// Backend/src/routes/analytics.ts

import { FastifyInstance } from "fastify";
import { getSpeakingTime, getOverviewStats } from "../services/analytics.service";
import { MeetingParamsSchema } from "../schemas/meeting";

export default async function analyticsRoutes(app: FastifyInstance) {
  // Dashboard overview: meeting counts + action-item completion rate.
  app.get(
    "/analytics/overview",
    {
      schema: {
        tags: ["Analytics"],
        summary: "Archive-wide overview stats",
      },
    },
    async () => {
      return getOverviewStats();
    }
  );

  // Per-meeting speaking-time breakdown.
  app.get(
    "/analytics/meeting/:id",
    {
      schema: {
        tags: ["Analytics"],
        summary: "Speaking time per speaker for one meeting",
        params: MeetingParamsSchema,
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      return getSpeakingTime(id);
    }
  );
}
