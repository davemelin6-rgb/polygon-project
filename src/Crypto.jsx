import { useState, useEffect, useCallback } from "react";

const CRYPTOS = [
  { symbol: "X:BTCUSD",  name: "Bitcoin",   abbr: "BTC",  color: "#F7931A" },
  { symbol: "X:ETHUSD",  name: "Ethereum",  abbr: "ETH",  color: "#627EEA" },
  { symbol: "X:SOLUSD",  name: "Solana",    abbr: "SOL",  color: "#9945FF" },
  { symbol: "X:XRPUSD",  name: "XRP",       abbr: "XRP",  color: "#00AAE4" },
  { symbol: "X:BNBUSD",  name: "BNB",       abbr: "BNB",  color: "#F3BA2F" },
  { symbol: "X:ADAUSD",  name: "Cardano",   abbr: "ADA",  color: "#0033AD" },
  { symbol: "X:AVAXUSD", name: "Avalanche", abbr: "AVAX", color: "#E84142" },
  { symbol: "X:DOGEUSD", name: "Dogecoin",  abbr: "DOGE", color: "#C2A633" },
  { symbol: "X:DOTUSD",  name: "Polkadot",  abbr: "DOT",  color: "#E6007A" },
  { symbol: "X:LINKUSD", name: "Chainlink", abbr: "LINK", color: "#375BD2" },
];

function fmtPrice(n) {
  if (n == null) return "—";
  if (n >= 1000)  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1)     return "$" + Number(n).toFixed(2);
  return "$" + Number(n).toFixed(4);
}

function fmtPct(n) {
  if (n == null) return "—";
  return (n >= 0 ? "▲ +" : "▼ ") + Math.abs(n).toFixed(2) + "%";
}

function scoreColor(v) {
  if (v == null) return "#2d4a5f";
  if (v >= 65)   return "#00dc82";
  if (v >= 40)   return "#f59e0b";
  return "#ff3c50";
}

function getGrade(signal) {
  if (signal == null) return { grade: "—", label: "NO DATA",      color: "#2d4a5f" };
  if (signal >= 70)   return { grade: "A", label: "STRONG · 90D", color: "#00dc82" };
  if (signal >= 55)   return { grade: "B", label: "WATCH · 90D",  color: "#22D3EE" };
  if (signal >= 40)   return { grade: "C", label: "MIXED · 90D",  color: "#f59e0b" };
  return               { grade: "D", label: "AVOID · 90D",  color: "#ff3c50" };
}

function ScoreBar({ label, value }) {
  const color = scoreColor(value);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "46px 1fr 34px", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#3d5c78" }}>{label}</span>
      <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: value != null ? `${value}%` : "0%", transition: "width .8s ease" }} />
      </div>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".75rem", fontWeight: 700, color, textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function CryptoCard({ crypto, price, changePercent, scores }) {
  const positive = (changePercent ?? 0) >= 0;
  const verdict  = getGrade(scores?.signal);

  return (
    <div style={{
      background: "rgba(8,14,24,0.85)",
      border: `1px solid rgba(255,255,255,0.07)`,
      borderLeft: `3px solid ${positive ? "rgba(0,220,130,0.7)" : "rgba(255,60,80,0.7)"}`,
      borderRadius: 16, padding: "1.5rem 1.4rem",
      backdropFilter: "blur(16px)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: crypto.color + "22", border: `1px solid ${crypto.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: ".72rem", fontWeight: 700, color: crypto.color }}>
            {crypto.abbr.slice(0,2)}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: "#dce8f4" }}>{crypto.abbr}</div>
            <div style={{ fontSize: ".68rem", color: "#3d5c78" }}>{crypto.name}</div>
          </div>
        </div>
        <span style={{
          fontSize: ".72rem", fontWeight: 700, padding: "3px 8px", borderRadius: 6,
          background: positive ? "rgba(0,220,130,.1)" : "rgba(255,60,80,.1)",
          color: positive ? "#00dc82" : "#ff3c50",
          border: `1px solid ${positive ? "rgba(0,220,130,.22)" : "rgba(255,60,80,.22)"}`,
          fontFamily: "'Space Mono',monospace",
        }}>
          {fmtPct(changePercent)}
        </span>
      </div>

      {/* Price */}
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.6rem", fontWeight: 700, color: "#f0f6fc", letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
        {fmtPrice(price)}
      </div>

      {/* Verdict */}
      {scores?.signal != null && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", borderRadius: 7, border: `1px solid ${verdict.color}40`, background: verdict.color + "12", marginBottom: "0.75rem" }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".9rem", fontWeight: 700, color: verdict.color }}>{verdict.grade}</span>
          <span style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: verdict.color }}>{verdict.label}</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".78rem", fontWeight: 700, color: verdict.color, marginLeft: "auto" }}>{scores.signal}/100</span>
        </div>
      )}

      {/* Scores */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: "0.75rem" }}>
        <ScoreBar label="MOM"  value={scores?.momentum} />
        <ScoreBar label="RISK" value={scores?.risk} />
        <div style={{ fontSize: ".62rem", color: "#1a3050", fontStyle: "italic" }}>TECH VALUE not available — no on-chain fundamentals</div>
      </div>
    </div>
  );
}

export default function Crypto({ session }) {
  const [prices,    setPrices]    = useState({});
  const [scores,    setScores]    = useState({});
  const [loading,   setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const tickers = CRYPTOS.map(c => c.symbol).join(",");

  const fetchAll = useCallback(async () => {
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    try {
      const [snapRes, scoresRes] = await Promise.all([
        fetch(`/api/stocks?tickers=${encodeURIComponent(tickers)}`, { headers }),
        fetch(`/api/scores?tickers=${encodeURIComponent(tickers)}`, { headers }),
      ]);
      if (snapRes.ok) {
        const j = await snapRes.json();
        const map = {};
        for (const s of j.data || []) map[s.symbol] = s;
        setPrices(map);
      }
      if (scoresRes.ok) {
        const j = await scoresRes.json();
        const map = {};
        for (const s of j.scores || []) map[s.symbol] = s;
        setScores(map);
      }
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  }, [tickers, session]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) return (
    <div style={{ padding: "4rem 0", textAlign: "center", color: "#3d5c78", fontSize: ".82rem", letterSpacing: ".18em" }}>
      <div style={{ width: 32, height: 32, border: "2px solid rgba(0,180,255,.08)", borderTopColor: "#00b4ff", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 1rem" }} />
      Fetching crypto data
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#00b4ff", marginBottom: 4 }}>
            Live · MOMENTUM scored
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#dce8f4", margin: 0 }}>Crypto Markets</h2>
        </div>
        {lastUpdated && (
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#1e3048" }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <p style={{ fontSize: ".82rem", color: "#3d5c78", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        MOMENTUM and RISK scores applied to crypto price data. TECH VALUE is not available — crypto has no on-chain balance sheet fundamentals. All signals are 90-day indicators.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {CRYPTOS.map(c => (
          <CryptoCard
            key={c.symbol}
            crypto={c}
            price={prices[c.symbol]?.price}
            changePercent={prices[c.symbol]?.changePercent}
            scores={scores[c.symbol]}
          />
        ))}
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: ".75rem", color: "#1a3050", lineHeight: 1.7 }}>
        Crypto prices are highly volatile. QuantDiver scores are 90-day signals and do not constitute financial advice. Always conduct your own research.
      </p>
    </div>
  );
}
