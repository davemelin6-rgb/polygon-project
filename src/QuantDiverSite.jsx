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
      <div style={{ fontSize: ".6rem", letterSpacing: ".18em", textTransform: "uppercase", color: T.dim, marginBottom: 8 }}>David Score</div>
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
              The David Score leaderboard
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
            Then 99 SEK / month — cancel anytime
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
                "Full David Score leaderboard with all six dimensions",
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
            <h2 style={{ fontFamily: ff.display, fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 14px" }}>The David Score</h2>
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
              {["Morning brief (08:00) + US preview (15:00) every trading day","Full David Score leaderboard with all six dimensions","Sector momentum, hype, and contract-flow signals","Earnings-week calendar and watch notes","Cancel anytime — no lock-in, no commitment"].map((li, i, arr) => (
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
              <a onClick={() => go("home")} style={{ cursor: "pointer", transition: "color .15s" }}>Scores</a>
              <a onClick={() => go("briefme")} style={{
                cursor: "pointer", color: page === "briefme" ? T.cyan : "inherit", transition: "color .15s",
              }}>BriefMe</a>
              <a onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }) || go("home")} style={{ cursor: "pointer", transition: "color .15s" }}>Pricing</a>
            </div>

            <PrimaryBtn onClick={onEnterApp} style={{ fontSize: ".88rem", padding: "10px 20px" }}>
              Members Area →
            </PrimaryBtn>
          </div>
        </nav>

        {/* page content */}
        {page === "home"
          ? <HomePage go={go} onEnterApp={onEnterApp} />
          : <BriefMePage onEnterApp={onEnterApp} />}

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "48px 0 60px" }}>
          <div className="qd-wrap">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
              <span style={{ fontFamily: ff.display, fontWeight: 700, fontSize: "1rem", color: T.sub }}>QuantDiver</span>
              <div style={{ display: "flex", gap: 20, fontSize: ".84rem" }}>
                {["Privacy Policy", "Terms of Service", "Contact"].map((l, i) => (
                  <a key={i} href="#" onClick={e => e.preventDefault()} style={{ color: T.dim, textDecoration: "none" }}>{l}</a>
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
