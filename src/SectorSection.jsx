import { useState, useEffect } from "react";
import "./SectorSection.css";

/* composite score: average of momentum, techValue, inverted risk */
function composite(s) {
  if (!s) return -1;
  const parts = [
    s.momentum,
    s.techValue,
    s.risk != null ? 100 - s.risk : null,
  ].filter(v => v != null);
  return parts.length ? parts.reduce((a, b) => a + b) / parts.length : 0;
}

function scoreColor(v, invert = false) {
  if (v == null) return "#2d4a5f";
  const n = invert ? 100 - v : v;
  return n >= 65 ? "#00dc82" : n >= 40 ? "#f59e0b" : "#ff3c50";
}

function MiniScore({ label, value, invert = false }) {
  const color = scoreColor(value, invert);
  return (
    <div className="ss-mini">
      <span className="ss-mini-label">{label}</span>
      <div className="ss-mini-track">
        <div className="ss-mini-fill" style={{ width: value != null ? `${value}%` : "0%", background: color }} />
      </div>
      <span className="ss-mini-val" style={{ color }}>{value ?? "—"}</span>
    </div>
  );
}

export default function SectorSection({ name, icon, tickers, session, accent = "#22D3EE", onSelect, selectedSymbol }) {
  const [stocks,  setStocks]  = useState([]);
  const [scores,  setScores]  = useState({});
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(true);
  const [sortBy,  setSortBy]  = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!tickers.length) return;
    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
    const q = encodeURIComponent(tickers.join(","));
    Promise.all([
      fetch(`/api/stocks?tickers=${q}`, { headers }).then(r => r.json()),
      fetch(`/api/scores?tickers=${q}`, { headers }).then(r => r.json()),
    ]).then(([sj, scj]) => {
      setStocks(sj.data || []);
      const map = {};
      for (const s of scj.scores || []) map[s.symbol] = s;
      setScores(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function sortValue(stock) {
    const sc = scores[stock.symbol];
    if (sortBy === "price")  return stock.price ?? -Infinity;
    if (sortBy === "change") return stock.changePercent ?? -Infinity;
    if (sortBy === "mom")    return sc?.momentum ?? -Infinity;
    if (sortBy === "risk")   return sc?.risk ?? -Infinity;
    if (sortBy === "tech")   return sc?.techValue ?? -Infinity;
    return composite(sc); // default: score
  }

  const sorted = [...stocks].sort((a, b) => {
    const diff = sortValue(b) - sortValue(a);
    return sortDir === "desc" ? diff : -diff;
  });

  function SortHead({ col, children, className }) {
    const active = sortBy === col;
    return (
      <span
        className={`ss-sort-head ${className || ""} ${active ? "ss-sort-active" : ""}`}
        onClick={() => handleSort(col)}
        style={{ cursor: "pointer", userSelect: "none", color: active ? accent : undefined }}
      >
        {children}
        <span style={{ marginLeft: 3, opacity: active ? 1 : 0.3, fontSize: ".65em" }}>
          {active ? (sortDir === "desc" ? "▼" : "▲") : "▼"}
        </span>
      </span>
    );
  }

  const topComp  = sorted[0] ? Math.round(composite(scores[sorted[0]?.symbol])) : null;
  const avgChange = sorted.length
    ? (sorted.reduce((s, st) => s + (st.changePercent ?? 0), 0) / sorted.length).toFixed(2)
    : null;

  return (
    <section className="ss-section" style={{ "--ss-accent": accent }}>
      {/* ── header ── */}
      <button className="ss-header" onClick={() => setOpen(o => !o)}>
        <div className="ss-header-left">
          <span className="ss-icon">{icon}</span>
          <div>
            <h3 className="ss-name" style={{ color: accent }}>{name}</h3>
            {!loading && sorted.length > 0 && (
              <div className="ss-meta">
                {sorted.length} stocks
                {topComp >= 0 && <> · top score <b style={{ color: accent }}>{topComp}</b></>}
                {avgChange != null && (
                  <> · avg <span style={{ color: Number(avgChange) >= 0 ? "#00dc82" : "#ff3c50" }}>
                    {Number(avgChange) >= 0 ? "+" : ""}{avgChange}%
                  </span></>
                )}
              </div>
            )}
          </div>
        </div>
        <span className="ss-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {/* ── body ── */}
      {open && (
        <div className="ss-body">
          {loading ? (
            <div className="ss-loading">
              <div className="ss-spinner" />
              Fetching market data…
            </div>
          ) : sorted.length === 0 ? (
            <p className="ss-empty">No data available</p>
          ) : (
            <div className="ss-table">
              {/* column heads */}
              <div className="ss-col-heads">
                <span>#</span>
                <span>Ticker</span>
                <SortHead col="price">Price</SortHead>
                <SortHead col="change" className="ss-hide-sm">Change</SortHead>
                <span className="ss-scores-head">MOM · RISK · TECH</span>
                <SortHead col="score">Score</SortHead>
              </div>

              {sorted.map((stock, i) => {
                const sc   = scores[stock.symbol];
                const comp = composite(sc);
                const up   = (stock.changePercent ?? 0) >= 0;
                const sel  = selectedSymbol === stock.symbol;

                return (
                  <div
                    key={stock.symbol}
                    className={`ss-row ${sel ? "ss-row--selected" : ""}`}
                    onClick={() => onSelect?.(stock, scores)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && onSelect?.(stock, scores)}
                  >
                    <span className="ss-rank">{String(i + 1).padStart(2, "0")}</span>

                    <span className="ss-ticker">
                      {stock.symbol}
                      {i === 0 && (
                        <span style={{
                          display: "inline-block",
                          marginLeft: 7,
                          fontFamily: "inherit",
                          fontSize: ".58rem",
                          fontWeight: 700,
                          letterSpacing: ".1em",
                          textTransform: "uppercase",
                          color: accent,
                          background: `${accent}18`,
                          border: `1px solid ${accent}40`,
                          borderRadius: 999,
                          padding: "2px 7px",
                          verticalAlign: "middle",
                        }}>
                          ★ QuantDiver Top Rank
                        </span>
                      )}
                    </span>

                    <span className="ss-price">
                      ${stock.price != null ? Number(stock.price).toFixed(2) : "—"}
                    </span>

                    <span className={`ss-change ss-hide-sm ${up ? "ss-up" : "ss-dn"}`}>
                      {up ? "▲" : "▼"}{Math.abs(stock.changePercent ?? 0).toFixed(2)}%
                    </span>

                    <div className="ss-scores">
                      <MiniScore label="MOM"  value={sc?.momentum}  invert={false} />
                      <MiniScore label="RISK" value={sc?.risk}       invert={true}  />
                      <MiniScore label="TECH" value={sc?.techValue}  invert={false} />
                    </div>

                    <span
                      className="ss-composite"
                      style={{ color: comp >= 0 ? scoreColor(comp) : "#2d4a5f" }}
                    >
                      {comp >= 0 ? Math.round(comp) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
