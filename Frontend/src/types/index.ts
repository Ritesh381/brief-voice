export type MeetingStatus =
  | "uploaded"
  | "processing"
  | "transcribed"
  | "processed"
  | "error";

export interface Meeting {
  id: string;
  filename: string;
  status: MeetingStatus;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerName?: string | null;
  text: string;
  startMs: number;
  endMs: number;
}

export interface MeetingSummary {
  attendees: string[];
  keyDecisions: string[];
  discussionPoints: string[];
  openQuestions: string[];
  nextSteps: string[];
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string | null;
  deadline?: string | null;
  completed: boolean;
}

export interface MeetingDetail extends Meeting {
  transcript: { fullText: string; segments: TranscriptSegment[] } | null;
  summary: MeetingSummary | null;
  actionItems: ActionItem[];
}

export interface SearchResult {
  meetingId: string;
  meetingTitle: string;
  snippet: string;
  speaker: string | null;
  startMs: number | null;
  chunkType: string;
  relevanceScore: number;
}

export interface OverviewStats {
  totalMeetings: number;
  processedMeetings: number;
  totalActionItems: number;
  completedItems: number;
  completionRate: number;
}

export interface SpeakingTimeEntry {
  speaker: string;
  totalMs: number;
}

export interface MeetingAnalytics {
  meetingId: string;
  totalDurationMs: number;
  speakingTime: SpeakingTimeEntry[];
}
