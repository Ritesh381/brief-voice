import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { analyticsAPI } from "../api/client";
import type { OverviewStats } from "../types";

const COLORS = ["#10b981", "#334155"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsAPI
      .overview()
      .then(setStats)
      .catch(() => setError("Could not load analytics."));
  }, []);

  if (error) return <p style={{ color: "var(--red)" }}>{error}</p>;
  if (!stats) return <div className="spinner">Loading…</div>;

  const pending = Math.max(0, stats.totalActionItems - stats.completedItems);
  const pieData = [
    { name: "Completed", value: stats.completedItems },
    { name: "Pending", value: pending },
  ];

  const cards = [
    { label: "Total meetings", value: stats.totalMeetings },
    { label: "Processed", value: stats.processedMeetings },
    { label: "Action items", value: stats.totalActionItems },
    { label: "Completion rate", value: `${stats.completionRate}%` },
  ];

  return (
    <div>
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">Overview across all meetings.</p>

      <div className="grid stat-grid" style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>
          Action item completion
        </div>
        {stats.totalActionItems === 0 ? (
          <p className="muted">No action items yet.</p>
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a44" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
