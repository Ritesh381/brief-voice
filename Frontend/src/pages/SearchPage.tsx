import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { searchAPI } from "../api/client";
import type { SearchResult } from "../types";
import { formatMs } from "../components/StatusBadge";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search as the user types.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchAPI.search(query.trim(), 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    <div>
      <h1 className="page-title">Search</h1>
      <p className="page-sub">Ask anything across your meeting archive.</p>

      <div style={{ position: "relative", marginBottom: 24 }}>
        <SearchIcon
          size={18}
          style={{ position: "absolute", left: 14, top: 14, color: "var(--muted)" }}
        />
        <input
          className="input"
          style={{ paddingLeft: 42 }}
          placeholder="e.g. what did we decide about the database?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <div className="spinner">Searching…</div>}

      {results && results.length === 0 && !loading && (
        <div className="empty">No results found.</div>
      )}

      {results?.map((r, i) => (
        <Link to={`/meetings/${r.meetingId}`} key={i} className="card clickable">
          <div className="row">
            <div style={{ fontWeight: 600 }}>{r.meetingTitle}</div>
            <span className="badge processed">{(r.relevanceScore * 100).toFixed(0)}%</span>
          </div>
          <div style={{ marginTop: 8 }}>{r.snippet}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            {r.speaker ? `${r.speaker} · ` : ""}
            {r.startMs != null ? formatMs(r.startMs) : r.chunkType}
          </div>
        </Link>
      ))}
    </div>
  );
}
