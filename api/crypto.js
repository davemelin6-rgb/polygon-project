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

  // ── Live prices from Polygon crypto snapshot ───────────────
  let prices = {};
  if (_priceCache.data && _priceCache.expires > Date.now()) {
    prices = _priceCache.data;
  } else {
    try {
      const tickers = encodeURIComponent(CRYPTOS.join(","));
      const r = await fetch(`${POLYGON}/v2/snapshot/locale/global/markets/crypto/tickers?tickers=${tickers}&apiKey=${polygonKey}`);
      if (r.ok) {
        const j = await r.json();
        for (const t of j.tickers || []) {
          prices[t.ticker] = {
            symbol:        t.ticker,
            price:         t.lastTrade?.p || t.day?.c || t.prevDay?.c || null,
            changePercent: t.todaysChangePerc ?? null,
            prevClose:     t.prevDay?.c ?? null,
            volume:        t.day?.v ?? null,
          };
        }
        _priceCache.data    = prices;
        _priceCache.expires = Date.now() + PRICE_TTL;
      }
    } catch (e) {
      console.error("Crypto price fetch error:", e.message);
    }
  }

  // ── MOMENTUM + RISK scores ─────────────────────────────────
  const now    = Date.now();
  const stale  = CRYPTOS.filter(t => !_scoreCache.get(t) || _scoreCache.get(t).expires < now);

  if (stale.length > 0) {
    await Promise.all(stale.map(async (ticker) => {
      try {
        const aggs = await fetchAggregates(ticker, polygonKey);
        const price = aggs?.at(-1)?.c ?? null;
        const momentum = calcMomentum({ price, aggs });
        const risk     = calcRisk({ aggs, fundamentals: null }); // volatility-only
        const signal   = calcSignal({ momentum, risk, techValue: null });
        _scoreCache.set(ticker, {
          score: { symbol: ticker, momentum, risk, techValue: null, signal, hasFundamentals: false },
          expires: now + SCORE_TTL,
        });
      } catch (e) {
        console.error(`Crypto score error for ${ticker}:`, e.message);
      }
    }));
  }

  const result = CRYPTOS.map(ticker => ({
    ...(prices[ticker] || { symbol: ticker, price: null, changePercent: null }),
    scores: _scoreCache.get(ticker)?.score || { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null },
  }));

  return res.status(200).json({ cryptos: result });
}
