import { useEffect, useRef, useState } from "react";
import { createChart, AreaSeries } from "lightweight-charts";
import "./PriceChart.css";

const RANGES_STOCK  = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
const RANGES_CRYPTO = ["1M", "3M", "1Y", "5Y"]; // no intraday for crypto

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const isCrypto = (symbol) => symbol?.startsWith("X:");

export default function PriceChart({ stock, session }) {
  const crypto = isCrypto(stock?.symbol);
  const RANGES = crypto ? RANGES_CRYPTO : RANGES_STOCK;
  const [range,   setRange]   = useState(crypto ? "1M" : "1D");
  const [bars,    setBars]    = useState([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: "#4a6a88",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: {
        vertLine: { color: "rgba(0,180,255,0.5)", labelBackgroundColor: "#050d18" },
        horzLine: { color: "rgba(0,180,255,0.5)", labelBackgroundColor: "#050d18" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.07)" },
      timeScale: { borderColor: "rgba(255,255,255,0.07)", timeVisible: true, secondsVisible: false },
      handleScroll: { mouseWheel: false },
      handleScale:  { mouseWheel: false, pinch: false },
    });

    // v5 API: addSeries(SeriesType, options)
    const series = chart.addSeries(AreaSeries, {
      lineColor:        "#00b4ff",
      topColor:         "rgba(0,180,255,0.18)",
      bottomColor:      "rgba(0,180,255,0.0)",
      lineWidth:        2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  // Fetch data when ticker or range changes
  useEffect(() => {
    if (!stock?.symbol) return;
    setLoading(true);
    setBars([]);
    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
    fetch(`/api/history?ticker=${stock.symbol}&range=${range}`, { headers })
      .then(r => r.json())
      .then(j => { setBars(j.bars || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock?.symbol, range, session]);

  // Update chart when data or range changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    const isUp  = bars.length > 1 ? bars[bars.length - 1].c >= bars[0].c : true;
    const color = isUp ? "#00dc82" : "#ff3c50";

    seriesRef.current.applyOptions({
      lineColor:   color,
      topColor:    `${color}28`,
      bottomColor: `${color}00`,
    });

    chartRef.current.applyOptions({
      timeScale: { timeVisible: range === "1D" || range === "1W", secondsVisible: false },
    });

    if (bars.length) {
      // Intraday ranges use Unix seconds; daily/weekly use date strings to avoid gap artefacts
      const intraday = range === "1D" || range === "1W";
      seriesRef.current.setData(
        bars.map(b => ({
          time: intraday
            ? Math.floor(b.t / 1000)
            : new Date(b.t).toISOString().slice(0, 10),
          value: b.c,
        }))
      );
      chartRef.current.timeScale().fitContent();
    }
  }, [bars, range]);

  const isUp    = bars.length > 1 ? bars[bars.length - 1].c >= bars[0].c : (stock.changePercent ?? 0) >= 0;
  const pctDiff = bars.length > 1
    ? ((bars[bars.length - 1].c - bars[0].c) / bars[0].c * 100).toFixed(2)
    : null;
  const diffColor = isUp ? "#00dc82" : "#ff3c50";

  return (
    <section className="panel chart-panel">
      <div className="chart-top">
        <div className="chart-info">
          <div className="panel-eyebrow">Price Chart · {stock.symbol}</div>
          <div className="chart-price-row">
            <span className="chart-price">${fmt(stock.price)}</span>
            {pctDiff != null && (
              <span className="chart-period-change" style={{ color: diffColor }}>
                {isUp ? "▲" : "▼"} {Math.abs(pctDiff)}% this period
              </span>
            )}
          </div>
        </div>

        <div className="range-btns">
          {RANGES.map(r => (
            <button
              key={r}
              className={`range-btn ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
            >{r}</button>
          ))}
        </div>
      </div>

      <div className="chart-body">
        {loading && <div className="chart-loader">Loading…</div>}
        <div
          ref={containerRef}
          className="chart-container"
          style={{ opacity: loading ? 0.25 : 1, transition: "opacity 0.2s" }}
        />
      </div>
    </section>
  );
}
