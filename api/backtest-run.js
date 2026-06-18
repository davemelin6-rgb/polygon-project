// api/backtest-run.js
// Weekly back-test: validates MOMENTUM scoring engine against historical outcomes
// Called by Vercel Cron every Sunday 02:00 UTC — secured by CRON_SECRET

import { fetchAggregates }  from "../lib/fetchPolygon.js";
import { calcMomentum }     from "../lib/formulas.js";
import { getSupabase }      from "../lib/supabase.js";

const TICKERS = [
  // Growth / Tech (original)
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","AMD","PLTR","IBM",
  // Quantum / Space / Defence
  "IONQ","RGTI","LMT","RTX","RKLB","ASTS","NOC","GD",
  // Biotech
  "LLY","NVO","MRNA","REGN","VRTX","GILD","ISRG",
  // Financials / Value
  "JPM","BAC","GS","V","MA","BRK-B","WFC","C",
  // Energy
  "XOM","CVX","COP","SLB",
  // Consumer / Retail
  "WMT","COST","HD","TGT","MCD",
  // Healthcare (non-biotech)
  "UNH","JNJ","ABT","PFE",
  // Industrials
  "CAT","GE","HON","DE",
  // Other large-cap
  "TSLA","NFLX","DIS","PYPL","INTC","AVGO",
];

const BUCKETS = [
  { label: "Strong (>70)",  min: 70,  max: 100 },
  { label: "Neutral (40-70)", min: 40, max: 70  },
  { label: "Weak (<40)",    min: 0,   max: 40  },
];

export default async function handler(req, res) {
  // Secured — only Vercel cron or manual trigger with secret
  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const allSamples = []; // { ticker, score, return30d, return60d, weeksBack }

  // Fetch 400 days of data per ticker (enough for 6 months of weekly steps + 90d history)
  // Fetch historical VIX for regime-adjusted back-test
  let vixHistory = [];
  try {
    const vixAggs = await fetchAggregates("I:VIX", polygonKey, 400);
    vixHistory = vixAggs || [];
  } catch {}

  await Promise.all(TICKERS.map(async (ticker) => {
    try {
      const aggs = await fetchAggregates(ticker, polygonKey, 500);
      if (!aggs || aggs.length < 120) return;

      // Only include stocks with solid fundamentals (RISK > 50)
      const currentRisk = await (async () => {
        try {
          const { fetchFundamentals } = await import("../lib/fetchFMP.js");
          const { calcRisk } = await import("../lib/formulas.js");
          const fund = await fetchFundamentals(ticker, process.env.FMP_API_KEY);
          return calcRisk({ aggs, fundamentals: fund });
        } catch { return null; }
      })();

      if (currentRisk !== null && currentRisk < 35) {
        console.log(`Skipping ${ticker} — RISK score ${currentRisk} below threshold`);
        return;
      }

      // Step back weekly (5 trading days) for up to 24 weeks
      for (let weeksBack = 4; weeksBack <= 24; weeksBack++) {
        const cutoff = aggs.length - (weeksBack * 5);
        if (cutoff < 90) break;

        // Get VIX at this historical point (same index offset)
        const vixCutoff = vixHistory.length - (weeksBack * 5);
        const historicalVix = vixCutoff > 0 ? vixHistory[vixCutoff]?.c ?? null : null;

        // Data as it would have looked at that historical point
        const historicalAggs = aggs.slice(0, cutoff);
        const score = calcMomentum({ price: historicalAggs.at(-1).c, aggs: historicalAggs, vix: historicalVix });
        if (score === null) continue;

        // Measure actual forward returns — 30, 60, 90, 180 days
        const priceNow    = historicalAggs.at(-1).c;
        const price30     = aggs[cutoff + 29]?.c  ?? null;
        const price60     = aggs[cutoff + 59]?.c  ?? null;
        const price90     = aggs[cutoff + 89]?.c  ?? null;
        const price180    = aggs[cutoff + 179]?.c ?? null;
        const return30d   = price30  != null ? (price30  - priceNow) / priceNow : null;
        const return60d   = price60  != null ? (price60  - priceNow) / priceNow : null;
        const return90d   = price90  != null ? (price90  - priceNow) / priceNow : null;
        const return180d  = price180 != null ? (price180 - priceNow) / priceNow : null;

        allSamples.push({ ticker, score, return30d, return60d, return90d, return180d, weeksBack });
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
    const with30  = samples.filter(s => s.return30d  !== null);
    const with60  = samples.filter(s => s.return60d  !== null);
    const with90  = samples.filter(s => s.return90d  !== null);
    const with180 = samples.filter(s => s.return180d !== null);

    const avg = (arr, key) => arr.length
      ? Math.round(arr.reduce((sum, s) => sum + s[key], 0) / arr.length * 10000) / 100
      : null;

    const wins    = with30.filter(s => s.return30d > 0).length;
    const winRate = with30.length ? Math.round(wins / with30.length * 1000) / 10 : null;

    return {
      bucket:   bucket.label,
      samples:  samples.length,
      avg30d:   avg(with30,  "return30d"),
      avg60d:   avg(with60,  "return60d"),
      avg90d:   avg(with90,  "return90d"),
      avg180d:  avg(with180, "return180d"),
      winRate,
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
  // Use 90d spread as primary verdict signal — more meaningful than 30d
  const spread90  = (strongBucket?.avg90d  ?? 0) - (weakBucket?.avg90d  ?? 0);
  const spread30  = (strongBucket?.avg30d  ?? 0) - (weakBucket?.avg30d  ?? 0);
  const spread    = spread90 !== 0 ? spread90 : spread30;
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
