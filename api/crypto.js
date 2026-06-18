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

  // Polygon crypto snapshot requires a higher plan.
  // Use aggregates (historical OHLCV) for both prices and scoring.
  // Price = latest daily close. 24h change = (last close - prev close) / prev close.
  const now   = Date.now();
  const stale = CRYPTOS.filter(t => !_scoreCache.get(t) || _scoreCache.get(t).expires < now);

  // Always refresh prices (TTL 60s), only recalculate scores when stale (TTL 1h)
  const needsPriceRefresh = !_priceCache.data || _priceCache.expires < now;

  if (stale.length > 0 || needsPriceRefresh) {
    const toFetch = needsPriceRefresh ? CRYPTOS : stale;
    await Promise.all(toFetch.map(async (ticker) => {
      try {
        const aggs     = await fetchAggregates(ticker, polygonKey);
        const last     = aggs?.at(-1);
        const prev     = aggs?.at(-2);
        const price    = last?.c ?? null;
        const prevClose = prev?.c ?? null;
        const changePercent = price && prevClose && prevClose > 0
          ? ((price - prevClose) / prevClose) * 100 : null;

        // Store price data
        if (!_priceCache.data) _priceCache.data = {};
        _priceCache.data[ticker] = {
          symbol: ticker, price, changePercent, prevClose,
          volume: last?.v ?? null,
        };

        // Recalculate score if stale
        if (!_scoreCache.get(ticker) || _scoreCache.get(ticker).expires < now) {
          const momentum = calcMomentum({ price, aggs });
          const risk     = calcRisk({ aggs, fundamentals: null });
          const signal   = calcSignal({ momentum, risk, techValue: null });
          _scoreCache.set(ticker, {
            score: { symbol: ticker, momentum, risk, techValue: null, signal, hasFundamentals: false },
            expires: now + SCORE_TTL,
          });
        }
      } catch (e) {
        console.error(`Crypto fetch error for ${ticker}:`, e.message);
      }
    }));
    _priceCache.expires = now + PRICE_TTL;
  }

  const prices = _priceCache.data || {};

  const result = CRYPTOS.map(ticker => ({
    ...(prices[ticker] || { symbol: ticker, price: null, changePercent: null }),
    scores: _scoreCache.get(ticker)?.score || { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null },
  }));

  return res.status(200).json({ cryptos: result });
}
