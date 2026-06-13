// Backend/src/routes/meetings.ts

import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { pipeline } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { prisma } from "../db/prisma"; // Import your Prisma client instance
import { processMeetingPipeline } from "../workers/processMeeting"; // Import your background pipeline worker
import { deleteMeetingEmbeddings } from "../services/search.service";
import {
  MeetingParamsSchema,
  SpeakerLabelsSchema,
  ActionItemParamsSchema,
  ActionItemToggleSchema,
  ALLOWED_AUDIO_EXTENSIONS,
} from "../schemas/meeting";

function sanitizeUploadedFilename(filename: string) {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^_+/, "") || "meeting-audio";
}

/** Parse a stored JSON-string column back into an array, tolerating bad data. */
function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function meetingRoutes(fastify: FastifyInstance) {
  // 1. GET ALL MEETINGS
  fastify.get(
    "/meetings",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Get all meetings",
      },
    },
    async () => {
      // Fetch actual meeting records from SQLite ordered by creation time
      const meetings = await prisma.meeting.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      return meetings;
    }
  );

  // 2. UPLOAD & INITIALIZE PIPELINE
  fastify.post(
    "/meetings/upload",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Upload meeting audio",
      },
    },
    async (request, reply) => {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          error: "No file uploaded",
        });
      }

      // Validate the file extension before we spend effort writing it to disk.
      const ext = path.extname(file.filename).toLowerCase();
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext as (typeof ALLOWED_AUDIO_EXTENSIONS)[number])) {
        return reply.status(400).send({
          error: `Unsupported file type "${ext || "unknown"}". Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
        });
      }

      const meetingId = randomUUID();
      const uploadsDir = "uploads";

      // Ensure directory exists
      await fsPromises.mkdir(uploadsDir, {
        recursive: true,
      });

      const originalFilename = sanitizeUploadedFilename(file.filename);
      const filename = `${meetingId}-${originalFilename}`;
      const filepath = path.join(uploadsDir, filename);

      // STREAMING OPTIMIZATION: Pipe the inbound file data directly to disk.
      // This prevents the whole file from loading into RAM, making large file uploads safe.
      const writeStream = fs.createWriteStream(filepath);
      try {
        await pipeline(file.file, writeStream);
      } catch (err) {
        await fsPromises.unlink(filepath).catch(() => {});
        throw err;
      }

      // @fastify/multipart flags the stream as truncated if it exceeded the size limit.
      if (file.file.truncated) {
        await fsPromises.unlink(filepath).catch(() => {});
        return reply.status(400).send({
          error: "File exceeds the maximum allowed size.",
        });
      }

      // Reject empty uploads outright — they cannot be transcribed.
      const stats = await fsPromises.stat(filepath);
      if (stats.size === 0) {
        await fsPromises.unlink(filepath).catch(() => {});
        return reply.status(400).send({ error: "Uploaded file is empty." });
      }

      // Save initial state to the SQLite database
      const newMeeting = await prisma.meeting.create({
        data: {
          id: meetingId,
          filename: originalFilename,
          audioPath: filepath,
          status: "uploaded", // Default initial state
        },
      });

      // FIRE AND FORGET WORKER PIPELINE
      // Do NOT use 'await' here. This lets the server respond immediately to the client
      // with an "uploaded" status while transcription runs in the background.
      processMeetingPipeline(newMeeting.id, newMeeting.audioPath)
        .catch((err) => fastify.log.error(`Pipeline error for meeting ${meetingId}:`, err));

      return {
        meetingId: newMeeting.id,
        filename: newMeeting.filename,
        status: newMeeting.status,
      };
    }
  );

  // 3. GET MEETING DETAIL (transcript + summary + action items)
  fastify.get(
    "/meetings/:id",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Get full meeting detail",
        params: MeetingParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
          transcript: {
            include: {
              segments: { orderBy: { startMs: "asc" } },
            },
          },
          summary: true,
          actionItems: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!meeting) {
        return reply.status(404).send({ error: "Meeting not found" });
      }

      // Re-hydrate the summary's JSON-string columns into real arrays for the client.
      const summary = meeting.summary
        ? {
            attendees: parseJsonArray(meeting.summary.attendees),
            keyDecisions: parseJsonArray(meeting.summary.keyDecisions),
            discussionPoints: parseJsonArray(meeting.summary.discussionPoints),
            openQuestions: parseJsonArray(meeting.summary.openQuestions),
            nextSteps: parseJsonArray(meeting.summary.nextSteps),
          }
        : null;

      return {
        id: meeting.id,
        filename: meeting.filename,
        status: meeting.status,
        createdAt: meeting.createdAt,
        transcript: meeting.transcript
          ? {
              fullText: meeting.transcript.fullText,
              segments: meeting.transcript.segments,
            }
          : null,
        summary,
        actionItems: meeting.actionItems,
      };
    }
  );

  // 4. ASSIGN REAL NAMES TO DIARIZED SPEAKERS
  fastify.put(
    "/meetings/:id/speakers",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Assign real names to speaker labels",
        params: MeetingParamsSchema,
        body: SpeakerLabelsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { labels } = request.body as { labels: Record<string, string> };

      const transcript = await prisma.transcript.findUnique({
        where: { meetingId: id },
      });
      if (!transcript) {
        return reply.status(404).send({ error: "Transcript not found for this meeting" });
      }

      // Apply each label → name mapping to the matching segments.
      let updated = 0;
      for (const [rawSpeaker, name] of Object.entries(labels)) {
        const result = await prisma.transcriptSegment.updateMany({
          where: { transcriptId: transcript.id, speaker: rawSpeaker },
          data: { speakerName: name },
        });
        updated += result.count;
      }

      return { updatedSegments: updated };
    }
  );

  // 5. TOGGLE AN ACTION ITEM'S COMPLETION STATE
  fastify.put(
    "/meetings/:id/action-items/:itemId",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Toggle action item completion",
        params: ActionItemParamsSchema,
        body: ActionItemToggleSchema,
      },
    },
    async (request, reply) => {
      const { id, itemId } = request.params as { id: string; itemId: string };
      const { completed } = request.body as { completed: boolean };

      const item = await prisma.actionItem.findFirst({
        where: { id: itemId, meetingId: id },
      });
      if (!item) {
        return reply.status(404).send({ error: "Action item not found" });
      }

      const updated = await prisma.actionItem.update({
        where: { id: itemId },
        data: { completed },
      });

      return updated;
    }
  );

  // 6. DELETE A MEETING (DB rows cascade; clean up audio file + search index)
  fastify.delete(
    "/meetings/:id",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Delete a meeting and its derived data",
        params: MeetingParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) {
        return reply.status(404).send({ error: "Meeting not found" });
      }

      // Remove embeddings from the search index (best effort).
      await deleteMeetingEmbeddings(id).catch((err) =>
        fastify.log.error(`Failed to delete embeddings for ${id}:`, err)
      );

      // Cascade deletes transcript / segments / summary / action items.
      await prisma.meeting.delete({ where: { id } });

      // Remove the stored audio file (best effort).
      if (meeting.audioPath) {
        await fsPromises.unlink(meeting.audioPath).catch(() => {});
      }

      return reply.status(200).send({ deleted: true, id });
    }
  );
}
