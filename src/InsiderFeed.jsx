import { useState, useEffect } from "react";
import "./InsiderFeed.css";

function fmtVal(v) {
  if (v == null) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function shortenTitle(t) {
  if (!t) return "";
  return t.replace(/Chief Executive Officer/i, "CEO")
    .replace(/Chief Financial Officer/i, "CFO")
    .replace(/Chief Operating Officer/i, "COO")
    .replace(/Chief Technology Officer/i, "CTO")
    .replace(/Director/i, "Director")
    .slice(0, 30);
}

export default function InsiderFeed({ stock, session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.symbol || !session?.access_token) return;
    setLoading(true);
    setData(null);
    fetch(`/api/insider?ticker=${stock.symbol}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock?.symbol, session]);

  const transactions = data?.transactions || [];

  return (
    <section className="panel if-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Smart Money · {stock?.symbol}</div>
        <h2 className="panel-title">Insider Trading</h2>
      </div>

      {loading && <div className="if-loading">Loading insider activity…</div>}

      {!loading && transactions.length === 0 && (
        <p className="if-empty">No recent insider transactions found.</p>
      )}

      {!loading && transactions.length > 0 && (
        <div className="if-list">
          {transactions.map((t, i) => {
            const isBuy  = t.type === "BUY";
            const isSell = t.type === "SELL";
            const color  = isBuy ? "#00dc82" : isSell ? "#ff3c50" : "#8fa0c4";
            return (
              <div key={i} className="if-row">
                <div className={`if-badge ${isBuy ? "if-buy" : isSell ? "if-sell" : "if-neutral"}`}>
                  {isBuy ? "BUY" : isSell ? "SELL" : t.type}
                </div>
                <div className="if-person">
                  <span className="if-name">{t.name}</span>
                  {t.title && <span className="if-title">{shortenTitle(t.title)}</span>}
                </div>
                <div className="if-amounts">
                  {t.value != null && (
                    <span className="if-value" style={{ color }}>{fmtVal(t.value)}</span>
                  )}
                  {t.shares != null && (
                    <span className="if-shares">{Number(t.shares).toLocaleString()} shares</span>
                  )}
                </div>
                <span className="if-date">{fmtDate(t.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
