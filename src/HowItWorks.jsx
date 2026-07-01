// In-app How It Works page — combines scores reference + Guide (5-step method)
const SCORES = [
  {
    key: "MOMENTUM", icon: "🚀", color: "#22D3EE",
    tagline: "Is the price accelerating?",
    desc: "Measures price trend strength and whether momentum is building or fading. The acceleration component is the key — a stock gaining 30% when it only gained 5% before is a much stronger signal than one sitting at high levels for months.",
    components: [
      { label: "6-Month Return", weight: 30 },
      { label: "Momentum Acceleration", weight: 25 },
      { label: "3-Month Return", weight: 20 },
      { label: "MA Trend (50/200)", weight: 18 },
      { label: "Earnings Surprise", weight: 5 },
      { label: "Relative Volume", weight: 2 },
    ],
  },
  {
    key: "RISK", icon: "🛡️", color: "#00dc82",
    tagline: "Can the company survive a downturn?",
    desc: "Balance sheet survivability. Higher = SAFER. Acts as a floor — we prevent Grade A from being awarded to companies that may not survive long enough for the thesis to play out. Not a return predictor at current weight.",
    components: [
      { label: "Debt/Equity Ratio", weight: 22 },
      { label: "Liquidity", weight: 18 },
      { label: "Interest Coverage", weight: 18 },
      { label: "Price Volatility", weight: 18 },
      { label: "Return on Assets", weight: 12 },
      { label: "Cash Runway", weight: 12 },
    ],
  },
  {
    key: "TECH QUALITY", icon: "💡", color: "#F59E0B",
    tagline: "How good is the existing business?",
    desc: "Current business quality — margins, FCF, ROE, R&D intensity. Sector-normalised so semiconductors are benchmarked against semiconductors, not software. Best for profitable or near-profitable companies.",
    components: [
      { label: "R&D Intensity", weight: 18 },
      { label: "Gross Margin", weight: 18 },
      { label: "Net Margin", weight: 13 },
      { label: "Revenue Growth", weight: 13 },
      { label: "Analyst Consensus", weight: 12 },
      { label: "FCF Margin", weight: 9 },
      { label: "ROE", weight: 9 },
      { label: "Earnings Surprise", weight: 8 },
    ],
  },
  {
    key: "TECH DEMAND", icon: "📡", color: "#a78bfa",
    tagline: "How much will the world need this technology?",
    desc: "Forward-looking technology demand. A company with great margins on dying technology scores low here. Combines sector demand outlook, analyst consensus, and sector ETF momentum as institutional money flow proxy.",
    components: [
      { label: "Sector Demand Score", weight: 30 },
      { label: "Analyst Forward Growth", weight: 30 },
      { label: "Sector ETF Momentum", weight: 25 },
      { label: "Revenue Acceleration", weight: 15 },
    ],
  },
  {
    key: "INNOVATION", icon: "⚗️", color: "#10B981",
    tagline: "Is R&D converting to results?",
    desc: "Built for pre-profit companies. IONQ can score 70+ with no earnings — as long as R&D is converting to revenue and adoption is accelerating. Measures R&D intensity, productivity, and trajectory.",
    components: [
      { label: "R&D Intensity", weight: 25 },
      { label: "R&D Productivity", weight: 25 },
      { label: "Revenue Acceleration", weight: 25 },
      { label: "Gross Margin Trend", weight: 15 },
      { label: "Analyst Conviction", weight: 10 },
    ],
  },
  {
    key: "SENTIMENT", icon: "📊", color: "#F97316",
    tagline: "Are experts getting more bullish?",
    desc: "Direction of analyst opinion — not the level, but whether it's moving up or down. A stock where 8 of 10 analysts just raised forecasts is fundamentally different from one where estimates are flat.",
    components: [
      { label: "Estimate Revision Direction", weight: 40 },
      { label: "Earnings Beat Consistency", weight: 35 },
      { label: "Analyst Revenue Conviction", weight: 25 },
    ],
  },
];

const GRADES = [
  { grade: "A", label: "STRONG · 180D", range: "≥63", ret90: "+19.68%", ret180: "+40.19%", wr: "66.6%", color: "#00dc82", desc: "Outperforms in both the first AND second 3-month window after scoring." },
  { grade: "B", label: "WATCH · 180D",  range: "48–63", ret90: "+8.30%",  ret180: "+21.85%", wr: "60.8%", color: "#22D3EE", desc: "Building momentum — watch for transition to Grade A." },
  { grade: "C", label: "MIXED · 180D",  range: "35–48", ret90: "+5.78%",  ret180: "+13.28%", wr: "54.4%", color: "#f59e0b", desc: "Weakest grade — no clear edge. Wait for a cleaner setup." },
  { grade: "D", label: "AVOID · 180D",  range: "<35",   ret90: "+6.99%",  ret180: "+19.60%", wr: "56.2%", color: "#ff3c50", desc: "Low momentum. Mean reversion only — not a signal." },
];

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  return v >= 65 ? "#00dc82" : v >= 40 ? "#f59e0b" : "#ff3c50";
}

import Guide from "./Guide.jsx";

export default function HowItWorks({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#04080F", overflowY: "auto", zIndex: 500 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, background: "rgba(4,8,15,.97)", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#dce8f4" }}>
          How It Works
        </div>
        <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#4a6a88", cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem", padding: "6px 14px" }}>
          ✕ Close
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#22D3EE", marginBottom: 14 }}>
            Proprietary · 0–100 · Live
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 16px" }}>
            Six scores. One decision.
          </h1>
          <p style={{ color: "#8A9EC0", fontSize: ".95rem", lineHeight: 1.75, maxWidth: "40rem", margin: "0 auto" }}>
            Every stock runs through six independent models. Each answers a specific question. All combine into one Signal grade: A, B, C, or D.
          </p>
        </div>

        {/* Signal formula */}
        <div style={{ background: "#080E1C", border: "1px solid rgba(90,130,200,.1)", borderRadius: 14, padding: "20px 24px", marginBottom: 48, textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", color: "#445268", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 12 }}>Signal formula</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "MOM", w: "45%", color: "#22D3EE" },
              { label: "INNOV", w: "30%", color: "#10B981" },
              { label: "TECH", w: "15%", color: "#F59E0B" },
              { label: "RISK", w: "10%", color: "#00dc82" },
            ].map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={{ color: "#2d4a5f" }}>+</span>}
                <span style={{ background: s.color + "15", border: `1px solid ${s.color}40`, borderRadius: 8, padding: "6px 14px", fontFamily: "'Space Mono',monospace", fontSize: ".78rem", fontWeight: 700, color: s.color }}>
                  {s.label} {s.w}
                </span>
              </div>
            ))}
            <span style={{ color: "#2d4a5f" }}>→</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".9rem", fontWeight: 700, color: "#EDF2FF" }}>Signal 0–100</span>
          </div>
        </div>

        {/* Score cards */}
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#445268", marginBottom: 20 }}>
          The six models
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 56 }}>
          {SCORES.map(s => (
            <div key={s.key} style={{ background: "#080E1C", border: `1px solid rgba(90,130,200,.1)`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#EDF2FF" }}>{s.key}</div>
                  <div style={{ fontSize: ".8rem", color: s.color, fontWeight: 700 }}>{s.tagline}</div>
                </div>
              </div>
              <p style={{ fontSize: ".86rem", color: "#aabcd4", lineHeight: 1.7, margin: "0 0 16px" }}>{s.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {s.components.map(c => (
                  <div key={c.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontFamily: "Arial, sans-serif", fontSize: ".82rem", color: "#c8d8e8", fontWeight: 600 }}>{c.label}</span>
                      <span style={{ fontFamily: "Arial, sans-serif", fontSize: ".82rem", fontWeight: 800, color: s.color }}>{c.weight}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${c.weight * 2.5}%`, height: "100%", background: s.color, borderRadius: 3, opacity: .8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Grades */}
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#445268", marginBottom: 20 }}>
          What each grade has historically returned · 3,136 back-tested samples
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
          {GRADES.map(g => (
            <div key={g.grade} style={{ background: "#080E1C", border: `1px solid ${g.color}20`, borderTop: `3px solid ${g.color}`, borderRadius: 12, padding: "16px" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.6rem", fontWeight: 700, color: g.color, lineHeight: 1 }}>{g.grade}</div>
              <div style={{ fontSize: ".62rem", fontWeight: 700, color: g.color, letterSpacing: ".1em", textTransform: "uppercase", margin: "4px 0 12px" }}>{g.label} · {g.range}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.2rem", fontWeight: 700, color: "#EDF2FF" }}>{g.ret90}</div>
              <div style={{ fontSize: ".62rem", color: "#445268", marginBottom: 6 }}>avg 90d return</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".9rem", fontWeight: 700, color: g.color }}>{g.ret180}</div>
              <div style={{ fontSize: ".62rem", color: "#445268", marginBottom: 10 }}>avg 180d return</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", fontWeight: 700, color: "#EDF2FF" }}>{g.wr} win rate</div>
              <p style={{ fontSize: ".72rem", color: "#445268", lineHeight: 1.5, margin: "10px 0 0" }}>{g.desc}</p>
            </div>
          ))}
        </div>

        {/* Alpha callout */}
        <div style={{ background: "rgba(0,220,130,.05)", border: "1px solid rgba(0,220,130,.2)", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.6rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>+12.69%</div>
            <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 3 }}>alpha vs S&P 500</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.6rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>8.23</div>
            <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 3 }}>t-statistic</div>
          </div>
          <p style={{ fontSize: ".85rem", color: "#8A9EC0", lineHeight: 1.65, margin: 0, flex: 1, minWidth: 200 }}>
            Grade A stocks outperformed the S&P 500 by +12.69% in the same time windows. t-statistic of 8.23 means the probability this is random is essentially zero.
          </p>
        </div>

        {/* Guide — 5-step method */}
        <div style={{ marginTop: 48, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <Guide />
        </div>

      </div>
    </div>
  );
}
