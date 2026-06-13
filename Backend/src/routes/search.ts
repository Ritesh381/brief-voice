// Backend/src/routes/search.ts

import { FastifyInstance } from "fastify";
import { searchMeetings, indexMeeting } from "../services/search.service";
import { SearchQuerySchema } from "../schemas/search";
import { MeetingParamsSchema } from "../schemas/meeting";

export default async function searchRoutes(app: FastifyInstance) {
  // Natural-language semantic search across all indexed meetings.
  app.get(
    "/search",
    {
      schema: {
        tags: ["Search"],
        summary: "Semantic search across the meeting archive",
        querystring: SearchQuerySchema,
      },
    },
    async (request) => {
      const { q, limit } = request.query as { q: string; limit: number };
      const results = await searchMeetings(q, limit);
      return { query: q, results };
    }
  );

  // (Re)index a meeting into the vector store on demand.
  app.post(
    "/meetings/:id/index",
    {
      schema: {
        tags: ["Search"],
        summary: "Re-index a meeting into the search index",
        params: MeetingParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      await indexMeeting(id);
      return { indexed: true, id };
    }
  );
}
