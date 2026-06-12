// api/charts.js — Intraday minute aggregates for sparkline charts
// GET /api/charts?tickers=AAPL,MSFT,NVDA

import { verifySession, parseTickers } from "../lib/apiGuard.js";

const POLYGON_BASE = "https://api.polygon.io";
const cache        = new Map();
const CACHE_TTL    = 60_000; // 1 minute

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "POLYGON_API_KEY not configured" });

  const raw     = (req.query.tickers || "").toString().trim();
  const tickers = parseTickers(raw);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers" });

  const today  = new Date().toISOString().slice(0, 10);
  const charts = {};

  await Promise.all(tickers.map(async (ticker) => {
    const key    = `${ticker}-${today}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      charts[ticker] = cached.bars;
      return;
    }

    try {
      const url  = `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/range/1/minute/${today}/${today}` +
                   `?adjusted=true&sort=asc&limit=500&apiKey=${apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) { charts[ticker] = []; return; }
      const json = await resp.json();
      const bars = (json.results || []).map(b => ({ t: b.t, c: b.c, v: b.v }));
      cache.set(key, { bars, expires: Date.now() + CACHE_TTL });
      charts[ticker] = bars;
    } catch {
      charts[ticker] = [];
    }
  }));

  return res.status(200).json({ charts });
}
