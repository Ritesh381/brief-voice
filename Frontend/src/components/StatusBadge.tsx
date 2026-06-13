import type { MeetingStatus } from "../types";

export default function StatusBadge({ status }: { status: MeetingStatus }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

/** Format milliseconds as m:ss for transcript timestamps and durations. */
export function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
