import { useState, useEffect } from "react";

const W = 520, H = 140, PAD = { top: 16, right: 12, bottom: 28, left: 32 };
const LINES = [
  { key: "momentum",  label: "MOM",  color: "#00b4ff" },
  { key: "risk",      label: "RISK", color: "#f59e0b" },
  { key: "tech_value",label: "TECH", color: "#8b5cf6" },
];

function xScale(i, n)  { return PAD.left + (i / Math.max(n - 1, 1)) * (W - PAD.left - PAD.right); }
function yScale(v)     { return PAD.top + (1 - v / 100) * (H - PAD.top - PAD.bottom); }

function Polyline({ data, key_, color }) {
  const pts = data
    .map((d, i) => d[key_] != null ? `${xScale(i, data.length)},${yScale(d[key_])}` : null)
    .filter(Boolean)
    .join(" ");
  if (!pts) return null;
  return <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />;
}

function Dots({ data, key_, color }) {
  return data.map((d, i) =>
    d[key_] != null ? (
      <circle key={i} cx={xScale(i, data.length)} cy={yScale(d[key_])} r="2.5" fill={color} opacity="0.85" />
    ) : null
  );
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-SE", { month: "short", day: "numeric" });
}

export default function ScoreHistory({ stock, session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock?.symbol) return;
    setHistory([]);
    setLoading(true);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch(`/api/score-history?ticker=${stock.symbol}`, { headers })
      .then(r => r.ok ? r.json() : { history: [] })
      .then(j => setHistory(j.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stock?.symbol, session]);

  if (loading) return null;
  if (history.length < 2) {
    return (
      <section className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-header" style={{ marginBottom: "1rem" }}>
          <div className="panel-eyebrow">Score History · {stock?.symbol}</div>
          <h2 className="panel-title">Score Trends</h2>
        </div>
        <p style={{ color: "#2a4060", fontSize: ".85rem" }}>
          Tracking started today — check back tomorrow to see trends build.
        </p>
      </section>
    );
  }

  const latest = history[history.length - 1];
  // Tick marks: first, last, and one or two midpoints
  const tickIdxs = history.length <= 10
    ? [0, history.length - 1]
    : [0, Math.floor(history.length / 3), Math.floor(history.length * 2 / 3), history.length - 1];

  return (
    <section className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-header" style={{ marginBottom: "1.25rem" }}>
        <div className="panel-eyebrow">Score History · {stock?.symbol}</div>
        <h2 className="panel-title">Score Trends</h2>
      </div>

      {/* Legend + latest values */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {LINES.map(l => (
          <div key={l.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 24, height: 2, background: l.color, borderRadius: 2 }} />
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#3d5c78" }}>
              {l.label}
            </span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".88rem", fontWeight: 700, color: l.color }}>
              {latest[l.key] ?? "—"}
            </span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: ".7rem", color: "#1e3048", fontFamily: "'Space Mono',monospace" }}>
          {history.length}d
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block", minWidth: 240 }}>
          {/* Grid lines */}
          {[25, 50, 75].map(v => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={yScale(v)} y2={yScale(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
          ))}
          {/* Y-axis labels */}
          {[0, 50, 100].map(v => (
            <text key={v} x={PAD.left - 5} y={yScale(v) + 4} textAnchor="end"
              fontSize="9" fill="#1e3048" fontFamily="Space Mono,monospace">{v}</text>
          ))}
          {/* X-axis date labels */}
          {tickIdxs.map(i => (
            <text key={i} x={xScale(i, history.length)} y={H - 4} textAnchor="middle"
              fontSize="9" fill="#1e3048" fontFamily="Space Mono,monospace">
              {fmtDate(history[i].recorded_date)}
            </text>
          ))}
          {/* Lines */}
          {LINES.map(l => (
            <Polyline key={l.key} data={history} key_={l.key} color={l.color} />
          ))}
          {/* Dots — only if ≤ 20 points to avoid clutter */}
          {history.length <= 20 && LINES.map(l => (
            <Dots key={l.key + "_dots"} data={history} key_={l.key} color={l.color} />
          ))}
        </svg>
      </div>
    </section>
  );
}
