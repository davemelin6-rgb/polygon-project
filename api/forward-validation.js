// api/forward-validation.js
// GET /api/forward-validation?days=30|60|90|180
// Pulls scores from score_history N days ago, fetches current prices,
// calculates actual returns, and groups by grade.
// This is the ONLY honest model validation — predictions made without knowing outcomes.

import { verifySession } from "../lib/apiGuard.js";
import { getSupabase }   from "../lib/supabase.js";
import { fetchAggregates } from "../lib/fetchPolygon.js";

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const supabase    = getSupabase();
  const polygonKey  = process.env.POLYGON_API_KEY;
  if (!supabase || !polygonKey) return res.status(500).json({ error: "Missing config" });

  const days = parseInt(req.query.days || "30", 10);
  if (![30, 60, 90, 180].includes(days)) {
    return res.status(400).json({ error: "days must be 30, 60, 90, or 180" });
  }

  // Target date: N trading days ago (approx — use calendar days × 1.4 buffer)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - Math.round(days * 1.4));
  const targetStr = targetDate.toISOString().slice(0, 10);

  // Find the closest recorded_date at or before the target
  const { data: rows } = await supabase
    .from("score_history")
    .select("symbol, signal, grade, price, recorded_date, momentum, risk")
    .lte("recorded_date", targetStr)
    .order("recorded_date", { ascending: false })
    .limit(500);

  if (!rows || rows.length === 0) {
    return res.status(200).json({
      days,
      message: `No score history available from ${days} days ago. History starts accumulating from today — check back in ${days} days.`,
      predictions: [],
      summary: [],
    });
  }

  // Keep only the most recent record per ticker (closest to target date)
  const byTicker = {};
  for (const row of rows) {
    if (!byTicker[row.symbol]) byTicker[row.symbol] = row;
  }
  const predictions = Object.values(byTicker);

  // Fetch current prices for all tickers
  const tickers = predictions.map(p => p.symbol);
  const priceMap = {};

  await Promise.all(tickers.map(async ticker => {
    try {
      const aggs = await fetchAggregates(ticker, polygonKey, 5);
      if (aggs?.length) priceMap[ticker] = aggs.at(-1).c;
    } catch { /* skip */ }
  }));

  // Calculate returns and enrich predictions
  const results = predictions
    .map(p => {
      const currentPrice    = priceMap[p.symbol];
      const predictionPrice = p.price;
      const signal          = p.signal ?? null;
      const grade           = p.grade ?? (signal >= 70 ? "A" : signal >= 55 ? "B" : signal >= 40 ? "C" : "D");

      let returnPct = null;
      if (currentPrice && predictionPrice && predictionPrice > 0) {
        returnPct = Math.round(((currentPrice - predictionPrice) / predictionPrice) * 10000) / 100;
      }

      return {
        symbol:          p.symbol,
        predictionDate:  p.recorded_date,
        grade,
        signal,
        momentum:        p.momentum,
        risk:            p.risk,
        predictionPrice: predictionPrice ? Math.round(predictionPrice * 100) / 100 : null,
        currentPrice:    currentPrice    ? Math.round(currentPrice * 100)    / 100 : null,
        returnPct,
        won:             returnPct != null ? returnPct > 0 : null,
      };
    })
    .sort((a, b) => (b.returnPct ?? -999) - (a.returnPct ?? -999));

  // Summary by grade
  const grades = ["A", "B", "C", "D"];
  const summary = grades.map(g => {
    const gradeRows = results.filter(r => r.grade === g && r.returnPct != null);
    const avgReturn = gradeRows.length
      ? Math.round(gradeRows.reduce((s, r) => s + r.returnPct, 0) / gradeRows.length * 100) / 100
      : null;
    const wins    = gradeRows.filter(r => r.won).length;
    const winRate = gradeRows.length ? Math.round(wins / gradeRows.length * 1000) / 10 : null;

    return {
      grade:    g,
      count:    gradeRows.length,
      avgReturn,
      winRate,
      bestPick: gradeRows[0]?.symbol ?? null,
      bestReturn: gradeRows[0]?.returnPct ?? null,
    };
  });

  return res.status(200).json({
    days,
    predictionDate: predictions[0]?.recorded_date,
    totalPredictions: results.length,
    withReturns: results.filter(r => r.returnPct != null).length,
    summary,
    predictions: results,
  });
}
