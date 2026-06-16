// api/ratios.js — Key financial ratios + company profile via FMP
// GET /api/ratios?ticker=AAPL

import { verifySession } from "../lib/apiGuard.js";

const FMP     = "https://financialmodelingprep.com/stable";
const POLYGON = "https://api.polygon.io";
const cache   = new Map();
const TTL     = 7 * 24 * 60 * 60_000;

function pct(v) { return v != null && isFinite(v) ? +(v * 100).toFixed(2) : null; }
function num(v) { return v != null && isFinite(v) ? +Number(v).toFixed(2)  : null; }
function first(...vals) { for (const v of vals) { if (v != null && isFinite(v) && v !== 0) return v; } return null; }

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const fmpKey     = process.env.FMP_API_KEY;
  const polygonKey = process.env.POLYGON_API_KEY;
  if (!fmpKey) return res.status(500).json({ error: "No FMP key" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !/^[A-Z]{1,10}$/.test(ticker))
    return res.status(400).json({ error: "Invalid ticker" });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const [rRes, pRes, kRes, incRes, snapRes] = await Promise.all([
      fetch(`${FMP}/ratios?symbol=${ticker}&limit=1&apikey=${fmpKey}`),
      fetch(`${FMP}/profile?symbol=${ticker}&apikey=${fmpKey}`),
      fetch(`${FMP}/key-metrics?symbol=${ticker}&limit=1&apikey=${fmpKey}`),
      fetch(`${FMP}/income-statement?symbol=${ticker}&limit=1&apikey=${fmpKey}`),
      polygonKey
        ? fetch(`${POLYGON}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${polygonKey}`)
        : Promise.resolve(null),
    ]);

    const ratioArr   = rRes.ok   ? await rRes.json()   : [];
    const profileArr = pRes.ok   ? await pRes.json()   : [];
    const keyArr     = kRes.ok   ? await kRes.json()   : [];
    const incArr     = incRes.ok ? await incRes.json() : [];
    const snapJson   = snapRes?.ok ? await snapRes.json() : null;

    const r   = (Array.isArray(ratioArr)   ? ratioArr[0]   : null) || {};
    const p   = (Array.isArray(profileArr) ? profileArr[0] : null) || {};
    const k   = (Array.isArray(keyArr)     ? keyArr[0]     : null) || {};
    const inc = (Array.isArray(incArr)     ? incArr[0]     : null) || {};

    // Current price from Polygon snapshot
    const snap  = snapJson?.ticker || {};
    const price = snap.lastTrade?.p ?? snap.day?.c ?? null;

    // Calculate P/E ourselves: price / EPS (most reliable)
    const eps        = inc.eps || inc.epsDiluted || null;
    const calcPE     = price && eps && eps > 0 ? price / eps : null;

    // Market cap: profile field or calculate from price × shares
    const shares     = inc.weightedAverageShsOut || inc.weightedAverageShsOutDil || null;
    const calcMktCap = price && shares ? price * shares : null;

    const data = {
      ticker,
      // Identity
      name:        p.companyName ?? ticker,
      sector:      p.sector      ?? null,
      industry:    p.industry    ?? null,
      description: (p.description || "").slice(0, 400),
      // Valuation — FMP ratio, then key-metrics, then calculated
      pe:          num(first(r.priceEarningsRatio, k.peRatio, calcPE)),
      pb:          num(first(r.priceToBookRatio,   k.pbRatio)),
      ps:          num(first(r.priceToSalesRatio,  k.priceToSalesRatio)),
      evEbitda:    num(first(r.enterpriseValueMultiple, k.evToEbitda, k.enterpriseValueOverEBITDA)),
      // Profitability
      roe:         pct(first(r.returnOnEquity,    k.roe, k.returnOnEquity)),
      roa:         pct(first(r.returnOnAssets,    k.roa, k.returnOnAssets)),
      grossMargin: pct(first(r.grossProfitMargin, k.grossProfitMargin)),
      netMargin:   pct(first(r.netProfitMargin,   k.netIncomePerShare && price ? k.netIncomePerShare / price : null)),
      // Growth / Health
      debtToEquity:  num(first(r.debtEquityRatio, k.debtToEquity)),
      currentRatio:  num(first(r.currentRatio,    k.currentRatio)),
      revenueGrowth: pct(k.revenueGrowth ?? null),
      // Market
      marketCap:   p.mktCap ?? p.marketCap ?? calcMktCap ?? null,
      beta:        num(p.beta),
      divYield:    pct(first(r.dividendYield, k.dividendYield)),
    };

    cache.set(ticker, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ ticker, error: "Failed to fetch" });
  }
}
