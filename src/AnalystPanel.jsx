import { useState, useEffect } from "react";
import "./AnalystPanel.css";

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EarningsBeat({ surprises }) {
  if (!surprises?.length) return null;
  return (
    <div className="ap-surprises">
      {surprises.map((s, i) => {
        if (s.actual == null || s.estimated == null) return null;
        const beat = s.actual >= s.estimated;
        const pct  = s.estimated !== 0
          ? (((s.actual - s.estimated) / Math.abs(s.estimated)) * 100).toFixed(1)
          : null;
        return (
          <div key={i} className="ap-surprise-chip" title={s.date}>
            <span className={beat ? "up" : "down"}>{beat ? "▲" : "▼"}</span>
            {pct != null && <span className={beat ? "up" : "down"}>{Math.abs(pct)}%</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function AnalystPanel({ stock, session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.symbol || !session?.access_token) return;
    setLoading(true);
    setData(null);
    fetch(`/api/analyst?ticker=${stock.symbol}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock?.symbol, session]);

  const c  = data?.consensus;
  const pt = data?.priceTarget;
  const price = stock?.price ?? null;
  const upside = pt?.mean && price ? (((pt.mean - price) / price) * 100).toFixed(1) : null;
  const ratingColor = c?.rating === "BUY" ? "#00dc82" : c?.rating === "SELL" ? "#ff3c50" : "#f59e0b";

  return (
    <section className="panel ap-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Wall Street · {stock?.symbol}</div>
        <h2 className="panel-title">Analyst Consensus</h2>
      </div>

      {loading && <div className="ap-loading">Loading analyst data…</div>}

      {data && !loading && (
        <div className="ap-body">

          {/* ── Consensus bar ──────────────────────────────── */}
          {c && c.total > 0 ? (
            <div className="ap-consensus">
              <div className="ap-rating-row">
                <span className="ap-rating-label" style={{ color: ratingColor }}>{c.rating ?? "—"}</span>
                <span className="ap-analyst-count">{c.total} analysts</span>
                <EarningsBeat surprises={data.surprises} />
              </div>
              <div className="ap-bar">
                {c.strongBuy  > 0 && <div className="ap-seg ap-strong-buy"  style={{ flex: c.strongBuy  }} title={`Strong Buy: ${c.strongBuy}`} />}
                {c.buy        > 0 && <div className="ap-seg ap-buy"          style={{ flex: c.buy        }} title={`Buy: ${c.buy}`} />}
                {c.hold       > 0 && <div className="ap-seg ap-hold"         style={{ flex: c.hold       }} title={`Hold: ${c.hold}`} />}
                {c.sell       > 0 && <div className="ap-seg ap-sell"         style={{ flex: c.sell       }} title={`Sell: ${c.sell}`} />}
                {c.strongSell > 0 && <div className="ap-seg ap-strong-sell"  style={{ flex: c.strongSell }} title={`Strong Sell: ${c.strongSell}`} />}
              </div>
              <div className="ap-bar-labels">
                <span style={{ color: "#00dc82" }}>Strong Buy {c.strongBuy} · Buy {c.buy}</span>
                <span style={{ color: "#f59e0b" }}>Hold {c.hold}</span>
                <span style={{ color: "#ff3c50" }}>Sell {c.sell} · Strong Sell {c.strongSell}</span>
              </div>
            </div>
          ) : (
            <p className="ap-empty">No analyst ratings available.</p>
          )}

          {/* ── Price target ───────────────────────────────── */}
          {pt?.mean && (
            <div className="ap-targets">
              <div className="ap-target-main">
                <div className="ap-target-label">AVG PRICE TARGET</div>
                <div className="ap-target-value">${fmt(pt.mean)}</div>
                {upside != null && (
                  <div className={`ap-upside ${+upside >= 0 ? "up" : "down"}`}>
                    {+upside >= 0 ? "▲" : "▼"} {Math.abs(upside)}% {+upside >= 0 ? "upside" : "downside"}
                  </div>
                )}
              </div>
              <div className="ap-target-range">
                <div className="ap-range-item">
                  <span className="ap-range-label">HIGH</span>
                  <span className="ap-range-val up">${fmt(pt.high)}</span>
                </div>
                <div className="ap-range-divider" />
                <div className="ap-range-item">
                  <span className="ap-range-label">LOW</span>
                  <span className="ap-range-val down">${fmt(pt.low)}</span>
                </div>
                {price && (
                  <>
                    <div className="ap-range-divider" />
                    <div className="ap-range-item">
                      <span className="ap-range-label">CURRENT</span>
                      <span className="ap-range-val">${fmt(price)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Earnings beat/miss history ─────────────────── */}
          {data.surprises?.length > 0 && (
            <div className="ap-history">
              <div className="ap-history-label">EARNINGS HISTORY (LAST {data.surprises.length}Q)</div>
              <div className="ap-history-rows">
                {data.surprises.map((s, i) => {
                  if (s.actual == null) return null;
                  const beat = s.estimated == null || s.actual >= s.estimated;
                  const pct  = s.estimated != null && s.estimated !== 0
                    ? (((s.actual - s.estimated) / Math.abs(s.estimated)) * 100).toFixed(1)
                    : null;
                  return (
                    <div key={i} className="ap-history-row">
                      <span className="ap-history-date">{s.date?.slice(0, 7)}</span>
                      <span className="ap-history-actual">EPS {fmt(s.actual)}</span>
                      {s.estimated != null && <span className="ap-history-est">Est {fmt(s.estimated)}</span>}
                      <span className={`ap-history-result ${beat ? "up" : "down"}`}>
                        {beat ? "▲ Beat" : "▼ Miss"}{pct != null ? ` ${Math.abs(pct)}%` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </section>
  );
}
