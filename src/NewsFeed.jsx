import { useState, useEffect } from "react";
import "./NewsFeed.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return `${Math.round(diff)}s ago`;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

const TICKER_COLORS = ["#22D3EE","#00dc82","#F59E0B","#A78BFA","#ff3c50"];

export default function NewsFeed({ tickers, session }) {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);

  const tickerStr = (tickers || []).slice(0, 5).join(",");

  useEffect(() => {
    if (!tickerStr) return;
    setLoading(true);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch(`/api/news?tickers=${encodeURIComponent(tickerStr)}`, { headers })
      .then(r => r.json())
      .then(j => { setNews(j.news || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tickerStr, session]);

  const colorMap = {};
  (tickers || []).forEach((t, i) => { colorMap[t] = TICKER_COLORS[i % TICKER_COLORS.length]; });

  return (
    <section className="panel nf-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Market Intelligence · Live Feed</div>
        <h2 className="panel-title">News & Sentiment</h2>
      </div>

      {loading && (
        <div className="nf-loading">
          <div className="nf-spinner" />Loading market intelligence…
        </div>
      )}

      {!loading && news.length === 0 && (
        <p className="nf-empty">No recent news found for these tickers.</p>
      )}

      <div className="nf-list">
        {news.map((item, i) => {
          const color = colorMap[item.symbol] || "#8FA0C4";
          return (
            <div
              key={i}
              className="nf-item"
            >
              <div className="nf-item-left">
                <span className="nf-ticker-tag" style={{ color, borderColor: `${color}44`, background: `${color}0f` }}>
                  {item.symbol}
                </span>
                <h4 className="nf-title">{item.title}</h4>
                {item.snippet && <p className="nf-snippet">{item.snippet}…</p>}
                <div className="nf-meta">
                  <span className="nf-source">{item.source}</span>
                  <span className="nf-dot">·</span>
                  <span className="nf-time">{timeAgo(item.published)}</span>
                </div>
              </div>
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="nf-thumb"
                  loading="lazy"
                  onError={e => { e.target.style.display = "none"; }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
