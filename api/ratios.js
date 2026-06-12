// api/ratios.js — Key financial ratios + company profile via FMP
// GET /api/ratios?ticker=AAPL

import { verifySession } from "../lib/apiGuard.js";

const FMP   = "https://financialmodelingprep.com/stable";
const cache = new Map();
const TTL   = 24 * 60 * 60_000; // 24h — ratios are quarterly

function pct(v) { return v != null ? +(v * 100).toFixed(2) : null; }
function num(v) { return v != null ? +Number(v).toFixed(2) : null; }

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No FMP key" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !/^[A-Z]{1,10}$/.test(ticker))
    return res.status(400).json({ error: "Invalid ticker" });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const [rRes, pRes, kRes] = await Promise.all([
      fetch(`${FMP}/ratios?symbol=${ticker}&limit=2&apikey=${apiKey}`),
      fetch(`${FMP}/profile?symbol=${ticker}&apikey=${apiKey}`),
      fetch(`${FMP}/key-metrics?symbol=${ticker}&limit=1&apikey=${apiKey}`),
    ]);

    const ratioArr   = rRes.ok ? await rRes.json() : [];
    const profileArr = pRes.ok ? await pRes.json() : [];
    const keyArr     = kRes.ok ? await kRes.json() : [];

    const r = (Array.isArray(ratioArr)   ? ratioArr[0]   : null) || {};
    const p = (Array.isArray(profileArr) ? profileArr[0] : null) || {};
    const k = (Array.isArray(keyArr)     ? keyArr[0]     : null) || {};

    const data = {
      ticker,
      // Identity
      name:        p.companyName   ?? ticker,
      sector:      p.sector        ?? null,
      industry:    p.industry      ?? null,
      description: (p.description || "").slice(0, 400),
      // Valuation
      pe:          num(r.priceEarningsRatio),
      pb:          num(r.priceToBookRatio),
      ps:          num(r.priceToSalesRatio),
      evEbitda:    num(r.enterpriseValueMultiple),
      // Profitability
      roe:         pct(r.returnOnEquity),
      roa:         pct(r.returnOnAssets),
      grossMargin: pct(r.grossProfitMargin),
      netMargin:   pct(r.netProfitMargin),
      // Growth / Health
      debtToEquity: num(r.debtEquityRatio),
      currentRatio: num(r.currentRatio),
      revenueGrowth: pct(k.revenueGrowth ?? null),
      // Market
      marketCap:   p.mktCap  ?? null,
      beta:        num(p.beta),
      divYield:    pct(r.dividendYield),
    };

    cache.set(ticker, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ ticker, error: "Failed to fetch" });
  }
}
