// api/sector-scores.js
// GET /api/sector-scores?sector=ai
// Returns all scores for a sector with ranks, percentiles, and peer comparison.

import { fetchAggregates }    from "../lib/fetchPolygon.js";
import { fetchFundamentals }  from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechValue, calcSignal } from "../lib/formulas.js";
import { getSectorBenchmarks } from "../lib/sectorBenchmarks.js";
import { getSupabase }       from "../lib/supabase.js";
import { verifySession }     from "../lib/apiGuard.js";

const SECTORS = {
  quantum:  ["IONQ","RGTI","QUBT","IBM","GOOGL","MSFT"],
  ai:       ["NVDA","AMD","META","MSFT","PLTR","AI","SMCI"],
  defence:  ["LMT","RTX","NOC","GD","RKLB","ASTS","KTOS"],
  biotech:  ["LLY","NVO","MRNA","REGN","VRTX","GILD","ISRG"],
};

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed)                    return res.status(401).json({ error: "Unauthorized" });

  const sector = (req.query.sector || "").toLowerCase();
  const tickers = SECTORS[sector];
  if (!tickers) return res.status(400).json({ error: `Unknown sector. Valid: ${Object.keys(SECTORS).join(", ")}` });

  // Cache per sector
  const cached = CACHE.get(sector);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ cached: true, ...cached.data });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;

  // Try to read from Supabase first (fresh = within 1 hour)
  const supabase  = getSupabase();
  let dbScores    = {};
  if (supabase) {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("scores")
      .select("*")
      .in("symbol", tickers)
      .gte("calculated_at", cutoff);
    for (const row of data || []) dbScores[row.symbol] = row;
  }

  // Recalculate any missing/stale tickers
  const stale = tickers.filter(t => !dbScores[t]);
  if (stale.length > 0) {
    await Promise.all(stale.map(async (ticker) => {
      try {
        const [aggs, fundamentals] = await Promise.all([
          fetchAggregates(ticker, polygonKey),
          fetchFundamentals(ticker, fmpKey),
        ]);
        const benchmarks = getSectorBenchmarks(ticker);
        const momentum   = calcMomentum({ price: aggs?.at(-1)?.c ?? null, aggs });
        const risk       = calcRisk({ aggs, fundamentals });
        const tech_value = calcTechValue({ fundamentals, benchmarks });
        const signal     = calcSignal({ momentum, risk, techValue: tech_value });
        const row = { symbol: ticker, momentum, risk, tech_value, signal, has_fundamentals: !!fundamentals, calculated_at: new Date().toISOString() };
        dbScores[ticker] = row;
        if (supabase && momentum !== null) {
          await supabase.from("scores").upsert(row, { onConflict: "symbol" });
        }
      } catch (e) {
        console.error(`sector-scores error for ${ticker}:`, e.message);
      }
    }));
  }

  // Build scored list
  const scored = tickers.map(t => {
    const r = dbScores[t] || {};
    return {
      symbol:          t,
      momentum:        r.momentum        ?? null,
      risk:            r.risk            ?? null,
      techValue:       r.tech_value      ?? null,
      signal:          r.signal          ?? null,
      hasFundamentals: r.has_fundamentals ?? false,
    };
  });

  // Compute sector stats per score dimension
  const stats = computeStats(scored);

  // Add rank, percentile, delta, z-score per stock
  const ranked = scored.map(s => ({
    ...s,
    ranks:      {
      momentum:  rank(s.momentum,  scored.map(x => x.momentum)),
      risk:      rank(s.risk,      scored.map(x => x.risk)),
      techValue: rank(s.techValue, scored.map(x => x.techValue)),
      signal:    rank(s.signal,    scored.map(x => x.signal)),
    },
    percentiles: {
      momentum:  percentile(s.momentum,  scored.map(x => x.momentum)),
      risk:      percentile(s.risk,      scored.map(x => x.risk)),
      techValue: percentile(s.techValue, scored.map(x => x.techValue)),
      signal:    percentile(s.signal,    scored.map(x => x.signal)),
    },
    deltas: {
      momentum:  delta(s.momentum,  stats.momentum.avg),
      risk:      delta(s.risk,      stats.risk.avg),
      techValue: delta(s.techValue, stats.techValue.avg),
      signal:    delta(s.signal,    stats.signal.avg),
    },
    zScores: {
      momentum:  zScore(s.momentum,  stats.momentum.avg,  stats.momentum.std),
      risk:      zScore(s.risk,      stats.risk.avg,      stats.risk.std),
      techValue: zScore(s.techValue, stats.techValue.avg, stats.techValue.std),
      signal:    zScore(s.signal,    stats.signal.avg,    stats.signal.std),
    },
  })).sort((a, b) => (b.signal ?? 0) - (a.signal ?? 0));

  const result = { sector, tickers: ranked, stats };
  CACHE.set(sector, { data: result, expires: Date.now() + CACHE_TTL });
  return res.status(200).json({ cached: false, ...result });
}

// ── Stats helpers ────────────────────────────────────────────
function validValues(arr) { return arr.filter(v => v != null); }

function computeStats(scored) {
  const keys = ["momentum", "risk", "techValue", "signal"];
  const out  = {};
  for (const key of keys) {
    const vals = validValues(scored.map(s => s[key]));
    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const std  = vals.length > 1
      ? Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length)
      : null;
    out[key] = {
      avg:  avg != null ? Math.round(avg * 10) / 10 : null,
      std:  std != null ? Math.round(std * 10) / 10 : null,
      min:  vals.length ? Math.min(...vals) : null,
      max:  vals.length ? Math.max(...vals) : null,
    };
  }
  return out;
}

function rank(value, allValues) {
  if (value == null) return null;
  const valid = validValues(allValues).sort((a, b) => b - a);
  return valid.indexOf(value) + 1;
}

function percentile(value, allValues) {
  if (value == null) return null;
  const valid = validValues(allValues);
  const below = valid.filter(v => v < value).length;
  return Math.round((below / valid.length) * 100);
}

function delta(value, avg) {
  if (value == null || avg == null) return null;
  return Math.round((value - avg) * 10) / 10;
}

function zScore(value, avg, std) {
  if (value == null || avg == null || !std) return null;
  return Math.round(((value - avg) / std) * 100) / 100;
}
