// lib/formulas.js — Proprietary scoring engine
// Pure functions only — no I/O, no side effects.
// Input: raw numbers. Output: 0-100 scores.

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function normalize(value, min, max) {
  if (max === min) return 50;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

// ── MOMENTUM (0-100) ────────────────────────────────────────────
// Price-based trend + fundamental backing (earnings surprise).
// Rule: never catch the falling knife — sharp downtrend below both MAs
// gets a hard penalty regardless of other signals.
// VIX multiplier: high fear dampens momentum signals — volatile markets
// make price trends unreliable.
export function calcMomentum({ price, aggs, fundamentals, vix }) {
  if (!aggs || aggs.length < 20) return null;

  const now  = price || aggs.at(-1).c;
  const p60  = aggs.length >= 60  ? aggs[aggs.length - 60].c  : aggs[0].c;
  const p90  = aggs.length >= 90  ? aggs[aggs.length - 90].c  : aggs[0].c;
  const p130 = aggs.length >= 130 ? aggs[aggs.length - 130].c : aggs[0].c;

  // 3-month return (60 trading days)
  // Range: -20% = poor, +40% = excellent (realistic for tracked growth stocks)
  const ret3M      = (now - p60) / p60;
  const ret3MScore = normalize(ret3M, -0.20, 0.40);

  // 6-month return (130 trading days) — primary driver
  // Range: -30% = poor, +60% = excellent
  // Previous range (-50% to +120%) was too wide — good stocks never scored >70
  const ret6M      = (now - p130) / p130;
  const ret6MScore = normalize(ret6M, -0.30, 0.60);

  // Relative volume: today vs 30-day average
  const recentVols  = aggs.slice(-31, -1).map(d => d.v).filter(v => v > 0);
  const avgVol      = recentVols.length ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length : 0;
  const todayVol    = aggs.at(-1).v || 0;
  const relVol      = avgVol > 0 ? todayVol / avgVol : 1;
  const relVolScore = normalize(relVol, 0, 3);

  // MA trend: % distance from MA50 and MA200
  const closes50  = aggs.slice(-50).map(d => d.c);
  const closes200 = aggs.map(d => d.c);
  const ma50  = closes50.reduce((a, b)  => a + b, 0) / closes50.length;
  const ma200 = closes200.reduce((a, b) => a + b, 0) / closes200.length;
  const ma50dist  = clamp((now - ma50)  / ma50,  -0.20, 0.20);
  const ma200dist = clamp((now - ma200) / ma200, -0.20, 0.20);
  const maScore   = normalize(ma50dist * 0.5 + ma200dist * 0.5, -0.20, 0.20);

  // Earnings surprise: consistent beaters have fundamental backing
  const surpriseAvg   = fundamentals?.earningsSurpriseAvg ?? null;
  const surpriseScore = surpriseAvg !== null
    ? normalize(surpriseAvg, -0.20, 0.20)
    : 50;

  // Base score — 6M is now the primary driver (35%)
  let score = (
    ret6MScore    * 0.35 +
    ret3MScore    * 0.25 +
    maScore       * 0.25 +
    surpriseScore * 0.10 +
    relVolScore   * 0.05
  );

  // ── Falling knife penalty ───────────────────────────────────
  const belowBothMAs = now < ma50 && now < ma200;
  const sharpDecline = ret3M < -0.20; // down >20% over 3 months
  if (belowBothMAs && sharpDecline) {
    score = score * 0.50;
  }

  // ── VIX regime adjustment ───────────────────────────────────
  // High fear makes price trends unreliable — even good setups fail
  // when the market is in risk-off mode.
  if (vix != null) {
    const vixMultiplier = vix < 15 ? 1.10
                        : vix < 20 ? 1.00
                        : vix < 25 ? 0.85
                        : vix < 30 ? 0.70
                        :            0.50;
    score = score * vixMultiplier;
  }

  return Math.round(clamp(score, 0, 100));
}

// ── RISK (0-100, HIGHER = SAFER) ────────────────────────────────
// Higher = safer balance sheet. Lower = more financial risk.
// Uses debt/equity (more standard than debt/assets), ROA, and current ratio trend.
export function calcRisk({ aggs, fundamentals }) {
  // Volatility: annualised standard deviation of daily returns
  let volatilityScore = 50;
  if (aggs && aggs.length >= 20) {
    const returns = [];
    for (let i = 1; i < aggs.length; i++) {
      if (aggs[i - 1].c > 0) returns.push((aggs[i].c - aggs[i - 1].c) / aggs[i - 1].c);
    }
    const mean      = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance  = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const annualVol = Math.sqrt(variance) * Math.sqrt(252);
    volatilityScore = normalize(annualVol, 0, 0.6);
  }

  if (!fundamentals) return Math.round(100 - volatilityScore);

  const { balance, income, metrics } = fundamentals;

  // Debt/Equity ratio (higher D/E = more leveraged = more risky)
  // Use keyMetrics D/E if available, fall back to totalDebt/totalEquity
  const debtToEquity = metrics?.debtToEquity != null
    ? metrics.debtToEquity
    : balance.totalEquity > 0 ? balance.totalDebt / balance.totalEquity : 2;
  const debtScore = normalize(debtToEquity, 0, 3); // 0 = no debt (safe), 3+ = very leveraged

  // Liquidity: current ratio (lower = more risk)
  const currentRatio   = balance.totalCurrentLiabilities > 0
    ? balance.totalCurrentAssets / balance.totalCurrentLiabilities : 2;
  const liquidityScore = normalize(1 / Math.max(currentRatio, 0.1), 0, 2);

  // Current ratio trend: improving liquidity = lower risk
  // If current ratio is rising QoQ → safer, falling → riskier
  const trendPenalty = balance.currentRatioDelta != null
    ? clamp(-balance.currentRatioDelta * 10, -15, 15) // rising ratio reduces risk score
    : 0;

  // Interest coverage: operating income / interest expense (lower = more risk)
  const interestExp   = Math.abs(income.interestExpense || 0);
  const coverage      = interestExp > 0 ? income.operatingIncome / interestExp : 10;
  const interestScore = normalize(1 / Math.max(coverage, 0.1), 0, 1);

  // ROA: return on assets — higher ROA means assets are working efficiently (safer)
  const roa = metrics?.roa ?? null;
  const roaScore = roa !== null
    ? normalize(-roa, -0.20, 0.05)
    : 50;

  // ── Cash Runway ───────────────────────────────────────────────
  // How many months can the company operate before running out of cash?
  // Critical for early-stage companies (IONQ, RGTI, RKLB, ASTS, biotech startups).
  // Cash = cashAndCashEquivalents. Monthly burn = |freeCashFlow| / 3 (quarterly FCF).
  let cashRunwayScore = 50; // neutral default if data unavailable
  const cash     = balance.cashAndCashEquivalents;
  const fcf      = fundamentals.cashflow?.freeCashFlow;
  if (cash != null && fcf != null && fcf < 0) {
    // Company is burning cash — calculate runway in months
    const monthlyBurn   = Math.abs(fcf) / 3; // quarterly FCF → monthly
    const runwayMonths  = monthlyBurn > 0 ? cash / monthlyBurn : 999;
    // < 6 months = crisis, 6-12 = danger, 12-24 = caution, 24+ = safe, profitable = max safe
    cashRunwayScore = normalize(runwayMonths, 0, 36); // 0 months = max risk, 36+ = safe
  } else if (fcf != null && fcf >= 0) {
    // Profitable / FCF positive — no burn concern, maximum safety on this component
    cashRunwayScore = 0; // contributes 0 to rawRisk (very safe)
  }

  // Raw composite — higher raw = more risky
  const rawRisk = Math.round(
    debtScore        * 0.22 +
    liquidityScore   * 0.18 +
    interestScore    * 0.18 +
    volatilityScore  * 0.18 +
    roaScore         * 0.12 +
    cashRunwayScore  * 0.12
  ) + trendPenalty;

  return clamp(100 - rawRisk, 0, 100);
}

// ── TECHNOLOGY VALUE (0-100, higher = stronger moat) ────────────
// Measures business quality: margins, efficiency, growth, innovation.
// Uses sector-specific normalization so AMD is benchmarked vs semiconductors,
// not vs software companies — apples to apples comparison.
export function calcTechValue({ fundamentals, benchmarks }) {
  if (!fundamentals) return null;

  const { income, cashflow, metrics, earningsSurpriseAvg, analystRevenueGrowth } = fundamentals;
  const revenue = income.revenue || 1;

  // Use sector benchmarks if provided, otherwise fall back to general tech ranges
  const b = benchmarks || {
    grossMargin: [0.35, 0.78],
    netMargin:   [0.03, 0.32],
    rdIntensity: [0.05, 0.25],
    revGrowth:   [-0.10, 0.50],
    fcfMargin:   [0.02, 0.30],
    roe:         [-0.05, 0.40],
  };

  // R&D intensity: R&D / Revenue — benchmarked within sector
  const rdIntensity = (income.researchAndDevelopmentExpenses || 0) / revenue;
  const rdScore     = normalize(rdIntensity, b.rdIntensity[0], b.rdIntensity[1]);

  // Gross margin — sector-adjusted (defence at 20% = avg for defence, not weak vs software)
  const grossMargin = (income.grossProfit || 0) / revenue;
  const gmScore     = normalize(grossMargin, b.grossMargin[0], b.grossMargin[1]);

  // Net margin — sector-adjusted
  const netMargin  = (income.netIncome || 0) / revenue;
  const nmScore    = normalize(netMargin, b.netMargin[0], b.netMargin[1]);

  // Revenue growth — same across sectors (growth is growth)
  const revGrowth   = income.revenueGrowth || 0;
  const growthScore = normalize(revGrowth, b.revGrowth[0], b.revGrowth[1]);

  // FCF margin — sector-adjusted
  const fcfMargin = (cashflow.freeCashFlow || 0) / revenue;
  const fcfScore  = normalize(fcfMargin, b.fcfMargin[0], b.fcfMargin[1]);

  // ROE — sector-adjusted
  const roe = metrics?.roe ?? null;
  const roeScore = roe !== null
    ? normalize(roe, b.roe[0], b.roe[1])
    : 50;

  // Earnings surprise consistency — same across all sectors
  const surpriseScore = earningsSurpriseAvg !== null
    ? normalize(earningsSurpriseAvg, -0.15, 0.20)
    : 50;

  // Analyst forward revenue growth consensus — what Wall Street expects
  // If analysts collectively forecast strong growth, that's forward conviction
  const analystGrowthScore = analystRevenueGrowth != null
    ? normalize(analystRevenueGrowth, -0.10, 0.50)
    : 50;

  return Math.round(
    rdScore            * 0.18 +
    gmScore            * 0.18 +
    nmScore            * 0.13 +
    growthScore        * 0.13 +
    analystGrowthScore * 0.12 +
    fcfScore           * 0.09 +
    roeScore           * 0.09 +
    surpriseScore      * 0.08
  );
}

// ── SIGNAL BREAKDOWN — plain-English labels for the five key metrics ──
// Returns human-readable labels for Runway, Growth, Dilution, Insiders, Valuation.
// Used in the Advanced Risk Assessment panel.
export function calcSignalBreakdown({ fundamentals, sectorPE }) {
  if (!fundamentals) return null;

  const { income, balance, cashflow, metrics, dilution } = fundamentals;

  // ── Runway ──────────────────────────────────────────────────────
  let runway = null, runwayLabel = "N/A", runwayColor = "#3d5c78";
  const cash = balance?.cashAndCashEquivalents;
  const fcf  = cashflow?.freeCashFlow;
  if (cash != null && fcf != null && fcf < 0) {
    const monthlyBurn = Math.abs(fcf) / 3;
    runway = monthlyBurn > 0 ? Math.round(cash / monthlyBurn) : null;
    if (runway != null) {
      if (runway < 6)  { runwayLabel = `${runway}mo · CRITICAL`; runwayColor = "#ff3c50"; }
      else if (runway < 12) { runwayLabel = `${runway}mo · SHORT`; runwayColor = "#ff3c50"; }
      else if (runway < 24) { runwayLabel = `${runway}mo · CAUTION`; runwayColor = "#f59e0b"; }
      else             { runwayLabel = `${runway}mo · SAFE`; runwayColor = "#00dc82"; }
    }
  } else if (fcf != null && fcf >= 0) {
    runwayLabel = "FCF POSITIVE"; runwayColor = "#00dc82";
  }

  // ── Growth ──────────────────────────────────────────────────────
  const revGrowth = income?.revenueGrowth ?? null;
  let growthLabel = "N/A", growthColor = "#3d5c78";
  if (revGrowth != null) {
    const pct = Math.round(revGrowth * 100);
    if (revGrowth >= 0.30)       { growthLabel = `+${pct}% · STRONG`;   growthColor = "#00dc82"; }
    else if (revGrowth >= 0.10)  { growthLabel = `+${pct}% · GROWING`;  growthColor = "#00b4ff"; }
    else if (revGrowth >= 0)     { growthLabel = `+${pct}% · STABLE`;   growthColor = "#f59e0b"; }
    else                         { growthLabel = `${pct}% · DECLINING`; growthColor = "#ff3c50"; }
  }

  // ── Dilution ────────────────────────────────────────────────────
  let dilutionLabel = "N/A", dilutionColor = "#3d5c78";
  if (dilution != null) {
    const pct = Math.round(dilution * 100 * 10) / 10;
    if (dilution < -0.01)        { dilutionLabel = `${pct}% · BUYBACKS`;  dilutionColor = "#00dc82"; }
    else if (dilution <= 0.02)   { dilutionLabel = `+${pct}% · LOW`;      dilutionColor = "#00dc82"; }
    else if (dilution <= 0.05)   { dilutionLabel = `+${pct}% · MODERATE`; dilutionColor = "#f59e0b"; }
    else                         { dilutionLabel = `+${pct}% · HIGH`;     dilutionColor = "#ff3c50"; }
  }

  // ── Valuation (P/E vs sector) ───────────────────────────────────
  const pe = metrics?.peRatio ?? null;
  let valuationLabel = "N/A", valuationColor = "#3d5c78";
  if (pe != null && pe > 0) {
    const benchmarkPE = sectorPE ?? 25; // fallback market average P/E
    if (pe < benchmarkPE * 0.7)       { valuationLabel = `P/E ${Math.round(pe)} · CHEAP`;      valuationColor = "#00dc82"; }
    else if (pe < benchmarkPE * 1.3)  { valuationLabel = `P/E ${Math.round(pe)} · FAIR`;       valuationColor = "#00b4ff"; }
    else if (pe < benchmarkPE * 2.0)  { valuationLabel = `P/E ${Math.round(pe)} · STRETCHED`;  valuationColor = "#f59e0b"; }
    else                              { valuationLabel = `P/E ${Math.round(pe)} · EXPENSIVE`;  valuationColor = "#ff3c50"; }
  }

  return {
    runway:    { label: runwayLabel,    color: runwayColor    },
    growth:    { label: growthLabel,    color: growthColor    },
    dilution:  { label: dilutionLabel,  color: dilutionColor  },
    insiders:  { label: "N/A",          color: "#3d5c78"      }, // FMP plan doesn't include insider data
    valuation: { label: valuationLabel, color: valuationColor },
  };
}

// ── SIGNAL (0-100) — composite buy/avoid signal ──────────────────
// MOMENTUM confirms price trend. TECH VALUE anchors whether business quality
// justifies the move (key for tech/biotech/quantum investors). RISK is a floor —
// it filters out companies that can't survive, not a primary return driver.
export function calcSignal({ momentum, risk, techValue }) {
  if (momentum === null) return null;

  if (techValue !== null) {
    // Full signal: MOMENTUM 50% + TECH VALUE 35% + RISK 15%
    return Math.round(momentum * 0.50 + techValue * 0.35 + risk * 0.15);
  }

  // Partial: no tech value — MOMENTUM dominant, RISK as floor
  return Math.round(momentum * 0.75 + risk * 0.25);
}
