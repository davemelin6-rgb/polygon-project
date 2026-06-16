// api/analyst.js — Analyst consensus + price targets via FMP
// GET /api/analyst?ticker=AAPL

import { verifySession } from "../lib/apiGuard.js";

const FMP   = "https://financialmodelingprep.com/stable";
const cache = new Map();
const TTL   = 24 * 60 * 60_000; // 24h — analyst ratings update infrequently

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No FMP key" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !/^[A-Z]{1,10}$/.test(ticker))
    return res.status(400).json({ error: "Invalid ticker" });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const [recRes, ptRes, surpriseRes] = await Promise.all([
      fetch(`${FMP}/analyst-stock-recommendations?symbol=${ticker}&limit=1&apikey=${apiKey}`),
      fetch(`${FMP}/price-target-consensus?symbol=${ticker}&apikey=${apiKey}`),
      fetch(`${FMP}/earnings-surprises?symbol=${ticker}&limit=4&apikey=${apiKey}`),
    ]);

    const recArr      = recRes.ok      ? await recRes.json()      : [];
    const ptArr       = ptRes.ok       ? await ptRes.json()       : [];
    const surpriseArr = surpriseRes.ok ? await surpriseRes.json() : [];

    const rec = (Array.isArray(recArr) ? recArr[0] : recArr) || {};
    const pt  = (Array.isArray(ptArr)  ? ptArr[0]  : ptArr)  || {};

    const strongBuy = rec.strongBuy  || rec.strong_buy  || 0;
    const buy       = rec.buy        || 0;
    const hold      = rec.hold       || 0;
    const sell      = rec.sell       || 0;
    const strongSell= rec.strongSell || rec.strong_sell || 0;
    const total     = strongBuy + buy + hold + sell + strongSell;

    const surprises = (Array.isArray(surpriseArr) ? surpriseArr : []).map(s => ({
      date:      s.date,
      estimated: s.estimatedEarning ?? s.estimatedEps ?? null,
      actual:    s.actualEarningResult ?? s.actualEps ?? null,
    }));

    const data = {
      ticker,
      consensus: {
        strongBuy, buy, hold, sell, strongSell, total,
        rating: total === 0 ? null
          : (strongBuy + buy) / total > 0.6 ? "BUY"
          : (sell + strongSell) / total > 0.4 ? "SELL"
          : "HOLD",
      },
      priceTarget: {
        high:   pt.targetHigh   ?? pt.priceTargetHigh   ?? null,
        low:    pt.targetLow    ?? pt.priceTargetLow    ?? null,
        mean:   pt.targetMean   ?? pt.priceTargetAverage ?? pt.targetConsensus ?? null,
        median: pt.targetMedian ?? null,
      },
      surprises,
    };

    cache.set(ticker, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ ticker, consensus: null, priceTarget: null, surprises: [] });
  }
}
