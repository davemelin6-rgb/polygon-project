// api/stocks.js — BriefMe market data endpoint (Polygon.io Stocks Starter)
//
// GET /api/stocks?tickers=AAPL,MSFT,NVDA
// Returns delayed (~15 min) snapshot data: price, prev close, change, change %.

const POLYGON_BASE = "https://api.polygon.io";
const CACHE_TTL_MS = 60_000;

// Module-level cache — persists across requests on a warm Vercel instance.
const cache = new Map();

export default async function handler(req, res) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "POLYGON_API_KEY is not configured" });
  }

  const raw = (req.query.tickers || "").toString().trim();
  if (!raw) {
    return res.status(400).json({ error: "Provide ?tickers=AAPL,MSFT" });
  }

  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return res.status(400).json({ error: "No valid tickers supplied" });
  }

  const cacheKey = tickers.join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ cached: true, data: cached.data });
  }

  const url =
    `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers` +
    `?tickers=${encodeURIComponent(cacheKey)}&apiKey=${apiKey}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.text();
      return res.status(resp.status).json({ error: "Polygon request failed", detail: body });
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
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Polygon", detail: String(err) });
  }
}
