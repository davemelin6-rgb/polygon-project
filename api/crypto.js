// api/crypto.js
// GET /api/crypto
// Live crypto prices + MOMENTUM/RISK scores via Polygon crypto endpoint

import { verifySession } from "../lib/apiGuard.js";
import { fetchAggregates } from "../lib/fetchPolygon.js";
import { calcMomentum, calcRisk, calcSignal } from "../lib/formulas.js";
import { getSupabase } from "../lib/supabase.js";

const POLYGON = "https://api.polygon.io";

const CRYPTOS = [
  "X:BTCUSD","X:ETHUSD","X:SOLUSD","X:XRPUSD","X:BNBUSD",
  "X:ADAUSD","X:AVAXUSD","X:DOGEUSD","X:DOTUSD","X:LINKUSD",
];

// In-memory cache — 60s for prices, 1h for scores
const _priceCache  = { data: null, expires: 0 };
const _scoreCache  = new Map(); // ticker → { score, expires }
const SCORE_TTL    = 60 * 60 * 1000;
const PRICE_TTL    = 60 * 1000;

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed)                    return res.status(401).json({ error: "Unauthorized" });

  const polygonKey = process.env.POLYGON_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const now = Date.now();

  // ── Step 1: Quick price fetch (last 3 days only, very fast) ──
  if (!_priceCache.data || _priceCache.expires < now) {
    const to   = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);

    // Fetch one at a time with small delay to avoid rate limiting
    const newPrices = {};
    for (const ticker of CRYPTOS) {
      try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${from}/${to}?adjusted=true&sort=desc&limit=3&apiKey=${polygonKey}`;
        const r   = await fetch(url);
        if (r.ok) {
          const j    = await r.json();
          const last = j.results?.[0];
          const prev = j.results?.[1];
          if (last) {
            const price = last.c;
            const prevClose = prev?.c ?? null;
            newPrices[ticker] = {
              symbol: ticker, price,
              changePercent: price && prevClose ? ((price - prevClose) / prevClose) * 100 : null,
              prevClose,
              volume: last.v ?? null,
            };
          }
        }
      } catch {}
    }
    _priceCache.data    = newPrices;
    _priceCache.expires = now + PRICE_TTL;
  }

  // ── Step 2: Full score calculation (200 days, cached 1h) ────
  const stale = CRYPTOS.filter(t => !_scoreCache.get(t) || _scoreCache.get(t).expires < now);
  if (stale.length > 0) {
    // Sequential to avoid rate limiting on large fetches
    for (const ticker of stale) {
      try {
        const aggs     = await fetchAggregates(ticker, polygonKey);
        const price    = _priceCache.data?.[ticker]?.price ?? aggs?.at(-1)?.c ?? null;
        const momentum = calcMomentum({ price, aggs });
        const risk     = calcRisk({ aggs, fundamentals: null });
        const signal   = calcSignal({ momentum, risk, techValue: null });
        _scoreCache.set(ticker, {
          score: { symbol: ticker, momentum, risk, techValue: null, signal, hasFundamentals: false },
          expires: now + SCORE_TTL,
        });
      } catch (e) {
        console.error(`Crypto score error for ${ticker}:`, e.message);
      }
    }
  }

  const prices = _priceCache.data || {};

  const result = CRYPTOS.map(ticker => ({
    ...(prices[ticker] || { symbol: ticker, price: null, changePercent: null }),
    scores: _scoreCache.get(ticker)?.score || { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null },
  }));

  return res.status(200).json({ cryptos: result });
}
