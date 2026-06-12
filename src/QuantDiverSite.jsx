import { useState, useEffect } from "react";

/* ---------- theme ---------- */
const T = {
  bg: "#060B1A", panel: "#0D1730", panel2: "#111E3E",
  line: "rgba(110,150,255,.16)", ink: "#E8EEFC", muted: "#8FA0C4",
  blue: "#3B82F6", cyan: "#22D3EE", amber: "#F59E0B",
  green: "#34D399", red: "#F87171", violet: "#A78BFA",
  glowBlue: "rgba(59,130,246,.35)", glowCyan: "rgba(34,211,238,.25)",
};
const fontDisplay = "'Space Grotesk', sans-serif";
const fontBody    = "'Inter', sans-serif";
const fontMono    = "'IBM Plex Mono', monospace";

const card = {
  background: `linear-gradient(165deg, ${T.panel2}, ${T.panel})`,
  border: `1px solid ${T.line}`,
  borderRadius: 16,
};

/* ---------- tiny components ---------- */
const Btn = ({ children, primary, big, onClick, style }) => (
  <button onClick={onClick} style={{
    fontFamily: fontDisplay, fontWeight: 600, cursor: "pointer",
    fontSize: big ? "1rem" : ".92rem", padding: big ? "14px 30px" : "10px 20px",
    borderRadius: 9, color: T.ink, transition: "all .2s",
    border: primary ? "1px solid transparent" : `1px solid ${T.line}`,
    background: primary ? `linear-gradient(135deg, ${T.blue}, #2563EB)` : "transparent",
    boxShadow: primary ? `0 0 24px ${T.glowBlue}` : "none",
    ...style,
  }}>{children}</button>
);

const Tag = ({ color, bg, children }) => (
  <span style={{
    fontFamily: fontMono, fontSize: ".66rem", letterSpacing: ".08em",
    textTransform: "uppercase", padding: "2px 8px", borderRadius: 5,
    marginRight: 6, color, background: bg, display: "inline-block",
  }}>{children}</span>
);

const Gauge = ({ value, color, label }) => {
  const C = 2 * Math.PI * 31;
  return (
    <div style={{ textAlign: "center", justifySelf: "end" }}>
      <div style={{ position: "relative", width: 74, height: 74 }}>
        <svg width="74" height="74" viewBox="0 0 74 74" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="37" cy="37" r="31" fill="none" stroke="rgba(120,160,255,.12)" strokeWidth="6" />
          <circle cx="37" cy="37" r="31" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - value / 100)} />
        </svg>
        <span style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: fontMono, fontWeight: 600, fontSize: "1rem",
        }}>{value}</span>
      </div>
      <div style={{
        fontFamily: fontMono, fontSize: ".6rem", letterSpacing: ".12em",
        color: T.muted, marginTop: 4, textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
};

const Spark = ({ points, color, fill }) => (
  <svg width="100%" height="44" viewBox="0 0 260 44" preserveAspectRatio="none" style={{ display: "block", margin: "10px 0 12px" }}>
    <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    <polyline points={`${points} 260,44 0,44`} fill={fill} stroke="none" />
  </svg>
);

const Dim = ({ name, grade, tone }) => {
  const c = tone === "g" ? T.green : tone === "a" ? T.amber : T.red;
  return (
    <span style={{
      fontFamily: fontMono, fontSize: ".68rem", color: T.muted,
      background: "rgba(120,160,255,.07)", border: `1px solid ${T.line}`,
      padding: "3px 8px", borderRadius: 5,
    }}>{name} <i style={{ fontStyle: "normal", color: c }}>{grade}</i></span>
  );
};

const SectionHead = ({ children, sub }) => (
  <div style={{ textAlign: "center", marginBottom: 44 }}>
    <h2 style={{ fontFamily: fontDisplay, fontSize: "clamp(1.7rem,3.2vw,2.3rem)", fontWeight: 700 }}>{children}</h2>
    {sub && <p style={{ color: T.muted, marginTop: 12, maxWidth: "42rem", margin: "12px auto 0", lineHeight: 1.6 }}>{sub}</p>}
  </div>
);

/* ---------- data ---------- */
const scores = [
  {
    rank: "01", name: "ServiceNow", sub: "Enterprise software · US", value: 74.6, color: T.green, label: "Strong",
    dims: [["RUNWAY","A","g"],["DILUTION","LOW","g"],["GROWTH","STRONG","g"],["MARGIN","▲","g"],["INSIDERS","MID","a"],["VALUATION","RICH","a"]],
  },
  {
    rank: "02", name: "AAC Clyde Space", sub: "Space systems · Sweden", value: 62.0, color: T.amber, label: "Building",
    dims: [["RUNWAY","B","a"],["DILUTION","WATCH","a"],["GROWTH","STRONG","g"],["MARGIN","▲","a"],["INSIDERS","HIGH","g"],["VALUATION","FAIR","g"]],
  },
  {
    rank: "03", name: "Salesforce", sub: "Enterprise software · US", value: 58.4, color: T.amber, label: "Building",
    dims: [["RUNWAY","A","g"],["DILUTION","LOW","g"],["GROWTH","SLOWING","a"],["MARGIN","▲","g"],["INSIDERS","MID","a"],["VALUATION","FAIR","g"]],
  },
];

const briefLines = [
  { time: "08:00", tag: ["Semis", T.cyan, "rgba(34,211,238,.12)"], bold: "Asia overnight:", text: "TSMC guided capacity expansion ahead of consensus; Tokyo chip-equipment names followed higher into the close." },
  { time: "08:00", tag: ["Nordic", T.amber, "rgba(245,158,11,.12)"], bold: "Stockholm:", text: "AAC Clyde Space announced a new ESA smallsat contract — order backlog now at a record for the third straight quarter." },
  { time: "08:00", tag: ["Macro", "#C4B5FD", "rgba(167,139,250,.14)"], bold: "Europe:", text: "ECB minutes signal a slower path on cuts; Swedish May CPI lands Tuesday and frames the Riksbank's July decision." },
  { time: "15:00", tag: ["AI", T.green, "rgba(52,211,153,.12)"], bold: "US preview:", text: "Hyperscaler capex commentary in focus as two megacaps report after the bell. Our take on the supply chain — in tonight's brief." },
];

const tickerItems = [
  ["NOW","David Score","74.6 ▲",T.green],["Semis","momentum:","confirmed",T.green],
  ["Quantum","hype index:","cooling",T.red],["Nordic space","contracts:","accelerating",T.green],
  ["CRM","David Score","under review",T.muted],["Defense EU","order flow:","strong",T.green],
  ["Earnings week","","no-entry window",T.red],
];

/* ---------- hero visual ---------- */
function HeroVisual() {
  return (
    <div style={{
      position: "relative", height: 380, borderRadius: 20, overflow: "hidden",
      border: `1px solid ${T.line}`, boxShadow: "0 30px 80px rgba(0,0,0,.55)",
      background: `radial-gradient(ellipse at 70% 30%, rgba(124,58,237,.25), transparent 55%),
                   radial-gradient(ellipse at 20% 80%, rgba(34,211,238,.18), transparent 60%),
                   linear-gradient(170deg, #0B1430, #070D20)`,
    }} aria-hidden="true">
      <svg style={{ position:"absolute", top:26, right:30, width:200, height:160, filter:"drop-shadow(0 0 30px rgba(167,139,250,.55))" }} viewBox="0 0 200 160">
        <defs>
          <radialGradient id="bg1" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#C4B5FD" /><stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="75" rx="78" ry="58" fill="url(#bg1)" opacity=".5" />
        <g stroke={T.violet} strokeWidth="1.1" fill="none" opacity=".9">
          <path d="M40 80 Q60 30 100 35 Q150 28 160 75 Q168 110 120 120 Q70 130 45 105 Q32 92 40 80Z" />
          <path d="M100 35 Q95 70 100 120" />
          <path d="M60 50 Q80 65 70 95" /><path d="M140 48 Q120 70 132 100" />
          <path d="M48 85 Q75 80 95 92" /><path d="M155 82 Q128 85 105 95" />
        </g>
        <g fill={T.cyan}>
          <circle cx="60" cy="50" r="3"><animate attributeName="opacity" values="1;.2;1" dur="2.2s" repeatCount="indefinite" /></circle>
          <circle cx="140" cy="48" r="3"><animate attributeName="opacity" values=".3;1;.3" dur="1.8s" repeatCount="indefinite" /></circle>
          <circle cx="100" cy="35" r="3.5" fill={T.amber}><animate attributeName="opacity" values="1;.4;1" dur="2.6s" repeatCount="indefinite" /></circle>
          <circle cx="70" cy="95" r="3"><animate attributeName="opacity" values=".4;1;.4" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="132" cy="100" r="3" fill={T.violet}><animate attributeName="opacity" values="1;.3;1" dur="2.4s" repeatCount="indefinite" /></circle>
        </g>
      </svg>
      <svg style={{ position:"absolute", inset:0, mixBlendMode:"screen", opacity:.7, width:"100%", height:"100%" }} viewBox="0 0 600 380" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={T.cyan} stopOpacity="0" /><stop offset="50%" stopColor={T.blue} /><stop offset="100%" stopColor={T.amber} stopOpacity=".6" />
          </linearGradient>
        </defs>
        <path d="M0 300 C120 260 200 320 300 250 S480 180 600 210" stroke="url(#wg)" strokeWidth="2.5" fill="none" opacity=".9" />
        <path d="M0 330 C140 300 240 350 340 290 S500 230 600 250" stroke="url(#wg)" strokeWidth="1.5" fill="none" opacity=".5" />
      </svg>
      <svg style={{ position:"absolute", bottom:0, left:0, right:0, height:200, width:"100%" }} viewBox="0 0 600 200" preserveAspectRatio="none">
        <g opacity=".9">
          {[[40,60,85,50,T.green],[80,75,95,45,T.red],[120,50,70,55,T.green],[160,35,55,48,T.green],[200,55,72,42,T.red],[240,30,48,46,T.green],[280,18,34,44,T.green]].map(([x,y1,ry,h,c],i) => (
            <g key={i} stroke={c} fill={c}><line x1={x} y1={y1} x2={x} y2={y1+100} /><rect x={x-7} y={ry} width="14" height={h} rx="2" /></g>
          ))}
        </g>
      </svg>
      <svg style={{ position:"absolute", bottom:0, left:0, right:0, height:110, width:"100%", opacity:.85 }} viewBox="0 0 600 110" preserveAspectRatio="none">
        <g fill="#0A1430">
          <rect x="430" y="30" width="26" height="80" /><rect x="462" y="50" width="20" height="60" />
          <rect x="488" y="18" width="30" height="92" /><rect x="524" y="42" width="22" height="68" />
          <rect x="552" y="26" width="26" height="84" /><rect x="396" y="58" width="28" height="52" />
        </g>
        <g fill={T.amber} opacity=".8">
          {[[436,40],[444,52],[494,28],[504,44],[530,52],[558,38],[466,60],[510,64]].map(([x,y],i) => (
            <rect key={i} x={x} y={y} width="3" height="3" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ---------- pages ---------- */
function HomePage({ go, onEnterApp }) {
  return (
    <div style={{ animation: "qd-fadein .45s ease" }}>
      <header style={{ padding: "72px 0 60px" }}>
        <div className="qd-wrap qd-hero-grid">
          <div>
            <h1 style={{ fontFamily: fontDisplay, fontSize: "clamp(2.3rem,4.8vw,3.5rem)", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-.015em" }}>
              Intelligence<br />That{" "}
              <span style={{ background: `linear-gradient(95deg, ${T.cyan}, ${T.blue} 50%, ${T.violet})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                Moves Markets
              </span>
            </h1>
            <p style={{ margin: "18px 0 30px", fontSize: "1.1rem", color: T.muted, maxWidth: "32rem", lineHeight: 1.6 }}>
              AI-powered insights, sector signals and daily intelligence on the technologies reshaping the world — from semiconductors to space.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn primary big onClick={onEnterApp}>Get started</Btn>
              <Btn big onClick={() => go("briefme")}>Explore BriefMe</Btn>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      {/* THREE COLUMNS */}
      <div className="qd-wrap qd-tri" style={{ padding: "56px 24px" }}>
        <div id="news">
          <h2 className="qd-colhead">Market News</h2>
          {[
            ["🌐","linear-gradient(140deg,#1E3A8A,#0E7490)","Tech stocks rally on earnings reports","15m ago"],
            ["🧠","linear-gradient(140deg,#7C3AED,#1D4ED8)","AI capex cycle: hyperscalers raise guidance again","1h ago"],
            ["🏛️","linear-gradient(140deg,#9A3412,#B45309)","Fed signals patience on rate path ahead of CPI","2h ago"],
          ].map(([emoji,bg,title,time],i) => (
            <div key={i} className="qd-hover" style={{ ...card, borderRadius:13, display:"flex", gap:14, padding:14, marginBottom:14 }}>
              <div style={{ width:74, height:64, borderRadius:9, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", background:bg }}>{emoji}</div>
              <div>
                <b style={{ fontSize:".92rem", display:"block", lineHeight:1.35, marginBottom:5 }}>{title}</b>
                <div style={{ fontSize:".74rem", color:T.muted, fontFamily:fontMono }}>{time}</div>
                <a href="#" onClick={e=>e.preventDefault()} style={{ fontSize:".76rem", color:T.cyan, textDecoration:"none" }}>Read more →</a>
              </div>
            </div>
          ))}
        </div>

        <div id="toppicks">
          <h2 className="qd-colhead">Top Scored</h2>
          {[
            ["ServiceNow","Enterprise software · US","74.6",T.green,"rgba(52,211,153,.13)","0,34 30,30 60,32 90,24 120,26 150,18 180,20 210,12 240,14 260,8",T.green,"rgba(52,211,153,.1)","View analysis"],
            ["AAC Clyde Space","Space systems · Sweden","62.0",T.amber,"rgba(245,158,11,.13)","0,30 30,32 60,26 90,28 120,22 150,25 180,17 210,20 240,13 260,15",T.amber,"rgba(245,158,11,.1)","View analysis"],
            ["Sector Signal: Semiconductors","Momentum confirmed · contract flow strong","▲",T.cyan,"rgba(34,211,238,.12)","0,36 26,33 52,35 78,28 104,30 130,22 156,24 182,15 208,18 234,9 260,11",T.cyan,"rgba(34,211,238,.1)","View signal"],
          ].map(([name,sub,score,color,chipBg,pts,lineColor,fill,cta],i) => (
            <div key={i} className="qd-hover" style={{ ...card, borderRadius:14, padding:18, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <b style={{ fontSize:"1rem", fontFamily:fontDisplay }}>{name}</b>
                  <span style={{ fontSize:".8rem", color:T.muted, display:"block", marginTop:2 }}>{sub}</span>
                </div>
                <span style={{ fontFamily:fontMono, fontWeight:600, fontSize:".9rem", padding:"4px 11px", borderRadius:7, color, background:chipBg, boxShadow:`inset 0 0 0 1px ${color}55` }}>{score}</span>
              </div>
              <Spark points={pts} color={lineColor} fill={fill} />
              <Btn style={{ fontSize:".8rem", padding:"7px 15px" }}>{cta}</Btn>
            </div>
          ))}
        </div>

        <div id="aitools">
          <h2 className="qd-colhead">AI Tools</h2>
          {[
            ["🔮","rgba(59,130,246,.15)","rgba(59,130,246,.3)","Predictive Models","Theme & momentum modelling"],
            ["🧩","rgba(52,211,153,.13)","rgba(52,211,153,.3)","Portfolio Lens","Diversification & exposure check"],
            ["🛡️","rgba(167,139,250,.15)","rgba(167,139,250,.3)","Risk Analyzer","Runway, dilution & drawdown flags"],
          ].map(([emoji,bg,ring,title,sub],i) => (
            <div key={i} className="qd-hover" style={{ ...card, borderRadius:14, display:"flex", alignItems:"center", gap:16, padding:18, marginBottom:14, cursor:"pointer" }}>
              <div style={{ width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0, background:bg, boxShadow:`inset 0 0 0 1px ${ring}` }}>{emoji}</div>
              <div>
                <b style={{ display:"block", fontSize:".98rem", fontFamily:fontDisplay }}>{title}</b>
                <span style={{ fontSize:".8rem", color:T.muted }}>{sub}</span>
              </div>
            </div>
          ))}
          <Btn style={{ width:"100%", marginTop:4 }}>Explore all tools</Btn>
        </div>
      </div>

      {/* DASHBOARD */}
      <section id="dashboard" style={{ padding: "30px 0 80px" }}>
        <div className="qd-wrap">
          <SectionHead>Your <span style={{ color: T.cyan }}>Investment Dashboard</span></SectionHead>
          <div className="qd-dash-grid">
            <div className="qd-hover" style={{ ...card, padding:20 }}>
              <h4 className="qd-panelhead">📈 Portfolio</h4>
              <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:8 }}>
                <span style={{ fontFamily:fontDisplay, fontSize:"1.9rem", fontWeight:700 }}>$152,300</span>
                <span style={{ fontFamily:fontMono, fontSize:".95rem", color:T.green }}>+3.25%</span>
              </div>
              <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.blue} stopOpacity=".4" /><stop offset="100%" stopColor={T.blue} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points="0,70 30,62 60,66 90,52 120,56 150,42 180,46 210,32 240,36 270,22 300,18" fill="none" stroke="#60A5FA" strokeWidth="2.5" />
                <polyline points="0,70 30,62 60,66 90,52 120,56 150,42 180,46 210,32 240,36 270,22 300,18 300,90 0,90" fill="url(#pf)" stroke="none" />
              </svg>
            </div>

            <div className="qd-hover" style={{ ...card, padding:20 }}>
              <h4 className="qd-panelhead">📊 Performance</h4>
              <svg width="100%" height="120" viewBox="0 0 220 120" preserveAspectRatio="none">
                <g fill="rgba(59,130,246,.65)">
                  {[[10,70,46],[44,58,58],[78,64,52],[112,42,74],[146,50,66],[180,26,90]].map(([x,y,h],i) => (
                    <rect key={i} x={x} y={y} width="22" height={h} rx="3" />
                  ))}
                </g>
                <polyline points="21,64 55,52 89,58 123,36 157,44 191,20" fill="none" stroke={T.cyan} strokeWidth="2" />
              </svg>
              <div className="qd-axis"><span>JAN</span><span>MAR</span><span>MAY</span></div>
            </div>

            <div className="qd-hover" style={{ ...card, padding:20 }}>
              <h4 className="qd-panelhead">🍩 Asset Allocation</h4>
              <svg width="100%" height="120" viewBox="0 0 120 120" style={{ maxWidth:130, display:"block", margin:"0 auto" }}>
                {[[T.blue,105.5,0],[T.cyan,66.3,-105.5],[T.amber,55.3,-171.8],[T.violet,49.4,-227.1]].map(([c,dash,off],i) => (
                  <circle key={i} cx="60" cy="60" r="44" fill="none" stroke={c} strokeWidth="18"
                    strokeDasharray={`${dash} 276.5`} strokeDashoffset={off} transform="rotate(-90 60 60)" />
                ))}
              </svg>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                {[["AI & Software",T.blue],["Semis",T.cyan],["Space & Defense",T.amber],["Cash",T.violet]].map(([l,c],i) => (
                  <span key={i} style={{ fontSize:".72rem", color:T.muted, display:"flex", alignItems:"center", gap:6 }}>
                    <i style={{ width:9, height:9, borderRadius:3, background:c, display:"inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>

            <div className="qd-hover" style={{ ...card, padding:20 }}>
              <h4 className="qd-panelhead">🛡️ Market Sentiment</h4>
              <svg width="100%" height="110" viewBox="0 0 200 110" style={{ maxWidth:200, display:"block", margin:"0 auto" }}>
                <path d="M20 100 A80 80 0 0 1 63 30" fill="none" stroke={T.red} strokeWidth="14" strokeLinecap="round" />
                <path d="M70 26 A80 80 0 0 1 130 26" fill="none" stroke={T.amber} strokeWidth="14" strokeLinecap="round" />
                <path d="M137 30 A80 80 0 0 1 180 100" fill="none" stroke={T.green} strokeWidth="14" strokeLinecap="round" />
                <line x1="100" y1="100" x2="146" y2="48" stroke={T.ink} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="7" fill={T.ink} />
              </svg>
              <div className="qd-axis"><span>FEAR</span><span>NEUTRAL</span><span>GREED</span></div>
            </div>
          </div>
          <p style={{ fontSize:".78rem", color:T.muted, textAlign:"center", marginTop:18, fontFamily:fontMono }}>· dashboard shown with demo data ·</p>
        </div>
      </section>
    </div>
  );
}

function BriefMePage({ onEnterApp }) {
  return (
    <div style={{ animation: "qd-fadein .45s ease" }}>
      <header style={{ padding: "80px 0 64px" }}>
        <div className="qd-wrap qd-hero-grid">
          <div>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:8, fontFamily:fontMono,
              fontSize:".78rem", letterSpacing:".14em", textTransform:"uppercase", color:T.cyan,
              border:"1px solid rgba(34,211,238,.3)", background:"rgba(34,211,238,.07)",
              padding:"6px 14px", borderRadius:999, marginBottom:22,
            }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:T.cyan, boxShadow:`0 0 10px ${T.cyan}`, animation:"qd-pulse 2s infinite" }} />
              Live · Stockholm 08:00 &amp; New York open
            </span>
            <h1 style={{ fontFamily:fontDisplay, fontSize:"clamp(2.4rem,5vw,3.6rem)", lineHeight:1.07, fontWeight:700 }}>
              Intelligence,<br />
              <span style={{ background:`linear-gradient(95deg, ${T.cyan}, ${T.blue} 45%, ${T.violet})`, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
                briefed daily.
              </span>
            </h1>
            <p style={{ margin:"20px 0 32px", fontSize:"1.12rem", color:T.muted, maxWidth:"34rem", lineHeight:1.65 }}>
              AI-curated market briefings for disruptive tech — semiconductors, AI, quantum, space, defense and biotech — across Nordic and US markets. Analysis and scoring, written for humans, twice a day.
            </p>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
              <Btn primary big onClick={() => document.getElementById("bm-pricing")?.scrollIntoView({ behavior:"smooth" })}>Start your briefings</Btn>
              <span style={{ fontFamily:fontMono, fontSize:".85rem", color:T.muted }}><b style={{ color:T.ink }}>99 SEK</b>/month · cancel anytime</span>
            </div>
          </div>

          {/* terminal */}
          <div style={{ ...card, borderRadius:18, boxShadow:"0 30px 80px rgba(0,0,0,.55)", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:`1px solid ${T.line}`, background:"rgba(10,18,40,.6)" }}>
              <span style={{ fontFamily:fontMono, fontSize:".78rem", color:T.muted }}>briefme · fredag 12 juni 2026 · 08:00 CEST</span>
              <span style={{ display:"flex", gap:6 }}>
                {[T.red,"#FBBF24",T.green].map((c,i) => <i key={i} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
              </span>
            </div>
            <div style={{ padding:18 }}>
              {briefLines.map((l,i) => (
                <div key={i} className="qd-briefline" style={{ display:"flex", gap:12, padding:"11px 12px", borderRadius:10, alignItems:"flex-start", marginTop:i?6:0 }}>
                  <span style={{ fontFamily:fontMono, fontSize:".75rem", color:T.cyan, paddingTop:2, minWidth:46 }}>{l.time}</span>
                  <span style={{ fontSize:".9rem", color:"#C7D2E8", lineHeight:1.5 }}>
                    <Tag color={l.tag[1]} bg={l.tag[2]}>{l.tag[0]}</Tag>
                    <b style={{ color:T.ink }}>{l.bold}</b> {l.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div style={{ borderTop:`1px solid ${T.line}`, borderBottom:`1px solid ${T.line}`, background:"rgba(13,23,48,.5)", overflow:"hidden", whiteSpace:"nowrap", padding:"12px 0" }} aria-hidden="true">
        <div style={{ display:"inline-block", animation:"qd-scroll 38s linear infinite" }}>
          {[...tickerItems,...tickerItems].map(([name,mid,val,color],i) => (
            <span key={i} style={{ fontFamily:fontMono, fontSize:".8rem", color:T.muted, margin:"0 28px" }}>
              <b style={{ color:T.ink }}>{name}</b> {mid} <i style={{ fontStyle:"normal", color }}>{val}</i>
            </span>
          ))}
        </div>
      </div>

      {/* SCOREBOARD */}
      <section style={{ padding: "74px 0" }}>
        <div className="qd-wrap">
          <SectionHead sub="Every company we cover is scored 0–100 across six fundamentals: cash runway, dilution risk, revenue growth, gross margin, insider ownership and valuation. Our scores, our methodology — updated after every report.">
            The <span style={{ color:T.cyan }}>David Score</span> leaderboard
          </SectionHead>
          <div style={{ ...card, borderRadius:18, overflow:"hidden" }}>
            {scores.map((s,i) => (
              <div key={i} className="qd-scorerow" style={{ borderBottom:i<scores.length-1?`1px solid ${T.line}`:"none" }}>
                <span style={{ fontFamily:fontMono, color:T.muted, fontSize:".85rem" }}>{s.rank}</span>
                <div>
                  <b style={{ display:"block", fontFamily:fontDisplay, fontSize:"1rem" }}>{s.name}</b>
                  <span style={{ fontSize:".78rem", color:T.muted }}>{s.sub}</span>
                </div>
                <div className="qd-dims" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {s.dims.map(([n,g,t],j) => <Dim key={j} name={n} grade={g} tone={t} />)}
                </div>
                <Gauge value={s.value} color={s.color} label={s.label} />
              </div>
            ))}
          </div>
          <p style={{ fontSize:".8rem", color:T.muted, textAlign:"center", marginTop:16 }}>
            Scores are our own analytical opinion, not investment advice or a recommendation to buy or sell.
          </p>
        </div>
      </section>

      {/* INTELLIGENCE LAYER */}
      <section style={{ padding: "0 0 74px" }}>
        <div className="qd-wrap">
          <SectionHead sub="We read the filings, the contracts and the overnight tape — so your morning starts with signal, not noise.">
            Your <span style={{ color:T.cyan }}>intelligence layer</span>
          </SectionHead>
          <div className="qd-cols3">
            {[
              ["🌅","Swedish Morning Brief — 08:00","Nordic tech movers, Asia's overnight semiconductor session, European disruptive tech, earnings and analyst moves, ECB & CPI macro. Today's news only."],
              ["🎽","US Brief — 15:00","Big-tech earnings, the frontier sectors — AI, semis, quantum, drones, defense, space, biotech — plus the US macro prints that move them."],
              ["💡","Sector Signals","Momentum, hype and contract-flow indicators per theme — derived from our own models, so you see when a narrative is heating up or cooling off."],
            ].map(([emoji,title,text],i) => (
              <div key={i} className="qd-hover" style={{ ...card, padding:26 }}>
                <div style={{ width:44, height:44, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, fontSize:"1.25rem", background:"rgba(59,130,246,.12)", boxShadow:"inset 0 0 0 1px rgba(59,130,246,.25)" }}>{emoji}</div>
                <h3 style={{ fontFamily:fontDisplay, fontSize:"1.12rem", marginBottom:10 }}>{title}</h3>
                <p style={{ fontSize:".92rem", color:T.muted, lineHeight:1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="bm-pricing" style={{ padding: "0 0 84px" }}>
        <div className="qd-wrap">
          <SectionHead>One plan. <span style={{ color:T.cyan }}>Everything.</span></SectionHead>
          <div style={{
            maxWidth:430, margin:"0 auto", borderRadius:20, padding:40, textAlign:"center",
            background:`linear-gradient(170deg, #13224A, ${T.panel})`,
            border:"1px solid rgba(59,130,246,.4)", boxShadow:`0 0 60px ${T.glowBlue}`,
          }}>
            <div style={{ fontFamily:fontDisplay, fontSize:"3.2rem", fontWeight:700 }}>
              99 SEK<small style={{ fontSize:"1rem", color:T.muted, fontWeight:400 }}> /month</small>
            </div>
            <ul style={{ listStyle:"none", margin:"26px 0 30px", textAlign:"left", padding:0 }}>
              {[
                "Two AI-curated briefings every trading day",
                "Full David Score leaderboard & methodology",
                "Sector momentum & hype signals",
                "Earnings-week calendar and watch notes",
                "Cancel anytime — no lock-in",
              ].map((li,i) => (
                <li key={i} style={{ padding:"9px 0", color:"#C7D2E8", fontSize:".95rem", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ color:T.cyan, fontSize:".7rem", paddingTop:4 }}>✓</span>{li}
                </li>
              ))}
            </ul>
            <Btn primary big style={{ width:"100%" }} onClick={onEnterApp}>Get started</Btn>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- root ---------- */
export default function QuantDiverSite({ onEnterApp }) {
  const [page, setPage] = useState("home");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const go = (p) => { setPage(p); window.scrollTo({ top:0 }); };
  const scrollToSection = (id) => {
    setPage("home");
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" }), 80);
  };

  return (
    <div style={{ background:T.bg, color:T.ink, fontFamily:fontBody, minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @keyframes qd-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes qd-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes qd-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes qd-drift{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,-30px) scale(1.08)}}
        .qd-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
        .qd-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
        .qd-tri{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:24px}
        .qd-dash-grid{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:18px}
        .qd-cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .qd-colhead{font-family:${fontDisplay};font-size:1.25rem;margin-bottom:18px;display:flex;align-items:center;gap:12px}
        .qd-colhead::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,${T.line},transparent)}
        .qd-panelhead{font-size:.88rem;color:${T.muted};font-weight:500;margin-bottom:10px;font-family:${fontBody}}
        .qd-axis{display:flex;justify-content:space-between;font-family:${fontMono};font-size:.68rem;color:${T.muted};margin-top:6px}
        .qd-hover{transition:transform .25s,box-shadow .25s,border-color .25s}
        .qd-hover:hover{transform:translateY(-3px);border-color:rgba(59,130,246,.45)!important;box-shadow:0 14px 40px rgba(0,0,0,.5),0 0 26px ${T.glowCyan}}
        .qd-briefline:hover{background:rgba(59,130,246,.07)}
        .qd-scorerow{display:grid;grid-template-columns:54px 1.4fr 2fr 110px;gap:16px;align-items:center;padding:18px 24px}
        .qd-scorerow:hover{background:rgba(59,130,246,.06)}
        @media(max-width:980px){
          .qd-hero-grid{grid-template-columns:1fr}
          .qd-tri{grid-template-columns:1fr}
          .qd-dash-grid{grid-template-columns:1fr 1fr}
          .qd-cols3{grid-template-columns:1fr}
          .qd-scorerow{grid-template-columns:40px 1fr 96px;gap:10px}
          .qd-dims{display:none}
          .qd-navlinks{display:none!important}
        }
        @media(max-width:560px){.qd-dash-grid{grid-template-columns:1fr}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      {/* ambient background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        {[
          { w:560, bg:T.glowBlue,  top:-180, left:-120, delay:"0s" },
          { w:480, bg:T.glowCyan,  top:"30%", right:-160, delay:"-6s" },
          { w:520, bg:"rgba(245,158,11,.22)", bottom:-200, left:"30%", delay:"-12s" },
        ].map((o,i) => (
          <div key={i} style={{
            position:"absolute", width:o.w, height:o.w, borderRadius:"50%",
            filter:"blur(90px)", opacity:.5, top:o.top, left:o.left, right:o.right, bottom:o.bottom,
            background:`radial-gradient(circle, ${o.bg}, transparent 70%)`,
            animation:`qd-drift 18s ease-in-out infinite alternate`, animationDelay:o.delay,
          }} />
        ))}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(120,160,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,255,.05) 1px,transparent 1px)",
          backgroundSize:"56px 56px",
          maskImage:"radial-gradient(ellipse 90% 70% at 50% 0%,black 30%,transparent 80%)",
          WebkitMaskImage:"radial-gradient(ellipse 90% 70% at 50% 0%,black 30%,transparent 80%)",
        }} />
      </div>

      <main style={{ position:"relative", zIndex:1 }}>
        {/* NAV */}
        <nav style={{ position:"sticky", top:0, zIndex:50, backdropFilter:"blur(14px)", background:"rgba(6,11,26,.78)", borderBottom:`1px solid ${T.line}` }}>
          <div className="qd-wrap" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:68 }}>
            <div onClick={() => go("home")} style={{ display:"flex", alignItems:"center", gap:10, fontFamily:fontDisplay, fontWeight:700, fontSize:"1.3rem", cursor:"pointer" }}>
              <span style={{
                width:34, height:34, borderRadius:9, position:"relative",
                background:`conic-gradient(from 210deg, ${T.cyan}, ${T.blue} 55%, #7C3AED)`,
                boxShadow:`0 0 22px ${T.glowBlue}`, display:"inline-block",
              }}>
                <span style={{ position:"absolute", inset:3, borderRadius:7, background:T.bg, backgroundImage:"radial-gradient(circle at 65% 35%, rgba(34,211,238,.7), transparent 55%)" }} />
              </span>
              QuantDiver
            </div>
            <div className="qd-navlinks" style={{ display:"flex", gap:24, fontSize:".92rem", color:T.muted, alignItems:"center" }}>
              <a onClick={() => go("home")} style={{ cursor:"pointer", color:page==="home"?T.ink:"inherit" }}>Home</a>
              <a onClick={() => scrollToSection("dashboard")} style={{ cursor:"pointer" }}>Analytics</a>
              <a onClick={() => scrollToSection("aitools")} style={{ cursor:"pointer" }}>AI Tools</a>
              <a onClick={() => scrollToSection("toppicks")} style={{ cursor:"pointer" }}>Top Scored</a>
              <a onClick={() => scrollToSection("news")} style={{ cursor:"pointer" }}>News</a>
              <a onClick={() => go("briefme")} style={{
                cursor:"pointer", color:T.cyan, border:"1px solid rgba(34,211,238,.35)",
                padding:"5px 13px", borderRadius:999, background:"rgba(34,211,238,.07)",
                boxShadow:page==="briefme"?`0 0 16px ${T.glowCyan}`:"none",
              }}>⚡ BriefMe</a>
            </div>
            {/* ── Premium Members Area button ── */}
            <Btn primary onClick={onEnterApp} style={{
              background:`linear-gradient(135deg, #7C3AED, #2563EB)`,
              boxShadow:`0 0 24px rgba(124,58,237,.4)`,
              letterSpacing:".02em",
            }}>
              Premium Members Area
            </Btn>
          </div>
        </nav>

        {page === "home"
          ? <HomePage go={go} onEnterApp={onEnterApp} />
          : <BriefMePage onEnterApp={onEnterApp} />}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${T.line}`, padding:"46px 0 60px", background:"rgba(6,11,26,.85)", position:"relative", zIndex:1 }}>
        <div className="qd-wrap">
          <div style={{ display:"flex", justifyContent:"space-between", gap:30, flexWrap:"wrap", marginBottom:30, alignItems:"center" }}>
            <div onClick={() => go("home")} style={{ display:"flex", alignItems:"center", gap:10, fontFamily:fontDisplay, fontWeight:700, fontSize:"1.3rem", cursor:"pointer" }}>QuantDiver</div>
            <div style={{ display:"flex", gap:22, fontSize:".88rem" }}>
              {["Privacy Policy","Terms of Service","Contact Us"].map((l,i) => (
                <a key={i} href="#" onClick={e=>e.preventDefault()} style={{ color:T.muted, textDecoration:"none" }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ fontSize:".78rem", color:"#6B7BA0", lineHeight:1.7, border:`1px solid ${T.line}`, borderRadius:12, padding:"18px 20px", background:"rgba(13,23,48,.5)" }}>
            <b style={{ color:T.muted }}>Viktig information:</b> QuantDiver och BriefMe tillhandahåller endast allmän finansiell information och analys i utbildningssyfte. Innehållet utgör inte investeringsrådgivning, finansiell rådgivning eller rekommendationer att köpa eller sälja värdepapper. Tjänsten står inte under Finansinspektionens tillsyn. Alla investeringsbeslut fattas på egen risk. Historisk avkastning är ingen garanti för framtida resultat. Skribenten kan äga aktier som omnämns — innehav redovisas i respektive briefing.
            <br /><br />
            QuantDiver and BriefMe provide general financial information and analysis for educational purposes only. Nothing on this site constitutes investment advice or a recommendation to buy or sell any security. All investment decisions are made at your own risk.
          </div>
        </div>
      </footer>
    </div>
  );
}
