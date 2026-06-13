import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
