import { useState, useEffect } from "react";

const GRADE_COLORS = { A: "#00dc82", B: "#22D3EE", C: "#f59e0b", D: "#ff3c50" };

function scoreColor(v) {
  if (v == null) return "#3d5c78";
  return v > 0 ? "#00dc82" : "#ff3c50";
}

export default function ForwardValidation({ session }) {
  const [days,    setDays]    = useState(30);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);
    setData(null);
    fetch(`/api/forward-validation?days=${days}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days, session]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#00b4ff", marginBottom: 8 }}>
          Forward Validation · Predictions vs Reality
        </div>
        <p style={{ fontSize: ".88rem", color: "#4a6a88", lineHeight: 1.65, margin: "0 0 1.25rem" }}>
          Scores recorded on a specific date — without knowing the future. We now check what actually happened.
          This is the only honest model test.
        </p>

        {/* Day selector */}
        <div style={{ display: "flex", gap: 8 }}>
          {[30, 60, 90, 180].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "5px 16px", borderRadius: 999, fontFamily: "inherit",
                fontSize: ".78rem", fontWeight: 600, cursor: "pointer",
                background: days === d ? "rgba(0,180,255,.12)" : "rgba(255,255,255,.03)",
                border: `1px solid ${days === d ? "rgba(0,180,255,.4)" : "rgba(255,255,255,.08)"}`,
                color: days === d ? "#00b4ff" : "#4a6a88",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ color: "#3d5c78", fontSize: ".85rem", padding: "2rem 0" }}>Loading predictions…</div>
      )}

      {!loading && data?.message && (
        <div style={{
          background: "rgba(0,180,255,.06)", border: "1px solid rgba(0,180,255,.18)",
          borderRadius: 14, padding: "1.5rem 1.75rem",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 700, color: "#dce8f4", marginBottom: 6 }}>Building prediction history</div>
          <p style={{ margin: 0, fontSize: ".85rem", color: "#4a6a88", lineHeight: 1.65 }}>{data.message}</p>
          <div style={{ marginTop: "1rem", fontSize: ".78rem", color: "#3d5c78" }}>
            Scores recorded today → check back in {days} days for {days}d validation data.
          </div>
        </div>
      )}

      {!loading && data?.summary && data.summary.some(s => s.count > 0) && <>

        {/* Grade summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "1.5rem" }}>
          {data.summary.map(s => (
            <div key={s.grade} style={{
              background: "rgba(255,255,255,.025)",
              border: `1px solid ${GRADE_COLORS[s.grade]}30`,
              borderTop: `3px solid ${GRADE_COLORS[s.grade]}`,
              borderRadius: 12, padding: "1rem",
            }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.4rem", fontWeight: 700, color: GRADE_COLORS[s.grade] }}>
                {s.grade}
              </div>
              <div style={{ fontSize: ".68rem", color: "#3d5c78", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                Grade {s.grade} · {s.count} predictions
              </div>
              {s.avgReturn != null ? <>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.25rem", fontWeight: 700, color: scoreColor(s.avgReturn) }}>
                  {s.avgReturn > 0 ? "+" : ""}{s.avgReturn}%
                </div>
                <div style={{ fontSize: ".72rem", color: "#3d5c78", marginTop: 2 }}>avg {days}d return</div>
                {s.winRate != null && (
                  <div style={{ fontSize: ".72rem", color: "#4a6a88", marginTop: 6 }}>
                    {s.winRate}% win rate
                  </div>
                )}
                {s.bestPick && (
                  <div style={{ fontSize: ".68rem", color: "#3d5c78", marginTop: 4 }}>
                    Best: <span style={{ color: GRADE_COLORS[s.grade], fontWeight: 700 }}>{s.bestPick}</span> {s.bestReturn > 0 ? "+" : ""}{s.bestReturn}%
                  </div>
                )}
              </> : (
                <div style={{ fontSize: ".78rem", color: "#2d4a5f" }}>No data yet</div>
              )}
            </div>
          ))}
        </div>

        {/* Individual predictions table */}
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 8 }}>
          All predictions — {data.predictionDate}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "52px 70px 60px 80px 80px 80px 80px", gap: "0 1rem", padding: "6px 12px", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#2d4a5f" }}>
            <span>Grade</span><span>Ticker</span><span>Signal</span><span>Pred. Price</span><span>Now</span><span>Return</span><span>Result</span>
          </div>
          {data.predictions.map(p => (
            <div key={p.symbol} style={{
              display: "grid", gridTemplateColumns: "52px 70px 60px 80px 80px 80px 80px",
              gap: "0 1rem", padding: "8px 12px",
              borderTop: "1px solid rgba(255,255,255,.04)",
              alignItems: "center",
            }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: ".88rem", color: GRADE_COLORS[p.grade] }}>
                {p.grade}
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: "#dce8f4" }}>
                {p.symbol}
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", color: "#5a7a9a" }}>
                {p.signal ?? "—"}
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", color: "#4a6a88" }}>
                {p.predictionPrice ? `$${p.predictionPrice}` : "—"}
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", color: "#8aaec8" }}>
                {p.currentPrice ? `$${p.currentPrice}` : "—"}
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: scoreColor(p.returnPct) }}>
                {p.returnPct != null ? `${p.returnPct > 0 ? "+" : ""}${p.returnPct}%` : "—"}
              </span>
              <span style={{ fontSize: ".75rem", fontWeight: 700 }}>
                {p.won === true ? <span style={{ color: "#00dc82" }}>✓ WIN</span>
                 : p.won === false ? <span style={{ color: "#ff3c50" }}>✗ LOSS</span>
                 : <span style={{ color: "#2d4a5f" }}>PENDING</span>}
              </span>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
