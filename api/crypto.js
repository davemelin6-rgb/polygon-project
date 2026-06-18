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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── Step 1 + 2 combined: fetch price + score together per ticker ──
  // Only recalculate if stale. Space out requests to avoid rate limiting.
  const stale = CRYPTOS.filter(t => !_scoreCache.get(t) || _scoreCache.get(t).expires < now);
  const needsPriceRefresh = !_priceCache.data || _priceCache.expires < now;

  if (stale.length > 0 || needsPriceRefresh) {
    if (!_priceCache.data) _priceCache.data = {};

    for (const ticker of CRYPTOS) {
      const needsScore = !_scoreCache.get(ticker) || _scoreCache.get(ticker).expires < now;
      if (!needsPriceRefresh && !needsScore) continue;

      try {
        // Fetch 200 days — used for both price (last bar) and score calculation
        const aggs  = await fetchAggregates(ticker, polygonKey);
        const last  = aggs?.at(-1);
        const prev  = aggs?.at(-2);
        const price = last?.c ?? null;

        // Price data
        if (needsPriceRefresh && price != null) {
          _priceCache.data[ticker] = {
            symbol: ticker, price,
            changePercent: price && prev?.c ? ((price - prev.c) / prev.c) * 100 : null,
            prevClose: prev?.c ?? null,
            volume:    last?.v ?? null,
          };
        }

        // Score data
        if (needsScore && aggs) {
          const momentum = calcMomentum({ price, aggs });
          const risk     = calcRisk({ aggs, fundamentals: null });
          const signal   = calcSignal({ momentum, risk, techValue: null });
          _scoreCache.set(ticker, {
            score: { symbol: ticker, momentum, risk, techValue: null, signal, hasFundamentals: false },
            expires: now + SCORE_TTL,
          });
        }
      } catch (e) {
        console.error(`Crypto error for ${ticker}:`, e.message);
      }

      // 300ms between tickers to stay well within rate limits
      await sleep(300);
    }

    if (needsPriceRefresh) _priceCache.expires = now + PRICE_TTL;
  }

  const prices = _priceCache.data || {};

  const result = CRYPTOS.map(ticker => ({
    ...(prices[ticker] || { symbol: ticker, price: null, changePercent: null }),
    scores: _scoreCache.get(ticker)?.score || { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null },
  }));

  return res.status(200).json({ cryptos: result });
}
