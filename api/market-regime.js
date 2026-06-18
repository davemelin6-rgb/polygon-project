// api/market-regime.js
// GET /api/market-regime
// Returns current VIX, SPX, QQQ levels and overall market condition.

import { verifySession } from "../lib/apiGuard.js";

const BASE  = "https://api.polygon.io";
const CACHE = new Map();
const TTL   = 30 * 60 * 1000; // 30 min cache

async function fetchLatest(ticker, apiKey) {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 5); // last 5 calendar days ensures we get a trading day
  const url = `${BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${from.toISOString().slice(0,10)}/${to.toISOString().slice(0,10)}?adjusted=true&sort=desc&limit=1&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.results?.[0] ?? null;
}

async function fetchHistory(ticker, apiKey, days = 260) {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.round(days * 1.4));
  const url = `${BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${from.toISOString().slice(0,10)}/${to.toISOString().slice(0,10)}?adjusted=true&sort=asc&limit=${days}&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.results || [];
}

export function calcRegime(vix, spxPctFromATH, qqPctFromATH) {
  if (vix == null) return { label: "UNKNOWN", color: "#3d5c78", score: 50 };

  // VIX regime
  const vixRegime = vix < 15 ? "calm"
                  : vix < 20 ? "normal"
                  : vix < 25 ? "elevated"
                  : vix < 35 ? "high"
                  :            "crisis";

  // Index distance from ATH (negative = below ATH)
  const indexHealth = (spxPctFromATH ?? 0) > -5 && (qqPctFromATH ?? 0) > -10
    ? "extended"  // near ATH — elevated risk
    : (spxPctFromATH ?? 0) > -15
    ? "normal"
    : "correcting";

  // Combine into regime
  if (vixRegime === "crisis")                                    return { label: "CRISIS",    color: "#ff3c50", score: 10, vixRegime, indexHealth };
  if (vixRegime === "high" || indexHealth === "correcting")      return { label: "RISK-OFF",  color: "#ff3c50", score: 25, vixRegime, indexHealth };
  if (vixRegime === "elevated")                                  return { label: "CAUTION",   color: "#f59e0b", score: 50, vixRegime, indexHealth };
  if (vixRegime === "calm" && indexHealth !== "correcting")      return { label: "FAVORABLE", color: "#00dc82", score: 85, vixRegime, indexHealth };
  return                                                              { label: "NEUTRAL",    color: "#00b4ff", score: 65, vixRegime, indexHealth };
}

export function vixMomentumMultiplier(vix) {
  if (vix == null) return 1.0;
  if (vix < 15)   return 1.10;  // calm — boost momentum signals
  if (vix < 20)   return 1.00;  // normal
  if (vix < 25)   return 0.85;  // elevated — dampen 15%
  if (vix < 30)   return 0.70;  // high fear — dampen 30%
  return                  0.50; // crisis — cut in half
}

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed)                    return res.status(401).json({ error: "Unauthorized" });

  const cached = CACHE.get("regime");
  if (cached && cached.expires > Date.now()) return res.status(200).json({ cached: true, ...cached.data });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const fmpKey = process.env.FMP_API_KEY;
  const FMP    = "https://financialmodelingprep.com/stable";

  // Fetch real index data from FMP + SPY history from Polygon for ATH
  async function fmpQuote(sym) {
    if (!fmpKey) return null;
    try {
      const r = await fetch(`${FMP}/quote?symbol=${encodeURIComponent(sym)}&apikey=${fmpKey}`);
      if (!r.ok) return null;
      const j = await r.json();
      return Array.isArray(j) ? j[0] : null;
    } catch { return null; }
  }

  const [vixQ, spxQ, nasdaqQ, spyBars] = await Promise.all([
    fmpQuote("^VIX"),   // Real CBOE VIX
    fmpQuote("^GSPC"),  // Real S&P 500
    fmpQuote("^IXIC"),  // Real Nasdaq Composite
    fetchHistory("SPY", apiKey, 260), // SPY for ATH calculation
  ]);

  const vix  = vixQ?.price  ?? null;
  const spx  = spxQ?.price  ?? null;
  const nasdaq = nasdaqQ?.price ?? null;

  // ATH from SPY (scale to SPX equivalent)
  const spyATH = spyBars.length ? Math.max(...spyBars.map(d => d.h)) : null;
  const spxATH = spyATH ? spyATH * 10 : null;
  const spxPctFromATH = spx && spxATH ? ((spx - spxATH) / spxATH) * 100 : null;

  const qq    = nasdaq;
  const qqATH = null;

  const regime = calcRegime(vix, spxPctFromATH, null);

  const data = {
    vix,
    spx,
    spxATH,
    spxPctFromATH: spxPctFromATH != null ? Math.round(spxPctFromATH * 10) / 10 : null,
    qq,
    regime,
    multiplier: vixMomentumMultiplier(vix),
  };

  CACHE.set("regime", { data, expires: Date.now() + TTL });
  return res.status(200).json({ cached: false, ...data });
}
