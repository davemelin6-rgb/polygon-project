// api/backtest-run.js
// Weekly back-test: validates MOMENTUM scoring engine against historical outcomes
// Called by Vercel Cron every Sunday 02:00 UTC — secured by CRON_SECRET

import { fetchAggregates }  from "../lib/fetchPolygon.js";
import { calcMomentum }     from "../lib/formulas.js";
import { getSupabase }      from "../lib/supabase.js";

const TICKERS = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN",
  "IONQ","RGTI","IBM","META","AMD",
  "PLTR","LMT","RTX","RKLB","ASTS",
  "LLY","NVO","MRNA","REGN","VRTX",
];

const BUCKETS = [
  { label: "Strong (>70)",  min: 70,  max: 100 },
  { label: "Neutral (40-70)", min: 40, max: 70  },
  { label: "Weak (<40)",    min: 0,   max: 40  },
];

export default async function handler(req, res) {
  // Secured — only Vercel cron or manual trigger with secret
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const allSamples = []; // { ticker, score, return30d, return60d, weeksBack }

  // Fetch 400 days of data per ticker (enough for 6 months of weekly steps + 90d history)
  await Promise.all(TICKERS.map(async (ticker) => {
    try {
      const aggs = await fetchAggregates(ticker, polygonKey, 400);
      if (!aggs || aggs.length < 120) return;

      // Step back weekly (5 trading days) for up to 24 weeks
      for (let weeksBack = 4; weeksBack <= 24; weeksBack++) {
        const cutoff = aggs.length - (weeksBack * 5);
        if (cutoff < 90) break;

        // Data as it would have looked at that historical point
        const historicalAggs = aggs.slice(0, cutoff);
        const score = calcMomentum({ price: historicalAggs.at(-1).c, aggs: historicalAggs });
        if (score === null) continue;

        // Measure actual forward returns
        const priceNow   = historicalAggs.at(-1).c;
        const price30    = aggs[cutoff + 29]?.c ?? null;
        const price60    = aggs[cutoff + 59]?.c ?? null;
        const return30d  = price30 != null ? (price30 - priceNow) / priceNow : null;
        const return60d  = price60 != null ? (price60 - priceNow) / priceNow : null;

        allSamples.push({ ticker, score, return30d, return60d, weeksBack });
      }
    } catch (e) {
      console.error(`Backtest error for ${ticker}:`, e.message);
    }
  }));

  if (!allSamples.length) {
    return res.status(500).json({ error: "No samples collected" });
  }

  // Group samples into buckets and calculate average returns
  const bucketResults = BUCKETS.map(bucket => {
    const samples = allSamples.filter(s => s.score >= bucket.min && s.score < bucket.max);
    const with30  = samples.filter(s => s.return30d !== null);
    const with60  = samples.filter(s => s.return60d !== null);

    const avg30d = with30.length
      ? with30.reduce((sum, s) => sum + s.return30d, 0) / with30.length
      : null;
    const avg60d = with60.length
      ? with60.reduce((sum, s) => sum + s.return60d, 0) / with60.length
      : null;

    // Win rate: % of samples where 30d return was positive
    const wins   = with30.filter(s => s.return30d > 0).length;
    const winRate = with30.length ? wins / with30.length : null;

    return {
      bucket:      bucket.label,
      samples:     samples.length,
      avg30d:      avg30d != null ? Math.round(avg30d * 10000) / 100 : null, // as %
      avg60d:      avg60d != null ? Math.round(avg60d * 10000) / 100 : null,
      winRate:     winRate != null ? Math.round(winRate * 1000) / 10 : null, // as %
    };
  });

  // Overall correlation: does higher score = higher 30d return?
  const samplesWithReturn = allSamples.filter(s => s.return30d !== null);
  const correlation = pearsonCorrelation(
    samplesWithReturn.map(s => s.score),
    samplesWithReturn.map(s => s.return30d)
  );

  // Verdict
  const strongBucket  = bucketResults.find(b => b.bucket.startsWith("Strong"));
  const weakBucket    = bucketResults.find(b => b.bucket.startsWith("Weak"));
  const spread        = (strongBucket?.avg30d ?? 0) - (weakBucket?.avg30d ?? 0);
  const verdict = spread > 3  ? "PREDICTIVE"
                : spread > 0  ? "WEAK_SIGNAL"
                :               "NOT_PREDICTIVE";

  const result = {
    run_date:     new Date().toISOString(),
    tickers:      TICKERS.length,
    total_samples: allSamples.length,
    correlation:  Math.round(correlation * 1000) / 1000,
    verdict,
    spread_pct:   Math.round(spread * 100) / 100,
    buckets:      bucketResults,
  };

  // Save to Supabase
  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("backtest_results").insert(result);
  }

  console.log(`Backtest complete: ${verdict}, spread=${spread.toFixed(2)}%, correlation=${correlation.toFixed(3)}, samples=${allSamples.length}`);
  return res.status(200).json(result);
}

// Pearson correlation coefficient
function pearsonCorrelation(xs, ys) {
  const n    = xs.length;
  if (n < 2)  return 0;
  const mx   = xs.reduce((a, b) => a + b, 0) / n;
  const my   = ys.reduce((a, b) => a + b, 0) / n;
  const num  = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const denX = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
  const denY = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
  return denX && denY ? num / (denX * denY) : 0;
}
