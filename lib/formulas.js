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

// ── MOMENTUM (0-100) ────────────────────────────────────────
// Inputs from Polygon aggregates + snapshot.
// No fundamentals required.
export function calcMomentum({ price, aggs }) {
  if (!aggs || aggs.length < 20) return null;

  const now = price || aggs.at(-1).c;
  const p30  = aggs.length >= 30  ? aggs[aggs.length - 30].c  : aggs[0].c;
  const p90  = aggs.length >= 90  ? aggs[aggs.length - 90].c  : aggs[0].c;

  // 1-month return → normalized -20% to +20%
  const ret1M      = (now - p30) / p30;
  const ret1MScore = normalize(ret1M, -0.20, 0.20);

  // 3-month return → normalized -30% to +30%
  const ret3M      = (now - p90) / p90;
  const ret3MScore = normalize(ret3M, -0.30, 0.30);

  // Relative volume: today vs 30-day average
  const recentVols = aggs.slice(-31, -1).map((d) => d.v).filter((v) => v > 0);
  const avgVol     = recentVols.length ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length : 0;
  const todayVol   = aggs.at(-1).v || 0;
  const relVol     = avgVol > 0 ? todayVol / avgVol : 1;
  const relVolScore = normalize(relVol, 0, 3);

  // MA trend: is price above 50-day and 200-day moving averages?
  const closes50  = aggs.slice(-50).map((d) => d.c);
  const closes200 = aggs.map((d) => d.c);
  const ma50  = closes50.reduce((a, b)  => a + b, 0) / closes50.length;
  const ma200 = closes200.reduce((a, b) => a + b, 0) / closes200.length;
  const maScore = (now > ma50 ? 50 : 0) + (now > ma200 ? 50 : 0);

  return Math.round(
    ret1MScore  * 0.30 +
    ret3MScore  * 0.35 +
    relVolScore * 0.15 +
    maScore     * 0.20
  );
}

// ── RISK (0-100, lower = safer) ─────────────────────────────
// Requires Polygon aggregates for volatility.
// Requires FMP fundamentals for balance sheet components.
export function calcRisk({ aggs, fundamentals }) {
  // Volatility: annualised standard deviation of daily returns
  let volatilityScore = 50;
  if (aggs && aggs.length >= 20) {
    const returns = [];
    for (let i = 1; i < aggs.length; i++) {
      if (aggs[i - 1].c > 0) returns.push((aggs[i].c - aggs[i - 1].c) / aggs[i - 1].c);
    }
    const mean     = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const annualVol = Math.sqrt(variance) * Math.sqrt(252);
    volatilityScore = normalize(annualVol, 0, 0.6); // 0% → safe, 60% → max risk
  }

  if (!fundamentals) return Math.round(volatilityScore);

  const { balance, income } = fundamentals;

  // Debt ratio: total debt / total assets (higher = more risk)
  const debtRatio  = balance.totalAssets > 0 ? balance.totalDebt / balance.totalAssets : 0.5;
  const debtScore  = normalize(debtRatio, 0, 0.8);

  // Liquidity: current ratio (lower ratio = more risk)
  const currentRatio    = balance.totalCurrentLiabilities > 0
    ? balance.totalCurrentAssets / balance.totalCurrentLiabilities
    : 2;
  const liquidityScore  = normalize(1 / Math.max(currentRatio, 0.1), 0, 2);

  // Interest coverage: operating income / interest expense (lower = more risk)
  const interestExp     = Math.abs(income.interestExpense || 0);
  const coverage        = interestExp > 0 ? income.operatingIncome / interestExp : 10;
  const interestScore   = normalize(1 / Math.max(coverage, 0.1), 0, 1);

  return Math.round(
    debtScore      * 0.30 +
    liquidityScore * 0.25 +
    interestScore  * 0.20 +
    volatilityScore * 0.25
  );
}

// ── TECHNOLOGY VALUE (0-100, higher = stronger moat) ────────
// Requires FMP fundamentals.
export function calcTechValue({ fundamentals }) {
  if (!fundamentals) return null;

  const { income, cashflow } = fundamentals;
  const revenue = income.revenue || 1;

  // R&D intensity: R&D / Revenue (higher = more innovation investment)
  const rdIntensity = (income.researchAndDevelopmentExpenses || 0) / revenue;
  const rdScore     = normalize(rdIntensity, 0, 0.25);

  // Gross margin: (Revenue - COGS) / Revenue (higher = stronger pricing power)
  const grossMargin = (income.grossProfit || 0) / revenue;
  const gmScore     = normalize(grossMargin, 0, 0.80);

  // Revenue growth YoY (higher = expanding business)
  const revGrowth   = income.revenueGrowth || 0;
  const growthScore = normalize(revGrowth, -0.10, 0.50);

  // FCF margin: Free Cash Flow / Revenue (higher = capital efficiency)
  const fcfMargin   = (cashflow.freeCashFlow || 0) / revenue;
  const fcfScore    = normalize(fcfMargin, -0.10, 0.30);

  return Math.round(
    rdScore     * 0.30 +
    gmScore     * 0.35 +
    growthScore * 0.20 +
    fcfScore    * 0.15
  );
}
