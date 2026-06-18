export default function Guide() {
  const panel = (children) => ({
    background: "rgba(8,14,24,0.85)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "2rem",
    backdropFilter: "blur(16px)",
    ...children,
  });

  const step = (num, title, body, color = "#00b4ff") => (
    <div key={num} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      <div style={{
        flexShrink: 0, width: 44, height: 44, borderRadius: 12,
        background: color + "18", border: `1px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Space Mono',monospace", fontSize: "1rem", fontWeight: 700, color,
      }}>
        {num}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#dce8f4", marginBottom: 6 }}>{title}</div>
        <p style={{ fontSize: ".88rem", color: "#6a8aac", lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#00b4ff", marginBottom: 10 }}>
          How to use QuantDiver
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#dce8f4", letterSpacing: "-.02em", margin: "0 0 12px" }}>
          The QuantDiver Method
        </h2>
        <p style={{ fontSize: ".92rem", color: "#4a6a88", lineHeight: 1.75, maxWidth: 560 }}>
          Five steps. Repeatable on any stock, any sector, any time. Follow the process — let the model do the analysis.
        </p>
      </div>

      {/* Steps */}
      <div style={{ background: "rgba(8,14,24,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {step("1", "Find Grade A stocks",
            "Open any sector on the Dashboard. You are looking for stocks with a Grade A signal — score above 70. That is the threshold where our model has historically shown the strongest outcomes. Grade B, C, and D are either watch-and-wait or avoid.",
            "#00dc82")}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          {step("2", "Check the Signal Breakdown",
            "Click the stock. Scroll to Advanced Risk Assessment. Look at the Signal Breakdown — Runway, Growth, Dilution, Valuation. You want at least three green signals. One critical red flag (very short runway, high dilution, expensive valuation with no growth) is enough reason to skip regardless of the overall score.",
            "#00b4ff")}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          {step("3", "Check the Market Condition",
            "Look at the Market Condition panel on your Dashboard. If it shows FAVORABLE or NEUTRAL — proceed. If it shows CAUTION — reduce your conviction and size down. If it shows RISK-OFF or CRISIS — wait. The best stock in a bad market still goes down. The model accounts for this, but your sizing should too.",
            "#f59e0b")}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          {step("4", "Hold for 90 days",
            "This is a 90-day conviction signal — not a day trade. Short-term volatility in the first 30 days is normal and expected. The model is validated on 90-day outcomes, not weekly price moves. Do not react to short-term noise. If the signal holds, the process holds.",
            "#8b5cf6")}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          {step("5", "Watch for alerts — not prices",
            "Enable Score Alerts in Settings. If something meaningful changes in the model — momentum drops sharply, risk score deteriorates, signal breaks — you will be notified before it becomes a problem. That is your exit signal. Checking the price every day is not the process.",
            "#22D3EE")}

        </div>
      </div>

      {/* The proof */}
      <div style={{
        background: "rgba(0,180,255,.06)", border: "1px solid rgba(0,180,255,.18)",
        borderRadius: 14, padding: "1.5rem 1.75rem", marginBottom: "1.5rem",
        display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap",
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.8rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>+29.3%</div>
          <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 4, fontFamily: "'Space Mono',monospace" }}>avg 90d · Grade A</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.8rem", fontWeight: 700, color: "#ff3c50", lineHeight: 1 }}>-1.79%</div>
          <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 4, fontFamily: "'Space Mono',monospace" }}>avg 90d · Grade D</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: 0, fontSize: ".85rem", color: "#4a6a88", lineHeight: 1.7 }}>
            These are measured historical outcomes across 1,029 data points — not projections. The back-test runs every Sunday and updates automatically. If the model drifts, we adjust it.
          </p>
        </div>
      </div>

      {/* What the scores mean */}
      <div style={{ background: "rgba(8,14,24,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1.25rem" }}>
          Score reference
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { grade: "A", range: "70–100", label: "STRONG · 90D", color: "#00dc82", desc: "High conviction. All or most signals align. Act." },
            { grade: "B", range: "55–70",  label: "WATCH · 90D",  color: "#22D3EE", desc: "Some positives but incomplete. Watch for confirmation." },
            { grade: "C", range: "40–55",  label: "MIXED · 90D",  color: "#f59e0b", desc: "No clear edge. Wait for a cleaner setup." },
            { grade: "D", range: "0–40",   label: "AVOID · 90D",  color: "#ff3c50", desc: "Multiple weak signals. Stay on the sidelines." },
          ].map(s => (
            <div key={s.grade} style={{ display: "grid", gridTemplateColumns: "36px 60px 140px 1fr", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.grade}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#3d5c78" }}>{s.range}</div>
              <div style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: s.color }}>{s.label}</div>
              <div style={{ fontSize: ".82rem", color: "#4a6a88" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: ".75rem", color: "#1e3048", lineHeight: 1.8, textAlign: "center" }}>
        QuantDiver scores and signals are for informational purposes only and do not constitute financial advice.
        Past back-test performance does not guarantee future results. Always conduct your own research before making investment decisions.
      </p>

    </div>
  );
}
