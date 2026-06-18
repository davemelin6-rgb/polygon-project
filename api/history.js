// api/history.js — Historical price bars for the chart panel
// GET /api/history?ticker=AAPL&range=1D|1W|1M|3M|1Y|5Y

import { verifySession } from "../lib/apiGuard.js";

const POLYGON_BASE  = "https://api.polygon.io";
const VALID_RANGES  = new Set(["1D","1W","1M","3M","1Y","5Y"]);
const TICKER_RE     = /^([A-Z]{1,10}|X:[A-Z]{1,10}USD)$/; // stocks + crypto (X:BTCUSD)
const cache         = new Map();

const TTL = { "1D": 60_000, "1W": 5*60_000, "1M": 15*60_000, "3M": 15*60_000, "1Y": 60*60_000, "5Y": 60*60_000 };

function rangeParams(range) {
  const now  = new Date();
  const to   = now.toISOString().slice(0, 10);
  let from, multiplier, timespan;

  if (range === "1D") {
    from = to; multiplier = 1; timespan = "minute";
  } else if (range === "1W") {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    from = d.toISOString().slice(0, 10); multiplier = 30; timespan = "minute";
  } else if (range === "1M") {
    const d = new Date(now); d.setMonth(d.getMonth() - 1);
    from = d.toISOString().slice(0, 10); multiplier = 1; timespan = "day";
  } else if (range === "3M") {
    const d = new Date(now); d.setMonth(d.getMonth() - 3);
    from = d.toISOString().slice(0, 10); multiplier = 1; timespan = "day";
  } else if (range === "1Y") {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
    from = d.toISOString().slice(0, 10); multiplier = 1; timespan = "day";
  } else { // 5Y
    const d = new Date(now); d.setFullYear(d.getFullYear() - 5);
    from = d.toISOString().slice(0, 10); multiplier = 1; timespan = "week";
  }

  return { from, to, multiplier, timespan };
}

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "POLYGON_API_KEY not configured" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) return res.status(400).json({ error: "Invalid ticker" });

  const range = (req.query.range || "1D").toString().toUpperCase();
  if (!VALID_RANGES.has(range)) return res.status(400).json({ error: "Invalid range" });

  const cacheKey = `${ticker}-${range}-${new Date().toISOString().slice(0, 10)}`;
  const cached   = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ bars: cached.bars, cached: true });
  }

  const { from, to, multiplier, timespan } = rangeParams(range);
  const baseUrl =
    `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}` +
    `?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`;

  try {
    // Paginate through all results — Polygon caps each response; follow next_url
    let allBars = [];
    let nextUrl = baseUrl;
    let pages   = 0;
    while (nextUrl && pages < 5) {
      const resp = await fetch(nextUrl);
      if (!resp.ok) break;
      const json = await resp.json();
      const chunk = (json.results || []).map(b => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
      allBars = allBars.concat(chunk);
      // next_url already contains all params except apiKey
      nextUrl = json.next_url ? `${json.next_url}&apiKey=${apiKey}` : null;
      pages++;
    }
    cache.set(cacheKey, { bars: allBars, expires: Date.now() + TTL[range] });
    return res.status(200).json({ bars: allBars, cached: false });
  } catch {
    return res.status(200).json({ bars: [] });
  }
}
