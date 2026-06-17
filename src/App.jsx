import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Forum    from "./Forum.jsx";
import RightDock from "./RightDock.jsx";
import Settings from "./Settings.jsx";
import QDLogo from "./QDLogo.jsx";
import Sparkline from "./Sparkline.jsx";
import PriceChart from "./PriceChart.jsx";
import SectorSection      from "./SectorSection.jsx";
import TechnicalSignals  from "./TechnicalSignals.jsx";
import NewsFeed          from "./NewsFeed.jsx";
import KeyRatios         from "./KeyRatios.jsx";
import DailyBrief        from "./DailyBrief.jsx";
import ContactModal      from "./ContactModal.jsx";
import AnalystPanel      from "./AnalystPanel.jsx";
import InsiderFeed       from "./InsiderFeed.jsx";
import TraderMatch       from "./TraderMatch.jsx";
import ScoreHistory      from "./ScoreHistory.jsx";

const SECTORS = [
  {
    id: "quantum",
    name: "Quantum Stocks",
    icon: "⚛️",
    accent: "#8B5CF6",
    tickers: ["IONQ", "RGTI", "QUBT", "QBTS", "IBM", "GOOGL", "MSFT"],
  },
  {
    id: "ai",
    name: "AI Stocks",
    icon: "🧠",
    accent: "#22D3EE",
    tickers: ["NVDA", "AMD", "META", "MSFT", "PLTR", "AI", "SOUN", "SMCI"],
  },
  {
    id: "defence",
    name: "Defence & Space",
    icon: "🛡️",
    accent: "#F59E0B",
    tickers: ["LMT", "RTX", "NOC", "GD", "BA", "RKLB", "ASTS", "KTOS"],
  },
  {
    id: "biotech",
    name: "Biotech & MedTech",
    icon: "🧬",
    accent: "#10B981",
    tickers: ["LLY", "NVO", "MRNA", "REGN", "VRTX", "GILD", "ISRG", "DXCM"],
  },
];

const DEFAULT_TICKERS = "AAPL,MSFT,NVDA,GOOGL,AMZN";
const PRICE_INTERVAL  = 30_000;  // price refresh
const SCORE_INTERVAL  = 60_000;  // full scores + charts refresh

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
function scoreColor(value) {
  if (value == null) return "#2d4a5f";
  if (value >= 65) return "#00dc82";
  if (value >= 40) return "#f59e0b";
  return "#ff3c50";
}

function momLabel(v)  {
  if (v == null) return "—";
  if (v >= 70) return "Accelerating";
  if (v >= 55) return "Steady";
  if (v >= 40) return "Stalling";
  return "Declining";
}
function riskLabel(v) {
  if (v == null) return "—";
  if (v >= 70) return "Low Risk";
  if (v >= 50) return "Moderate";
  if (v >= 35) return "Elevated";
  return "High Risk";
}
function techLabel(v) {
  if (v == null) return "—";
  if (v >= 70) return "Strong Moat";
  if (v >= 50) return "Solid";
  if (v >= 35) return "Average";
  return "Weak";
}

function getVerdict(sc) {
  const { momentum, risk, techValue, signal } = sc || {};
  if (momentum == null) return { label: "NO DATA", color: "#2d4a5f", grade: "—", summary: "Not enough data to generate a verdict for this stock." };

  const sig = signal ?? Math.round(momentum * 0.55 + (risk ?? 50) * 0.45);

  const momHigh  = momentum  >= 65;
  const momLow   = momentum  <  40;
  const riskSafe = (risk ?? 50) >= 65;
  const riskBad  = (risk ?? 50) <  40;
  const techHigh = techValue != null && techValue >= 65;
  const techLow  = techValue != null && techValue <  40;

  let summary;
  if (sig >= 70) {
    if (riskSafe && techHigh)  summary = "All signals align — strong momentum, clean balance sheet, and a durable business model. High-conviction setup.";
    else if (riskSafe)         summary = "Strong momentum with a solid balance sheet. Business quality data is unavailable but the trend and risk profile are attractive.";
    else if (techHigh)         summary = "Accelerating price trend backed by strong fundamentals. Balance sheet warrants monitoring but the setup is positive.";
    else                       summary = "Strong momentum across all timeframes. Keep an eye on the balance sheet before sizing up.";
  } else if (sig >= 55) {
    if (momHigh && riskBad)    summary = "Price is moving well but the balance sheet carries elevated risk. Consider a smaller position until fundamentals improve.";
    else if (momLow && riskSafe) summary = "Solid financial foundation but price momentum is weak. Worth watching — not yet a buy signal.";
    else if (techLow)          summary = "Decent momentum but limited competitive moat. Good for a short-term trade, not a long-term hold.";
    else                       summary = "Mixed signals — some positives but no clear conviction across all three dimensions. Watch for confirmation.";
  } else if (sig >= 40) {
    if (momLow && riskBad)     summary = "Weak trend and elevated balance sheet risk. No signal here — stay on the sidelines.";
    else if (techLow)          summary = "Low margins and limited R&D suggest no durable advantage. Price trend offers no confirmation either.";
    else                       summary = "Neutral territory across the board. No edge in either direction — wait for a clearer setup.";
  } else {
    if (riskBad && momLow)     summary = "Declining momentum combined with a weak balance sheet. This is a high-risk situation — risk-reward does not favour entry.";
    else if (momLow)           summary = "Price is in a clear downtrend. Fundamental data does not provide enough justification to fight the trend.";
    else                       summary = "Scores are below threshold across multiple dimensions. Avoid until there is meaningful improvement.";
  }

  if (sig >= 70) return { label: "STRONG SIGNAL", color: "#00dc82", grade: "A", sig, summary };
  if (sig >= 55) return { label: "WATCH",         color: "#22D3EE", grade: "B", sig, summary };
  if (sig >= 40) return { label: "MIXED",         color: "#f59e0b", grade: "C", sig, summary };
  return              { label: "AVOID",           color: "#ff3c50", grade: "D", sig, summary };
}

function ScoreBar({ label, value }) {
  const color = scoreColor(value);
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

function StockCard({ stock, scores, chart, selected, onClick }) {
  const positive = (stock.change ?? 0) >= 0;
  const verdict  = getVerdict(scores);
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

      {/* Signal verdict badge */}
      <div className="card-verdict" style={{ borderColor: verdict.color + "40", background: verdict.color + "12" }}>
        <span className="card-verdict-grade" style={{ color: verdict.color }}>{verdict.grade}</span>
        <span className="card-verdict-label" style={{ color: verdict.color }}>{verdict.label}</span>
        {scores?.signal != null && (
          <span className="card-verdict-sig" style={{ color: verdict.color }}>
            {scores.signal}<span style={{ fontSize: "0.7em", opacity: 0.6 }}>/100</span>
          </span>
        )}
      </div>

      <div className="sparkline-wrap">
        <Sparkline bars={chart} ticker={stock.symbol} />
      </div>
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
        <ScoreBar label="MOM"  value={scores?.momentum} />
        <ScoreBar label="RISK" value={scores?.risk}      />
        <ScoreBar label="TECH" value={scores?.techValue} />
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
    const rColor = scoreColor(risk);
    const rLabel = riskLabel(risk);

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
            <span className="risk-stat-label">Safety Rating</span>
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
              {s.techValue ?? (s.hasFundamentals === false ? "—" : "—")}
            </span>
          </div>
        </div>

        <div className="risk-bars">
          <ScoreBar label="Risk Score"   value={risk}       />
          <ScoreBar label="Momentum"     value={s.momentum} />
          <ScoreBar label="Tech Value"   value={s.techValue}/>
        </div>

      </section>
    );
  }

  // Portfolio view
  const rows = stocks
    .map((s) => ({ symbol: s.symbol, ...scoresMap[s.symbol] }))
    .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));

  const avgRisk  = rows.filter((r) => r.risk != null).reduce((s, r) => s + r.risk, 0) / (rows.filter((r) => r.risk != null).length || 1);
  const highRisk = rows.filter((r) => (r.risk ?? 100) < 40).length; // count genuinely risky (low score) stocks
  const rColor   = scoreColor(Math.round(avgRisk));

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
          <span className="risk-stat-label">Risky Assets</span>
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
            <span className="risk-level" style={{ color: scoreColor(r.risk) }}>
              {r.risk != null ? (r.risk >= 65 ? "SAFE" : r.risk >= 40 ? "MOD" : "RISK") : "—"}
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

    const verdict  = getVerdict(sc);
    const pctAbs   = Math.abs(s.changePercent ?? 0);

    const insights = [
      sc.momentum  != null && `Momentum ${sc.momentum}/100 — ${momLabel(sc.momentum)}. ${sc.momentum >= 65 ? "Price trend and volume confirm bullish continuation." : sc.momentum >= 40 ? "Mixed signals — no clear directional conviction yet." : "Weak trend — price is below key moving averages."}`,
      sc.risk      != null && `Risk ${sc.risk}/100 — ${riskLabel(sc.risk)}. ${sc.risk >= 65 ? "Strong balance sheet with manageable debt and healthy liquidity." : sc.risk >= 40 ? "Moderate risk profile — within normal range for this sector." : "Elevated balance sheet risk — high debt or low liquidity detected."}`,
      sc.techValue != null && `Tech Value ${sc.techValue}/100 — ${techLabel(sc.techValue)}. ${sc.techValue >= 65 ? "High R&D intensity and gross margins signal durable competitive advantage." : sc.techValue >= 40 ? "Average innovation profile relative to sector peers." : "Limited R&D investment and margin compression detected."}`,
      `${s.symbol} ${positive ? "gained" : "lost"} ${fmt(pctAbs)}% today from a previous close of $${fmt(s.prevClose)}.`,
    ].filter(Boolean);

    return (
      <section className="panel">
        <div className="panel-header">
          <div className="panel-eyebrow">Signal · {s.symbol}</div>
          <h2 className="panel-title">Financial Intelligence</h2>
        </div>

        {/* Verdict block */}
        <div className="fi-verdict" style={{ borderColor: verdict.color + "35", background: verdict.color + "0e" }}>
          <div className="fi-verdict-left">
            <div className="fi-verdict-grade" style={{ color: verdict.color, borderColor: verdict.color + "50" }}>
              {verdict.grade}
            </div>
            <div>
              <div className="fi-verdict-label" style={{ color: verdict.color }}>{verdict.label}</div>
              {sc.signal != null && (
                <div className="fi-verdict-sig" style={{ color: verdict.color }}>
                  Signal score: <strong>{sc.signal}</strong>/100
                </div>
              )}
            </div>
          </div>
          <p className="fi-verdict-summary">{verdict.summary}</p>
        </div>

        <div className="fi-grid">
          <div className="fi-stat-group">
            <div className="fi-stat">
              <span className="fi-stat-label">Momentum</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.momentum) }}>{sc.momentum ?? "—"}</span>
              <span className="fi-stat-sub" style={{ color: scoreColor(sc.momentum) }}>{momLabel(sc.momentum)}</span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Risk</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.risk) }}>{sc.risk ?? "—"}</span>
              <span className="fi-stat-sub" style={{ color: scoreColor(sc.risk) }}>{riskLabel(sc.risk)}</span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Tech Value</span>
              <span className="fi-stat-value" style={{ color: scoreColor(sc.techValue) }}>{sc.techValue ?? "—"}</span>
              <span className="fi-stat-sub" style={{ color: scoreColor(sc.techValue) }}>{techLabel(sc.techValue)}</span>
            </div>
            <div className="fi-stat">
              <span className="fi-stat-label">Direction</span>
              <span className="fi-stat-value" style={{ color: positive ? "#00dc82" : "#ff3c50" }}>{positive ? "BULLISH" : "BEARISH"}</span>
              <span className="fi-stat-sub">{positive ? "▲" : "▼"} {fmt(pctAbs)}%</span>
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
export default function App({ session, onLogout, onAdmin }) {
  const [input, setInput]         = useState(DEFAULT_TICKERS);
  const [tickers, setTickers]     = useState(DEFAULT_TICKERS);
  const [stocks, setStocks]       = useState([]);
  const [scoresMap, setScoresMap] = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartsMap, setChartsMap] = useState({});
  const [selected, setSelected]   = useState(null);
  const [username, setUsername]   = useState(null);
  const [profile,  setProfile]   = useState(null);
  const [settings, setSettings]  = useState({});
  const [showSettings,   setShowSettings]   = useState(false);
  const [showContact,    setShowContact]    = useState(false);
  const [showCommunity,  setShowCommunity]  = useState(false);

  useEffect(() => {
    if (!session) return;
    import("./supabaseClient.js").then(({ supabase }) =>
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => {
          if (!data) return;
          setProfile(data);
          setUsername(data.username);
          const s = data.settings || {};
          setSettings(s);
          applySettings(s);
          // Load saved watchlist
          if (s.defaultTickers) {
            setInput(s.defaultTickers);
            setTickers(s.defaultTickers);
          }
        })
    );
  }, [session]);

  function applySettings(s) {
    const root = document.documentElement;
    // Brightness
    const b = s.brightness || "dark";
    root.style.setProperty("--bg-base",  b === "dark" ? "#020509" : b === "balanced" ? "#050d18" : "#0a1828");
    root.style.setProperty("--bg-card",  b === "dark" ? "rgba(255,255,255,0.03)" : b === "balanced" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)");
    // Accent
    const accents = { blue: "#00b4ff", teal: "#00dc82", purple: "#7c3aed" };
    root.style.setProperty("--accent", accents[s.accent || "blue"]);
  }

  function handleSaveSettings(newSettings, newAvatarColor) {
    setSettings(newSettings);
    setProfile(p => ({ ...p, avatar_color: newAvatarColor }));
    applySettings(newSettings);
    if (newSettings.defaultTickers) {
      setInput(newSettings.defaultTickers);
      setTickers(newSettings.defaultTickers);
    }
  }

  // Full refresh: prices + scores + charts
  const fetchAll = useCallback(async () => {
    if (!tickers.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};
      const q = encodeURIComponent(tickers);
      const [stocksRes, scoresRes, chartsRes] = await Promise.all([
        fetch(`/api/stocks?tickers=${q}`, { headers }),
        fetch(`/api/scores?tickers=${q}`, { headers }),
        fetch(`/api/charts?tickers=${q}`, { headers }),
      ]);

      const stocksJson = await stocksRes.json();
      const scoresJson = await scoresRes.json();
      const chartsJson = chartsRes.ok ? await chartsRes.json() : { charts: {} };

      if (!stocksRes.ok) throw new Error(stocksJson.error || "Stocks request failed");

      setStocks(stocksJson.data || []);
      const map = {};
      for (const s of scoresJson.scores || []) map[s.symbol] = s;
      setScoresMap(map);
      setChartsMap(chartsJson.charts || {});
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tickers, session]);

  // Fast price-only refresh (every 10s) — no loading spinner, silent update
  const fetchPrices = useCallback(async () => {
    if (!tickers.trim()) return;
    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
    try {
      const res = await fetch(`/api/stocks?tickers=${encodeURIComponent(tickers)}`, { headers });
      if (res.ok) {
        const j = await res.json();
        setStocks(j.data || []);
        setLastUpdated(new Date());
      }
    } catch {}
  }, [tickers, session]);

  useEffect(() => {
    fetchAll();
    const fullId  = setInterval(fetchAll,   SCORE_INTERVAL);
    const priceId = setInterval(fetchPrices, PRICE_INTERVAL);
    return () => { clearInterval(fullId); clearInterval(priceId); };
  }, [fetchAll, fetchPrices]);

  function handleSubmit(e) {
    e.preventDefault();
    setSelected(null);
    setTickers(input.toUpperCase());
  }

  function handleSelect(stock) {
    setSelected((prev) => prev?.symbol === stock.symbol ? null : stock);
  }

  // Sector stock selected — merge its scores into scoresMap so panels work
  function handleSectorSelect(stock, sectorScores) {
    setSelected((prev) => prev?.symbol === stock.symbol ? null : stock);
    setScoresMap((prev) => ({ ...prev, ...sectorScores }));
  }

  // Trial banner
  const trialMeta = session?.user?.user_metadata?.trial_ends_at;
  const trialDaysLeft = trialMeta
    ? Math.ceil((new Date(trialMeta) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft >= 0
    && session?.user?.user_metadata?.subscription_status !== "active";

  // ── Community page (full replace — dashboard not rendered) ──
  if (showCommunity) {
    return (
      <div className="app">
        <div className="community-page">
          <Forum session={session} onClose={() => setShowCommunity(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showTrialBanner && (
        <div style={{
          background: trialDaysLeft <= 3 ? "rgba(245,158,11,.12)" : "rgba(0,180,255,.08)",
          borderBottom: `1px solid ${trialDaysLeft <= 3 ? "rgba(245,158,11,.3)" : "rgba(0,180,255,.2)"}`,
          padding: "10px 20px", textAlign: "center",
          fontSize: ".82rem", color: trialDaysLeft <= 3 ? "#f59e0b" : "#5a9abf",
          letterSpacing: ".03em",
        }}>
          {trialDaysLeft === 0
            ? "Your free trial expires today — "
            : `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining — `}
          <span style={{ color: "#00b4ff", cursor: "pointer", textDecoration: "underline" }}>
            Upgrade to keep access
          </span>
        </div>
      )}
      <header className="header">
        <div className="header-brand">
          <QDLogo size={52} />
          <div>
            <h1>QuantDiver</h1>
            <div className="header-eyebrow">Quant Scores · <span style={{ color: "#f59e0b" }}>15-min delayed</span></div>
            {username && <div className="header-welcome">Welcome back, {username}</div>}
          </div>
        </div>
        <div className="header-actions">
          {onAdmin && (
            <button className="logout-btn" onClick={onAdmin} style={{ background: "rgba(0,180,255,.1)", borderColor: "rgba(0,180,255,.3)", color: "#00b4ff" }}>
              Admin
            </button>
          )}
          <button className="logout-btn" onClick={() => setShowContact(true)}>
            <span className="btn-label-full">Contact Support</span>
            <span className="btn-label-short">Support</span>
          </button>
          <button className="logout-btn" onClick={async () => { await import("./supabaseClient.js").then(m => m.supabase.auth.signOut()); onLogout(); }}>
            Sign Out
          </button>
          <button className="gear-btn" onClick={() => setShowSettings(true)} title="Settings">⚙</button>
        </div>
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
              chart={chartsMap[s.symbol]}
              selected={selected?.symbol === s.symbol}
              onClick={() => handleSelect(s)}
            />
          ))}
        </div>
      )}

      {selected && <PriceChart            stock={selected} session={session} />}
      {selected && <TechnicalSignals      stock={selected} session={session} />}
      {selected && <FinancialIntelligence stocks={stocks} scoresMap={scoresMap} selected={selected} />}
      {selected && <ScoreHistory          stock={selected} session={session} />}
      {selected && <AnalystPanel          stock={selected} session={session} />}
      {selected && <InsiderFeed           stock={selected} session={session} />}

      <DailyBrief session={session} />

      {(stocks.length > 0 || selected) && (
        <div className="sections">
          <AdvancedRiskAssessment stocks={stocks} scoresMap={scoresMap} selected={selected} />
          {selected && <KeyRatios          stock={selected} session={session} />}
        </div>
      )}

      {/* News feed — shows selected stock news or full watchlist news */}
      {stocks.length > 0 && (
        <NewsFeed
          tickers={selected ? [selected.symbol] : stocks.map(s => s.symbol).slice(0, 5)}
          session={session}
        />
      )}

      <div className="sectors-wrap">
        <h2 className="sectors-heading">Market Sectors</h2>
        {SECTORS.map(s => (
          <SectorSection
            key={s.id}
            name={s.name}
            icon={s.icon}
            tickers={s.tickers}
            accent={s.accent}
            session={session}
            onSelect={handleSectorSelect}
            selectedSymbol={selected?.symbol}
          />
        ))}
      </div>

      {lastUpdated && (
        <p className="timestamp">Updated {lastUpdated.toLocaleTimeString()}</p>
      )}
      <RightDock session={session} onOpenCommunity={() => setShowCommunity(true)} />
      {showSettings && (
        <Settings
          session={session}
          profile={profile}
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showContact && (
        <ContactModal
          userEmail={session?.user?.email}
          onClose={() => setShowContact(false)}
        />
      )}

      <footer className="app-footer">
        <p style={{ marginBottom: "1.25rem" }}>
          QuantDiver provides data and proprietary scores for informational purposes only.
          Nothing on this platform constitutes financial advice.
          Always conduct your own research before making any investment decision.
        </p>
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}>
          <p style={{ color: "#3d5c78", fontSize: "0.82rem", lineHeight: 1.7, maxWidth: 680, margin: "0 auto" }}>
            <span style={{ color: "#8aaec8", fontWeight: 700 }}>Become a QuantDiver Contributor.</span>{" "}
            Instead of a subscription, contributors get full access to all platform resources — completely free.
            In return, you share your own ideas, analysis, and market thinking with the community,
            and stay actively engaged. If that sounds like you, introduce yourself and we will take it from there.{" "}
            <a href="mailto:hello@quantdiver.com" style={{ color: "#00b4ff", textDecoration: "none", fontWeight: 600 }}>
              hello@quantdiver.com
            </a>
          </p>
          <p style={{ color: "#1a3050", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
            © {new Date().getFullYear()} QuantDiver. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
