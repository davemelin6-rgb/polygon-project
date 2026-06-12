import { useState, useEffect } from "react";
import "./TechnicalSignals.css";

/* ─── signal logic ───────────────────────────────────────── */
function interpret(rsi, macd, sma50, sma200, ema20, price) {
  const rows = [];
  let bull = 0, bear = 0;

  // RSI
  if (rsi != null) {
    const v = +rsi.toFixed(1);
    if (v >= 70)      { rows.push({ key:"RSI(14)", value: v, label:"OVERBOUGHT", color:"#ff3c50", dir:-1 }); bear++; }
    else if (v <= 30) { rows.push({ key:"RSI(14)", value: v, label:"OVERSOLD",   color:"#00dc82", dir:+1 }); bull++; }
    else              { rows.push({ key:"RSI(14)", value: v, label:"NEUTRAL",    color:"#f59e0b", dir: 0 }); }
  }

  // MACD
  if (macd) {
    const up = macd.histogram > 0;
    rows.push({ key:"MACD", value: +macd.value.toFixed(3), label: up ? "BULLISH CROSS" : "BEARISH CROSS", color: up ? "#00dc82" : "#ff3c50", dir: up ? 1 : -1 });
    up ? bull++ : bear++;
  }

  // Price vs SMA 50
  if (sma50 != null && price != null) {
    const above = price > sma50;
    rows.push({ key:"SMA(50)", value: +sma50.toFixed(2), label: above ? "PRICE ABOVE" : "PRICE BELOW", color: above ? "#00dc82" : "#ff3c50", dir: above ? 1 : -1, prefix:"$" });
    above ? bull++ : bear++;
  }

  // Price vs SMA 200
  if (sma200 != null && price != null) {
    const above = price > sma200;
    rows.push({ key:"SMA(200)", value: +sma200.toFixed(2), label: above ? "PRICE ABOVE" : "PRICE BELOW", color: above ? "#00dc82" : "#ff3c50", dir: above ? 1 : -1, prefix:"$" });
    above ? bull++ : bear++;
  }

  // EMA 20 vs SMA 50 momentum
  if (ema20 != null && sma50 != null) {
    const up = ema20 > sma50;
    rows.push({ key:"EMA(20)", value: +ema20.toFixed(2), label: up ? "ABOVE SMA50" : "BELOW SMA50", color: up ? "#00dc82" : "#ff3c50", dir: up ? 1 : -1, prefix:"$" });
    up ? bull++ : bear++;
  }

  const total = bull + bear;
  const score = total ? Math.round((bull / total) * 100) : 50;
  const overall = score >= 65 ? "BULLISH" : score <= 35 ? "BEARISH" : "NEUTRAL";
  const overallColor = overall === "BULLISH" ? "#00dc82" : overall === "BEARISH" ? "#ff3c50" : "#f59e0b";

  return { rows, bull, bear, score, overall, overallColor };
}

/* ─── RSI arc ────────────────────────────────────────────── */
function RSIGauge({ value }) {
  if (value == null) return null;
  const v = Math.max(0, Math.min(100, value));
  const angle = -120 + (v / 100) * 240;
  const r = 32, cx = 40, cy = 44;
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const s = toXY(-120), e = toXY(-120 + 240);
  const n = toXY(angle);
  const arcPath = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`;
  const color = v >= 70 ? "#ff3c50" : v <= 30 ? "#00dc82" : "#f59e0b";

  return (
    <svg width="80" height="56" viewBox="0 0 80 56" className="ts-rsi-gauge">
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6" strokeLinecap="round" />
      <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${(v/100*240)>180?1:0} 1 ${n.x} ${n.y}`}
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x="40" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="'IBM Plex Mono',monospace">{v.toFixed(0)}</text>
      <text x="14" y="53" fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="'IBM Plex Mono',monospace">30</text>
      <text x="57" y="53" fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="'IBM Plex Mono',monospace">70</text>
    </svg>
  );
}

/* ─── MACD histogram mini bars ───────────────────────────── */
function MacdBar({ value, signal, histogram }) {
  if (value == null) return null;
  const bullish = histogram > 0;
  const h = Math.abs(histogram);
  const maxH = Math.max(Math.abs(value), Math.abs(signal), h, 0.01);
  const barH = Math.min(32, Math.round((h / maxH) * 32));
  return (
    <div className="ts-macd">
      <div className="ts-macd-bar-wrap">
        <div className="ts-macd-bar" style={{ height: barH, background: bullish ? "#00dc82" : "#ff3c50" }} />
      </div>
      <div className="ts-macd-vals">
        <span>MACD <b style={{ color: bullish ? "#00dc82" : "#ff3c50" }}>{value.toFixed(3)}</b></span>
        <span>SIG <b>{signal.toFixed(3)}</b></span>
        <span>HIST <b style={{ color: bullish ? "#00dc82" : "#ff3c50" }}>{histogram.toFixed(3)}</b></span>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function TechnicalSignals({ stock, session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.symbol) return;
    setLoading(true);
    setData(null);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch(`/api/technicals?ticker=${stock.symbol}`, { headers })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock?.symbol, session]);

  if (!stock) return null;

  const sig = data ? interpret(data.rsi, data.macd, data.sma50, data.sma200, data.ema20, stock.price) : null;

  return (
    <section className="panel ts-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Technical Indicators · {stock.symbol}</div>
        <h2 className="panel-title">Technical Signals</h2>
      </div>

      {loading && <div className="ts-loading"><div className="ts-spinner" /> Fetching indicators…</div>}

      {sig && (
        <>
          {/* Overall signal */}
          <div className="ts-overall">
            <div className="ts-overall-score" style={{ "--score-color": sig.overallColor }}>
              <div className="ts-overall-ring" style={{ background: `conic-gradient(${sig.overallColor} ${sig.score * 3.6}deg, rgba(255,255,255,.06) 0)` }}>
                <div className="ts-overall-inner">
                  <span className="ts-overall-pct" style={{ color: sig.overallColor }}>{sig.score}%</span>
                  <span className="ts-overall-label" style={{ color: sig.overallColor }}>{sig.overall}</span>
                </div>
              </div>
            </div>

            <div className="ts-rsi-block">
              <div className="ts-block-label">RSI (14)</div>
              <RSIGauge value={data?.rsi} />
              <div className="ts-block-sublabel" style={{ color: data?.rsi >= 70 ? "#ff3c50" : data?.rsi <= 30 ? "#00dc82" : "#f59e0b" }}>
                {data?.rsi >= 70 ? "OVERBOUGHT" : data?.rsi <= 30 ? "OVERSOLD" : "NEUTRAL"}
              </div>
            </div>

            <div className="ts-macd-block">
              <div className="ts-block-label">MACD (12/26/9)</div>
              <MacdBar {...(data?.macd || {})} />
            </div>

            <div className="ts-counts">
              <div className="ts-count-row">
                <span className="ts-count-bull">{sig.bull}</span>
                <span className="ts-count-sep">/</span>
                <span className="ts-count-bear">{sig.bear}</span>
              </div>
              <div className="ts-count-labels">
                <span>BULL</span><span>BEAR</span>
              </div>
            </div>
          </div>

          {/* Indicator rows */}
          <div className="ts-rows">
            {sig.rows.map(row => (
              <div key={row.key} className="ts-row">
                <span className="ts-row-key">{row.key}</span>
                <span className="ts-row-val">{row.prefix || ""}{row.value}</span>
                <div className="ts-row-bar-wrap">
                  <div className="ts-row-bar" style={{
                    width: row.key === "RSI(14)" ? `${row.value}%` : `${Math.min(100, Math.abs(((row.value || 0) / (row.value || 1)) * 60 + 40))}%`,
                    background: row.color,
                  }} />
                </div>
                <span className="ts-row-label" style={{ color: row.color }}>{row.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
