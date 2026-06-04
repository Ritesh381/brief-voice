import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export default async function meetingRoutes(
  fastify: FastifyInstance
) {
  fastify.get(
    "/meetings",
    {
      schema: {
        tags: ["Meetings"],
        summary: "Get all meetings",
      },
    },
    async () => {
      return [];
    }
  );

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

      await fs.mkdir(uploadsDir, {
        recursive: true,
      });

      const filename =
        `${meetingId}-${file.filename}`;

      const filepath = path.join(
        uploadsDir,
        filename
      );

      await fs.writeFile(
        filepath,
        await file.toBuffer()
      );

      return {
        meetingId,
        filename: file.filename,
        status: "uploaded",
      };
    }
  );
}