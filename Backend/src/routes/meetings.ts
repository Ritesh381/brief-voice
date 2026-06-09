// Backend/src/routes/meetings.ts

import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { pipeline } from "stream/promises";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { prisma } from "../db/prisma"; // Import your Prisma client instance
import { processMeetingPipeline } from "../workers/processMeeting"; // Import your background pipeline worker

export default async function meetingRoutes(
  fastify: FastifyInstance
) {
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

      const meetingId = randomUUID();
      const uploadsDir = "uploads";

      // Ensure directory exists
      await fsPromises.mkdir(uploadsDir, {
        recursive: true,
      });

      const filename = `${meetingId}-${file.filename}`;
      const filepath = path.join(uploadsDir, filename);

      // STREAMING OPTIMIZATION: Pipe the inbound file data directly to disk.
      // This prevents the whole file from loading into RAM, making large file uploads safe.
      const writeStream = fs.createWriteStream(filepath);
      await pipeline(file.file, writeStream);

      // Save initial state to the SQLite database
      const newMeeting = await prisma.meeting.create({
        data: {
          id: meetingId,
          filename: file.filename,
          audioPath: filepath,
          status: "uploaded", // Default initial state
        },
      });

      // FIRE AND FORGET WORKER PIPELINE
      // Do NOT use 'await' here. This lets the server respond immediately to the client 
      // with an "uploaded" status while Groq runs in the background.
      processMeetingPipeline(newMeeting.id, newMeeting.audioPath)
        .catch((err) => fastify.log.error(`Pipeline error for meeting ${meetingId}:`, err));

      return {
        meetingId: newMeeting.id,
        filename: newMeeting.filename,
        status: newMeeting.status,
      };
    }
  );
}