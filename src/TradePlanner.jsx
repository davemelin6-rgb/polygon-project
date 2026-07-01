import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const BENCHMARKS = ["SPY", "QQQ", "XLK"]; // SPY=S&P500, QQQ=Nasdaq100, XLK=Tech ETF

const ALL_TICKERS = "NVDA,AMD,META,MSFT,GOOGL,AMZN,PLTR,IBM,AI,SOUN,SMCI,ORCL,CRM,NOW,SNOW,MDB,DDOG,NET,PATH,BBAI,UPST,ANET,CRWD,ZS,AVGO,MRVL,QCOM,TSM,IONQ,RGTI,QUBT,QBTS,ARQQ,HON,INTC,LMT,RTX,NOC,GD,BA,HII,LHX,KTOS,AXON,AVAV,RKLB,ASTS,IRDM,BAH,LLY,NVO,ABBV,BMY,AMGN,GILD,BIIB,REGN,VRTX,MRNA,ALNY,CRSP,EDIT,BEAM,ISRG,DXCM,ILMN,MDT,ABT,SYK,MU,ASML,TXN,AMAT,LRCX,KLAC,ADI,NXPI,ON,MPWR,WOLF,AMBA";

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  return v >= 65 ? "#00dc82" : v >= 40 ? "#f59e0b" : "#ff3c50";
}

function pctColor(v) {
  if (v == null) return "#3d5c78";
  return v >= 0 ? "#00dc82" : "#ff3c50";
}

const COMPANY_NAMES = {
  NVDA:"NVIDIA", AMD:"AMD", META:"Meta", MSFT:"Microsoft", GOOGL:"Alphabet",
  AMZN:"Amazon", PLTR:"Palantir", IBM:"IBM", AI:"C3.ai", SOUN:"SoundHound",
  SMCI:"Super Micro", ORCL:"Oracle", CRM:"Salesforce", NOW:"ServiceNow",
  SNOW:"Snowflake", MDB:"MongoDB", DDOG:"Datadog", NET:"Cloudflare",
  PATH:"UiPath", BBAI:"BigBear.ai", UPST:"Upstart", ANET:"Arista",
  CRWD:"CrowdStrike", ZS:"Zscaler", AVGO:"Broadcom", MRVL:"Marvell",
  QCOM:"Qualcomm", TSM:"TSMC", IONQ:"IonQ", RGTI:"Rigetti", QUBT:"Quantum Inc",
  QBTS:"D-Wave", ARQQ:"Arqit", HON:"Honeywell", INTC:"Intel",
  LMT:"Lockheed", RTX:"RTX", NOC:"Northrop", GD:"General Dynamics",
  BA:"Boeing", HII:"Huntington", LHX:"L3Harris", KTOS:"Kratos",
  AXON:"Axon", AVAV:"AeroVironment", RKLB:"Rocket Lab", ASTS:"AST SpaceMobile",
  LLY:"Eli Lilly", NVO:"Novo Nordisk", ABBV:"AbbVie", BMY:"Bristol-Myers",
  AMGN:"Amgen", GILD:"Gilead", BIIB:"Biogen", REGN:"Regeneron",
  VRTX:"Vertex", MRNA:"Moderna", ALNY:"Alnylam", CRSP:"CRISPR Tx",
  ISRG:"Intuitive Surgical", DXCM:"Dexcom", MDT:"Medtronic",
  MU:"Micron", ASML:"ASML", TXN:"Texas Instruments", AMAT:"Applied Materials",
  LRCX:"Lam Research", KLAC:"KLA Corp", ADI:"Analog Devices",
  NXPI:"NXP Semi", ON:"ON Semi", MPWR:"Monolithic Power", AMBA:"Ambarella",
};

export default function TradePlanner({ session }) {
  const [allScores,    setAllScores]       = useState([]);
  const [gradeAStocks, setGradeAStocks]   = useState([]);
  const [prices,       setPrices]          = useState({});
  const [benchmarks,   setBenchmarks]      = useState({});
  const [news,         setNews]            = useState([]);
  const [plan,         setPlan]            = useState("");
  const [planSaved,    setPlanSaved]       = useState(false);
  const [loading,      setLoading]         = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  // Load all scores from DB + prices separately
  useEffect(() => {
    if (!session?.access_token) return;

    const SUPA_URL = "https://ksgodgqwtfpwazmxbdrk.supabase.co";
    const ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZ29kZ3F3dGZwd2F6bXhiZHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzIxNTEsImV4cCI6MjA5NTEwODE1MX0.pqta512IgXbxffptl9dqUEtNhoE2UyePBCiG1NmWtNg";
    const authHeaders = { "apikey": ANON, "Authorization": `Bearer ${session.access_token}` };

    // 1. Get ALL scores from DB
    fetch(`${SUPA_URL}/rest/v1/scores?select=symbol,signal,momentum&order=signal.desc&limit=200`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllScores(data);
          setGradeAStocks(data.filter(s => (s.signal ?? 0) >= 63));
        }
      }).catch(() => {});

    // 2. Get prices for Grade A tickers + benchmarks separately
    const stockHeaders = { Authorization: `Bearer ${session.access_token}` };
    fetch(`/api/stocks?tickers=${encodeURIComponent(ALL_TICKERS)}`, { headers: stockHeaders })
      .then(r => r.json())
      .then(d => {
        const priceMap = {};
        for (const s of d.data || []) priceMap[s.symbol] = s;
        setPrices(priceMap);
        setLoading(false);
      }).catch(() => setLoading(false));

    // 3. Get benchmark prices independently
    fetch(`/api/stocks?tickers=SPY,QQQ,XLK`, { headers: stockHeaders })
      .then(r => r.json())
      .then(d => {
        const benchMap = {};
        for (const s of d.data || []) benchMap[s.symbol] = s;
        setBenchmarks(benchMap);
      }).catch(() => {});
  }, [session]);

  // Load news for top grade A tickers
  useEffect(() => {
    if (!gradeAStocks.length || !session?.access_token) return;
    const top10 = gradeAStocks.slice(0, 10).map(s => s.symbol).join(",");
    const headers = { Authorization: `Bearer ${session.access_token}` };
    fetch(`/api/news?tickers=${encodeURIComponent(top10)}&limit=8`, { headers })
      .then(r => r.json())
      .then(d => setNews(d.news || []))
      .catch(() => {});
  }, [gradeAStocks, session]);

  // Load today's plan
  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("trade_plans").select("content").eq("user_id", session.user.id)
      .eq("plan_date", today).maybeSingle()
      .then(({ data }) => { if (data?.content) setPlan(data.content); });
  }, [session, today]);

  // Save plan (debounced)
  const savePlan = useCallback(async (content) => {
    if (!session?.user?.id) return;
    await supabase.from("trade_plans").upsert({
      user_id: session.user.id, plan_date: today, content, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,plan_date" });
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  }, [session, today]);

  // Compute returns per grade
  const avgReturn = (stocks) => {
    const vals = stocks.map(s => prices[s.symbol]?.changePercent).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*100)/100 : null;
  };

  const gradeAReturn = avgReturn(gradeAStocks);
  const allStocksWithSignal = Object.entries(prices)
    .map(([sym, p]) => ({ symbol: sym, changePercent: p.changePercent }));

  // Sort movers from Grade A
  const withPrices = gradeAStocks.filter(s => prices[s.symbol]?.changePercent != null)
    .map(s => ({ ...s, ...prices[s.symbol] }))
    .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
  const rising  = withPrices.filter(s => s.changePercent > 0).slice(0, 6);
  const falling = withPrices.filter(s => s.changePercent < 0).slice(-6).reverse();

  const panel = { background: "rgba(7,13,22,.92)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "20px 22px", backdropFilter: "blur(16px)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Alpha Index vs Benchmarks */}
      <div style={panel}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 16 }}>
          Alpha Index · Today vs Benchmarks
        </div>
        {/* Benchmarks row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
          {[
            { key: "SPY", name: "S&P 500",    color: "#22D3EE" },
            { key: "QQQ", name: "Nasdaq 100", color: "#a78bfa" },
            { key: "XLK", name: "Tech ETF",   color: "#f59e0b" },
          ].map(b => {
            const bData = benchmarks[b.key];
            return (
              <div key={b.key} style={{ background: "rgba(255,255,255,.025)", border: `1px solid ${b.color}20`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: b.color, marginBottom: 6 }}>{b.name}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.6rem", fontWeight: 700, color: pctColor(bData?.changePercent), lineHeight: 1 }}>
                  {bData?.changePercent != null ? `${bData.changePercent >= 0 ? "+" : ""}${bData.changePercent.toFixed(2)}%` : "…"}
                </div>
              </div>
            );
          })}
        </div>

        {/* All grades vs benchmarks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Grade A", min: 63,  max: 101, color: "#00dc82" },
            { label: "Grade B", min: 48,  max: 63,  color: "#22D3EE" },
            { label: "Grade C", min: 35,  max: 48,  color: "#f59e0b" },
            { label: "Grade D", min: 0,   max: 35,  color: "#ff3c50" },
          ].map(g => {
            const stocks = allScores.filter(s => (s.signal ?? 0) >= g.min && (s.signal ?? 0) < g.max);
            const ret = avgReturn(stocks);
            const spy = benchmarks["SPY"]?.changePercent;
            const alpha = ret != null && spy != null ? Math.round((ret - spy) * 100) / 100 : null;
            return (
              <div key={g.label} style={{ background: g.color + "08", border: `1px solid ${g.color}25`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: g.color, marginBottom: 6 }}>{g.label}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: pctColor(ret), lineHeight: 1 }}>
                  {ret != null ? `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%` : (loading ? "…" : "—")}
                </div>
                {alpha != null && (
                  <div style={{ fontSize: ".7rem", fontWeight: 700, color: alpha >= 0 ? "#00dc82" : "#ff3c50", marginTop: 4 }}>
                    vs SPY: {alpha >= 0 ? "+" : ""}{alpha}%
                  </div>
                )}
                <div style={{ fontSize: ".65rem", color: "#3d5c78", marginTop: 4 }}>{stocks.length} stocks</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Movers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Rising */}
        <div style={panel}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 14 }}>
            ▲ Rising Today · Grade A
          </div>
          {loading ? <div style={{ color: "#3d5c78", fontSize: ".8rem" }}>Loading…</div> :
          rising.length === 0 ? <div style={{ color: "#3d5c78", fontSize: ".8rem" }}>No data yet</div> :
          rising.map(s => (
            <div key={s.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
              <div>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".88rem", fontWeight: 700, color: "#00dc82" }}>{s.symbol}</span>
                <span style={{ fontSize: ".7rem", color: "#3d5c78", marginLeft: 8 }}>{COMPANY_NAMES[s.symbol] || ""}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".88rem", fontWeight: 700, color: "#00dc82" }}>
                  +{s.changePercent?.toFixed(2)}%
                </div>
                <div style={{ fontSize: ".65rem", color: "#3d5c78" }}>${s.price?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Falling */}
        <div style={panel}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 14 }}>
            ▼ Falling Today · Grade A
          </div>
          {loading ? <div style={{ color: "#3d5c78", fontSize: ".8rem" }}>Loading…</div> :
          falling.length === 0 ? <div style={{ color: "#3d5c78", fontSize: ".8rem" }}>No data yet</div> :
          falling.map(s => (
            <div key={s.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
              <div>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".88rem", fontWeight: 700, color: "#ff3c50" }}>{s.symbol}</span>
                <span style={{ fontSize: ".7rem", color: "#3d5c78", marginLeft: 8 }}>{COMPANY_NAMES[s.symbol] || ""}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".88rem", fontWeight: 700, color: "#ff3c50" }}>
                  {s.changePercent?.toFixed(2)}%
                </div>
                <div style={{ fontSize: ".65rem", color: "#3d5c78" }}>${s.price?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      {news.length > 0 && (
        <div style={panel}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 14 }}>
            📰 News Today · Grade A Stocks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {news.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", gap: "1rem", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.04)", textDecoration: "none", color: "inherit" }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", fontWeight: 700, color: "#22D3EE", flexShrink: 0, paddingTop: 2 }}>
                  {n.tickers?.[0] || ""}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".88rem", fontWeight: 600, color: "#dce8f4", lineHeight: 1.4, marginBottom: 3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "#3d5c78" }}>{n.publisher} · {new Date(n.publishedDate || n.published_utc).toLocaleDateString()}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Trade Plan */}
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#3d5c78" }}>
            📋 My Trade Plan · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {planSaved && <span style={{ fontSize: ".72rem", color: "#00dc82", fontWeight: 700 }}>✓ Saved</span>}
        </div>
        <textarea
          value={plan}
          onChange={e => setPlan(e.target.value)}
          onBlur={() => savePlan(plan)}
          placeholder={"Write your trade plan for today...\n\nWhat am I watching?\nWhat are my entry targets?\nWhat are my exit targets?\nWhat's my risk on each position?"}
          style={{
            width: "100%", minHeight: 180, background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 12,
            color: "#dce8f4", fontFamily: "inherit", fontSize: ".88rem",
            lineHeight: 1.7, padding: "14px 16px", outline: "none", resize: "vertical",
            transition: "border-color .2s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(0,180,255,.35)"}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => savePlan(plan)} style={{
            background: "rgba(0,180,255,.12)", border: "1px solid rgba(0,180,255,.3)",
            borderRadius: 8, color: "#00b4ff", cursor: "pointer", fontFamily: "inherit",
            fontSize: ".78rem", fontWeight: 700, padding: "8px 18px",
          }}>
            Save Plan
          </button>
        </div>
      </div>

    </div>
  );
}
