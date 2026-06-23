import { useState, useEffect } from "react";

const SECTORS = [
  { id: "ai",             name: "AI",              icon: "🧠", accent: "#22D3EE", tickers: ["NVDA","AMD","META","MSFT","PLTR","AI","SOUN","SMCI"] },
  { id: "semiconductors", name: "Semiconductors",  icon: "🔬", accent: "#F97316", tickers: ["NVDA","TSM","AVGO","AMD","QCOM","INTC","MU","ASML","TXN","AMAT"] },
  { id: "quantum",        name: "Quantum",         icon: "⚛️", accent: "#8B5CF6", tickers: ["IONQ","RGTI","QUBT","QBTS","IBM","GOOGL","MSFT"] },
  { id: "defence",        name: "Defence & Space", icon: "🛡️", accent: "#F59E0B", tickers: ["LMT","RTX","NOC","GD","BA","RKLB","ASTS","KTOS"] },
  { id: "biotech",        name: "Biotech",         icon: "🧬", accent: "#10B981", tickers: ["LLY","NVO","MRNA","REGN","VRTX","GILD","ISRG","DXCM"] },
];

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  return v >= 65 ? "#00dc82" : v >= 40 ? "#f59e0b" : "#ff3c50";
}

function riskLabel(v) {
  if (v == null) return "—";
  if (v >= 70) return "LOW RISK";
  if (v >= 50) return "MODERATE";
  if (v >= 35) return "ELEVATED";
  return "HIGH RISK";
}

export default function SectorRiskPanel({ session }) {
  const [activeSector, setActiveSector] = useState(SECTORS[0]);
  const [scores, setScores]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSector) return;
    setLoading(true);
    setScores([]);
    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
    const q = encodeURIComponent(activeSector.tickers.join(","));
    fetch(`/api/scores?tickers=${q}`, { headers })
      .then(r => r.json())
      .then(data => {
        setScores(data.scores || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSector, session]);

  const sorted = [...scores].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));
  const withRisk = sorted.filter(s => s.risk != null);
  const avgRisk  = withRisk.length ? Math.round(withRisk.reduce((s, r) => s + r.risk, 0) / withRisk.length) : null;
  const avgMom   = sorted.filter(s => s.momentum != null).length
    ? Math.round(sorted.filter(s => s.momentum != null).reduce((s, r) => s + r.momentum, 0) / sorted.filter(s => s.momentum != null).length)
    : null;

  const safe     = withRisk.filter(s => s.risk >= 65).length;
  const moderate = withRisk.filter(s => s.risk >= 40 && s.risk < 65).length;
  const elevated = withRisk.filter(s => s.risk >= 25 && s.risk < 40).length;
  const high     = withRisk.filter(s => s.risk < 25).length;

  const accent = activeSector.accent;

  return (
    <section className="panel">
      <div className="panel-header" style={{ marginBottom: "1.25rem" }}>
        <div className="panel-eyebrow">Scoring Engine · Sector View</div>
        <h2 className="panel-title">Sector Risk Assessment</h2>
      </div>

      {/* Sector picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {SECTORS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSector(s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${activeSector.id === s.id ? s.accent + "60" : "rgba(255,255,255,.08)"}`,
              background: activeSector.id === s.id ? s.accent + "18" : "rgba(255,255,255,.03)",
              color: activeSector.id === s.id ? s.accent : "#4a6a88",
              fontFamily: "inherit",
              fontSize: ".78rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            <span>{s.icon}</span> {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#3d5c78", fontSize: ".82rem", padding: "2rem 0", textAlign: "center" }}>
          Loading sector data…
        </div>
      ) : withRisk.length === 0 ? (
        <div style={{ color: "#3d5c78", fontSize: ".82rem", padding: "2rem 0", textAlign: "center" }}>
          No risk data available yet
        </div>
      ) : <>
        {/* Summary stats */}
        <div className="risk-overview" style={{ marginBottom: "1.75rem" }}>
          <div className="risk-stat">
            <span className="risk-stat-label">Avg Risk</span>
            <span className="risk-stat-value" style={{ color: scoreColor(avgRisk) }}>
              {avgRisk ?? "—"}
              <span style={{ fontSize: "0.6em", color: "#2d4a5f" }}>{avgRisk != null ? "/100" : ""}</span>
            </span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Sector Verdict</span>
            <span className="risk-stat-value" style={{ color: scoreColor(avgRisk), fontSize: "1rem" }}>
              {riskLabel(avgRisk)}
            </span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Avg Momentum</span>
            <span className="risk-stat-value" style={{ color: scoreColor(avgMom) }}>
              {avgMom ?? "—"}
            </span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Safe / Risky</span>
            <span className="risk-stat-value">
              <span style={{ color: "#00dc82" }}>{safe}</span>
              <span style={{ color: "#3d5c78", margin: "0 4px" }}>/</span>
              <span style={{ color: "#ff3c50" }}>{elevated + high}</span>
            </span>
          </div>
        </div>

        {/* Risk distribution bar */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 8 }}>
            Risk Distribution
          </div>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2 }}>
            {safe     > 0 && <div style={{ flex: safe,     background: "#00dc82", borderRadius: 3 }} title={`${safe} safe`} />}
            {moderate > 0 && <div style={{ flex: moderate, background: "#f59e0b", borderRadius: 3 }} title={`${moderate} moderate`} />}
            {elevated > 0 && <div style={{ flex: elevated, background: "#f97316", borderRadius: 3 }} title={`${elevated} elevated`} />}
            {high     > 0 && <div style={{ flex: high,     background: "#ff3c50", borderRadius: 3 }} title={`${high} high risk`} />}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: 8, flexWrap: "wrap" }}>
            {[
              { label: "Safe ≥65",      count: safe,     color: "#00dc82" },
              { label: "Moderate 40–64",count: moderate, color: "#f59e0b" },
              { label: "Elevated 25–39",count: elevated, color: "#f97316" },
              { label: "High Risk <25", count: high,     color: "#ff3c50" },
            ].filter(d => d.count > 0).map(d => (
              <span key={d.label} style={{ fontSize: ".65rem", color: d.color, fontWeight: 700 }}>
                ● {d.count} {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Per-stock risk bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
          <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 4 }}>
            Stocks — sorted safest first
          </div>
          {sorted.map(s => {
            const color = scoreColor(s.risk);
            return (
              <div key={s.symbol} style={{ display: "grid", gridTemplateColumns: "60px 1fr 110px 44px", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: accent }}>
                  {s.symbol}
                </span>
                <div style={{ height: 5, background: "rgba(255,255,255,.05)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${s.risk ?? 0}%`, height: "100%", background: color, borderRadius: 99, transition: "width .6s ease" }} />
                </div>
                <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", color, textAlign: "right" }}>
                  {riskLabel(s.risk)}
                </span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", fontWeight: 700, color, textAlign: "right" }}>
                  {s.risk ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </>}
    </section>
  );
}
