import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  if (v >= 65)   return "#00dc82";
  if (v >= 40)   return "#f59e0b";
  return "#ff3c50";
}

function ScoreBar({ label, value, color }) {
  const c = color || scoreColor(value);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 36px", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#3d5c78" }}>{label}</span>
      <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: c, width: value != null ? `${value}%` : "0%", transition: "width .8s ease", boxShadow: `0 0 6px ${c}44` }} />
      </div>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", fontWeight: 700, color: c, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

function getVerdict(signal) {
  if (signal == null) return { label: "NO DATA", color: "#2d4a5f", grade: "—" };
  if (signal >= 70)   return { label: "STRONG SIGNAL", color: "#00dc82", grade: "A" };
  if (signal >= 55)   return { label: "WATCH",         color: "#22D3EE", grade: "B" };
  if (signal >= 40)   return { label: "MIXED",         color: "#f59e0b", grade: "C" };
  return               { label: "AVOID",           color: "#ff3c50", grade: "D" };
}

export default function Portfolio({ session }) {
  const [portfolioTickers, setPortfolioTickers] = useState([]);
  const [input,   setInput]   = useState("");
  const [scores,  setScores]  = useState({});
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);

  // Load saved portfolio
  useEffect(() => {
    if (!session) return;
    supabase.from("user_watchlists")
      .select("tickers")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.tickers) {
          const saved = data.tickers.split(",").map(t => t.trim()).filter(Boolean);
          setPortfolioTickers(saved);
        }
      });
  }, [session]);

  // Fetch scores whenever portfolio changes
  const fetchScores = useCallback(async () => {
    if (!portfolioTickers.length) return;
    setLoading(true);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    try {
      const res = await fetch(`/api/scores?tickers=${encodeURIComponent(portfolioTickers.join(","))}`, { headers });
      const json = await res.json();
      const map = {};
      for (const s of json.scores || []) map[s.symbol] = s;
      setScores(map);
    } catch {}
    setLoading(false);
  }, [portfolioTickers, session]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  // Save portfolio to Supabase
  async function savePortfolio(tickers) {
    if (!session) return;
    setSaving(true);
    await supabase.from("user_watchlists").upsert({
      user_id:    session.user.id,
      tickers:    tickers.join(","),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
  }

  function addTicker() {
    const t = input.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
    if (!t || portfolioTickers.includes(t) || portfolioTickers.length >= 20) return;
    const updated = [...portfolioTickers, t];
    setPortfolioTickers(updated);
    savePortfolio(updated);
    setInput("");
  }

  function removeTicker(t) {
    const updated = portfolioTickers.filter(x => x !== t);
    setPortfolioTickers(updated);
    savePortfolio(updated);
  }

  // Aggregate scores — equal weighting
  const scoredTickers = portfolioTickers.filter(t => scores[t]?.momentum != null);
  const avg = (key) => {
    const vals = portfolioTickers.map(t => scores[t]?.[key]).filter(v => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const portfolioMomentum  = avg("momentum");
  const portfolioRisk      = avg("risk");
  const portfolioTechValue = avg("techValue");
  const portfolioSignal    = avg("signal");
  const verdict            = getVerdict(portfolioSignal);

  // Best and worst contributors
  const ranked = portfolioTickers
    .filter(t => scores[t]?.signal != null)
    .sort((a, b) => (scores[b].signal ?? 0) - (scores[a].signal ?? 0));
  const strongest = ranked[0];
  const weakest   = ranked[ranked.length - 1];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* Portfolio builder */}
      <section className="panel" style={{ marginBottom: "1.25rem" }}>
        <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
          <div className="panel-eyebrow">My Portfolio · {portfolioTickers.length} stocks</div>
          <h2 className="panel-title">Portfolio Builder</h2>
        </div>

        {/* Add ticker */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,""))}
            onKeyDown={e => e.key === "Enter" && addTicker()}
            placeholder="Add ticker — e.g. NVDA"
            maxLength={10}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontFamily: "'Space Mono',monospace", fontSize: ".95rem", padding: "0.75rem 1rem", outline: "none" }}
          />
          <button
            onClick={addTicker}
            style={{ background: "linear-gradient(135deg,rgba(0,120,220,.9),rgba(0,80,170,.9))", border: "1px solid rgba(0,180,255,.3)", borderRadius: 10, color: "#e2f4ff", cursor: "pointer", fontFamily: "inherit", fontSize: ".8rem", fontWeight: 700, letterSpacing: ".1em", padding: "0.75rem 1.5rem", textTransform: "uppercase", whiteSpace: "nowrap" }}
          >
            + Add
          </button>
        </div>

        {/* Ticker chips */}
        {portfolioTickers.length === 0 ? (
          <p style={{ color: "#2a4060", fontSize: ".88rem" }}>No stocks yet — add tickers above to build your portfolio.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {portfolioTickers.map(t => {
              const sc  = scores[t];
              const sig = sc?.signal ?? null;
              const c   = scoreColor(sig);
              return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 999, padding: "0.35rem 0.75rem 0.35rem 1rem" }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: "#c8d8e8" }}>{t}</span>
                  {sig != null && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: c, fontWeight: 700 }}>{sig}</span>}
                  <button onClick={() => removeTicker(t)} style={{ background: "none", border: "none", color: "#2a4060", cursor: "pointer", fontSize: ".9rem", padding: "0 2px", lineHeight: 1 }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
        {saving && <p style={{ color: "#2a4060", fontSize: ".75rem", marginTop: "0.75rem" }}>Saving…</p>}
      </section>

      {/* Portfolio score */}
      {portfolioTickers.length > 0 && (
        <section className="panel" style={{ marginBottom: "1.25rem" }}>
          <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
            <div className="panel-eyebrow">Aggregate Score · Equal Weighted</div>
            <h2 className="panel-title">Portfolio Score</h2>
          </div>

          {loading ? (
            <p style={{ color: "#2a4060", fontSize: ".85rem" }}>Calculating scores…</p>
          ) : (
            <>
              {/* Verdict */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", background: `${verdict.color}0e`, border: `1px solid ${verdict.color}35`, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "2.5rem", fontWeight: 700, color: verdict.color, width: 60, height: 60, borderRadius: 12, border: `2px solid ${verdict.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {verdict.grade}
                </div>
                <div>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: verdict.color, marginBottom: 4 }}>{verdict.label}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#c8d8e8" }}>
                    Portfolio Signal: <span style={{ color: verdict.color }}>{portfolioSignal ?? "—"}</span>/100
                  </div>
                  <div style={{ fontSize: ".78rem", color: "#3d5c78", marginTop: 4 }}>
                    Based on {scoredTickers.length} of {portfolioTickers.length} scored stocks · equal weighting
                  </div>
                </div>
              </div>

              {/* Score bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                <ScoreBar label="Momentum"  value={portfolioMomentum}  />
                <ScoreBar label="Risk"      value={portfolioRisk}      />
                <ScoreBar label="Tech Value" value={portfolioTechValue} />
              </div>

              {/* Best / worst */}
              {strongest && weakest && strongest !== weakest && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "rgba(0,220,130,0.05)", border: "1px solid rgba(0,220,130,0.2)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#00dc82", marginBottom: 6 }}>Strongest holding</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#c8d8e8" }}>{strongest}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", color: "#00dc82", marginTop: 3 }}>Signal {scores[strongest]?.signal ?? "—"}/100</div>
                  </div>
                  <div style={{ background: "rgba(255,60,80,0.05)", border: "1px solid rgba(255,60,80,0.2)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#ff3c50", marginBottom: 6 }}>Weakest holding</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: "#c8d8e8" }}>{weakest}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", color: "#ff3c50", marginTop: 3 }}>Signal {scores[weakest]?.signal ?? "—"}/100</div>
                  </div>
                </div>
              )}

              {/* Per-stock breakdown */}
              <div style={{ marginTop: "2rem" }}>
                <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1rem" }}>Holdings Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {portfolioTickers.map(t => {
                    const sc  = scores[t];
                    const sig = sc?.signal ?? null;
                    const c   = scoreColor(sig);
                    return (
                      <div key={t} style={{ display: "grid", gridTemplateColumns: "80px 1fr 48px 48px 48px 56px", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: "#5a7a9a" }}>{t}</span>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: c, width: sig != null ? `${sig}%` : "0%" }} />
                        </div>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#00dc82", textAlign: "right" }}>{sc?.momentum ?? "—"}</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#f59e0b", textAlign: "right" }}>{sc?.risk ?? "—"}</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#8b5cf6", textAlign: "right" }}>{sc?.techValue ?? "—"}</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: c, textAlign: "right" }}>{sig ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", paddingLeft: "0.75rem" }}>
                  {[["MOM","#00dc82"],["RISK","#f59e0b"],["TECH","#8b5cf6"],["SIG","#00b4ff"]].map(([l,c]) => (
                    <span key={l} style={{ fontSize: ".62rem", color: c, fontWeight: 700, letterSpacing: ".1em" }}>{l}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
