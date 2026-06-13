// Backend/src/services/analytics.service.ts

import { prisma } from "../db/prisma";

export interface SpeakingTimeEntry {
  speaker: string;
  totalMs: number;
}

export interface MeetingAnalytics {
  meetingId: string;
  totalDurationMs: number;
  speakingTime: SpeakingTimeEntry[];
}

export interface OverviewStats {
  totalMeetings: number;
  processedMeetings: number;
  totalActionItems: number;
  completedItems: number;
  completionRate: number; // 0–100, rounded
}

/**
 * Speaking time per participant for a single meeting, derived from the
 * diarized transcript segments. Uses the user-assigned name when present.
 */
export async function getSpeakingTime(meetingId: string): Promise<MeetingAnalytics> {
  const segments = await prisma.transcriptSegment.findMany({
    where: { transcript: { meetingId } },
    select: { speaker: true, speakerName: true, startMs: true, endMs: true },
  });

  const totals: Record<string, number> = {};
  let totalDurationMs = 0;

  for (const seg of segments) {
    const name = seg.speakerName || seg.speaker;
    const duration = Math.max(0, seg.endMs - seg.startMs);
    totals[name] = (totals[name] || 0) + duration;
    totalDurationMs += duration;
  }

  const speakingTime = Object.entries(totals)
    .map(([speaker, totalMs]) => ({ speaker, totalMs }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return { meetingId, totalDurationMs, speakingTime };
}

/**
 * Dashboard-level rollup across the whole archive: meeting counts and
 * action-item completion rate.
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const [totalMeetings, processedMeetings, totalActionItems, completedItems] =
    await Promise.all([
      prisma.meeting.count(),
      prisma.meeting.count({ where: { status: "processed" } }),
      prisma.actionItem.count(),
      prisma.actionItem.count({ where: { completed: true } }),
    ]);

  return {
    totalMeetings,
    processedMeetings,
    totalActionItems,
    completedItems,
    completionRate:
      totalActionItems > 0
        ? Math.round((completedItems / totalActionItems) * 100)
        : 0,
  };
}
