// lib/fetchFMP.js — Financial Modeling Prep fetchers
// Uses FMP stable API (post-Aug 2025)

const BASE = "https://financialmodelingprep.com/stable";

// 7-day in-memory cache — fundamentals are quarterly filings, rarely change
const _cache = new Map();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

async function fmpGet(path, apiKey, index = 0) {
  const key = path + "|" + index;
  const hit = _cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}apikey=${apiKey}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return null;
  const value = json[index] ?? null;
  _cache.set(key, { value, expires: Date.now() + CACHE_TTL });
  return value;
}

async function fmpGetAll(path, apiKey, limit = 4) {
  const key = path + "|all|" + limit;
  const hit = _cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}apikey=${apiKey}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return null;
  const value = json.slice(0, limit);
  _cache.set(key, { value, expires: Date.now() + CACHE_TTL });
  return value;
}

export async function fetchFundamentals(ticker, apiKey) {
  if (!apiKey) return null;

  const [
    incomeCurrent, incomePrior,
    incomeAnnualCurrent, incomeAnnualPrior,
    balance, balancePrior,
    cashflow, cashflowPrior,
    keyMetrics,
    earningsSurprises,
    analystEstimates,
  ] = await Promise.all([
    // Quarterly income — current and prior quarter
    fmpGet(`/income-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 0),
    fmpGet(`/income-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 1),
    // Annual income — for YoY revenue growth (more stable signal than QoQ)
    fmpGet(`/income-statement?symbol=${ticker}&period=annual&limit=2`, apiKey, 0),
    fmpGet(`/income-statement?symbol=${ticker}&period=annual&limit=2`, apiKey, 1),
    // Balance sheet — current and prior quarter (for trend + dilution)
    fmpGet(`/balance-sheet-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 0),
    fmpGet(`/balance-sheet-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 1),
    // Cash flow — current and prior quarter
    fmpGet(`/cash-flow-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 0),
    fmpGet(`/cash-flow-statement?symbol=${ticker}&period=quarter&limit=2`, apiKey, 1),
    // Key metrics — ROE, ROA, debt/equity, P/E, EV/EBITDA
    fmpGet(`/key-metrics?symbol=${ticker}&period=quarter&limit=1`, apiKey, 0),
    // Earnings surprises — last 4 quarters of beat/miss
    fmpGetAll(`/earnings-surprises?symbol=${ticker}`, apiKey, 4),
    // Analyst forward estimates — consensus revenue/EPS for next fiscal year
    fmpGetAll(`/analyst-estimates?symbol=${ticker}&period=annual&limit=2`, apiKey, 2),
  ]);

  if (!incomeCurrent || !balance) return null;

  // ── Revenue growth ──────────────────────────────────────────
  // YoY annual (preferred) — cleaner signal than QoQ
  const annualRevGrowth = incomeAnnualCurrent && incomeAnnualPrior && incomeAnnualPrior.revenue > 0
    ? (incomeAnnualCurrent.revenue - incomeAnnualPrior.revenue) / incomeAnnualPrior.revenue
    : null;
  // QoQ quarterly fallback
  const qoqRevGrowth = incomePrior && incomePrior.revenue > 0
    ? (incomeCurrent.revenue - incomePrior.revenue) / incomePrior.revenue
    : 0;
  const revenueGrowth = annualRevGrowth ?? qoqRevGrowth;

  // ── FCF growth ──────────────────────────────────────────────
  const fcfCurrent = cashflow?.freeCashFlow || 0;
  const fcfPrior   = cashflowPrior?.freeCashFlow || 0;
  const fcfGrowth  = fcfPrior !== 0 ? (fcfCurrent - fcfPrior) / Math.abs(fcfPrior) : null;

  // ── Current ratio trend ─────────────────────────────────────
  const currentRatioCurrent = balance.totalCurrentLiabilities > 0
    ? balance.totalCurrentAssets / balance.totalCurrentLiabilities : 2;
  const currentRatioPrior   = balancePrior && balancePrior.totalCurrentLiabilities > 0
    ? balancePrior.totalCurrentAssets / balancePrior.totalCurrentLiabilities : null;
  const currentRatioDelta   = currentRatioPrior != null
    ? currentRatioCurrent - currentRatioPrior : 0;

  // ── Earnings surprise consistency ──────────────────────────
  // Positive = beat, negative = miss. Avg of last 4 quarters.
  let earningsSurpriseAvg = null;
  if (Array.isArray(earningsSurprises) && earningsSurprises.length > 0) {
    const surprises = earningsSurprises
      .map(e => {
        if (e.estimatedEarning && e.actualEarningResult != null) {
          return e.estimatedEarning !== 0
            ? (e.actualEarningResult - e.estimatedEarning) / Math.abs(e.estimatedEarning)
            : 0;
        }
        return null;
      })
      .filter(v => v !== null);
    if (surprises.length > 0) {
      earningsSurpriseAvg = surprises.reduce((a, b) => a + b, 0) / surprises.length;
    }
  }

  return {
    income: {
      revenue:                        incomeCurrent.revenue                        || 0,
      grossProfit:                    incomeCurrent.grossProfit                    || 0,
      netIncome:                      incomeCurrent.netIncome                      || 0,
      operatingIncome:                incomeCurrent.operatingIncome                || 0,
      interestExpense:                incomeCurrent.interestExpense                || 0,
      researchAndDevelopmentExpenses: incomeCurrent.researchAndDevelopmentExpenses || 0,
      revenueGrowth,
    },
    balance: {
      totalAssets:             balance.totalAssets             || 0,
      totalDebt:               balance.totalDebt               || 0,
      totalEquity:             balance.totalStockholdersEquity || 0,
      totalCurrentAssets:      balance.totalCurrentAssets      || 0,
      totalCurrentLiabilities: balance.totalCurrentLiabilities || 0,
      cashAndCashEquivalents:  balance.cashAndCashEquivalents  || 0,
      currentRatioDelta,
    },
    cashflow: {
      freeCashFlow: fcfCurrent,
      fcfGrowth,
    },
    dilution: (() => {
      const curr = balance.commonStockSharesOutstanding ?? balance.commonStock ?? null;
      const prev = balancePrior?.commonStockSharesOutstanding ?? balancePrior?.commonStock ?? null;
      if (!curr || !prev || prev === 0) return null;
      // Quarterly change annualised × 4
      return ((curr - prev) / prev) * 4;
    })(),
    metrics: {
      roe:        keyMetrics?.roe        ?? null,
      roa:        keyMetrics?.returnOnTangibleAssets ?? keyMetrics?.roa ?? null,
      debtToEquity: keyMetrics?.debtToEquity ?? null,
      peRatio:    keyMetrics?.peRatio    ?? null,
      evToEbitda: keyMetrics?.enterpriseValueOverEBITDA ?? null,
    },
    earningsSurpriseAvg,
    // Innovation inputs
    grossMarginPrior: (() => {
      if (!incomeAnnualPrior || incomeAnnualPrior.revenue <= 0) return null;
      return incomeAnnualPrior.grossProfit / incomeAnnualPrior.revenue;
    })(),
    rdSpendPrior: incomeAnnualPrior?.researchAndDevelopmentExpenses ?? null,
    analystRevenueGrowth: (() => {
      // Compare nearest future analyst revenue estimate to current annual revenue
      const currentAnnualRevenue = incomeAnnualCurrent?.revenue;
      if (!currentAnnualRevenue || !Array.isArray(analystEstimates)) return null;
      // Find the nearest future estimate (smallest date still in the future)
      const today   = new Date();
      const nearest = analystEstimates
        .filter(e => e?.date && new Date(e.date) > today && e.revenueAvg > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      if (!nearest?.revenueAvg) return null;
      return (nearest.revenueAvg - currentAnnualRevenue) / currentAnnualRevenue;
    })(),
  };
}
