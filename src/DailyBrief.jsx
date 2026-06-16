import { useState, useEffect } from "react";
import "./DailyBrief.css";

// What each macro event means + which sectors it affects
const MACRO_INFO = {
  "Business Confidence": {
    what: "Measures how optimistic businesses feel about economic conditions. Scores above 50 indicate expansion; below 50 signals contraction.",
    sectors: { ai: "High confidence drives tech capex and AI infrastructure spending — good for NVDA, AMD, MSFT.", quantum: "Corporate R&D budgets expand in confident environments — positive for IBM, IONQ.", defence: "Less direct impact. Defence spending driven by policy, not sentiment.", biotech: "Strong confidence expands hospital and pharma capex — positive for ISRG, DXCM." },
  },
  "NAHB Housing Market Index": {
    what: "Gauge of US homebuilder confidence. A reading above 50 means more builders see conditions as good than poor.",
    sectors: { ai: "Weak housing can signal broader slowdown but has limited direct impact on tech.", quantum: "Minimal direct impact on quantum sector.", defence: "No meaningful connection to defence & space.", biotech: "No direct impact on biotech or medtech." },
  },
  "Industrial Production MoM": {
    what: "Measures monthly change in output from factories, mines, and utilities. Reflects the health of the real economy.",
    sectors: { ai: "Strong industrial production increases demand for AI-powered automation and semiconductor chips — bullish for NVDA, AMD, SMCI.", quantum: "Positive for IBM which serves industrial clients. Early signal for quantum computing adoption timelines.", defence: "Strong industrial output supports defence supply chains — positive for LMT, RTX, NOC.", biotech: "Stronger industrial output signals broader economic health — positive for medical device demand, ISRG, DXCM." },
  },
  "NY Empire State Manufacturing Index": {
    what: "Monthly survey of manufacturers in New York State. Above 0 = expansion, below 0 = contraction. Early leading indicator for US manufacturing.",
    sectors: { ai: "Weak manufacturing can pull chip demand lower near-term. Watch NVDA and AMD.", quantum: "Limited direct impact but reflects industrial health.", defence: "Supply chain indicator for defence manufacturers.", biotech: "Minimal direct impact on biotech pipeline or drug pricing." },
  },
  "Housing Starts": {
    what: "Number of new residential construction projects begun. A key indicator of consumer confidence and economic health.",
    sectors: { ai: "Indirect — strong housing drives mortgage tech, smart home AI.", quantum: "Minimal sector impact.", defence: "No direct connection.", biotech: "No meaningful direct impact on biotech." },
  },
  "Balance of Trade": {
    what: "Difference between a country's exports and imports. A deficit means more is imported than exported. US trade data moves currency and affects multinational earnings.",
    sectors: { ai: "Trade tensions can restrict semiconductor exports — watch NVDA China restrictions. A wider deficit can pressure USD and impact foreign revenue.", quantum: "IBM and GOOGL derive significant international revenue — currency effects matter.", defence: "Trade policy often drives defence deals — arms exports are a key component.", biotech: "Drug pricing and trade policy intersect — NVO and LLY have significant international revenue exposed to currency swings." },
  },
  "CPI": {
    what: "Consumer Price Index — the main inflation gauge. High CPI keeps interest rates elevated, compressing tech valuations.",
    sectors: { ai: "Rate-sensitive. High CPI = higher rates = lower tech valuations. Critical for NVDA, META, MSFT multiples.", quantum: "Same rate sensitivity. Early-stage quantum companies most exposed.", defence: "Defence stocks are relatively rate-insensitive — government contracts are inflation-adjusted.", biotech: "High inflation raises R&D costs and compresses biotech multiples. Drug pricing pressure increases when consumers are squeezed." },
  },
  "Core CPI": {
    what: "CPI excluding food and energy — what the Fed focuses on. The single most important inflation print for equity markets.",
    sectors: { ai: "Directly drives Fed policy. Lower core CPI = rate cut expectations = tech rally.", quantum: "Same as AI — rate environment is the key variable.", defence: "Defensive positioning benefits from rate uncertainty.", biotech: "Lower core CPI supports rate cuts, which boost high-multiple biotech names like VRTX, REGN, and MRNA." },
  },
  "Fed Interest Rate Decision": {
    what: "The Federal Reserve sets the benchmark interest rate. This is the single most market-moving event. Rate cuts boost growth stocks; hikes compress them.",
    sectors: { ai: "Massive impact. Rate cuts are rocket fuel for high-multiple AI names — NVDA, META, PLTR.", quantum: "Rate cuts benefit speculative plays most — IONQ, RGTI, QUBT would rally hard.", defence: "Less sensitive. Defence is often seen as a safe haven during rate uncertainty.", biotech: "Rate cuts are very positive for growth-stage biotech — lower discount rates inflate future drug revenue valuations. Bullish for MRNA, VRTX." },
  },
  "Unemployment Rate": {
    what: "Percentage of the labour force that is jobless and seeking work. Low unemployment signals economic strength but can fuel inflation.",
    sectors: { ai: "Strong labour market → consumer spending → cloud/SaaS growth → bullish for META, MSFT.", quantum: "Indirect signal of tech hiring conditions.", defence: "Stable employment supports defence budget appropriations.", biotech: "Low unemployment → strong insurance coverage → higher drug utilization → positive for GILD, REGN, LLY." },
  },
  "GDP": {
    what: "Gross Domestic Product — the broadest measure of economic output. Strong GDP growth is generally bullish across sectors.",
    sectors: { ai: "Strong GDP drives enterprise tech spending — bullish across the board.", quantum: "GDP growth expands R&D budgets and quantum investment timelines.", defence: "Strong GDP supports higher defence allocations as % of budget.", biotech: "Strong GDP increases healthcare spending and drug demand — broadly bullish for LLY, NVO, GILD." },
  },
  "PMI": {
    what: "Purchasing Managers Index. Above 50 = economic expansion; below 50 = contraction. One of the most timely economic indicators available.",
    sectors: { ai: "Strong PMI → more enterprise orders → chip demand growth. Critical for NVDA and AMD.", quantum: "Leading indicator for industrial quantum adoption.", defence: "Manufacturing PMI affects defence production capacity.", biotech: "Strong PMI signals economic expansion — supports hospital capex and elective procedure volumes, positive for ISRG." },
  },
  "Retail Sales": {
    what: "Monthly change in total receipts at retail stores. Measures consumer spending — the largest component of the US economy.",
    sectors: { ai: "Strong retail = consumer confidence = cloud/app spending growth. Positive for META, AMZN.", quantum: "Indirect. Consumer economy strength supports tech investment.", defence: "Limited direct impact.", biotech: "Strong retail spending signals consumer confidence — positive for OTC health products and consumer health segments." },
  },
  "Nonfarm Payrolls": {
    what: "Monthly count of jobs added outside farming. The headline jobs number — moves markets significantly on release day.",
    sectors: { ai: "Strong jobs = consumer spending = ad revenue and cloud growth. Positive for META, GOOGL, MSFT.", quantum: "Leading indicator for tech talent availability.", defence: "Strong economy supports defence budget stability.", biotech: "More employed people = more insured = higher drug and device utilization. Broadly positive for LLY, NVO, ISRG." },
  },
};

function getMacroInfo(eventName) {
  for (const [key, val] of Object.entries(MACRO_INFO)) {
    if (eventName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return null;
}

function macroInterpretation(e) {
  if (e.actual == null || e.estimate == null) return null;
  const beat = e.actual > e.estimate;
  const miss = e.actual < e.estimate;
  const diff = Math.abs(((e.actual - e.estimate) / Math.abs(e.estimate || 1)) * 100).toFixed(1);
  if (beat) return { label: `Beat estimates by ${diff}%`, color: "#00dc82", sign: "▲" };
  if (miss) return { label: `Missed estimates by ${diff}%`, color: "#ff3c50", sign: "▼" };
  return { label: "In line with estimates", color: "#f59e0b", sign: "●" };
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " + time;
}

function fmt(n, d = 2) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtVal(v, unit) {
  if (v == null) return null;
  return `${fmt(v, 2)}${unit || ""}`;
}

const IMPACT_COLOR = { High: "#ff3c50", Medium: "#f59e0b" };

export default function DailyBrief({ session }) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [expandedMacro, setExpandedMacro] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/brief", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => { setError("Failed to load brief"); setLoading(false); });
  }, [session]);

  const dateLabel = data?.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="panel db-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Market Intelligence · {dateLabel}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="panel-title">Daily Brief</h2>
          <span className="db-live-badge">● LIVE</span>
        </div>
      </div>

      {loading && <div className="db-loading"><div className="db-spinner" />Loading brief…</div>}
      {error   && <div className="db-error">{error}</div>}

      {data && !loading && (
        <div className="db-brief-body">

          {/* ── One section per sector ──────────────────────── */}
          {data.sectors?.map(s => {
            const sectorNews = data.newsBySector?.[s.id] || [];
            const movers = (s.stocks || []).slice(0, 4);

            return (
              <div key={s.id} className="db-brief-sector">
                {/* sector heading */}
                <div className="db-brief-sector-head" style={{ borderColor: s.accent + "44" }}>
                  <span className="db-brief-sector-icon">{s.icon}</span>
                  <span className="db-brief-sector-name" style={{ color: s.accent }}>{s.name}</span>
                  {/* compact movers strip */}
                  <div className="db-brief-movers">
                    {movers.map(st => {
                      const up = (st.changePercent ?? 0) >= 0;
                      return (
                        <span key={st.symbol} className="db-brief-mover">
                          <span className="db-brief-mover-sym">{st.symbol}</span>
                          <span className={up ? "up" : "down"}>
                            {up ? "▲" : "▼"}{fmt(Math.abs(st.changePercent ?? 0))}%
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* news articles */}
                {sectorNews.length === 0 ? (
                  <p className="db-brief-empty">No news today.</p>
                ) : (
                  <div className="db-brief-articles">
                    {sectorNews.map((item, i) => (
                      <div key={i} className="db-brief-article">
                        <div className="db-brief-article-meta">
                          <span className="db-brief-article-date">{fmtDate(item.published)}</span>
                          <span className="db-brief-article-dot">·</span>
                          <span className="db-brief-article-sym" style={{ color: s.accent }}>{item.symbol}</span>
                          <span className="db-brief-article-dot">·</span>
                          <span className="db-brief-article-source">{item.source}</span>
                        </div>
                        <p className="db-brief-article-title">{item.title}</p>
                        {item.text && <p className="db-brief-article-text">{item.text}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Upcoming Earnings ───────────────────────────── */}
          {data.earnings?.length > 0 && (
            <div className="db-brief-sector">
              <div className="db-brief-sector-head" style={{ borderColor: "rgba(255,255,255,.08)" }}>
                <span className="db-brief-sector-icon">📊</span>
                <span className="db-brief-sector-name" style={{ color: "#f59e0b" }}>Upcoming Earnings · Next 7 Days</span>
              </div>
              <div className="db-earnings">
                {data.earnings.map((e, i) => {
                  const d = new Date(e.date + "T12:00:00");
                  const dateStr = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                  return (
                    <div key={i} className="db-earnings-row">
                      <span className="db-earnings-sym">{e.symbol}</span>
                      <span className="db-earnings-date">{dateStr}</span>
                      {e.time && <span className="db-earnings-time">{e.time === "bmo" ? "Pre-market" : e.time === "amc" ? "After close" : e.time}</span>}
                      {e.epsEst != null && <span className="db-earnings-est">EPS est. {Number(e.epsEst).toFixed(2)}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Macro Context ───────────────────────────────── */}
          {data.events?.length > 0 && (
            <div className="db-brief-sector">
              <div className="db-brief-sector-head" style={{ borderColor: "rgba(255,255,255,.08)" }}>
                <span className="db-brief-sector-icon">📅</span>
                <span className="db-brief-sector-name" style={{ color: "#94a3b8" }}>Macro Context</span>
              </div>
              <div className="db-events">
                {data.events.map((e, i) => {
                  const info   = getMacroInfo(e.event);
                  const interp = macroInterpretation(e);
                  const open   = expandedMacro === i;
                  return (
                    <div key={i}>
                      <div className="db-event" onClick={() => setExpandedMacro(open ? null : i)} style={{ cursor: "pointer" }}>
                        <span style={{ color: IMPACT_COLOR[e.impact] ?? "#8fa0c4", fontSize: ".7rem" }}>●</span>
                        {e.time && <span className="db-event-time">{e.time}</span>}
                        <span className="db-event-flag">{e.flag}</span>
                        <span className="db-event-name">{e.event}</span>
                        <div className="db-event-vals">
                          {e.estimate != null && <span className="db-val-chip">Est: {fmtVal(e.estimate, e.unit)}</span>}
                          {e.previous != null && <span className="db-val-chip dim">Prev: {fmtVal(e.previous, e.unit)}</span>}
                          {e.actual   != null && <span className="db-val-chip actual">Act: {fmtVal(e.actual, e.unit)}</span>}
                          <span style={{ color: "#2a3f55", fontSize: ".65rem", marginLeft: ".25rem" }}>{open ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      {open && (
                        <div className="db-macro-detail">
                          {interp && (
                            <div className="db-macro-reading" style={{ color: interp.color }}>
                              {interp.sign} {interp.label}
                            </div>
                          )}
                          {info ? (
                            <>
                              <p className="db-macro-what">{info.what}</p>
                              <div className="db-macro-sectors">
                                <div className="db-macro-sector"><span style={{ color: "#22D3EE" }}>🧠 AI</span><span>{info.sectors.ai}</span></div>
                                <div className="db-macro-sector"><span style={{ color: "#8B5CF6" }}>⚛️ Quantum</span><span>{info.sectors.quantum}</span></div>
                                <div className="db-macro-sector"><span style={{ color: "#F59E0B" }}>🛡️ Defence</span><span>{info.sectors.defence}</span></div>
                                <div className="db-macro-sector"><span style={{ color: "#10B981" }}>🧬 Biotech</span><span>{info.sectors.biotech}</span></div>
                              </div>
                            </>
                          ) : (
                            <p className="db-macro-what">Economic indicator — click the numbers to compare actual vs estimate and previous readings.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </section>
  );
}
