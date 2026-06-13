import { z } from "zod";

export const UploadMeetingResponseSchema = z.object({
  meetingId: z.string(),
  filename: z.string(),
  status: z.string(),
});

export type UploadMeetingResponse = z.infer<
  typeof UploadMeetingResponseSchema
>;

/** `:id` path param shared by all single-meeting routes. */
export const MeetingParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body for `PUT /meetings/:id/speakers` — map raw diarization labels to names. */
export const SpeakerLabelsSchema = z.object({
  labels: z.record(z.string(), z.string()),
});

export type SpeakerLabels = z.infer<typeof SpeakerLabelsSchema>;

/** Path params for the action-item toggle route. */
export const ActionItemParamsSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});

/** Body for toggling an action item's completion state. */
export const ActionItemToggleSchema = z.object({
  completed: z.boolean(),
});

export type ActionItemToggle = z.infer<typeof ActionItemToggleSchema>;

/** Audio formats accepted by the upload endpoint. */
export const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a"] as const;
