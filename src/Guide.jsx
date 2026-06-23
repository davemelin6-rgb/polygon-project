export default function Guide() {

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

  const divider = <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />;

  const scoreCard = (label, color, desc, detail) => (
    <div key={label} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      <div style={{
        flexShrink: 0, width: 64, height: 44, borderRadius: 12,
        background: color + "18", border: `1px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Space Mono',monospace", fontSize: ".72rem", fontWeight: 700, color,
        letterSpacing: ".06em",
      }}>
        {label}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#dce8f4", marginBottom: 6 }}>{desc}</div>
        <p style={{ fontSize: ".88rem", color: "#6a8aac", lineHeight: 1.75, margin: 0 }}>{detail}</p>
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

      {/* The 4 Scores */}
      <div style={{ background: "rgba(8,14,24,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1.25rem" }}>
          The 4 Scores (0–100)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
          {scoreCard("MOM · Momentum", "#00dc82",
            "Is the market moving on it?",
            "Measures price trend strength using 6-month and 3-month returns, moving average direction, and relative volume. VIX-adjusted — high fear dampens the signal. Fully historical and back-tested."
          )}
          {scoreCard("RISK · Balance Sheet", "#f59e0b",
            "Can the company survive a downturn?",
            "Analyses debt/equity ratio, liquidity, interest coverage, cash runway, and price volatility. Higher = safer. Acts as a floor — we use it to filter out companies that cannot survive, not as a primary return driver."
          )}
          {scoreCard("TECH · Technology Quality", "#00b4ff",
            "How good is the existing business?",
            "Measures gross margin, R&D intensity, net margin, revenue growth, FCF margin, and ROE. Sector-normalised — semiconductors are benchmarked against semiconductors, not software. Best for profitable or near-profitable companies."
          )}
          {scoreCard("INNOV · Innovation Score", "#8b5cf6",
            "Is the technology investment paying off?",
            "Built specifically for pre-profit growth companies — AI, quantum, biotech, defence. Measures R&D intensity (is the company seriously investing?), R&D productivity (is R&D converting to revenue?), revenue acceleration (is adoption speeding up?), gross margin trajectory, and analyst conviction. A company with no profit can still score high here."
          )}
        </div>
      </div>

      {/* Signal */}
      <div style={{ background: "rgba(8,14,24,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1rem" }}>
          The Signal Score &amp; Grade
        </div>
        <p style={{ fontSize: ".88rem", color: "#6a8aac", lineHeight: 1.75, margin: "0 0 1.25rem" }}>
          The Signal combines all four scores into one number: <span style={{ color: "#dce8f4", fontWeight: 700 }}>MOM 45% + INNOV 30% + TECH 15% + RISK 10%</span>. Momentum leads because price confirms thesis. Innovation anchors whether the technology justifies the move. Tech and Risk provide quality filters.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
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

      {/* Steps */}
      <div style={{ background: "rgba(8,14,24,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1.5rem" }}>
          The 5-Step Process
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {step("1", "Find Grade A stocks",
            "Open any sector on the Dashboard → Sectors tab. Look for stocks with a Grade A signal — score above 70. That is the threshold where the model has historically shown the strongest outcomes. Grade B is watch-and-wait. Grade C and D are avoid.",
            "#00dc82")}

          {divider}

          {step("2", "Check all 4 scores individually",
            "Click the stock to open Analysis. You want MOM high (momentum confirmed), RISK above 35 (balance sheet survivable), and INNOV high (technology investment is paying off). For profitable companies, also check TECH. A high Signal with a very low RISK is a yellow flag — the company might not survive a downturn.",
            "#00b4ff")}

          {divider}

          {step("3", "Check the Market Condition",
            "Go to Market Intel tab. If it shows FAVORABLE or NEUTRAL — proceed. If CAUTION — reduce your position size. If RISK-OFF or CRISIS — wait. The best stock in a bad market still goes down.",
            "#f59e0b")}

          {divider}

          {step("4", "Hold for 90 days",
            "This is a 90-day conviction signal. Short-term volatility in the first 30 days is normal and expected. The model is validated on 90-day outcomes. Do not react to short-term noise. If the signal holds, the process holds.",
            "#8b5cf6")}

          {divider}

          {step("5", "Watch for score alerts — not prices",
            "Enable Score Alerts in Settings. If something meaningful changes — momentum drops sharply, RISK score deteriorates, Signal breaks grade — you will be notified. That is your exit signal. Watching the price every day is not the process.",
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
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.8rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>+24.59%</div>
          <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 4, fontFamily: "'Space Mono',monospace" }}>avg 90d · Grade A</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.8rem", fontWeight: 700, color: "#00dc82", lineHeight: 1 }}>72.7%</div>
          <div style={{ fontSize: ".7rem", color: "#3d5c78", marginTop: 4, fontFamily: "'Space Mono',monospace" }}>win rate · Grade A · 90d</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: 0, fontSize: ".85rem", color: "#4a6a88", lineHeight: 1.7 }}>
            Measured historical outcomes across 1,344 data points across 65 stocks — not projections. The back-test runs every Sunday and updates automatically. If the model drifts, we catch it and adjust.
          </p>
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
