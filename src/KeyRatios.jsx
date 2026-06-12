import { useState, useEffect } from "react";
import "./KeyRatios.css";

function fmtMktCap(n) {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function fmt(v, suffix = "") {
  return v != null ? `${Number(v).toFixed(2)}${suffix}` : "—";
}

function RatioCard({ label, value, suffix = "", context, contextColor }) {
  return (
    <div className="kr-card">
      <div className="kr-card-label">{label}</div>
      <div className="kr-card-value">{value != null ? `${fmt(value)}${suffix}` : "—"}</div>
      {context && <div className="kr-card-ctx" style={{ color: contextColor || "#3d5c78" }}>{context}</div>}
    </div>
  );
}

function ratingPE(pe) {
  if (pe == null) return null;
  if (pe < 0)  return ["NEGATIVE", "#ff3c50"];
  if (pe < 15) return ["VALUE",    "#00dc82"];
  if (pe < 25) return ["FAIR",     "#f59e0b"];
  if (pe < 40) return ["GROWTH",   "#f59e0b"];
  return             ["EXPENSIVE", "#ff3c50"];
}

function ratingROE(roe) {
  if (roe == null) return null;
  if (roe >= 20) return ["STRONG",   "#00dc82"];
  if (roe >= 10) return ["MODERATE", "#f59e0b"];
  if (roe >= 0)  return ["WEAK",     "#ff3c50"];
  return               ["NEGATIVE",  "#ff3c50"];
}

function ratingMargin(m) {
  if (m == null) return null;
  if (m >= 25)  return ["PREMIUM",  "#00dc82"];
  if (m >= 10)  return ["HEALTHY",  "#f59e0b"];
  return              ["THIN",      "#ff3c50"];
}

export default function KeyRatios({ stock, session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.symbol) return;
    setLoading(true);
    setData(null);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch(`/api/ratios?ticker=${stock.symbol}`, { headers })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock?.symbol, session]);

  if (!stock) return null;

  const peRating  = ratingPE(data?.pe);
  const roeRating = ratingROE(data?.roe);
  const gmRating  = ratingMargin(data?.grossMargin);

  return (
    <section className="panel kr-panel">
      <div className="panel-header">
        <div className="panel-eyebrow">Fundamental Analysis · {stock.symbol}</div>
        <h2 className="panel-title">Key Ratios & Profile</h2>
      </div>

      {loading && <div className="kr-loading"><div className="kr-spinner" />Loading fundamentals…</div>}

      {data && !data.error && (
        <>
          {/* Company header */}
          {data.name && (
            <div className="kr-company">
              <div>
                <div className="kr-company-name">{data.name}</div>
                {data.sector && (
                  <div className="kr-company-meta">
                    {data.sector}{data.industry ? ` · ${data.industry}` : ""}
                  </div>
                )}
              </div>
              <div className="kr-company-stats">
                <div className="kr-stat">
                  <span className="kr-stat-label">Mkt Cap</span>
                  <span className="kr-stat-val">{fmtMktCap(data.marketCap)}</span>
                </div>
                <div className="kr-stat">
                  <span className="kr-stat-label">Beta</span>
                  <span className="kr-stat-val" style={{ color: data.beta > 1.5 ? "#ff3c50" : data.beta < 0.8 ? "#00dc82" : "#f0f6fc" }}>{fmt(data.beta)}</span>
                </div>
                {data.divYield > 0 && (
                  <div className="kr-stat">
                    <span className="kr-stat-label">Div Yield</span>
                    <span className="kr-stat-val green">{fmt(data.divYield)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Valuation grid */}
          <div className="kr-section-label">Valuation</div>
          <div className="kr-grid">
            <RatioCard label="P/E Ratio"   value={data.pe}       context={peRating?.[0]}  contextColor={peRating?.[1]}  />
            <RatioCard label="P/B Ratio"   value={data.pb}       context={data.pb > 5 ? "PREMIUM" : data.pb < 1 ? "UNDERVALUED" : null} contextColor={data.pb < 1 ? "#00dc82" : "#f59e0b"} />
            <RatioCard label="P/S Ratio"   value={data.ps}       />
            <RatioCard label="EV/EBITDA"   value={data.evEbitda} context={data.evEbitda < 10 ? "CHEAP" : data.evEbitda > 30 ? "RICH" : null} contextColor={data.evEbitda < 10 ? "#00dc82" : "#f59e0b"} />
          </div>

          {/* Profitability grid */}
          <div className="kr-section-label">Profitability</div>
          <div className="kr-grid">
            <RatioCard label="ROE"          value={data.roe}         suffix="%" context={roeRating?.[0]} contextColor={roeRating?.[1]} />
            <RatioCard label="ROA"          value={data.roa}         suffix="%" context={data.roa >= 10 ? "STRONG" : data.roa >= 5 ? "FAIR" : null} contextColor={data.roa >= 10 ? "#00dc82" : "#f59e0b"} />
            <RatioCard label="Gross Margin" value={data.grossMargin} suffix="%" context={gmRating?.[0]} contextColor={gmRating?.[1]} />
            <RatioCard label="Net Margin"   value={data.netMargin}   suffix="%" context={data.netMargin >= 15 ? "STRONG" : data.netMargin >= 5 ? "FAIR" : null} contextColor={data.netMargin >= 15 ? "#00dc82" : "#f59e0b"} />
          </div>

          {/* Balance sheet */}
          <div className="kr-section-label">Financial Health</div>
          <div className="kr-grid">
            <RatioCard label="Debt/Equity"    value={data.debtToEquity} context={data.debtToEquity < 0.5 ? "LOW DEBT" : data.debtToEquity > 2 ? "HIGH DEBT" : null} contextColor={data.debtToEquity < 0.5 ? "#00dc82" : "#ff3c50"} />
            <RatioCard label="Current Ratio"  value={data.currentRatio} context={data.currentRatio >= 2 ? "STRONG" : data.currentRatio >= 1 ? "ADEQUATE" : "WEAK"} contextColor={data.currentRatio >= 2 ? "#00dc82" : data.currentRatio >= 1 ? "#f59e0b" : "#ff3c50"} />
            {data.revenueGrowth != null && <RatioCard label="Rev Growth" value={data.revenueGrowth} suffix="%" context={data.revenueGrowth >= 20 ? "STRONG" : data.revenueGrowth >= 10 ? "HEALTHY" : "SLOWING"} contextColor={data.revenueGrowth >= 20 ? "#00dc82" : data.revenueGrowth >= 10 ? "#f59e0b" : "#ff3c50"} />}
          </div>

          {/* Description */}
          {data.description && (
            <p className="kr-description">{data.description}{data.description.length >= 400 ? "…" : ""}</p>
          )}
        </>
      )}
    </section>
  );
}
