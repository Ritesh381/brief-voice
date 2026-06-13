// Backend/src/workers/processMeeting.ts

import { prisma } from "../db/prisma";
import { transcribeAudio } from "../services/assemblyai.service";
// Switch out Gemini service reference for our newly built OpenAI engine module
import { generateSummary, extractActionItems } from "../services/openai.service";
import { indexMeeting } from "../services/search.service";

interface Segment {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

// Upper bound on characters sent to the LLM. gpt-4o-mini has a 128k-token
// window; ~120k chars (~30k tokens) leaves ample room for the prompt + output.
const MAX_TRANSCRIPT_CHARS = 120_000;

/**
 * Builds a speaker-labelled transcript ("Speaker A: ...") so the LLM can
 * attribute decisions and action-item owners to the right people instead of
 * collapsing everything into one anonymous block of text.
 */
function buildLabelledTranscript(segments: Segment[], fullText: string): string {
  if (segments.length === 0) return fullText;
  return segments.map((s) => `${s.speaker}: ${s.text}`).join("\n");
}

/**
 * Clamps very long transcripts so a single huge meeting cannot blow the
 * model's context window. Keeps the head and logs a warning when it truncates.
 */
function clampTranscript(text: string, meetingId: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  console.warn(
    `[Worker] Transcript for ${meetingId} is ${text.length} chars; truncating to ${MAX_TRANSCRIPT_CHARS} for LLM processing.`
  );
  return `${text.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[...transcript truncated for length...]`;
}

/**
 * Handles the async transcription and AI processing pipeline process.
 */
export async function processMeetingPipeline(meetingId: string, filePath: string) {
  try {
    // 1. Update master meeting entry status to processing
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "processing" },
    });

    // Make retries safe if a previous run partially wrote derived records.
    await prisma.$transaction([
      prisma.actionItem.deleteMany({ where: { meetingId } }),
      prisma.meetingSummary.deleteMany({ where: { meetingId } }),
      prisma.transcript.deleteMany({ where: { meetingId } }),
    ]);

    console.log(`[Worker] Step 1: Ingesting audio through AssemblyAI for: ${meetingId}`);
    const { fullText, segments } = await transcribeAudio(filePath);
    
    // 2. Persist the transcript core records and chronological segments to SQLite
    console.log(`[Worker] Step 2: Saving transcript data to database...`);
    const savedTranscript = await prisma.transcript.create({
      data: {
        meetingId: meetingId,
        fullText: fullText,
      }
    });

    if (segments.length > 0) {
      await prisma.transcriptSegment.createMany({
        data: segments.map((seg) => ({
          transcriptId: savedTranscript.id,
          speaker: seg.speaker,
          text: seg.text,
          startMs: seg.startMs,
          endMs: seg.endMs,
        })),
      });
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "transcribed" },
    });

    // 3. Build a speaker-labelled transcript so the LLM can attribute
    //    decisions and action items to specific people, then clamp its length.
    const uniqueSpeakers = Array.from(new Set(segments.map((s) => s.speaker)));
    const labelledTranscript = clampTranscript(
      buildLabelledTranscript(segments, fullText),
      meetingId
    );

    console.log(`[Worker] Step 3: Triggering OpenAI structured summary synthesis...`);
    const summaryData = await generateSummary(labelledTranscript, uniqueSpeakers);

    // Save summary text data objects to SQLite
    await prisma.meetingSummary.create({
      data: {
        meetingId: meetingId,
        attendees: JSON.stringify(summaryData.attendees),
        keyDecisions: JSON.stringify(summaryData.keyDecisions),
        discussionPoints: JSON.stringify(summaryData.discussionPoints),
        openQuestions: JSON.stringify(summaryData.openQuestions),
        nextSteps: JSON.stringify(summaryData.nextSteps),
      },
    });

    console.log(`[Worker] Step 4: Extracting interactive action items checklists via OpenAI...`);
    const actionItemsData = await extractActionItems(labelledTranscript);

    if (actionItemsData.length > 0) {
      await prisma.actionItem.createMany({
        data: actionItemsData.map((item) => ({
          meetingId: meetingId,
          task: item.task,
          owner: item.owner,
          deadline: item.deadline,
          completed: false, 
        })),
      });
    }

    // 5. Index transcript + summary into the vector store for semantic search.
    //    Failure here must not fail the whole meeting — log and continue.
    console.log(`[Worker] Step 5: Indexing meeting into the search archive...`);
    try {
      await indexMeeting(meetingId);
    } catch (indexErr) {
      console.error(`[Worker] Search indexing failed for ${meetingId}:`, indexErr);
    }

    // 6. SUCCESS! Finalize pipeline lifecycle flag to processed
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "processed" },
    });

    console.log(`[Worker] Pipeline finished successfully via OpenAI for meeting ${meetingId}!`);

  } catch (error) {
    console.error(`[Worker Operational Error] Processing failed for meeting ${meetingId}:`, error);
    
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "error" },
    }).catch((dbErr) => console.error(`[Worker Error] Failed to write error state to database:`, dbErr));
  }
}
