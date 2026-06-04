import { z } from "zod";

export const UploadMeetingResponseSchema = z.object({
  meetingId: z.string(),
  filename: z.string(),
  status: z.string(),
});

export type UploadMeetingResponse = z.infer<
  typeof UploadMeetingResponseSchema
>;