// lib/fetchPolygon.js — Polygon.io data fetchers

const BASE = "https://api.polygon.io";

// 200 days of daily OHLCV — enough for MA200 + 3-month momentum
export async function fetchAggregates(ticker, apiKey) {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 280); // ~200 trading days

  const toStr   = to.toISOString().slice(0, 10);
  const fromStr = from.toISOString().slice(0, 10);

  const url =
    `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}` +
    `?adjusted=true&sort=asc&limit=200&apiKey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.results || null;
}
