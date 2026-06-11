// api/stocks.js — Polygon snapshot endpoint
// GET /api/stocks?tickers=AAPL,MSFT,NVDA

import { verifySession, parseTickers } from "../lib/apiGuard.js";

const POLYGON_BASE = "https://api.polygon.io";
const CACHE_TTL_MS = 60_000;

const cache = new Map();

export default async function handler(req, res) {
  // ── Auth guard ───────────────────────────────────────────
  const authed = await verifySession(req);
  if (!authed) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── API key ──────────────────────────────────────────────
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "POLYGON_API_KEY is not configured" });
  }

  // ── Input validation ─────────────────────────────────────
  const raw = (req.query.tickers || "").toString().trim();
  if (!raw) return res.status(400).json({ error: "Provide ?tickers=AAPL,MSFT" });

  const tickers = parseTickers(raw);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers supplied" });

  // ── Cache ────────────────────────────────────────────────
  const cacheKey = tickers.join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ cached: true, data: cached.data });
  }

  // ── Fetch from Polygon ───────────────────────────────────
  const url =
    `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers` +
    `?tickers=${encodeURIComponent(cacheKey)}&apiKey=${apiKey}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: "Polygon request failed" });
    }

    const json = await resp.json();
    const data = (json.tickers || []).map((t) => ({
      symbol:        t.ticker,
      price:         t.lastTrade?.p ?? t.day?.c ?? null,
      prevClose:     t.prevDay?.c ?? null,
      change:        t.todaysChange ?? null,
      changePercent: t.todaysChangePerc ?? null,
      volume:        t.day?.v ?? null,
      updated:       t.updated ? Math.floor(t.updated / 1_000_000) : null,
    }));

    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
    return res.status(200).json({ cached: false, data });
  } catch {
    return res.status(502).json({ error: "Failed to reach Polygon" });
  }
}
