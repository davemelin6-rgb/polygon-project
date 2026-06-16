import { useState, useEffect } from "react";
import QDLogo from "./QDLogo.jsx";

/* ─── tokens ──────────────────────────────────────────────── */
const T = {
  bg:      "#04080F",
  s1:      "#080E1C",
  s2:      "#0C1628",
  s3:      "#101D35",
  border:  "rgba(90, 130, 200, 0.1)",
  borderM: "rgba(34, 211, 238, 0.25)",
  ink:     "#EDF2FF",
  sub:     "#8A9EC0",
  dim:     "#445268",
  cyan:    "#22D3EE",
  green:   "#34D399",
  amber:   "#F59E0B",
  red:     "#F87171",
  blue:    "#3B82F6",
};
const ff = {
  display: "'Space Grotesk', sans-serif",
  body:    "'Inter', sans-serif",
  mono:    "'IBM Plex Mono', monospace",
};

/* ─── primitives ──────────────────────────────────────────── */
const PrimaryBtn = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    fontFamily: ff.display, fontWeight: 600, fontSize: "0.95rem",
    padding: "13px 28px", borderRadius: 10, cursor: "pointer",
    color: "#fff", border: "none",
    background: `linear-gradient(135deg, #1A6BCC, ${T.blue})`,
    boxShadow: "0 0 0 1px rgba(59,130,246,.4), 0 8px 32px rgba(59,130,246,.28)",
    transition: "all .18s",
    ...style,
  }}>{children}</button>
);

const GhostBtn = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    fontFamily: ff.display, fontWeight: 500, fontSize: "0.92rem",
    padding: "13px 24px", borderRadius: 10, cursor: "pointer",
    color: T.sub, border: `1px solid ${T.border}`,
    background: "transparent", transition: "all .18s",
    ...style,
  }}>{children}</button>
);

const ScoreBar = ({ pct, color = T.cyan, height = 3 }) => (
  <div style={{ height, background: "rgba(100,140,200,.1)", borderRadius: height, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height, opacity: .75 }} />
  </div>
);

const Tag = ({ color, bg, children }) => (
  <span style={{
    fontFamily: ff.mono, fontSize: ".64rem", letterSpacing: ".08em",
    textTransform: "uppercase", padding: "2px 8px", borderRadius: 4,
    marginRight: 6, color, background: bg, display: "inline-block",
  }}>{children}</span>
);

/* ─── product score card ──────────────────────────────────── */
function ProductCard({ name, ticker, sub, score, color, dims, rotate = 0, opacity = 1, style }) {
  return (
    <div style={{
      background: "linear-gradient(150deg, #0D1A30, #090F1E)",
      border: `1px solid rgba(90,130,200,.18)`,
      borderRadius: 18,
      padding: "24px 24px 20px",
      boxShadow: "0 0 0 1px rgba(255,255,255,.03), 0 50px 100px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)",
      fontFamily: ff.mono,
      transform: `rotate(${rotate}deg)`,
      opacity,
      ...style,
    }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: ".65rem", letterSpacing: ".16em", color: T.dim, textTransform: "uppercase", marginBottom: 7 }}>
            <span style={{ color: T.green }}>●</span>  {ticker}
          </div>
          <div style={{ fontFamily: ff.display, fontSize: "1.15rem", fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: ".77rem", color: T.dim, marginTop: 3 }}>{sub}</div>
        </div>
        <div style={{
          background: `${color}15`, border: `1px solid ${color}35`,
          borderRadius: 8, padding: "5px 11px", fontSize: ".72rem", color, fontWeight: 600, flexShrink: 0,
        }}>Strong</div>
      </div>

      {/* main score */}
      <div style={{ height: 1, background: "rgba(90,130,200,.12)", marginBottom: 16 }} />
      <div style={{ fontSize: ".6rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>QuantDiver Score</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 7, background: "rgba(90,130,200,.1)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 4 }} />
        </div>
        <span style={{ fontFamily: ff.mono, fontSize: "2rem", fontWeight: 700, color, minWidth: 52, textAlign: "right" }}>{score}</span>
      </div>

      {/* dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {dims.map(([label, pct, grade, c]) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: T.dim }}>{label}</span>
              <span style={{ fontSize: ".62rem", color: c || T.cyan, fontWeight: 600 }}>{grade}</span>
            </div>
            <ScoreBar pct={pct} color={c || T.cyan} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── data ────────────────────────────────────────────────── */
const leaderboard = [
  { rank: "01", name: "ServiceNow", ticker: "NOW", sub: "Enterprise software · US", score: 74.6, color: T.green,
    dims: [["Runway","A",88,T.green],["Dilution","Low",78,T.green],["Growth","Strong",84,T.green],["Margin","▲",72,T.cyan],["Insiders","Mid",55,T.amber],["Valuation","Rich",38,T.amber]] },
  { rank: "02", name: "AAC Clyde Space", ticker: "AAC", sub: "Space systems · Sweden", score: 62.0, color: T.amber,
    dims: [["Runway","B",58,T.amber],["Dilution","Watch",42,T.amber],["Growth","Strong",80,T.green],["Margin","▲",55,T.amber],["Insiders","High",82,T.green],["Valuation","Fair",65,T.green]] },
  { rank: "03", name: "Salesforce", ticker: "CRM", sub: "Enterprise software · US", score: 58.4, color: T.amber,
    dims: [["Runway","A",88,T.green],["Dilution","Low",78,T.green],["Growth","Slowing",45,T.amber],["Margin","▲",70,T.cyan],["Insiders","Mid",55,T.amber],["Valuation","Fair",62,T.green]] },
];

const briefLines = [
  { time: "08:00", tag: ["Semis", T.cyan, "rgba(34,211,238,.1)"], bold: "Asia overnight:", text: "TSMC guided capacity expansion ahead of consensus; Tokyo chip-equipment names followed higher into the close." },
  { time: "08:00", tag: ["Nordic", T.amber, "rgba(245,158,11,.1)"], bold: "Stockholm:", text: "AAC Clyde Space announced a new ESA smallsat contract — order backlog now at a record for the third consecutive quarter." },
  { time: "08:00", tag: ["Macro", "#A78BFA", "rgba(167,139,250,.1)"], bold: "Europe:", text: "ECB minutes signal a slower path on cuts; Swedish May CPI lands Tuesday and frames the Riksbank's July decision." },
  { time: "15:00", tag: ["AI", T.green, "rgba(52,211,153,.1)"], bold: "US preview:", text: "Hyperscaler capex commentary in focus as two megacaps report after the bell. Our supply chain take — tonight's brief." },
];

/* ─── home page ───────────────────────────────────────────── */
function HomePage({ go, onEnterApp }) {
  return (
    <>
      {/* HERO */}
      <section style={{ padding: "110px 0 100px" }}>
        <div className="qd-wrap qd-hero">
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: ff.mono, fontSize: ".72rem", letterSpacing: ".14em",
              textTransform: "uppercase", color: T.cyan,
              border: "1px solid rgba(34,211,238,.22)", background: "rgba(34,211,238,.06)",
              padding: "5px 14px", borderRadius: 999, marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.cyan, animation: "qd-pulse 2s infinite" }} />
              Proprietary scoring · Daily briefs
            </div>

            <h1 style={{
              fontFamily: ff.display, fontSize: "clamp(2.8rem,5.2vw,4.6rem)",
              lineHeight: 1.03, fontWeight: 800, letterSpacing: "-.035em", margin: 0,
            }}>
              Intelligence<br />
              that moves<br />
              <span style={{
                background: `linear-gradient(100deg, ${T.cyan} 0%, #60A5FA 50%, #818CF8 100%)`,
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}>markets.</span>
            </h1>

            <p style={{
              margin: "24px 0 36px", fontSize: "1.08rem", color: T.sub,
              maxWidth: "30rem", lineHeight: 1.65, fontFamily: ff.body,
            }}>
              Proprietary stock scores across six fundamentals — runway, growth, margins, dilution, insiders, valuation. AI-curated briefs on the sectors shaping the next decade.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <PrimaryBtn onClick={onEnterApp}>Get started</PrimaryBtn>
              <GhostBtn onClick={() => go("briefme")}>Explore BriefMe →</GhostBtn>
            </div>

            {/* social proof */}
            <div style={{
              marginTop: 48, display: "flex", gap: 36, flexWrap: "wrap",
            }}>
              {[["6", "scoring dimensions"], ["2×", "daily briefs"], ["0–100", "score scale"]].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: ff.mono, fontSize: "1.5rem", fontWeight: 700, color: T.ink }}>{n}</div>
                  <div style={{ fontFamily: ff.body, fontSize: ".78rem", color: T.dim, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* product card stack */}
          <div style={{ position: "relative", minHeight: 380 }}>
            {/* back card */}
            <div style={{ position: "absolute", top: 24, right: 0, width: "90%", transform: "rotate(3deg)", transformOrigin: "top right" }}>
              <ProductCard
                name="AAC Clyde Space" ticker="AAC" sub="Space systems · Sweden"
                score={62} color={T.amber}
                dims={[["Growth","STRONG",80,T.green],["Insiders","HIGH",82,T.green],["Runway","B",58,T.amber]]}
                opacity={0.5}
              />
            </div>
            {/* front card */}
            <div style={{ position: "relative", transform: "rotate(-1.5deg)" }}>
              <ProductCard
                name="ServiceNow" ticker="NOW" sub="Enterprise software · US"
                score={74.6} color={T.green}
                dims={[["Runway","A",88,T.green],["Growth","STRONG",84,T.green],["Margin","▲",72,T.cyan],["Dilution","LOW",78,T.green],["Insiders","MID",55,T.amber],["Valuation","RICH",38,T.amber]]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* THIN RULE */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* LEADERBOARD */}
      <section style={{ padding: "96px 0" }}>
        <div className="qd-wrap">
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 14 }}>Our methodology · Our scores</div>
            <h2 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 700, letterSpacing: "-.02em", margin: 0 }}>
              The QuantDiver Score leaderboard
            </h2>
            <p style={{ color: T.sub, marginTop: 14, maxWidth: "38rem", lineHeight: 1.6, fontFamily: ff.body, fontSize: ".95rem" }}>
              Every company scored 0–100 across six dimensions. Our numbers, our methodology — updated after every report.
            </p>
          </div>

          <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: T.s1 }}>
            {leaderboard.map((s, i) => (
              <div key={i} className="qd-lbrow" style={{
                display: "grid", gridTemplateColumns: "52px 1fr",
                gap: 0, padding: "28px 28px",
                borderBottom: i < leaderboard.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <span style={{ fontFamily: ff.mono, fontSize: ".85rem", color: T.dim, paddingTop: 3 }}>{s.rank}</span>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: ff.display, fontSize: "1.1rem", fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: ".8rem", color: T.dim, marginTop: 3, fontFamily: ff.body }}>{s.sub}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span style={{ fontFamily: ff.mono, fontSize: "1.9rem", fontWeight: 700, color: s.color }}>{s.score}</span>
                    </div>
                  </div>
                  {/* dimension mini-bars */}
                  <div className="qd-dims-grid">
                    {s.dims.map(([label, grade, pct, c]) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: ff.mono, fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: T.dim }}>{label}</span>
                          <span style={{ fontFamily: ff.mono, fontSize: ".62rem", color: c, fontWeight: 600 }}>{grade}</span>
                        </div>
                        <ScoreBar pct={pct} color={c} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: ".75rem", color: T.dim, marginTop: 14, fontFamily: ff.mono, textAlign: "right" }}>
            Scores represent our analytical opinion — not investment advice.
          </p>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* BRIEFME TEASER */}
      <section style={{ padding: "96px 0" }}>
        <div className="qd-wrap qd-briefme-teaser">
          <div>
            <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 14 }}>⚡ BriefMe</div>
            <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 18px" }}>
              Your intelligence brief,<br />every trading day.
            </h2>
            <p style={{ color: T.sub, lineHeight: 1.65, fontSize: ".95rem", marginBottom: 32, maxWidth: "28rem", fontFamily: ff.body }}>
              Two AI-curated market briefings daily — Nordic at 08:00, US at 15:00. Semiconductors, AI, space, defense, biotech. No headlines. No filler. Just what moved and why.
            </p>
            <GhostBtn onClick={() => go("briefme")}>Read BriefMe →</GhostBtn>
          </div>

          {/* terminal preview */}
          <div style={{
            background: "linear-gradient(150deg, #0C1828, #080E1A)",
            border: `1px solid ${T.border}`, borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 18px", borderBottom: `1px solid ${T.border}`,
              background: "rgba(8,12,24,.7)",
            }}>
              <span style={{ fontFamily: ff.mono, fontSize: ".72rem", color: T.dim }}>briefme · 08:00 CEST</span>
              <span style={{ display: "flex", gap: 6 }}>
                {[T.red, T.amber, T.green].map((c, i) => <i key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
              </span>
            </div>
            <div style={{ padding: "16px" }}>
              {briefLines.map((l, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, padding: "10px 10px", borderRadius: 9,
                  alignItems: "flex-start", marginTop: i ? 4 : 0,
                  borderBottom: i < briefLines.length - 1 ? `1px solid rgba(90,130,200,.07)` : "none",
                }}>
                  <span style={{ fontFamily: ff.mono, fontSize: ".7rem", color: T.dim, paddingTop: 1, minWidth: 40, flexShrink: 0 }}>{l.time}</span>
                  <span style={{ fontSize: ".87rem", color: "#B8C8E4", lineHeight: 1.55, fontFamily: ff.body }}>
                    <Tag color={l.tag[1]} bg={l.tag[2]}>{l.tag[0]}</Tag>
                    <b style={{ color: T.ink }}>{l.bold}</b> {l.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* PRICING */}
      <section id="pricing" style={{ padding: "96px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 14 }}>14-day free trial · No card required</div>
          <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 12px" }}>
            Try free for 14 days
          </h2>
          <p style={{ fontFamily: ff.body, color: T.sub, fontSize: "1rem", margin: "0 0 40px" }}>
            From 49 SEK / month — cancel anytime
          </p>

          <div style={{
            background: "linear-gradient(160deg, #0F1E3C, #090F1E)",
            border: `1px solid rgba(59,130,246,.3)`,
            borderRadius: 20, padding: "40px 36px",
            boxShadow: "0 0 80px rgba(59,130,246,.12), 0 40px 80px rgba(0,0,0,.4)",
          }}>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, textAlign: "left" }}>
              {[
                "Morning brief (08:00) + US preview (15:00) every trading day",
                "Full QuantDiver Score leaderboard with all six dimensions",
                "Sector momentum, hype, and contract-flow signals",
                "Earnings-week calendar and watch notes",
                "Cancel anytime — no lock-in, no commitment",
              ].map((li, i) => (
                <li key={i} style={{
                  padding: "11px 0", display: "flex", gap: 12, alignItems: "flex-start",
                  borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
                  fontFamily: ff.body, fontSize: ".93rem", color: "#B8C8E4", lineHeight: 1.4,
                }}>
                  <span style={{ color: T.cyan, fontSize: ".75rem", paddingTop: 2, flexShrink: 0 }}>✓</span>{li}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={onEnterApp} style={{ width: "100%", justifyContent: "center", padding: "15px", fontSize: "1rem" }}>
              Start free trial →
            </PrimaryBtn>
            <p style={{ fontFamily: ff.body, fontSize: ".78rem", color: T.dim, marginTop: 14, marginBottom: 0 }}>
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── scores page ────────────────────────────────────────── */
const SCORE_DEFS = [
  {
    key: "MOMENTUM", icon: "🚀", color: T.cyan,
    tagline: "Is the stock accelerating?",
    description: "Momentum measures the strength and direction of a stock's recent price movement. A high score means buyers are in control — the trend is up, and volume confirms it. A low score means the stock is stalling or in decline.",
    components: [
      { label: "3-Month Return",  weight: 35, desc: "Medium-term price trend — the primary driver" },
      { label: "1-Month Return",  weight: 30, desc: "Recent short-term price performance" },
      { label: "MA Trend",        weight: 20, desc: "50-day vs 200-day moving average crossover" },
      { label: "Relative Volume", weight: 15, desc: "Current volume vs 20-day average" },
    ],
    note: "Score 65+ → strong uptrend. Score below 40 → trend is weakening or reversing.",
  },
  {
    key: "RISK", icon: "🛡️", color: T.green,
    tagline: "How solid is the balance sheet?",
    description: "Risk scores the financial strength of the company — not how wild the stock price swings. Higher always means SAFER. A score of 75 means low debt, healthy liquidity, and stable price behavior. A score of 25 means the company is financially fragile.",
    components: [
      { label: "Debt Ratio",          weight: 30, desc: "Total liabilities vs total assets" },
      { label: "Current Ratio",       weight: 25, desc: "Short-term assets vs short-term liabilities" },
      { label: "Interest Coverage",   weight: 20, desc: "Operating income vs interest expense" },
      { label: "Price Volatility",    weight: 25, desc: "30-day standard deviation of daily returns" },
    ],
    note: "Higher is always SAFER. Score 70+ = strong foundation. Score below 35 = proceed with caution.",
  },
  {
    key: "TECH VALUE", icon: "💡", color: T.amber,
    tagline: "Is the business built to last?",
    description: "Tech Value scores the quality and durability of the business model. It focuses on R&D investment, margin quality, and growth — the metrics that separate companies with lasting competitive advantage from those burning cash to stay relevant.",
    components: [
      { label: "Gross Margin",    weight: 35, desc: "Revenue minus cost of goods sold — the moat proxy" },
      { label: "R&D Intensity",   weight: 30, desc: "R&D spend as % of revenue — future investment signal" },
      { label: "Revenue Growth",  weight: 20, desc: "Year-over-year top-line growth rate" },
      { label: "FCF Margin",      weight: 15, desc: "Free cash flow as % of revenue" },
    ],
    note: "Score 65+ = strong moat. Score 40–65 = average. Score below 40 = limited competitive advantage.",
  },
];

function ScoresPage({ onEnterApp }) {
  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      {/* Hero */}
      <section style={{ padding: "100px 0 72px", textAlign: "center" }}>
        <div className="qd-wrap" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 16 }}>Proprietary · 0–100 · Live</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2.4rem,4.5vw,3.8rem)", fontWeight: 800, letterSpacing: "-.035em", margin: "0 0 20px", lineHeight: 1.05 }}>
            Three scores.<br/>
            <span style={{ background: `linear-gradient(100deg, ${T.cyan}, #60A5FA 50%, #818CF8)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>One edge.</span>
          </h1>
          <p style={{ fontFamily: ff.body, fontSize: "1.05rem", color: T.sub, lineHeight: 1.65, margin: "0 0 36px" }}>
            Every stock in QuantDiver is scored across three dimensions — Momentum, Risk, and Tech Value — calculated from live market data and real financial statements. No opinions. Just signal.
          </p>
          <PrimaryBtn onClick={onEnterApp}>See live scores →</PrimaryBtn>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* Score deep-dives */}
      {SCORE_DEFS.map((s, i) => (
        <section key={s.key} style={{ padding: "88px 0", background: i % 2 === 1 ? "rgba(255,255,255,.015)" : "transparent" }}>
          <div className="qd-wrap">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
              {/* Left: explanation */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: "2rem" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: ff.mono, fontSize: ".65rem", letterSpacing: ".18em", textTransform: "uppercase", color: s.color, marginBottom: 4 }}>Score {i + 1} of 3</div>
                    <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", margin: 0, color: T.ink }}>{s.key}</h2>
                  </div>
                </div>
                <p style={{ fontFamily: ff.body, fontSize: "1rem", color: T.sub, lineHeight: 1.7, margin: "0 0 20px" }}>{s.description}</p>
                <div style={{
                  background: `${s.color}0d`, border: `1px solid ${s.color}25`,
                  borderRadius: 10, padding: "12px 16px",
                  fontFamily: ff.mono, fontSize: ".78rem", color: s.color,
                }}>
                  {s.note}
                </div>
              </div>

              {/* Right: component breakdown */}
              <div style={{ background: "linear-gradient(150deg, #0D1A30, #090F1E)", border: `1px solid rgba(90,130,200,.15)`, borderRadius: 18, padding: "28px 28px 24px" }}>
                <div style={{ fontFamily: ff.mono, fontSize: ".62rem", letterSpacing: ".16em", textTransform: "uppercase", color: T.dim, marginBottom: 20 }}>Score components</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {s.components.map(c => (
                    <div key={c.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontFamily: ff.mono, fontSize: ".78rem", color: T.ink, fontWeight: 600 }}>{c.label}</span>
                          <div style={{ fontFamily: ff.body, fontSize: ".7rem", color: T.dim, marginTop: 2 }}>{c.desc}</div>
                        </div>
                        <span style={{ fontFamily: ff.mono, fontSize: ".88rem", fontWeight: 700, color: s.color, flexShrink: 0, marginLeft: 12 }}>{c.weight}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(100,140,200,.1)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${c.weight * 2.5}%`, height: "100%", background: s.color, borderRadius: 4, opacity: .7 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.12) 30%, rgba(90,130,200,.12) 70%, transparent)", marginTop: 88 }} />
        </section>
      ))}

      {/* CTA */}
      <section style={{ padding: "96px 0 112px", textAlign: "center" }}>
        <div className="qd-wrap" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 16px" }}>Ready to see the numbers?</h2>
          <p style={{ fontFamily: ff.body, color: T.sub, fontSize: "1rem", margin: "0 0 32px" }}>14-day free trial — full access, no card required.</p>
          <PrimaryBtn onClick={onEnterApp} style={{ padding: "14px 32px", fontSize: "1rem" }}>Start free trial →</PrimaryBtn>
        </div>
      </section>
    </div>
  );
}

/* ─── pricing page ────────────────────────────────────────── */
function PricingPage({ onEnterApp, go }) {
  const briefmeFeatures = [
    ["Morning brief · 08:00 Stockholm", "AI-curated summary of what moved overnight and why"],
    ["US market preview · 15:00",        "Pre-market signals on US tech, semis, biotech, defence"],
    ["QuantDiver Score leaderboard",     "Top movers ranked across MOMENTUM, RISK & TECH VALUE"],
    ["Sector signals",                   "Weekly digest on AI, Quantum, Defence & Space, Biotech"],
  ];

  const proFeatures = [
    ["Everything in BriefMe",            "All daily briefs and leaderboard access included"],
    ["Live MOMENTUM · RISK · TECH VALUE","Three scores per stock, refreshed every 60 seconds"],
    ["Full score breakdown",             "Component-level analysis: what's driving each score"],
    ["Price chart & technicals",         "6-month chart, RSI, MACD, Bollinger Bands, MAs"],
    ["Analyst consensus",                "Wall Street ratings, price targets, last 4 earnings"],
    ["Insider trading feed",             "SEC-sourced exec buy/sell — last 15 transactions"],
    ["Key ratios",                       "P/E, EV/EBITDA, margins, debt-to-equity — live"],
    ["News & sector feed",               "48-hour filtered news per ticker, hourly updated"],
    ["Trader Connect & community",       "Match with traders who share your sector interests"],
  ];

  const cardBase = {
    borderRadius: 24, padding: "44px 40px",
    display: "flex", flexDirection: "column",
  };

  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      <section style={{ padding: "100px 0 72px", textAlign: "center" }}>
        <div className="qd-wrap" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 16 }}>Simple pricing · No surprises</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2.4rem,4.5vw,3.8rem)", fontWeight: 800, letterSpacing: "-.035em", margin: "0 0 16px", lineHeight: 1.05 }}>
            Two plans.<br />Pick your edge.
          </h1>
          <p style={{ fontFamily: ff.body, fontSize: "1.05rem", color: T.sub, lineHeight: 1.65, margin: 0 }}>
            Start free for 14 days — no card required. Upgrade or cancel anytime.
          </p>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      <section style={{ padding: "72px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

            {/* ── BriefMe ── */}
            <div style={{ ...cardBase, background: "linear-gradient(160deg,#0a1422,#060c16)", border: "1px solid rgba(90,130,200,.2)" }}>
              <div style={{ fontFamily: ff.mono, fontSize: ".66rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.sub, marginBottom: 10 }}>BriefMe</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: ff.display, fontSize: "2.8rem", fontWeight: 800, color: T.ink, lineHeight: 1 }}>49</span>
                <span style={{ fontFamily: ff.body, fontSize: "1rem", color: T.sub, fontWeight: 500 }}>SEK / month</span>
              </div>
              <div style={{ fontFamily: ff.body, fontSize: ".78rem", color: T.dim, marginBottom: 28 }}>Daily intelligence briefs</div>

              <div style={{ height: 1, background: "rgba(90,130,200,.1)", marginBottom: 24 }} />

              <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, flex: 1 }}>
                {briefmeFeatures.map(([title, desc], i) => (
                  <li key={i} style={{ padding: "11px 0", display: "flex", gap: 12, alignItems: "flex-start", borderBottom: i < briefmeFeatures.length - 1 ? "1px solid rgba(90,130,200,.07)" : "none" }}>
                    <span style={{ color: T.cyan, fontSize: ".7rem", paddingTop: 2, flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontFamily: ff.body, fontSize: ".86rem", color: T.ink, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                      <div style={{ fontFamily: ff.body, fontSize: ".75rem", color: T.dim, lineHeight: 1.4 }}>{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <button onClick={onEnterApp} style={{
                width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(90,130,200,.3)",
                color: T.sub, fontFamily: ff.body, fontSize: ".92rem", fontWeight: 700,
                transition: "all .15s",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,.5)"; e.currentTarget.style.color = T.ink; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(90,130,200,.3)"; e.currentTarget.style.color = T.sub; }}
              >
                Start free trial →
              </button>
              <p style={{ fontFamily: ff.body, fontSize: ".72rem", color: T.dim, marginTop: 12, marginBottom: 0, textAlign: "center" }}>
                14 days free · then 49 SEK/month
              </p>
            </div>

            {/* ── QuantPRO ── */}
            <div style={{ ...cardBase, background: "linear-gradient(160deg,#0F1E3C,#090F1E)", border: "1px solid rgba(59,130,246,.4)", boxShadow: "0 0 80px rgba(59,130,246,.12), 0 32px 64px rgba(0,0,0,.4)", position: "relative" }}>
              {/* Recommended badge */}
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#00b4ff,#1a6bcc)", color: "#fff", fontFamily: ff.mono, fontSize: ".6rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 2px 16px rgba(0,180,255,.35)" }}>
                Most popular
              </div>

              <div style={{ fontFamily: ff.mono, fontSize: ".66rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 10 }}>QuantPRO</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: ff.display, fontSize: "2.8rem", fontWeight: 800, color: T.ink, lineHeight: 1 }}>99</span>
                <span style={{ fontFamily: ff.body, fontSize: "1rem", color: T.sub, fontWeight: 500 }}>SEK / month</span>
              </div>
              <div style={{ fontFamily: ff.body, fontSize: ".78rem", color: T.dim, marginBottom: 28 }}>Full platform access · ~€8.50/mo</div>

              <div style={{ height: 1, background: "rgba(90,130,200,.12)", marginBottom: 24 }} />

              <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, flex: 1 }}>
                {proFeatures.map(([title, desc], i) => (
                  <li key={i} style={{ padding: "11px 0", display: "flex", gap: 12, alignItems: "flex-start", borderBottom: i < proFeatures.length - 1 ? "1px solid rgba(90,130,200,.08)" : "none" }}>
                    <span style={{ color: T.cyan, fontSize: ".7rem", paddingTop: 2, flexShrink: 0 }}>✓</span>
                    <div>
                      <div style={{ fontFamily: ff.body, fontSize: ".86rem", color: T.ink, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                      <div style={{ fontFamily: ff.body, fontSize: ".75rem", color: T.dim, lineHeight: 1.4 }}>{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <PrimaryBtn onClick={onEnterApp} style={{ width: "100%", justifyContent: "center", padding: "15px", fontSize: "1rem" }}>
                Start free trial — no card needed →
              </PrimaryBtn>
              <p style={{ fontFamily: ff.body, fontSize: ".72rem", color: T.dim, marginTop: 12, marginBottom: 0, textAlign: "center" }}>
                14 days free · then 99 SEK/month · cancel anytime
              </p>
            </div>

          </div>

          <p style={{ fontFamily: ff.body, fontSize: ".8rem", color: T.dim, textAlign: "center", lineHeight: 1.6, marginTop: 32 }}>
            Need a team subscription or have questions? <span onClick={() => go("contact")} style={{ color: T.cyan, cursor: "pointer" }}>Contact us</span>.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ─── contact page ────────────────────────────────────────── */
function ContactPage() {
  const [form,    setForm]    = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    setError("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) { setDone(true); }
      else { const j = await r.json(); setError(j.error || "Something went wrong."); }
    } catch { setError("Network error — please try again."); }
    finally { setSending(false); }
  }

  const inp = (label, field, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontFamily: ff.mono, fontSize: ".65rem", letterSpacing: ".14em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(255,255,255,.03)", border: `1px solid rgba(90,130,200,.15)`,
          borderRadius: 10, color: T.ink, fontFamily: ff.body, fontSize: ".92rem",
          padding: "12px 16px", outline: "none",
          transition: "border-color .15s",
        }}
        onFocus={e => e.target.style.borderColor = "rgba(34,211,238,.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(90,130,200,.15)"}
      />
    </div>
  );

  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      <section style={{ padding: "100px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 16, textAlign: "center" }}>Support</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 12px", textAlign: "center" }}>Contact Support</h1>
          <p style={{ fontFamily: ff.body, fontSize: ".95rem", color: T.sub, lineHeight: 1.65, textAlign: "center", margin: "0 0 48px" }}>
            We read every message and reply within one business day.
          </p>

          {done ? (
            <div style={{
              background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.25)",
              borderRadius: 16, padding: "40px 36px", textAlign: "center",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: ff.display, fontSize: "1.2rem", fontWeight: 700, color: T.ink, marginBottom: 8 }}>Message sent</div>
              <div style={{ fontFamily: ff.body, fontSize: ".88rem", color: T.sub }}>
                We'll reply to {form.email || "your email"} shortly.
              </div>
            </div>
          ) : (
            <form onSubmit={submit} style={{
              background: "linear-gradient(160deg, #0D1A30, #090F1E)",
              border: "1px solid rgba(90,130,200,.15)", borderRadius: 20, padding: "40px 36px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <div>{inp("Your name", "name", "text", "Jane Smith")}</div>
                <div>{inp("Email address", "email", "email", "you@example.com")}</div>
              </div>
              {inp("Subject", "subject", "text", "Question about pricing...")}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: ff.mono, fontSize: ".65rem", letterSpacing: ".14em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>Message</label>
                <textarea
                  value={form.message}
                  onChange={e => update("message", e.target.value)}
                  placeholder="Tell us what you need help with..."
                  rows={6}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,.03)", border: "1px solid rgba(90,130,200,.15)",
                    borderRadius: 10, color: T.ink, fontFamily: ff.body, fontSize: ".92rem",
                    padding: "12px 16px", outline: "none", resize: "vertical",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(34,211,238,.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(90,130,200,.15)"}
                />
              </div>
              {error && <p style={{ color: T.red, fontFamily: ff.mono, fontSize: ".78rem", marginBottom: 16 }}>{error}</p>}
              <PrimaryBtn style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "1rem", opacity: sending ? .6 : 1 }}>
                {sending ? "Sending…" : "Send message →"}
              </PrimaryBtn>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

/* ─── briefme page ────────────────────────────────────────── */
function BriefMePage({ onEnterApp }) {
  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      <section style={{ padding: "100px 0 80px" }}>
        <div className="qd-wrap qd-hero">
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: ff.mono, fontSize: ".72rem", letterSpacing: ".14em",
              textTransform: "uppercase", color: T.cyan,
              border: "1px solid rgba(34,211,238,.22)", background: "rgba(34,211,238,.06)",
              padding: "5px 14px", borderRadius: 999, marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.cyan, animation: "qd-pulse 2s infinite" }} />
              Live · Stockholm 08:00 &amp; New York open
            </div>
            <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2.6rem,5vw,4rem)", lineHeight: 1.03, fontWeight: 800, letterSpacing: "-.035em" }}>
              Intelligence,<br />
              <span style={{ background: `linear-gradient(100deg, ${T.cyan}, #60A5FA 50%, #818CF8)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                briefed daily.
              </span>
            </h1>
            <p style={{ margin: "22px 0 34px", fontSize: "1.08rem", color: T.sub, maxWidth: "32rem", lineHeight: 1.65, fontFamily: ff.body }}>
              AI-curated market briefings for disruptive tech — semiconductors, AI, quantum, space, defense, biotech — across Nordic and US markets. Twice a day, every trading day.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <PrimaryBtn onClick={() => document.getElementById("bm-pricing")?.scrollIntoView({ behavior: "smooth" })}>
                Start your briefings
              </PrimaryBtn>
              <span style={{ fontFamily: ff.mono, fontSize: ".82rem", color: T.dim }}>
                <b style={{ color: T.sub }}>99 SEK</b> / month · cancel anytime
              </span>
            </div>
          </div>

          {/* terminal */}
          <div style={{
            background: "linear-gradient(150deg, #0C1828, #080E1A)",
            border: `1px solid ${T.border}`, borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 50px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${T.border}`, background: "rgba(8,12,24,.7)" }}>
              <span style={{ fontFamily: ff.mono, fontSize: ".72rem", color: T.dim }}>briefme · fredag 12 juni 2026 · 08:00 CEST</span>
              <span style={{ display: "flex", gap: 6 }}>
                {[T.red, T.amber, T.green].map((c, i) => <i key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
              </span>
            </div>
            <div style={{ padding: 18 }}>
              {briefLines.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 12px", borderRadius: 10, alignItems: "flex-start", marginTop: i ? 4 : 0, borderBottom: i < briefLines.length - 1 ? `1px solid rgba(90,130,200,.07)` : "none" }}>
                  <span style={{ fontFamily: ff.mono, fontSize: ".72rem", color: T.dim, paddingTop: 2, minWidth: 44, flexShrink: 0 }}>{l.time}</span>
                  <span style={{ fontSize: ".9rem", color: "#B8C8E4", lineHeight: 1.55, fontFamily: ff.body }}>
                    <Tag color={l.tag[1]} bg={l.tag[2]}>{l.tag[0]}</Tag>
                    <b style={{ color: T.ink }}>{l.bold}</b> {l.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* SCORE LEADERBOARD */}
      <section style={{ padding: "96px 0" }}>
        <div className="qd-wrap">
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 14 }}>Our methodology · Our scores</div>
            <h2 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 14px" }}>The QuantDiver Score</h2>
            <p style={{ color: T.sub, maxWidth: "42rem", lineHeight: 1.6, fontFamily: ff.body, fontSize: ".95rem" }}>
              Every company we cover is scored 0–100 across six fundamentals: cash runway, dilution risk, revenue growth, gross margin, insider ownership, and valuation. Updated after every report.
            </p>
          </div>

          <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: T.s1 }}>
            {leaderboard.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "52px 1fr",
                padding: "28px 28px",
                borderBottom: i < leaderboard.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <span style={{ fontFamily: ff.mono, fontSize: ".85rem", color: T.dim, paddingTop: 3 }}>{s.rank}</span>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: ff.display, fontSize: "1.1rem", fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: ".8rem", color: T.dim, marginTop: 3 }}>{s.sub}</div>
                    </div>
                    <span style={{ fontFamily: ff.mono, fontSize: "1.9rem", fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.score}</span>
                  </div>
                  <div className="qd-dims-grid">
                    {s.dims.map(([label, grade, pct, c]) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: ff.mono, fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: T.dim }}>{label}</span>
                          <span style={{ fontFamily: ff.mono, fontSize: ".62rem", color: c, fontWeight: 600 }}>{grade}</span>
                        </div>
                        <ScoreBar pct={pct} color={c} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(90,130,200,.15) 30%, rgba(90,130,200,.15) 70%, transparent)" }} />

      {/* PRICING */}
      <section id="bm-pricing" style={{ padding: "96px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".68rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.cyan, marginBottom: 14 }}>One plan · Everything included</div>
          <h2 style={{ fontFamily: ff.display, fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 40px" }}>
            99 SEK / month
          </h2>
          <div style={{
            background: "linear-gradient(160deg, #0F1E3C, #090F1E)",
            border: "1px solid rgba(59,130,246,.3)", borderRadius: 20, padding: "40px 36px",
            boxShadow: "0 0 80px rgba(59,130,246,.12), 0 40px 80px rgba(0,0,0,.4)",
          }}>
            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, textAlign: "left" }}>
              {["Morning brief (08:00) + US preview (15:00) every trading day","Full QuantDiver Score leaderboard with all six dimensions","Sector momentum, hype, and contract-flow signals","Earnings-week calendar and watch notes","Cancel anytime — no lock-in, no commitment"].map((li, i, arr) => (
                <li key={i} style={{ padding: "11px 0", display: "flex", gap: 12, alignItems: "flex-start", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", fontFamily: ff.body, fontSize: ".93rem", color: "#B8C8E4", lineHeight: 1.4 }}>
                  <span style={{ color: T.cyan, fontSize: ".75rem", paddingTop: 2, flexShrink: 0 }}>✓</span>{li}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={onEnterApp} style={{ width: "100%", justifyContent: "center", padding: "15px", fontSize: "1rem" }}>
              Start your briefings →
            </PrimaryBtn>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── about us page ───────────────────────────────────────── */
function AboutPage({ onEnterApp }) {
  return (
    <div style={{ animation: "qd-fadein .5s ease" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: "120px 0 96px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* background glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(245,158,11,.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="qd-wrap" style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
          <div style={{ fontFamily: ff.mono, fontSize: "1rem", letterSpacing: ".28em", textTransform: "uppercase", color: T.amber, marginBottom: 36 }}>
            — Our Motto —
          </div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(3.6rem,8vw,6.8rem)", fontWeight: 900, letterSpacing: "-.05em", margin: "0 0 36px", lineHeight: .96, color: T.ink }}>
            Success can only come from<br />
            <span style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              experience &amp; persistence.
            </span>
          </h1>
          <p style={{ fontFamily: ff.body, fontSize: "1.3rem", color: T.sub, lineHeight: 1.7, margin: "0 auto", maxWidth: 640 }}>
            David and Albin have spent over a decade in the trenches of the global stock market — reading charts before breakfast, breaking down balance sheets, and hunting for edge where most investors never look.
          </p>
        </div>
      </section>

      {/* ── FOUNDERS PHOTO ───────────────────────────────────── */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="qd-wrap" style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", maxWidth: 640, width: "100%" }}>
            {/* outer gold glow */}
            <div style={{ position: "absolute", inset: -40, borderRadius: 32, background: "radial-gradient(ellipse, rgba(245,158,11,.18) 0%, transparent 70%)", filter: "blur(30px)", zIndex: 0, pointerEvents: "none" }} />
            {/* subtle blue accent */}
            <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: "80%", height: 60, background: "rgba(0,180,255,.12)", filter: "blur(24px)", borderRadius: "50%", zIndex: 0 }} />
            <img
              src="/founders.png"
              alt="David and Albin — QuantDiver Co-Founders"
              style={{
                position: "relative", zIndex: 1,
                width: "100%", borderRadius: 24,
                border: "1px solid rgba(245,158,11,.35)",
                boxShadow: "0 48px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(245,158,11,.1)",
                display: "block",
              }}
            />
            {/* caption bar */}
            <div style={{
              position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
              zIndex: 2, background: "rgba(4,8,15,.88)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(245,158,11,.25)", borderRadius: 12,
              padding: "12px 28px", whiteSpace: "nowrap", textAlign: "center",
            }}>
              <div style={{ fontFamily: ff.display, fontSize: "1rem", fontWeight: 700, color: T.ink, letterSpacing: "-.01em" }}>David & Albin</div>
              <div style={{ fontFamily: ff.mono, fontSize: ".62rem", letterSpacing: ".16em", textTransform: "uppercase", color: T.amber, marginTop: 3 }}>Co-Founders · QuantDiver</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="qd-wrap" style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(245,158,11,.08)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(245,158,11,.12)" }}>
            {[
              ["10+",        "Years in the market"],
              ["Sweden",     "Stockholm-based"],
              ["3",          "Proprietary scores"],
              ["24/7",       "Live market data"],
            ].map(([val, label]) => (
              <div key={label} style={{ background: "rgba(4,8,15,.95)", padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: ff.display, fontSize: "2.6rem", fontWeight: 900, lineHeight: 1, marginBottom: 8, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{val}</div>
                <div style={{ fontFamily: ff.mono, fontSize: ".62rem", letterSpacing: ".14em", textTransform: "uppercase", color: T.dim }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────── */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="qd-wrap" style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Pull quote */}
          <div style={{
            margin: "0 0 72px",
            padding: "40px 44px",
            background: "linear-gradient(135deg, rgba(245,158,11,.06), rgba(245,158,11,.02))",
            border: "1px solid rgba(245,158,11,.2)",
            borderLeft: "4px solid #f59e0b",
            borderRadius: 16,
          }}>
            <p style={{ fontFamily: ff.display, fontSize: "clamp(1.3rem,2.5vw,1.7rem)", fontWeight: 700, color: T.ink, lineHeight: 1.45, margin: "0 0 20px", letterSpacing: "-.02em" }}>
              "We built the tool we always wished existed — one that cuts through the noise and gives you a real signal on any stock in seconds."
            </p>
            <span style={{ fontFamily: ff.mono, fontSize: ".7rem", color: T.amber, letterSpacing: ".14em", textTransform: "uppercase" }}>— David &amp; Albin, Co-Founders</span>
          </div>

          {/* Story sections */}
          {[
            {
              num: "01",
              title: "10 years in the market",
              body: "David and Albin started trading as teenagers — first on small Swedish stocks, then into US tech, semiconductors, and biotech. They learned what every serious investor eventually discovers: most financial tools are either too complex, too expensive, or too slow. The individual investor is always last in line.",
            },
            {
              num: "02",
              title: "The problem they set out to solve",
              body: "After years of manually pulling balance sheets, calculating ratios, and cross-referencing news feeds — they decided to systematize it. The QuantDiver scoring engine was born from one question: what if you could score any stock across momentum, risk, and technology value in one clean number?",
            },
            {
              num: "03",
              title: "Built for the serious investor",
              body: "QuantDiver isn't for people who want tips. It's for investors who want to do their own thinking — but with the analytical firepower to do it faster. Three proprietary scores. Live data. No noise. The edge institutional desks have, at a fraction of the cost.",
            },
            {
              num: "04",
              title: "A community, not just a platform",
              body: "Beyond the scores, David and Albin built a place where serious investors can connect. Albin's Community — the forum inside QuantDiver — is where members share theses, debate sectors, and find traders who think like they do. The edge isn't just in the data. It's in the network.",
            },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 32, marginBottom: 56, alignItems: "flex-start" }}>
              <div style={{ fontFamily: ff.mono, fontSize: "2.2rem", fontWeight: 900, color: "rgba(245,158,11,.15)", lineHeight: 1, flexShrink: 0, marginTop: 4, minWidth: 48 }}>{s.num}</div>
              <div>
                <h2 style={{ fontFamily: ff.display, fontSize: "1.5rem", fontWeight: 800, color: T.ink, margin: "0 0 14px", letterSpacing: "-.02em", lineHeight: 1.2 }}>
                  {s.title}
                </h2>
                <p style={{ fontFamily: ff.body, fontSize: "1rem", color: T.sub, lineHeight: 1.8, margin: 0 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div style={{ textAlign: "center", paddingTop: 24 }}>
            <PrimaryBtn onClick={onEnterApp} style={{ fontSize: "1.05rem", padding: "18px 44px" }}>
              Try QuantDiver free for 14 days →
            </PrimaryBtn>
            <p style={{ fontFamily: ff.body, fontSize: ".8rem", color: T.dim, marginTop: 16 }}>
              No credit card required · Cancel anytime · From 49 SEK/month
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── privacy policy page ─────────────────────────────────── */
function PrivacyPage() {
  const sec = (title, children) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: ff.display, fontSize: "1.15rem", fontWeight: 700, color: T.ink, margin: "0 0 12px" }}>{title}</h2>
      <div style={{ fontFamily: ff.body, fontSize: ".9rem", color: T.sub, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      <section style={{ padding: "80px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".65rem", letterSpacing: ".16em", textTransform: "uppercase", color: T.cyan, marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 8px" }}>Privacy Policy</h1>
          <p style={{ fontFamily: ff.mono, fontSize: ".75rem", color: T.dim, marginBottom: 48 }}>Last updated: June 2026</p>
          <div style={{ height: 1, background: "rgba(90,130,200,.12)", marginBottom: 48 }} />

          {sec("1. Who we are", <p>QuantDiver ("we", "us", "our") operates the QuantDiver platform at quantdiver.com — a proprietary stock analysis and market intelligence service. For privacy questions, contact us at support@quantdiver.com.</p>)}

          {sec("2. What information we collect", <>
            <p><strong style={{ color: T.ink }}>Account data:</strong> When you sign up, we collect your email address and a username you choose. We do not collect your full name, address, or payment card details directly (payments are processed by our payment provider).</p>
            <p style={{ marginTop: 10 }}><strong style={{ color: T.ink }}>Profile data:</strong> Your display settings (theme, accent color, avatar color), default watchlist tickers, and trading interest preferences (e.g., AI, Quantum) that you optionally provide in Settings.</p>
            <p style={{ marginTop: 10 }}><strong style={{ color: T.ink }}>Usage data:</strong> We log API requests to detect abuse and enforce rate limits. We do not sell or share this data with advertisers.</p>
            <p style={{ marginTop: 10 }}><strong style={{ color: T.ink }}>Messages:</strong> If you use Trader Connect or the in-app chat, message content is stored in our database to deliver the service. Messages are not read by staff except when required to investigate abuse reports.</p>
            <p style={{ marginTop: 10 }}><strong style={{ color: T.ink }}>Contact form submissions:</strong> When you submit a support request, your name, email, and message are sent to our support inbox.</p>
          </>)}

          {sec("3. How we use your data", <>
            <p>We use your information to: provide and operate the QuantDiver platform; send authentication and security emails; respond to support requests; match you with other users via Trader Connect (using only your chosen topic, never your identity); detect and prevent fraud or abuse; and improve the platform.</p>
            <p style={{ marginTop: 10 }}>We do not use your data for advertising, sell it to third parties, or use it to train AI models.</p>
          </>)}

          {sec("4. Third-party services", <>
            <p>We use third-party services to operate the platform, including infrastructure and hosting providers, authentication services, transactional email delivery, and market data APIs. We share only the minimum data necessary with each provider to deliver the relevant function of the service.</p>
          </>)}

          {sec("5. Data retention", <p>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it by law (e.g., billing records).</p>)}

          {sec("6. Your rights", <>
            <p>Depending on your jurisdiction (including under GDPR for EU/EEA residents), you may have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; object to certain processing; and data portability.</p>
            <p style={{ marginTop: 10 }}>To exercise any of these rights, contact support@quantdiver.com.</p>
          </>)}

          {sec("7. Cookies", <p>We use only essential session cookies required to keep you logged in. We do not use advertising cookies or tracking pixels. You can clear cookies at any time via your browser settings.</p>)}

          {sec("8. Security", <p>We use industry-standard measures to protect your data, including HTTPS encryption, secure authentication via Supabase Auth, and server-side API key management. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>)}

          {sec("9. Changes to this policy", <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the updated policy on this page with a revised date. Continued use of QuantDiver after changes constitutes acceptance of the updated policy.</p>)}

          {sec("10. Contact", <p>For any privacy questions or requests, contact us at: <span style={{ color: T.cyan }}>support@quantdiver.com</span></p>)}
        </div>
      </section>
    </div>
  );
}

/* ─── terms of service page ───────────────────────────────── */
function TermsPage() {
  const sec = (title, children) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: ff.display, fontSize: "1.15rem", fontWeight: 700, color: T.ink, margin: "0 0 12px" }}>{title}</h2>
      <div style={{ fontFamily: ff.body, fontSize: ".9rem", color: T.sub, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ animation: "qd-fadein .4s ease" }}>
      <section style={{ padding: "80px 0 112px" }}>
        <div className="qd-wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: ff.mono, fontSize: ".65rem", letterSpacing: ".16em", textTransform: "uppercase", color: T.cyan, marginBottom: 12 }}>Legal</div>
          <h1 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-.03em", margin: "0 0 8px" }}>Terms of Service</h1>
          <p style={{ fontFamily: ff.mono, fontSize: ".75rem", color: T.dim, marginBottom: 48 }}>Last updated: June 2026</p>
          <div style={{ height: 1, background: "rgba(90,130,200,.12)", marginBottom: 48 }} />

          <div style={{ background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 40, fontFamily: ff.body, fontSize: ".88rem", color: T.amber, lineHeight: 1.6 }}>
            <strong>Important:</strong> QuantDiver provides financial data and proprietary scoring tools for informational and educational purposes only. Nothing on this platform constitutes financial advice, investment advice, or a recommendation to buy, sell, or hold any security. All investment decisions are made solely at your own risk.
          </div>

          {sec("1. Acceptance of terms", <p>By accessing or using QuantDiver ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including visitors, registered members, and subscribers.</p>)}

          {sec("2. Description of the service", <p>QuantDiver is a proprietary stock analysis platform that provides quantitative scores (Momentum, Risk, Tech Value), market data, news, and analytics tools. The Service is operated by QuantDiver and is available at quantdiver.com and associated domains.</p>)}

          {sec("3. Not financial advice", <>
            <p>All content, scores, analysis, insights, and information provided by QuantDiver — including but not limited to Momentum scores, Risk scores, Tech Value scores, analyst data, insider trading information, Daily Briefs, and AI assistant responses — are for informational and educational purposes only.</p>
            <p style={{ marginTop: 10 }}>QuantDiver is not a registered investment adviser, broker-dealer, financial planner, or financial institution. Nothing on the platform should be construed as financial advice, investment advice, trading advice, or any other type of advice. You should consult a qualified financial professional before making any investment decision.</p>
            <p style={{ marginTop: 10 }}><strong style={{ color: T.ink }}>Past performance of any score, signal, or stock is not indicative of future results.</strong></p>
          </>)}

          {sec("4. User accounts", <>
            <p>You must create an account to access certain features. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify us immediately at support@quantdiver.com if you suspect unauthorized access to your account.</p>
            <p style={{ marginTop: 10 }}>You must be at least 18 years old to create an account. By registering, you confirm that you meet this requirement.</p>
          </>)}

          {sec("5. Subscription and payment", <>
            <p>QuantDiver offers a 14-day free trial with full access. After the trial period, continued access requires a paid subscription at the then-current price (currently 99 SEK/month).</p>
            <p style={{ marginTop: 10 }}>Subscriptions are billed monthly. You may cancel at any time; cancellation takes effect at the end of the current billing period. We do not offer refunds for partial months.</p>
          </>)}

          {sec("6. Intellectual property", <>
            <p>All content, features, functionality, scoring methodologies, algorithms, code, design, and branding on QuantDiver are the exclusive property of QuantDiver and are protected by applicable copyright, trademark, and intellectual property laws.</p>
            <p style={{ marginTop: 10 }}>The proprietary scoring formulas (Momentum, Risk, and Tech Value) are trade secrets of QuantDiver. You may not reverse-engineer, reproduce, distribute, or create derivative works from any part of the Service without express written permission.</p>
            <p style={{ marginTop: 10 }}>© {new Date().getFullYear()} QuantDiver. All rights reserved.</p>
          </>)}

          {sec("7. Acceptable use", <>
            <p>You agree not to: scrape, crawl, or systematically extract data from the platform; reverse-engineer any scoring formula or algorithm; use the Service for any unlawful purpose; share your account credentials with others; attempt to gain unauthorized access to any part of the Service; or interfere with the platform's operation.</p>
            <p style={{ marginTop: 10 }}>Violations may result in immediate account termination without refund.</p>
          </>)}

          {sec("8. Trader Connect and user content", <>
            <p>Trader Connect allows users to communicate directly. You are solely responsible for any content you send through this feature. You agree not to use Trader Connect to harass, deceive, or harm other users, share explicit or illegal content, or solicit financial transactions.</p>
            <p style={{ marginTop: 10 }}>QuantDiver is not responsible for the content of user-to-user communications and does not endorse any views expressed therein. We reserve the right to remove content and terminate accounts that violate these terms.</p>
          </>)}

          {sec("9. Market data and third-party content", <p>Market data is sourced from Polygon.io and Financial Modeling Prep. QuantDiver does not warrant the accuracy, completeness, or timeliness of any market data. Data may be delayed, contain errors, or be unavailable due to third-party service issues. QuantDiver is not liable for any losses resulting from reliance on such data.</p>)}

          {sec("10. Limitation of liability", <>
            <p>To the maximum extent permitted by applicable law, QuantDiver and its operators, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, or financial losses arising from:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2 }}>
              <li>Your use of or inability to use the Service</li>
              <li>Any investment or trading decision made based on information from the Service</li>
              <li>Inaccuracies in market data or scores</li>
              <li>Unauthorized access to your account</li>
              <li>Any interruption or cessation of the Service</li>
            </ul>
            <p style={{ marginTop: 10 }}>In no event shall QuantDiver's total liability exceed the amount you paid for the Service in the 12 months preceding the claim.</p>
          </>)}

          {sec("11. Disclaimer of warranties", <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. QuantDiver does not warrant that the Service will be uninterrupted, error-free, or free of viruses or harmful components.</p>)}

          {sec("12. Governing law", <p>These Terms are governed by the laws of Sweden. Any disputes shall be subject to the exclusive jurisdiction of the courts of Sweden.</p>)}

          {sec("13. Changes to these terms", <p>We reserve the right to modify these Terms at any time. We will notify registered users of material changes via email. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>)}

          {sec("14. Contact", <p>For questions about these Terms, contact us at: <span style={{ color: T.cyan }}>support@quantdiver.com</span></p>)}
        </div>
      </section>
    </div>
  );
}

/* ─── root ────────────────────────────────────────────────── */
export default function QuantDiverSite({ onEnterApp }) {
  const [page, setPage] = useState("home");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }); };

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: ff.body, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @keyframes qd-fadein { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes qd-pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }

        .qd-wrap { max-width: 1100px; margin: 0 auto; padding: 0 28px; }

        /* hero — product card on right */
        .qd-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; animation: qd-fadein .5s ease; }

        /* BriefMe teaser — text left, terminal right */
        .qd-briefme-teaser { display: grid; grid-template-columns: 1fr 1.3fr; gap: 56px; align-items: start; }

        /* leaderboard dimension bars */
        .qd-dims-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }

        .qd-lbrow { transition: background .2s; }
        .qd-lbrow:hover { background: rgba(90,130,200,.04); }

        @media (max-width: 900px) {
          .qd-hero { grid-template-columns: 1fr; }
          .qd-briefme-teaser { grid-template-columns: 1fr; }
          .qd-dims-grid { grid-template-columns: repeat(3, 1fr); }
          .qd-nav-links { display: none !important; }
        }
        @media (max-width: 560px) {
          .qd-dims-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      {/* subtle ambient background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", top: -200, left: -100, background: "radial-gradient(circle, rgba(59,130,246,.12), transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", top: "40%", right: -150, background: "radial-gradient(circle, rgba(34,211,238,.08), transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", bottom: -100, left: "35%", background: "radial-gradient(circle, rgba(139,92,246,.07), transparent 70%)", filter: "blur(60px)" }} />
        {/* subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(90,130,200,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(90,130,200,.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 85% 60% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 60% at 50% 0%, black 20%, transparent 75%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* NAV */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          background: "rgba(4,8,15,.82)",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div className="qd-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            {/* logo */}
            <div onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <QDLogo size={38} />
              <span style={{ fontFamily: ff.display, fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-.01em" }}>QuantDiver</span>
            </div>

            {/* nav links */}
            <div className="qd-nav-links" style={{ display: "flex", gap: 28, fontFamily: ff.body, fontSize: ".88rem", color: T.dim }}>
              <a onClick={() => go("home")} style={{ cursor: "pointer", color: page === "home" ? T.sub : "inherit", transition: "color .15s" }}>Home</a>
              <a onClick={() => go("scores")} style={{ cursor: "pointer", color: page === "scores" ? T.cyan : "inherit", transition: "color .15s" }}>Scores</a>
              <a onClick={() => go("briefme")} style={{ cursor: "pointer", color: page === "briefme" ? T.cyan : "inherit", transition: "color .15s" }}>BriefMe</a>
              <a onClick={() => go("pricing")} style={{ cursor: "pointer", color: page === "pricing" ? T.cyan : "inherit", transition: "color .15s" }}>Pricing</a>
              <a onClick={() => go("about")} style={{ cursor: "pointer", color: page === "about" ? T.cyan : "inherit", transition: "color .15s" }}>About Us</a>
            </div>

            <PrimaryBtn onClick={onEnterApp} style={{ fontSize: ".88rem", padding: "10px 20px" }}>
              Members Area →
            </PrimaryBtn>
          </div>
        </nav>

        {/* page content */}
        {page === "home"    && <HomePage go={go} onEnterApp={onEnterApp} />}
        {page === "briefme" && <BriefMePage onEnterApp={onEnterApp} />}
        {page === "scores"  && <ScoresPage onEnterApp={onEnterApp} />}
        {page === "pricing" && <PricingPage onEnterApp={onEnterApp} go={go} />}
        {page === "about"   && <AboutPage onEnterApp={onEnterApp} />}
        {page === "contact" && <ContactPage />}
        {page === "privacy" && <PrivacyPage />}
        {page === "terms"   && <TermsPage />}

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "48px 0 60px" }}>
          <div className="qd-wrap">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
              <span style={{ fontFamily: ff.display, fontWeight: 700, fontSize: "1rem", color: T.sub }}>QuantDiver</span>
              <div style={{ display: "flex", gap: 20, fontSize: ".84rem" }}>
                {[
                  ["Privacy Policy", "privacy"],
                  ["Terms of Service", "terms"],
                  ["Contact", "contact"],
                ].map(([label, route]) => (
                  <a key={route} onClick={() => go(route)} style={{ color: T.dim, textDecoration: "none", cursor: "pointer" }}>{label}</a>
                ))}
              </div>
            </div>
            <div style={{
              fontSize: ".76rem", color: T.dim, lineHeight: 1.7,
              border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px",
              background: "rgba(8,14,28,.5)", fontFamily: ff.body,
            }}>
              <b style={{ color: T.sub }}>Important:</b> QuantDiver and BriefMe provide general financial information and analysis for educational purposes only. Nothing on this platform constitutes investment advice, financial advice, or a recommendation to buy or sell any security. All investment decisions are made at your own risk. Past performance is not a guarantee of future results.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
