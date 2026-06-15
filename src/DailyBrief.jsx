import { useState, useEffect } from "react";
import "./DailyBrief.css";

function timeAgo(str) {
  if (!str) return "";
  const diff = Date.now() - new Date(str).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1)  return `${h}h ago`;
  return `${m}m ago`;
}

function fmt(n, d = 2) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtVal(v, unit) {
  if (v == null) return null;
  return `${fmt(v, 2)}${unit || ""}`;
}

const IMPACT_COLOR = { High: "#ff3c50", Medium: "#f59e0b" };

export default function DailyBrief({ session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/brief", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => { setError("Failed to load brief"); setLoading(false); });
  }, [session]);

  const dateLabel = data?.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="panel db-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Market Intelligence · {dateLabel}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="panel-title">Daily Brief</h2>
          <span className="db-live-badge">● LIVE</span>
        </div>
      </div>

      {loading && <div className="db-loading"><div className="db-spinner" />Loading brief…</div>}
      {error   && <div className="db-error">{error}</div>}

      {data && !loading && (
        <div className="db-brief-body">

          {/* ── One section per sector ──────────────────────── */}
          {data.sectors?.map(s => {
            const sectorNews = data.newsBySector?.[s.id] || [];
            const movers = (s.stocks || []).slice(0, 4);

            return (
              <div key={s.id} className="db-brief-sector">
                {/* sector heading */}
                <div className="db-brief-sector-head" style={{ borderColor: s.accent + "44" }}>
                  <span className="db-brief-sector-icon">{s.icon}</span>
                  <span className="db-brief-sector-name" style={{ color: s.accent }}>{s.name}</span>
                  {/* compact movers strip */}
                  <div className="db-brief-movers">
                    {movers.map(st => {
                      const up = (st.changePercent ?? 0) >= 0;
                      return (
                        <span key={st.symbol} className="db-brief-mover">
                          <span className="db-brief-mover-sym">{st.symbol}</span>
                          <span className={up ? "up" : "down"}>
                            {up ? "▲" : "▼"}{fmt(Math.abs(st.changePercent ?? 0))}%
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* news articles */}
                {sectorNews.length === 0 ? (
                  <p className="db-brief-empty">No news today.</p>
                ) : (
                  <div className="db-brief-articles">
                    {sectorNews.map((item, i) => (
                      <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="db-brief-article">
                        <div className="db-brief-article-meta">
                          <span className="db-brief-article-sym" style={{ color: s.accent }}>{item.symbol}</span>
                          <span className="db-brief-article-dot">·</span>
                          <span className="db-brief-article-source">{item.source}</span>
                          <span className="db-brief-article-dot">·</span>
                          <span className="db-brief-article-time">{timeAgo(item.published)}</span>
                        </div>
                        <p className="db-brief-article-title">{item.title}</p>
                        {item.text && <p className="db-brief-article-text">{item.text}</p>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Macro Context ───────────────────────────────── */}
          {data.events?.length > 0 && (
            <div className="db-brief-sector">
              <div className="db-brief-sector-head" style={{ borderColor: "rgba(255,255,255,.08)" }}>
                <span className="db-brief-sector-icon">📅</span>
                <span className="db-brief-sector-name" style={{ color: "#94a3b8" }}>Macro Context</span>
              </div>
              <div className="db-events">
                {data.events.map((e, i) => (
                  <div key={i} className="db-event" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(e.event + " economic indicator")}`, "_blank")} style={{ cursor: "pointer" }}>
                    <span style={{ color: IMPACT_COLOR[e.impact] ?? "#8fa0c4", fontSize: ".7rem" }}>●</span>
                    {e.time && <span className="db-event-time">{e.time}</span>}
                    <span className="db-event-flag">{e.flag}</span>
                    <span className="db-event-name">{e.event}</span>
                    <div className="db-event-vals">
                      {e.estimate != null && <span className="db-val-chip">Est: {fmtVal(e.estimate, e.unit)}</span>}
                      {e.previous != null && <span className="db-val-chip dim">Prev: {fmtVal(e.previous, e.unit)}</span>}
                      {e.actual   != null && <span className="db-val-chip actual">Act: {fmtVal(e.actual, e.unit)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </section>
  );
}
