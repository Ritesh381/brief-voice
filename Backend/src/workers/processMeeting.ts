// Backend/src/workers/processMeeting.ts

import { prisma } from "../db/prisma";
import {transcribeAudio} from "../services/assemblyai.service";

/**
 * Handles the async transcription pipeline process.
 * Separated from the HTTP request-response cycle to handle large files without timeouts.
 */
export async function processMeetingPipeline(meetingId: string, filePath: string) {
  try {
    // 1. Update status to processing
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "processing" },
    });

    console.log(`[Worker] Slicing and sending audio to AssemblyAI for meeting: ${meetingId}`);
    
    // 2. Call the newly upgraded AssemblyAI processing service
    // This automatically breaks large audio into safe WAV chunks under the hood
    const { fullText, segments } = await transcribeAudio(filePath);
    
    console.log(`[Worker] AssemblyAI Pipeline completed successfully!`);
    console.log(`[Worker] Full Text length: ${fullText.length} characters.`);
    console.log(`[Worker] Extracted ${segments.length} individual speaker-labelled segments.`);

    // 3. Update database status to transcribed
    // (Once you expand your schema.prisma models, you can save fullText and segments here)
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { 
        status: "transcribed" 
      },
    });

    console.log(`[Worker] Meeting ${meetingId} updated to 'transcribed'. Ready for Gemini summary step.`);

  } catch (error) {
    console.error(`[Worker Error] Processing failed for meeting ${meetingId}:`, error);
    
    // Fail-safe update to flag error state on the dashboard
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "error" },
    }).catch((dbErr) => console.error(`[Worker Error] Failed to write error status to DB:`, dbErr));
  }}