import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const GRADE_COLORS = { A: "#00dc82", B: "#22D3EE", C: "#f59e0b", D: "#ff3c50" };
const GRADE_LABELS = { A: "STRONG · 180D", B: "WATCH · 180D", C: "MIXED · 180D", D: "AVOID · 180D" };

const COMPANY_NAMES = {
  NVDA:"NVIDIA", AMD:"Advanced Micro Devices", META:"Meta Platforms", MSFT:"Microsoft",
  GOOGL:"Alphabet", AMZN:"Amazon", PLTR:"Palantir", IBM:"IBM", AI:"C3.ai", SOUN:"SoundHound",
  SMCI:"Super Micro Computer", ORCL:"Oracle", CRM:"Salesforce", NOW:"ServiceNow",
  SNOW:"Snowflake", MDB:"MongoDB", DDOG:"Datadog", NET:"Cloudflare", PATH:"UiPath",
  BBAI:"BigBear.ai", UPST:"Upstart", ANET:"Arista Networks", CRWD:"CrowdStrike",
  ZS:"Zscaler", AVGO:"Broadcom", MRVL:"Marvell Technology", QCOM:"Qualcomm", TSM:"TSMC",
  IONQ:"IonQ", RGTI:"Rigetti Computing", QUBT:"Quantum Computing", QBTS:"D-Wave Quantum",
  ARQQ:"Arqit Quantum", HON:"Honeywell", INTC:"Intel", ONTO:"Onto Innovation",
  LMT:"Lockheed Martin", RTX:"RTX Corporation", NOC:"Northrop Grumman", GD:"General Dynamics",
  BA:"Boeing", HII:"Huntington Ingalls", LHX:"L3Harris", KTOS:"Kratos Defense",
  AXON:"Axon Enterprise", AVAV:"AeroVironment", RKLB:"Rocket Lab", ASTS:"AST SpaceMobile",
  LDOS:"Leidos", SAIC:"Sci Applications", BAH:"Booz Allen", IRDM:"Iridium", VSAT:"Viasat",
  LLY:"Eli Lilly", NVO:"Novo Nordisk", ABBV:"AbbVie", BMY:"Bristol-Myers", AMGN:"Amgen",
  GILD:"Gilead", BIIB:"Biogen", REGN:"Regeneron", VRTX:"Vertex Pharma", MRNA:"Moderna",
  ALNY:"Alnylam", CRSP:"CRISPR Therapeutics", EDIT:"Editas", BEAM:"Beam Therapeutics",
  ISRG:"Intuitive Surgical", DXCM:"Dexcom", ILMN:"Illumina", MDT:"Medtronic", ABT:"Abbott",
  SYK:"Stryker", HOLX:"Hologic", MU:"Micron", ASML:"ASML Holding", TXN:"Texas Instruments",
  AMAT:"Applied Materials", LRCX:"Lam Research", KLAC:"KLA Corp", TER:"Teradyne",
  ADI:"Analog Devices", NXPI:"NXP Semi", ON:"ON Semiconductor", MPWR:"Monolithic Power",
  WOLF:"Wolfspeed", AMBA:"Ambarella", AAPL:"Apple", TSLA:"Tesla",
};

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  return v >= 65 ? "#00dc82" : v >= 40 ? "#f59e0b" : "#ff3c50";
}

export default function GradePortfolioPanel({ session }) {
  const [stocks,   setStocks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState("A");

  useEffect(() => {
    supabase
      .from("scores")
      .select("symbol, signal, momentum, risk, tech_value, tech_demand, innovation, sentiment, price")
      .order("signal", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setStocks(data || []);
        setLoading(false);
      });
  }, []);

  function getGrade(sig) {
    if (sig == null) return "D";
    if (sig >= 63) return "A";
    if (sig >= 48) return "B";
    if (sig >= 35) return "C";
    return "D";
  }

  const gradeStocks = {
    A: stocks.filter(s => getGrade(s.signal) === "A"),
    B: stocks.filter(s => getGrade(s.signal) === "B"),
    C: stocks.filter(s => getGrade(s.signal) === "C"),
    D: stocks.filter(s => getGrade(s.signal) === "D"),
  };

  const avgSignal = gradeStocks[selected].length
    ? Math.round(gradeStocks[selected].reduce((s, x) => s + (x.signal ?? 0), 0) / gradeStocks[selected].length)
    : null;
  const avgMom = gradeStocks[selected].filter(s => s.momentum != null).length
    ? Math.round(gradeStocks[selected].reduce((s, x) => s + (x.momentum ?? 0), 0) / gradeStocks[selected].filter(s => s.momentum != null).length)
    : null;

  return (
    <section className="panel">
      <div className="panel-header" style={{ marginBottom: "1.25rem" }}>
        <div className="panel-eyebrow">QuantDiver Universe · Grade Distribution</div>
        <h2 className="panel-title">Grade Portfolio vs Index</h2>
      </div>

      {/* Validated benchmark callout */}
      <div style={{
        background: "rgba(0,220,130,.06)", border: "1px solid rgba(0,220,130,.2)",
        borderRadius: 12, padding: "16px 20px", marginBottom: "1.5rem",
        display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>+12.69%</div>
          <div style={{ fontSize: ".68rem", color: "#3d5c78", marginTop: 3 }}>Grade A alpha vs S&P 500</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>+10.53%</div>
          <div style={{ fontSize: ".68rem", color: "#3d5c78", marginTop: 3 }}>Grade A alpha vs QQQ</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: "#22D3EE", lineHeight: 1 }}>8.23</div>
          <div style={{ fontSize: ".68rem", color: "#3d5c78", marginTop: 3 }}>t-statistic (statistically proven)</div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ margin: 0, fontSize: ".78rem", color: "#4a6a88", lineHeight: 1.6 }}>
            Validated over 3,136 back-tested samples. Grade A stocks outperformed the S&P 500 in the same time windows — not random, not projected.
          </p>
        </div>
      </div>

      {/* Grade selector + counts */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["A","B","C","D"].map(g => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10, cursor: "pointer",
              border: `1px solid ${selected === g ? GRADE_COLORS[g] + "60" : "rgba(255,255,255,.07)"}`,
              background: selected === g ? GRADE_COLORS[g] + "15" : "rgba(255,255,255,.02)",
              fontFamily: "inherit", transition: "all .15s",
            }}
          >
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "1rem", fontWeight: 700, color: GRADE_COLORS[g] }}>{g}</span>
            <span style={{ fontSize: ".72rem", color: selected === g ? GRADE_COLORS[g] : "#3d5c78" }}>
              {GRADE_LABELS[g]}
            </span>
            <span style={{
              background: GRADE_COLORS[g] + "20", borderRadius: 999,
              padding: "1px 8px", fontFamily: "'Space Mono',monospace",
              fontSize: ".65rem", fontWeight: 700, color: GRADE_COLORS[g],
            }}>
              {gradeStocks[g].length}
            </span>
          </button>
        ))}
      </div>

      {/* Aggregate stats for selected grade */}
      {gradeStocks[selected].length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: "1.25rem" }}>
          {[
            { label: "Stocks", value: gradeStocks[selected].length, color: GRADE_COLORS[selected] },
            { label: "Avg Signal", value: avgSignal, color: GRADE_COLORS[selected] },
            { label: "Avg Momentum", value: avgMom, color: scoreColor(avgMom) },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,.025)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.2rem", fontWeight: 700, color: s.color }}>{s.value ?? "—"}</div>
              <div style={{ fontSize: ".65rem", color: "#3d5c78", marginTop: 3, letterSpacing: ".08em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stock list */}
      {loading ? (
        <div style={{ color: "#3d5c78", fontSize: ".82rem", padding: "1rem 0" }}>Loading scores…</div>
      ) : gradeStocks[selected].length === 0 ? (
        <div style={{ color: "#3d5c78", fontSize: ".82rem" }}>No stocks at Grade {selected} right now.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {gradeStocks[selected].map((s, i) => (
            <div key={s.symbol} style={{
              display: "grid", gridTemplateColumns: "28px 140px 1fr 44px",
              alignItems: "center", gap: "1rem", padding: "9px 4px",
              borderBottom: "1px solid rgba(255,255,255,.04)",
            }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".65rem", color: "#2d4a5f" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: GRADE_COLORS[selected] }}>
                  {s.symbol}
                </div>
                <div style={{ fontSize: ".65rem", color: "#3d5c78", marginTop: 1 }}>
                  {COMPANY_NAMES[s.symbol] || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {[
                  { label: "MOM", value: s.momentum },
                  { label: "RISK", value: s.risk },
                  { label: "TECH", value: s.tech_value },
                  { label: "DEMAND", value: s.tech_demand },
                ].map(sc => (
                  <div key={sc.label} style={{ textAlign: "center", minWidth: 36 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".7rem", fontWeight: 700, color: scoreColor(sc.value) }}>
                      {sc.value ?? "—"}
                    </div>
                    <div style={{ fontSize: ".52rem", color: "#2d4a5f", letterSpacing: ".06em" }}>{sc.label}</div>
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".9rem", fontWeight: 700, color: GRADE_COLORS[selected], textAlign: "right" }}>
                {s.signal ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
