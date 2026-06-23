// api/scores.js — Scoring engine endpoint
// GET /api/scores?tickers=AAPL,MSFT,NVDA

import { fetchAggregates }   from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechValue, calcInnovation, calcSignal, calcSignalBreakdown } from "../lib/formulas.js";
import { getSectorBenchmarks, getSectorPE } from "../lib/sectorBenchmarks.js";

// Fetch current VIX once per scores request (shared across all tickers)
let _vixCache = null;
async function getVix(polygonKey) {
  if (_vixCache && _vixCache.expires > Date.now()) return _vixCache.value;
  try {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 5);
    const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/I:VIX/range/1/day/${from.toISOString().slice(0,10)}/${to.toISOString().slice(0,10)}?adjusted=true&sort=desc&limit=1&apiKey=${polygonKey}`);
    if (!res.ok) return null;
    const json = await res.json();
    const vix  = json.results?.[0]?.c ?? null;
    _vixCache  = { value: vix, expires: Date.now() + 30 * 60 * 1000 };
    return vix;
  } catch { return null; }
}
import { getSupabase } from "../lib/supabase.js";
import { verifySession, parseTickers } from "../lib/apiGuard.js";

const STALE_MS = 60 * 60 * 1000; // 1 hour — scores refresh hourly

export default async function handler(req, res) {
  // ── Auth guard ───────────────────────────────────────────
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests — slow down" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  // ── API keys ─────────────────────────────────────────────
  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;

  if (!polygonKey) {
    return res.status(500).json({ error: "POLYGON_API_KEY is not configured" });
  }

  // ── Input validation ─────────────────────────────────────
  const raw = (req.query.tickers || "").toString().trim();
  if (!raw) return res.status(400).json({ error: "Provide ?tickers=AAPL,MSFT" });

  const tickers = parseTickers(raw);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers supplied" });

  const supabase = getSupabase();
  const cutoff   = Date.now() - STALE_MS;

  // ── Read from Supabase cache ─────────────────────────────
  let existingMap = {};
  if (supabase) {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .in("symbol", tickers);
    existingMap = Object.fromEntries((data || []).map(r => [r.symbol, r]));
  }

  // ── Recalculate stale tickers ────────────────────────────
  const stale = tickers.filter(ticker => {
    const row = existingMap[ticker];
    if (!row) return true;
    return new Date(row.calculated_at).getTime() < cutoff;
  });

  if (stale.length > 0) {
    const vix = await getVix(polygonKey);

    const freshResults = await Promise.all(
      stale.map(async (ticker) => {
        const [aggs, fundamentals] = await Promise.all([
          fetchAggregates(ticker, polygonKey),
          fetchFundamentals(ticker, fmpKey),
        ]);
        const price      = aggs?.at(-1)?.c ?? null;
        const benchmarks = getSectorBenchmarks(ticker);
        const sectorPE   = getSectorPE(ticker);
        const momentum   = calcMomentum({ price, aggs, fundamentals, vix });
        const risk       = calcRisk({ aggs, fundamentals });
        const tech_value = calcTechValue({ fundamentals, benchmarks });
        const innovation = calcInnovation({ fundamentals, benchmarks });
        const breakdown  = calcSignalBreakdown({ fundamentals, sectorPE });
        const signal     = calcSignal({ momentum, risk, techValue: tech_value, innovation });
        return {
          symbol:           ticker,
          momentum,
          risk,
          tech_value,
          innovation,
          signal,
          breakdown:        breakdown ? JSON.stringify(breakdown) : null,
          has_fundamentals: !!fundamentals,
          calculated_at:    new Date().toISOString(),
        };
      })
    );

    if (supabase) {
      const validResults = freshResults.filter(r => r.momentum !== null);
      if (validResults.length > 0) {
        await supabase
          .from("scores")
          .upsert(validResults, { onConflict: "symbol" });

        // Write one snapshot per ticker per day to score_history
        const today = new Date().toISOString().slice(0, 10);
        const historyRows = validResults.map(r => ({
          symbol:        r.symbol,
          momentum:      r.momentum,
          risk:          r.risk,
          tech_value:    r.tech_value,
          signal:        r.signal,
          recorded_date: today,
        }));
        await supabase
          .from("score_history")
          .upsert(historyRows, { onConflict: "symbol,recorded_date", ignoreDuplicates: true });
      }
    }

    for (const row of freshResults) {
      existingMap[row.symbol] = row;
    }
  }

  // Fetch 7-day-old scores for delta display
  let historyMap = {};
  if (supabase) {
    const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: hist } = await supabase
      .from("score_history")
      .select("symbol, momentum, risk, tech_value, signal, recorded_date")
      .in("symbol", tickers)
      .lte("recorded_date", sevenAgo)
      .order("recorded_date", { ascending: false });
    // Take most recent record per ticker that's at least 7 days old
    for (const row of hist || []) {
      if (!historyMap[row.symbol]) historyMap[row.symbol] = row;
    }
  }

  const scores = tickers.map(ticker => {
    const row  = existingMap[ticker];
    const hist = historyMap[ticker];
    if (!row) return { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null, hasFundamentals: false };

    const delta = (curr, prev) => curr != null && prev != null ? curr - prev : null;

    return {
      symbol:          row.symbol,
      momentum:        row.momentum,
      risk:            row.risk,
      techValue:       row.tech_value,
      innovation:      row.innovation,
      signal:          row.signal ?? null,
      hasFundamentals: row.has_fundamentals,
      breakdown:       row.breakdown ?? null,
      deltas: {
        momentum:  delta(row.momentum,    hist?.momentum),
        risk:      delta(row.risk,        hist?.risk),
        techValue: delta(row.tech_value,  hist?.tech_value),
        innovation:delta(row.innovation,  hist?.innovation),
        signal:    delta(row.signal,      hist?.signal),
      },
    };
  });

  return res.status(200).json({ cached: stale.length === 0, scores });
}
