import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Hugo from "./Hugo.jsx";
import Chat from "./Chat.jsx";

const DEFAULT_TICKERS = "AAPL,MSFT,NVDA,GOOGL,AMZN";
const REFRESH_INTERVAL = 60_000;

function fmt(n, decimals = 2) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtVol(n) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

// ── Score helpers ──────────────────────────────────────────
function scoreColor(value, invert = false) {
  if (value == null) return "#2d4a5f";
  const v = invert ? 100 - value : value;
  if (v >= 65) return "#00dc82";
  if (v >= 40) return "#f59e0b";
  return "#ff3c50";
}

function ScoreBar({ label, value, invert = false }) {
  const color = scoreColor(value, invert);
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: value != null ? `${value}%` : "0%", background: color, boxShadow: `0 0 6px ${color}44` }}
        />
      </div>
      <span className="score-value" style={{ color }}>
        {value != null ? value : "—"}
      </span>
    </div>
  );
}

// ── Stock Card ─────────────────────────────────────────────
function ChangeChip({ value }) {
  if (value == null) return <span className="chip neutral">—</span>;
  const up = value >= 0;
  return (
    <span className={`chip ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {fmt(Math.abs(value))}%
    </span>
  );
}

function StockCard({ stock, scores, selected, onClick }) {
  const positive = (stock.change ?? 0) >= 0;
  return (
    <div
      className={`card ${positive ? "positive" : "negative"} ${selected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="card-glow" />
      <div className="card-header">
        <span className="symbol">{stock.symbol}</span>
        <ChangeChip value={stock.changePercent} />
      </div>
      <div className="price">{stock.price ? `$${fmt(stock.price)}` : "—"}</div>
      <div className="meta">
        <div className="meta-row">
          <span className="label">Prev Close</span>
          <span className="meta-value">${fmt(stock.prevClose)}</span>
        </div>
        <div className="meta-row">
          <span className="label">Change</span>
          <span className={`meta-value ${positive ? "green" : "red"}`}>
            {positive ? "+" : ""}{fmt(stock.change)}
          </span>
        </div>
        <div className="meta-row">
          <span className="label">Volume</span>
          <span className="meta-value">{fmtVol(stock.volume)}</span>
        </div>
      </div>

      <div className="score-section">
        <ScoreBar label="MOM"  value={scores?.momentum}  invert={false} />
        <ScoreBar label="RISK" value={scores?.risk}       invert={true}  />
        <ScoreBar label="TECH" value={scores?.techValue}  invert={false} />
      </div>
    </div>
  );
}

// ── Advanced Risk Assessment ───────────────────────────────
function AdvancedRiskAssessment({ stocks, scoresMap, selected }) {
  if (!stocks.length) return null;

  if (selected) {
    const s      = scoresMap[selected.symbol] || {};
    const risk   = s.risk ?? null;
    const rColor = scoreColor(risk, true);
    const rLabel = risk == null ? "—" : risk >= 65 ? "HIGH" : risk >= 40 ? "ELEVATED" : "LOW";

    return (
      <section className="panel">
        <div className="panel-header">
          <div className="panel-eyebrow">Scoring Engine · {selected.symbol}</div>
          <h2 className="panel-title">Advanced Risk Assessment</h2>
        </div>

        <div className="risk-overview">
          <div className="risk-stat">
            <span className="risk-stat-label">Risk Score</span>
            <span className="risk-stat-value" style={{ color: rColor }}>
              {risk ?? "—"}<span style={{ fontSize: "0.6em", color: "#2d4a5f" }}>{risk != null ? "/100" : ""}</span>
            </span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Rating</span>
            <span className="risk-stat-value" style={{ color: rColor }}>{rLabel}</span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Momentum</span>
            <span className="risk-stat-value" style={{ color: scoreColor(s.momentum) }}>
              {s.momentum ?? "—"}
            </span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Tech Value</span>
            <span className="risk-stat-value" style={{ color: scoreColor(s.techValue) }}>
              {s.techValue ?? (s.hasFundamentals === false ? "No FMP" : "—")}
            </span>
          </div>
        </div>

        <div className="risk-bars">
          <ScoreBar label="Risk Score"   value={risk}          invert={true}  />
          <ScoreBar label="Momentum"     value={s.momentum}    invert={false} />
          <ScoreBar label="Tech Value"   value={s.techValue}   invert={false} />
        </div>

      </section>
    );
  }

  // Portfolio view
  const rows = stocks
    .map((s) => ({ symbol: s.symbol, ...scoresMap[s.symbol] }))
    .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));

  const avgRisk  = rows.filter((r) => r.risk != null).reduce((s, r) => s + r.risk, 0) / (rows.filter((r) => r.risk != null).length || 1);
  const highRisk = rows.filter((r) => (r.risk ?? 0) >= 65).length;
  const rColor   = scoreColor(Math.round(avgRisk), true);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Scoring Engine · Portfolio View</div>
        <h2 className="panel-title">Advanced Risk Assessment</h2>
      </div>

      <div className="risk-overview">
        <div className="risk-stat">
          <span className="risk-stat-label">Avg Risk</span>
          <span className="risk-stat-value" style={{ color: rColor }}>{Math.round(avgRisk)}</span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-label">High-Risk Assets</span>
          <span className="risk-stat-value" style={{ color: highRisk > 0 ? "#ff3c50" : "#00dc82" }}>
            {highRisk} / {rows.length}
          </span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-label">Avg Momentum</span>
          <span className="risk-stat-value">
            {Math.round(rows.filter((r) => r.momentum != null).reduce((s, r) => s + r.momentum, 0) / (rows.filter((r) => r.momentum != null).length || 1))}
          </span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-label">Fundamentals</span>
          <span className="risk-stat-value" style={{ color: rows.some((r) => r.hasFundamentals) ? "#00dc82" : "#f59e0b" }}>
            {rows.some((r) => r.hasFundamentals) ? "LIVE" : "PARTIAL"}
          </span>
        </div>
      </div>

      <div className="risk-bars">
        {rows.map((r) => (
          <div key={r.symbol} className="risk-row">
            <span className="risk-symbol">{r.symbol}</span>
            <div className="risk-bar-track">
              <div
                className="risk-bar-fill"
                style={{
                  width: r.risk != null ? `${r.risk}%` : "4%",
                  background: scoreColor(r.risk, true),
                  boxShadow: `0 0 8px ${scoreColor(r.risk, true)}55`,
                }}
              />
            </div>
            <span className="risk-level" style={{ color: scoreColor(r.risk, true) }}>
              {r.risk != null ? (r.risk >= 65 ? "HIGH" : r.risk >= 40 ? "ELEV" : "LOW") : "—"}
            </span>
            <span className="risk-pct">{r.risk ?? "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Financial Intelligence ─────────────────────────────────
function FinancialIntelligence({ stocks, scoresMap, selected }) {
  if (!stocks.length) return null;

  if (selected) {
    const s   = selected;
    const sc  = scoresMap[s.symbol] || {};
    const positive = (s.change ?? 0) >= 0;

    const momLabel  = sc.momentum  != null ? (sc.momentum  >= 65 ? "STRONG" : sc.momentum  >= 40 ? "MODERATE" : "WEAK") : null;
    const techLabel = sc.techValue != null ? (sc.techValue >= 65 ? "STRONG" : sc.techValue >= 40 ? "FAIR"     : "WEAK") : null;
    const pctAbs    = Math.abs(s.changePercent ?? 0);

    const insights = [
      sc.momentum  != null && `Momentum score of ${sc.momentum}/100 — ${momLabel} signal. ${sc.momentum >= 65 ? "Price trend and volume confirm bullish continuation." : sc.momentum >= 40 ? "Mixed signals — no clear directional conviction." : "Weak trend — price below key moving averages."}`,
      sc.risk      != null && `Risk score of ${sc.risk}/100 — ${sc.risk >= 65 ? "elevated exposure, consider position sizing carefully." : sc.risk >= 40 ? "moderate risk profile, within normal range." : "low risk profile, strong balance sheet fundamentals."}`,
      sc.techValue != null && `Tech Value score of ${sc.techValue}/100 — ${techLabel} moat. ${sc.techValue >= 65 ? "High R&D intensity and gross margins signal durable competitive advantage." : sc.techValue >= 40 ? "Average innovation profile relative to sector." : "Limited R&D investment and margin compression detected."}`,
      !sc.hasFundamentals && `Full fundamental scores unavailable — add FMP_API_KEY to unlock Risk and Tech Value depth.`,
      `${s.symbol} ${positive ? "gained" : "lost"} ${fmt(pctAbs)}% this session from a previous close of $${fmt(s.prevClose)}.`,
    ].filter(Boolean);

    return (
      <section className="panel">
        <div className="panel-header">
          <div className="panel-eyebrow">AI-Powered Insights · {s.symbol}</div>
          <h2 className="panel-title">Financial Intelligence</h2>
        </div>

        <div className="fi-grid">
          <div className="fi-stat-group">
            <div className="fi-stat">
              <span className="fi-stat-label">Momentum</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.momentum) }}>
                {sc.momentum ?? "—"}
              </span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Risk</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.risk, true) }}>
                {sc.risk ?? "—"}
              </span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Tech Value</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.techValue) }}>
                {sc.techValue ?? "—"}
              </span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Direction</span>
              <span className="fi-stat-value" style={{ color: positive ? "#00dc82" : "#ff3c50" }}>
                {positive ? "BULLISH" : "BEARISH"}
              </span>
            </div>
          </div>

          <div className="fi-leaders">
            <div className="fi-leader-row">
              <span className="fi-leader-label">Current</span>
              <span className="fi-leader-ticker">${fmt(s.price)}</span>
              <span className={`fi-leader-val ${positive ? "green" : "red"}`}>{positive ? "▲" : "▼"}</span>
            </div>
            <div className="fi-leader-row">
              <span className="fi-leader-label">Prev Close</span>
              <span className="fi-leader-ticker">${fmt(s.prevClose)}</span>
              <span className="fi-leader-val" />
            </div>
            <div className="fi-leader-row">
              <span className="fi-leader-label">Volume</span>
              <span className="fi-leader-ticker">{fmtVol(s.volume)}</span>
              <span className="fi-leader-val" />
            </div>
          </div>
        </div>

        <div className="insights">
          {insights.map((text, i) => (
            <div key={i} className="insight-row">
              <span className="insight-dot" />
              <p className="insight-text">{text}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Portfolio view
  const gainers   = stocks.filter((s) => (s.changePercent ?? 0) > 0);
  const losers    = stocks.filter((s) => (s.changePercent ?? 0) < 0);
  const topGainer = [...stocks].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))[0];
  const topLoser  = [...stocks].sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0))[0];
  const topMom    = [...stocks].sort((a, b) => (scoresMap[b.symbol]?.momentum ?? 0) - (scoresMap[a.symbol]?.momentum ?? 0))[0];
  const breadth   = (gainers.length / stocks.length) * 100;
  const sentiment = breadth >= 60 ? "BULLISH" : breadth <= 40 ? "BEARISH" : "NEUTRAL";
  const sentColor = sentiment === "BULLISH" ? "#00dc82" : sentiment === "BEARISH" ? "#ff3c50" : "#f59e0b";

  const insights = [
    topGainer && `${topGainer.symbol} leads with +${fmt(topGainer.changePercent)}% — momentum score: ${scoresMap[topGainer.symbol]?.momentum ?? "—"}/100.`,
    topLoser  && `${topLoser.symbol} lags at ${fmt(topLoser.changePercent)}% — risk score: ${scoresMap[topLoser.symbol]?.risk ?? "—"}/100.`,
    topMom    && scoresMap[topMom.symbol]?.momentum != null && `Strongest momentum: ${topMom.symbol} scoring ${scoresMap[topMom.symbol].momentum}/100 on the engine.`,
    `Breadth at ${fmt(breadth, 0)}% — ${gainers.length} advancing, ${losers.length} declining. Bias: ${sentiment.toLowerCase()}.`,
  ].filter(Boolean);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-eyebrow">AI-Powered Insights · Portfolio View</div>
        <h2 className="panel-title">Financial Intelligence</h2>
      </div>

      <div className="fi-grid">
        <div className="fi-stat-group">
          <div className="fi-stat">
            <span className="fi-stat-label">Sentiment</span>
            <span className="fi-stat-value" style={{ color: sentColor }}>{sentiment}</span>
          </div>
          <div className="fi-stat">
            <span className="fi-stat-label">Breadth</span>
            <span className="fi-stat-value">{fmt(breadth, 0)}%</span>
          </div>
          <div className="fi-stat">
            <span className="fi-stat-label">Advancing</span>
            <span className="fi-stat-value green">{gainers.length}</span>
          </div>
          <div className="fi-stat">
            <span className="fi-stat-label">Declining</span>
            <span className="fi-stat-value red">{losers.length}</span>
          </div>
        </div>

        <div className="fi-leaders">
          <div className="fi-leader-row">
            <span className="fi-leader-label">Top Gainer</span>
            <span className="fi-leader-ticker">{topGainer?.symbol}</span>
            <span className="fi-leader-val green">+{fmt(topGainer?.changePercent)}%</span>
          </div>
          <div className="fi-leader-row">
            <span className="fi-leader-label">Top Loser</span>
            <span className="fi-leader-ticker">{topLoser?.symbol}</span>
            <span className="fi-leader-val red">{fmt(topLoser?.changePercent)}%</span>
          </div>
          <div className="fi-leader-row">
            <span className="fi-leader-label">Best Momentum</span>
            <span className="fi-leader-ticker">{topMom?.symbol}</span>
            <span className="fi-leader-val">{scoresMap[topMom?.symbol]?.momentum ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="insights">
        {insights.map((text, i) => (
          <div key={i} className="insight-row">
            <span className="insight-dot" />
            <p className="insight-text">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── App ────────────────────────────────────────────────────
export default function App({ session, onLogout }) {
  const [input, setInput]         = useState(DEFAULT_TICKERS);
  const [tickers, setTickers]     = useState(DEFAULT_TICKERS);
  const [stocks, setStocks]       = useState([]);
  const [scoresMap, setScoresMap] = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected]   = useState(null);

  const fetchAll = useCallback(async () => {
    if (!tickers.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [stocksRes, scoresRes] = await Promise.all([
        fetch(`/api/stocks?tickers=${encodeURIComponent(tickers)}`),
        fetch(`/api/scores?tickers=${encodeURIComponent(tickers)}`),
      ]);

      const stocksJson = await stocksRes.json();
      const scoresJson = await scoresRes.json();

      if (!stocksRes.ok) throw new Error(stocksJson.error || "Stocks request failed");

      setStocks(stocksJson.data || []);

      // Build symbol → scores lookup
      const map = {};
      for (const s of scoresJson.scores || []) map[s.symbol] = s;
      setScoresMap(map);

      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAll]);

  function handleSubmit(e) {
    e.preventDefault();
    setSelected(null);
    setTickers(input.toUpperCase());
  }

  function handleSelect(stock) {
    setSelected((prev) => prev?.symbol === stock.symbol ? null : stock);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>QuantDiver</h1>
          <div className="header-eyebrow">Real-Time Quant Scores</div>
        </div>
        <button className="logout-btn" onClick={async () => { await import("./supabaseClient.js").then(m => m.supabase.auth.signOut()); onLogout(); }}>
          Sign Out
        </button>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="ticker-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AAPL, MSFT, NVDA..."
          spellCheck={false}
        />
        <button className="btn" type="submit">Analyze</button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading && stocks.length === 0 ? (
        <div className="loading">
          <div className="loading-spinner" />
          Fetching market data
        </div>
      ) : (
        <div className="grid">
          {stocks.map((s) => (
            <StockCard
              key={s.symbol}
              stock={s}
              scores={scoresMap[s.symbol]}
              selected={selected?.symbol === s.symbol}
              onClick={() => handleSelect(s)}
            />
          ))}
        </div>
      )}

      {stocks.length > 0 && (
        <div className="sections">
          <AdvancedRiskAssessment stocks={stocks} scoresMap={scoresMap} selected={selected} />
          <FinancialIntelligence  stocks={stocks} scoresMap={scoresMap} selected={selected} />
        </div>
      )}

      {lastUpdated && (
        <p className="timestamp">Updated {lastUpdated.toLocaleTimeString()}</p>
      )}
      <Hugo />
      <Chat session={session} />
    </div>
  );
}
