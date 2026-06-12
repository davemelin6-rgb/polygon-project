// api/technicals.js — Technical indicators via Polygon /v1/indicators/
// GET /api/technicals?ticker=AAPL
// Returns: RSI(14), SMA(50), SMA(200), MACD(12,26,9) + derived signal

import { verifySession } from "../lib/apiGuard.js";

const POLY = "https://api.polygon.io";
const cache = new Map();
const TTL   = 5 * 60_000;

async function fetchVal(path, apiKey) {
  try {
    const r = await fetch(`${POLY}${path}&apiKey=${apiKey}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.results?.values?.[0] ?? null;
  } catch { return null; }
}

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No API key" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !/^[A-Z]{1,10}$/.test(ticker))
    return res.status(400).json({ error: "Invalid ticker" });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  const base = `?timespan=day&adjusted=true&series_type=close&order=desc&limit=1`;

  const [rsiRaw, sma50Raw, sma200Raw, macdRaw, ema20Raw] = await Promise.all([
    fetchVal(`/v1/indicators/rsi/${ticker}${base}&window=14`,     apiKey),
    fetchVal(`/v1/indicators/sma/${ticker}${base}&window=50`,     apiKey),
    fetchVal(`/v1/indicators/sma/${ticker}${base}&window=200`,    apiKey),
    fetchVal(`/v1/indicators/macd/${ticker}${base}&short_window=12&long_window=26&signal_window=9`, apiKey),
    fetchVal(`/v1/indicators/ema/${ticker}${base}&window=20`,     apiKey),
  ]);

  const data = {
    ticker,
    rsi:    rsiRaw?.value    ?? null,
    sma50:  sma50Raw?.value  ?? null,
    sma200: sma200Raw?.value ?? null,
    ema20:  ema20Raw?.value  ?? null,
    macd: macdRaw ? {
      value:     macdRaw.value,
      signal:    macdRaw.signal,
      histogram: macdRaw.histogram,
    } : null,
  };

  cache.set(ticker, { data, expires: Date.now() + TTL });
  return res.status(200).json(data);
}
