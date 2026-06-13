import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import { meetingsAPI } from "../api/client";
import type { Meeting } from "../types";
import StatusBadge from "../components/StatusBadge";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    meetingsAPI
      .list()
      .then(setMeetings)
      .catch(() => setError("Could not load meetings. Is the backend running?"));
  };

  useEffect(load, []);

  const remove = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Delete this meeting and all its data?")) return;
    await meetingsAPI.remove(id);
    setMeetings((m) => (m ? m.filter((x) => x.id !== id) : m));
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page-title">Meetings</h1>
        <Link to="/upload" className="btn">
          <Plus size={18} /> New meeting
        </Link>
      </div>
      <p className="page-sub">Your processed and in-progress recordings.</p>

      {error && <p style={{ color: "var(--red)" }}>{error}</p>}
      {!meetings && !error && <div className="spinner">Loading…</div>}

      {meetings && meetings.length === 0 && (
        <div className="empty">No meetings yet — upload your first recording!</div>
      )}

      {meetings?.map((m) => (
        <Link to={`/meetings/${m.id}`} key={m.id} className="card clickable">
          <div className="row">
            <div>
              <div style={{ fontWeight: 600 }}>{m.filename}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {new Date(m.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <StatusBadge status={m.status} />
              <button
                className="btn danger"
                style={{ padding: "6px 10px" }}
                onClick={(e) => remove(e, m.id)}
                aria-label="delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
