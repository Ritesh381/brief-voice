import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { meetingsAPI } from "../api/client";
import type { MeetingDetail } from "../types";
import StatusBadge, { formatMs } from "../components/StatusBadge";

type Tab = "transcript" | "summary" | "actions";
const PROCESSING = ["uploaded", "processing", "transcribed"];

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    meetingsAPI.get(id).then(setMeeting).catch(() => setError("Meeting not found."));
  }, [id]);

  useEffect(load, [load]);

  // Poll while the meeting is still being processed.
  useEffect(() => {
    if (!meeting || !PROCESSING.includes(meeting.status)) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [meeting, load]);

  const renameSpeaker = async (rawSpeaker: string) => {
    if (!id) return;
    const name = prompt(`Rename "${rawSpeaker}" to:`);
    if (!name) return;
    await meetingsAPI.renameSpeakers(id, { [rawSpeaker]: name });
    load();
  };

  const toggle = async (itemId: string, completed: boolean) => {
    if (!id) return;
    await meetingsAPI.toggleActionItem(id, itemId, completed);
    setMeeting((m) =>
      m
        ? {
            ...m,
            actionItems: m.actionItems.map((a) =>
              a.id === itemId ? { ...a, completed } : a
            ),
          }
        : m
    );
  };

  if (error) return <p style={{ color: "var(--red)" }}>{error}</p>;
  if (!meeting) return <div className="spinner">Loading…</div>;

  const processing = PROCESSING.includes(meeting.status);

  return (
    <div>
      <Link to="/meetings" className="nav-link" style={{ width: "fit-content", paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="row" style={{ margin: "8px 0 4px" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {meeting.filename}
        </h1>
        <a className="btn ghost" href={meetingsAPI.reportUrl(meeting.id)} target="_blank" rel="noreferrer">
          <Download size={16} /> PDF
        </a>
      </div>
      <p className="page-sub" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <StatusBadge status={meeting.status} />
        {processing && <span className="muted">Processing… this updates automatically.</span>}
      </p>

      <div className="tabs">
        {(["summary", "transcript", "actions"] as Tab[]).map((t) => (
          <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "actions" ? "Action Items" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "summary" && <SummaryView meeting={meeting} />}

      {tab === "transcript" && (
        <div className="card">
          {!meeting.transcript || meeting.transcript.segments.length === 0 ? (
            <p className="muted">No transcript yet.</p>
          ) : (
            meeting.transcript.segments.map((s) => (
              <div className="segment" key={s.id}>
                <span className="speaker-tag" onClick={() => renameSpeaker(s.speaker)}>
                  {s.speakerName || s.speaker}
                </span>
                <span className="ts">{formatMs(s.startMs)}</span>
                <div style={{ marginTop: 4 }}>{s.text}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "actions" && (
        <div className="card">
          {meeting.actionItems.length === 0 ? (
            <p className="muted">No action items extracted.</p>
          ) : (
            meeting.actionItems.map((a) => (
              <div className={`action-item${a.completed ? " done" : ""}`} key={a.id}>
                <input
                  type="checkbox"
                  checked={a.completed}
                  onChange={(e) => toggle(a.id, e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div className="task">{a.task}</div>
                  {(a.owner || a.deadline) && (
                    <div className="action-meta">
                      {[a.owner, a.deadline].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SummaryView({ meeting }: { meeting: MeetingDetail }) {
  if (!meeting.summary) {
    return (
      <div className="card">
        <p className="muted">No summary yet.</p>
      </div>
    );
  }
  const s = meeting.summary;
  const sections: Array<[string, string[]]> = [
    ["Attendees", s.attendees],
    ["Key Decisions", s.keyDecisions],
    ["Discussion Points", s.discussionPoints],
    ["Open Questions", s.openQuestions],
    ["Next Steps", s.nextSteps],
  ];
  return (
    <div className="card">
      {sections.map(([title, items]) => (
        <div key={title}>
          <div className="section-title">{title}</div>
          {items.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              — none —
            </p>
          ) : (
            <ul className="bullets">
              {items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
