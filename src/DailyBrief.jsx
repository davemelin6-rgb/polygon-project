import { useState, useEffect } from "react";
import "./DailyBrief.css";

const SECTOR_MAP = {};
const SECTORS_DEF = [
  { id: "quantum", tickers: ["IONQ","RGTI","QUBT","QBTS","IBM","GOOGL","MSFT"] },
  { id: "ai",      tickers: ["NVDA","AMD","META","MSFT","PLTR","AI","SOUN","SMCI"] },
  { id: "defence", tickers: ["LMT","RTX","NOC","GD","BA","RKLB","ASTS","KTOS"] },
];
for (const s of SECTORS_DEF) for (const t of s.tickers) SECTOR_MAP[t] = s.id;

function fmt(n, d = 2) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function timeAgo(str) {
  if (!str) return "";
  const diff = Date.now() - new Date(str).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d`;
  if (h >= 1)  return `${h}h`;
  return `${m}m`;
}

function fmtVal(v, unit) {
  if (v == null) return null;
  return `${fmt(v, 2)}${unit || ""}`;
}

const IMPACT_COLOR = { High: "#ff3c50", Medium: "#f59e0b", Low: "#00dc82" };

export default function DailyBrief({ session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    fetch("/api/brief", { headers })
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

      {loading && (
        <div className="db-loading">
          <div className="db-spinner" />
          Loading brief…
        </div>
      )}

      {error && <div className="db-error">{error}</div>}

      {data && !loading && (
        <>
          {/* ── Macro Events ──────────────────────────────── */}
          {data.events?.length > 0 && (
            <div className="db-macro">
              <div className="db-section-label">📅 Macro Events Today</div>
              <div className="db-events">
                {data.events.map((e, i) => (
                  <div key={i} className="db-event" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(e.event + " economic indicator")}`, "_blank")} style={{ cursor: "pointer" }}>
                    <span className="db-event-impact" style={{ color: IMPACT_COLOR[e.impact] ?? "#8fa0c4" }}>
                      ●
                    </span>
                    {e.time && <span className="db-event-time">{e.time}</span>}
                    <span className="db-event-flag">{e.flag}</span>
                    <span className="db-event-name">{e.event}</span>
                    <div className="db-event-vals">
                      {e.estimate != null && (
                        <span className="db-val-chip">Est: {fmtVal(e.estimate, e.unit)}</span>
                      )}
                      {e.previous != null && (
                        <span className="db-val-chip dim">Prev: {fmtVal(e.previous, e.unit)}</span>
                      )}
                      {e.actual != null && (
                        <span className="db-val-chip actual">Act: {fmtVal(e.actual, e.unit)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sector Movers ─────────────────────────────── */}
          <div className="db-section-label" style={{ marginTop: data.events?.length ? "1.5rem" : 0 }}>
            📊 Sector Movers
          </div>
          <div className="db-sectors">
            {data.sectors?.map(s => {
              const [top, ...rest] = s.stocks || [];
              const topUp = (top?.changePercent ?? 0) >= 0;
              return (
                <div key={s.id} className="db-sector" style={{ "--sector-accent": s.accent }}>
                  <div className="db-sector-header">
                    <span className="db-sector-icon">{s.icon}</span>
                    <span className="db-sector-name">{s.name}</span>
                  </div>

                  {top && (
                    <div className="db-top-mover">
                      <div className="db-top-row">
                        <span className="db-top-symbol">{top.symbol}</span>
                        <span className={`db-top-pct ${topUp ? "up" : "down"}`}>
                          {topUp ? "▲" : "▼"} {fmt(Math.abs(top.changePercent ?? 0))}%
                        </span>
                      </div>
                      {top.price && (
                        <div className="db-top-price">${fmt(top.price)}</div>
                      )}
                    </div>
                  )}

                  <div className="db-rest">
                    {rest.slice(0, 5).map(st => {
                      const up = (st.changePercent ?? 0) >= 0;
                      return (
                        <div key={st.symbol} className="db-rest-row">
                          <span className="db-rest-symbol">{st.symbol}</span>
                          <span className={`db-rest-pct ${up ? "up" : "down"}`}>
                            {up ? "▲" : "▼"} {fmt(Math.abs(st.changePercent ?? 0))}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── News ──────────────────────────────────────── */}
          {data.news?.length > 0 && (
            <>
              <div className="db-section-label" style={{ marginTop: "1.5rem" }}>📰 Top News</div>
              <div className="db-news">
                {data.news.map((item, i) => {
                  const sectorId = SECTOR_MAP[item.symbol];
                  const sector   = data.sectors?.find(s => s.id === sectorId);
                  return (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="db-news-item">
                      <div className="db-news-left">
                        <div className="db-news-tags">
                          {sector && (
                            <span className="db-tag" style={{ color: sector.accent, borderColor: sector.accent + "44", background: sector.accent + "11" }}>
                              {sector.icon} {item.symbol}
                            </span>
                          )}
                        </div>
                        <p className="db-news-title">{item.title}</p>
                        <div className="db-news-meta">
                          <span className="db-news-source">{item.source}</span>
                          <span className="db-news-dot">·</span>
                          <span className="db-news-time">{timeAgo(item.published)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
