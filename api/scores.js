// api/scores.js — Scoring engine endpoint
// GET /api/scores?tickers=AAPL,MSFT,NVDA

import { fetchAggregates }   from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechValue, calcSignal } from "../lib/formulas.js";
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
    const freshResults = await Promise.all(
      stale.map(async (ticker) => {
        const [aggs, fundamentals] = await Promise.all([
          fetchAggregates(ticker, polygonKey),
          fetchFundamentals(ticker, fmpKey),
        ]);
        const price      = aggs?.at(-1)?.c ?? null;
        const momentum   = calcMomentum({ price, aggs, fundamentals });
        const risk       = calcRisk({ aggs, fundamentals });
        const tech_value = calcTechValue({ fundamentals });
        const signal     = calcSignal({ momentum, risk, techValue: tech_value });
        return {
          symbol:           ticker,
          momentum,
          risk,
          tech_value,
          signal,
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

  const scores = tickers.map(ticker => {
    const row = existingMap[ticker];
    if (!row) return { symbol: ticker, momentum: null, risk: null, techValue: null, signal: null, hasFundamentals: false };
    return {
      symbol:          row.symbol,
      momentum:        row.momentum,
      risk:            row.risk,
      techValue:       row.tech_value,
      signal:          row.signal ?? null,
      hasFundamentals: row.has_fundamentals,
    };
  });

  return res.status(200).json({ cached: stale.length === 0, scores });
}
