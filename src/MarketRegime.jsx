import { useState, useEffect } from "react";

function fmt(n, d = 2) { return n == null ? "—" : Number(n).toFixed(d); }
function sign(n) { return n > 0 ? "+" : ""; }

export default function MarketRegime({ session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch("/api/market-regime", { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  if (loading || !data) return null;

  const { vix, spx, spxPctFromATH, qq, regime, multiplier } = data;

  const vixColor = vix == null ? "#3d5c78"
                 : vix < 15   ? "#00dc82"
                 : vix < 20   ? "#00b4ff"
                 : vix < 25   ? "#f59e0b"
                 : vix < 35   ? "#ff3c50"
                 :               "#ff3c50";

  const vixLabel = vix == null ? "—"
                 : vix < 15   ? "CALM"
                 : vix < 20   ? "NORMAL"
                 : vix < 25   ? "ELEVATED"
                 : vix < 35   ? "HIGH FEAR"
                 :               "CRISIS";

  const multiplierPct = Math.round((multiplier - 1) * 100);

  return (
    <div style={{
      background: `${regime.color}08`,
      border: `1px solid ${regime.color}30`,
      borderRadius: 14,
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 5 }}>
            Overall Market Condition
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: regime.color, boxShadow: `0 0 8px ${regime.color}` }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "1rem", fontWeight: 700, color: regime.color }}>
              {regime.label}
            </span>
          </div>
        </div>
        <div style={{ fontSize: ".75rem", color: "#3d5c78", fontFamily: "'Space Mono',monospace", textAlign: "right" }}>
          Momentum signals {multiplierPct >= 0 ? "boosted" : "dampened"}{" "}
          <span style={{ color: multiplierPct >= 0 ? "#00dc82" : "#ff3c50", fontWeight: 700 }}>
            {multiplierPct >= 0 ? "+" : ""}{multiplierPct}%
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, overflow: "hidden" }}>
        {[
          {
            label: "Volatility",
            value: vix != null ? `${vix}%` : "—",
            sub:   vixLabel,
            color: vixColor,
          },
          {
            label: "SPY (S&P proxy)",
            value: spy ? `$${fmt(spy, 0)}` : "—",
            sub:   spxPctFromATH != null ? `${sign(spxPctFromATH)}${fmt(spxPctFromATH, 1)}% from ATH` : "—",
            color: spxPctFromATH != null && spxPctFromATH > -5 ? "#f59e0b" : spxPctFromATH != null && spxPctFromATH < -15 ? "#ff3c50" : "#00b4ff",
          },
          {
            label: "QQQ",
            value: qq ? `$${fmt(qq, 0)}` : "—",
            sub:   "Nasdaq proxy",
            color: "#8b5cf6",
          },
          {
            label: "Regime Score",
            value: regime.score,
            sub:   "0 = crisis · 100 = ideal",
            color: regime.color,
          },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(5,10,18,0.95)", padding: "0.9rem 1rem" }}>
            <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: ".65rem", color: "#3d5c78", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Regime explanation */}
      <p style={{ margin: "0.85rem 0 0", fontSize: ".78rem", color: "#4a6a88", lineHeight: 1.65 }}>
        {regime.label === "FAVORABLE"  && "Market conditions are calm. Momentum signals are reliable and boosted. Good environment for high-signal setups."}
        {regime.label === "NEUTRAL"    && "Conditions are normal. Momentum signals run at full weight. No macro headwind or tailwind."}
        {regime.label === "CAUTION"    && "Volatility is elevated. Momentum signals are dampened — even good setups carry higher macro risk. Size positions carefully."}
        {regime.label === "RISK-OFF"   && "Market is in risk-off mode. Fear is driving prices more than fundamentals. Momentum signals are significantly dampened. Favour defensive positions."}
        {regime.label === "CRISIS"     && "Crisis conditions. Momentum signals are near-meaningless — macro is overwhelming company-level analysis. Capital preservation first."}
        {regime.label === "UNKNOWN"    && "Market data unavailable. Signals shown without regime adjustment."}
      </p>
    </div>
  );
}
