// lib/fetchPolygon.js — Polygon.io data fetchers

const BASE = "https://api.polygon.io";

// Fetches daily OHLCV — defaults to 200 trading days, pass days=400 for back-testing
export async function fetchAggregates(ticker, apiKey, days = 200) {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.round(days * 1.4)); // calendar days buffer

  const toStr   = to.toISOString().slice(0, 10);
  const fromStr = from.toISOString().slice(0, 10);

  const url =
    `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}` +
    `?adjusted=true&sort=asc&limit=${days}&apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.results || null;
}
