// api/scores.js — Scoring engine endpoint
// GET /api/scores?tickers=AAPL,MSFT,NVDA
// Reads from Supabase first. Recalculates only if scores are missing or older than 24h.

import { fetchAggregates }   from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechValue } from "../lib/formulas.js";
import { getSupabase } from "../lib/supabase.js";

const STALE_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;

  if (!polygonKey) {
    return res.status(500).json({ error: "POLYGON_API_KEY is not configured" });
  }

  const raw = (req.query.tickers || "").toString().trim();
  if (!raw) return res.status(400).json({ error: "Provide ?tickers=AAPL,MSFT" });

  const tickers = raw.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
  if (!tickers.length) return res.status(400).json({ error: "No valid tickers supplied" });

  const supabase = getSupabase();
  const cutoff   = Date.now() - STALE_MS;

  // Try reading from Supabase if available
  let existingMap = {};
  if (supabase) {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .in("symbol", tickers);
    existingMap = Object.fromEntries((data || []).map(r => [r.symbol, r]));
  }

  // Determine which tickers need recalculating
  const stale = tickers.filter(ticker => {
    const row = existingMap[ticker];
    if (!row) return true;
    return new Date(row.calculated_at).getTime() < cutoff;
  });

  // Recalculate stale tickers
  if (stale.length > 0) {
    const freshResults = await Promise.all(
      stale.map(async (ticker) => {
        const [aggs, fundamentals] = await Promise.all([
          fetchAggregates(ticker, polygonKey),
          fetchFundamentals(ticker, fmpKey),
        ]);
        const price = aggs?.at(-1)?.c ?? null;
        return {
          symbol:           ticker,
          momentum:         calcMomentum({ price, aggs }),
          risk:             calcRisk({ aggs, fundamentals }),
          tech_value:       calcTechValue({ fundamentals }),
          has_fundamentals: !!fundamentals,
          calculated_at:    new Date().toISOString(),
        };
      })
    );

    // Save to Supabase only if we got real data
    if (supabase) {
      const validResults = freshResults.filter(r => r.momentum !== null);
      if (validResults.length > 0) {
        await supabase
          .from("scores")
          .upsert(validResults, { onConflict: "symbol" });
      }
    }

    for (const row of freshResults) {
      existingMap[row.symbol] = row;
    }
  }

  const scores = tickers.map(ticker => {
    const row = existingMap[ticker];
    if (!row) return { symbol: ticker, momentum: null, risk: null, techValue: null, hasFundamentals: false };
    return {
      symbol:          row.symbol,
      momentum:        row.momentum,
      risk:            row.risk,
      techValue:       row.tech_value,
      hasFundamentals: row.has_fundamentals,
    };
  });

  return res.status(200).json({ cached: stale.length === 0, scores });
}
