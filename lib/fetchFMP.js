// lib/fetchFMP.js — Financial Modeling Prep fetchers
// Uses FMP stable API (post-Aug 2025)

const BASE = "https://financialmodelingprep.com/stable";

// 7-day in-memory cache — fundamentals are annual filings, rarely change
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

export async function fetchFundamentals(ticker, apiKey) {
  if (!apiKey) return null;

  const [incomeCurrent, incomePrior, balance, cashflow] = await Promise.all([
    fmpGet(`/income-statement?symbol=${ticker}&limit=2`, apiKey, 0),
    fmpGet(`/income-statement?symbol=${ticker}&limit=2`, apiKey, 1),
    fmpGet(`/balance-sheet-statement?symbol=${ticker}&limit=1`, apiKey, 0),
    fmpGet(`/cash-flow-statement?symbol=${ticker}&limit=1`, apiKey, 0),
  ]);

  if (!incomeCurrent || !balance) return null;

  const priorRevenue  = incomePrior?.revenue ?? incomeCurrent.revenue;
  const revenueGrowth = priorRevenue > 0
    ? (incomeCurrent.revenue - priorRevenue) / priorRevenue
    : 0;

  return {
    income: {
      revenue:                        incomeCurrent.revenue                        || 0,
      grossProfit:                    incomeCurrent.grossProfit                    || 0,
      operatingIncome:                incomeCurrent.operatingIncome                || 0,
      interestExpense:                incomeCurrent.interestExpense                || 0,
      researchAndDevelopmentExpenses: incomeCurrent.researchAndDevelopmentExpenses || 0,
      revenueGrowth,
    },
    balance: {
      totalAssets:             balance.totalAssets             || 0,
      totalDebt:               balance.totalDebt               || 0,
      totalCurrentAssets:      balance.totalCurrentAssets      || 0,
      totalCurrentLiabilities: balance.totalCurrentLiabilities || 0,
      cashAndCashEquivalents:  balance.cashAndCashEquivalents  || 0,
    },
    cashflow: {
      freeCashFlow: cashflow?.freeCashFlow || 0,
    },
  };
}
