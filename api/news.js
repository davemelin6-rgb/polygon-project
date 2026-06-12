// api/news.js — Stock news via FMP /stable/stock_news
// GET /api/news?tickers=AAPL,MSFT   (up to 5 tickers)

import { verifySession, parseTickers } from "../lib/apiGuard.js";

const FMP   = "https://financialmodelingprep.com/stable";
const cache = new Map();
const TTL   = 5 * 60_000;

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No FMP key" });

  const tickers = parseTickers(req.query.tickers).slice(0, 5);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers" });

  const key = tickers.join(",");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const url = `${FMP}/stock_news?tickers=${key}&limit=20&apikey=${apiKey}`;
    const r   = await fetch(url);
    const arr = r.ok ? await r.json() : [];

    const news = (Array.isArray(arr) ? arr : []).map(a => ({
      symbol:  a.symbol,
      title:   a.title,
      snippet: (a.text || "").slice(0, 180).trimEnd(),
      url:     a.url,
      published: a.publishedDate,
      source:  a.site,
      image:   a.image || null,
    }));

    const data = { news };
    cache.set(key, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ news: [] });
  }
}
