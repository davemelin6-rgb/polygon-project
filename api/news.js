// api/news.js — Stock news via Polygon /v2/reference/news
// GET /api/news?tickers=AAPL,MSFT   (up to 5 tickers)

import { verifySession, parseTickers } from "../lib/apiGuard.js";

const POLYGON = "https://api.polygon.io";
const cache   = new Map();
const TTL     = 5 * 60_000;
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No Polygon key" });

  const tickers = parseTickers(req.query.tickers).slice(0, 5);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers" });

  const key = tickers.join(",");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const cutoff = Date.now() - TWO_DAYS;

    const results = await Promise.all(
      tickers.map(ticker =>
        fetch(`${POLYGON}/v2/reference/news?ticker=${ticker}&limit=5&order=desc&sort=published_utc&apiKey=${apiKey}`)
          .then(r => r.ok ? r.json() : { results: [] })
          .then(j => (j.results || []).map(a => ({
            symbol:    ticker,
            title:     a.title,
            snippet:   a.description ? a.description.slice(0, 500).trimEnd() : "",
            url:       a.article_url,
            published: a.published_utc,
            source:    a.publisher?.name || "",
            image:     a.image_url || null,
          })))
          .catch(() => [])
      )
    );

    const seenUrls = new Set();
    const news = results
      .flat()
      .filter(a => a.published && new Date(a.published).getTime() > cutoff && !seenUrls.has(a.url) && seenUrls.add(a.url))
      .sort((a, b) => new Date(b.published) - new Date(a.published))
      .slice(0, 20);

    const data = { news };
    cache.set(key, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ news: [] });
  }
}
