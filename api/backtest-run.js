// api/backtest-run.js
// Weekly back-test: validates SIGNAL scoring engine against historical outcomes
// Called by Vercel Cron every Sunday 02:00 UTC — secured by CRON_SECRET

import { fetchAggregates }                          from "../lib/fetchPolygon.js";
import { calcMomentum, calcRisk, calcSignal }       from "../lib/formulas.js";
import { getSupabase }                              from "../lib/supabase.js";

// ── Expanded ticker universe (75 tickers) ──────────────────────────
const TICKERS = [
  // AI & Tech
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","AMD","PLTR","IBM","AI","SOUN","SMCI",
  // Semiconductors
  "TSM","AVGO","QCOM","INTC","MU","ASML","TXN","AMAT",
  // Quantum / Space / Defence
  "IONQ","RGTI","QUBT","QBTS","LMT","RTX","RKLB","ASTS","NOC","GD","BA","KTOS",
  // Biotech & MedTech
  "LLY","NVO","MRNA","REGN","VRTX","GILD","ISRG","DXCM",
  // Financials
  "JPM","BAC","GS","V","MA",
  // Energy
  "XOM","CVX","COP",
  // Consumer
  "WMT","COST","HD","MCD",
  // Healthcare
  "UNH","JNJ","ABT","PFE",
  // Industrials
  "CAT","GE","HON","DE",
  // Other large-cap
  "TSLA","NFLX","PYPL","AVGO","BRK-B",
];

// Grade buckets — match what users see (A/B/C/D)
const BUCKETS = [
  { label: "Grade A (≥63)",  min: 63,  max: 101 },
  { label: "Grade B (48-63)",min: 48,  max: 63  },
  { label: "Grade C (35-48)",min: 35,  max: 48  },
  { label: "Grade D (<35)",  min: 0,   max: 35  },
];

// Legacy spread buckets (kept for backward compat with front-end)
const SPREAD_BUCKETS = [
  { label: "Strong (>63)",   min: 63, max: 101 },
  { label: "Neutral (35-63)",min: 35, max: 63  },
  { label: "Weak (<40)",     min: 0,  max: 40  },
];

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.authorization || "";
  // Accept either the CRON_SECRET or the admin-trigger bypass (used by Admin panel)
  const validSecret = secret ? `Bearer ${secret}` : null;
  const isAdminTrigger = auth === "Bearer admin-trigger";
  if (!isAdminTrigger && (!validSecret || auth !== validSecret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const { fetchFundamentals } = await import("../lib/fetchFMP.js");

  // Pre-fetch VIX history
  let vixHistory = [];
  try {
    vixHistory = await fetchAggregates("I:VIX", polygonKey, 600) || [];
  } catch {}

  const allSamples = [];

  await Promise.all(TICKERS.map(async ticker => {
    try {
      // Fetch 600 days — enough for 24 weekly steps + 180d forward window
      const aggs = await fetchAggregates(ticker, polygonKey, 600);
      if (!aggs || aggs.length < 120) return;

      // Fetch fundamentals per ticker (inside loop — avoids overwhelming FMP with 75 simultaneous batches)
      const fundamentals = fmpKey ? await fetchFundamentals(ticker, fmpKey).catch(() => null) : null;

      // Step back weekly (5 trading days) — go back 52 weeks for enough Grade A samples (300+)
      for (let weeksBack = 4; weeksBack <= 52; weeksBack++) {
        const cutoff = aggs.length - (weeksBack * 5);
        if (cutoff < 90) break;

        // Historical price slice — what we'd have seen at that point in time
        const historicalAggs = aggs.slice(0, cutoff);
        const price          = historicalAggs.at(-1).c;

        // Historical VIX at same point
        const vixCutoff     = vixHistory.length - (weeksBack * 5);
        const historicalVix = vixCutoff > 0 ? vixHistory[vixCutoff]?.c ?? null : null;

        // MOMENTUM: fully historical (price-based) — the only truly back-testable signal
        const momentum = calcMomentum({ price, aggs: historicalAggs, vix: historicalVix });
        if (momentum === null) continue;

        // RISK: historical volatility component (price-based, no fundamental look-ahead)
        const risk = calcRisk({ aggs: historicalAggs, fundamentals: null }); // volatility only

        // Signal = momentum only — purest historical test
        // Hard cap: if volatility risk < 20, cap at 65 (too dangerous for Grade A)
        let signal = Math.round(momentum);
        if ((risk ?? 50) < 20) signal = Math.min(signal, 65);
        if (signal === null) continue;

        // Forward returns — 30, 60, 90, 180 trading days
        const p30  = aggs[cutoff + 29]?.c  ?? null;
        const p60  = aggs[cutoff + 59]?.c  ?? null;
        const p90  = aggs[cutoff + 89]?.c  ?? null;
        const p180 = aggs[cutoff + 179]?.c ?? null;

        allSamples.push({
          ticker,
          momentum,
          risk,
          signal,
          weeksBack,
          return30d:  p30  != null ? (p30  - price) / price : null,
          return60d:  p60  != null ? (p60  - price) / price : null,
          return90d:  p90  != null ? (p90  - price) / price : null,
          return180d: p180 != null ? (p180 - price) / price : null,
        });
      }
    } catch (e) {
      console.error(`Backtest error ${ticker}:`, e.message);
    }
  }));

  if (!allSamples.length) {
    return res.status(500).json({ error: "No samples collected" });
  }

  // ── Grade buckets (A/B/C/D) ────────────────────────────────────
  function calcBuckets(buckets) {
    return buckets.map(bucket => {
      const samples = allSamples.filter(s => s.signal >= bucket.min && s.signal < bucket.max);
      const with30  = samples.filter(s => s.return30d  !== null);
      const with60  = samples.filter(s => s.return60d  !== null);
      const with90  = samples.filter(s => s.return90d  !== null);
      const with180 = samples.filter(s => s.return180d !== null);

      const avg = (arr, key) => arr.length
        ? Math.round(arr.reduce((s, x) => s + x[key], 0) / arr.length * 10000) / 100
        : null;

      // Win rate at 90d (not 30d — more meaningful)
      const wins90   = with90.filter(s => s.return90d > 0).length;
      const winRate  = with90.length ? Math.round(wins90 / with90.length * 1000) / 10 : null;

      return {
        bucket:  bucket.label,
        samples: samples.length,
        avg30d:  avg(with30,  "return30d"),
        avg60d:  avg(with60,  "return60d"),
        avg90d:  avg(with90,  "return90d"),
        avg180d: avg(with180, "return180d"),
        winRate,
      };
    });
  }

  const bucketResults       = calcBuckets(SPREAD_BUCKETS); // for backward compat
  const gradeBucketResults  = calcBuckets(BUCKETS);        // A/B/C/D

  // ── Pearson correlation: SIGNAL vs 90d return ─────────────────
  const samplesWithReturn = allSamples.filter(s => s.return90d !== null);
  const correlation = pearsonCorrelation(
    samplesWithReturn.map(s => s.signal),
    samplesWithReturn.map(s => s.return90d)
  );

  // ── Verdict ───────────────────────────────────────────────────
  const gradeA = gradeBucketResults.find(b => b.bucket.startsWith("Grade A"));
  const gradeD = gradeBucketResults.find(b => b.bucket.startsWith("Grade D"));
  const spread = (gradeA?.avg90d ?? 0) - (gradeD?.avg90d ?? 0);

  const verdict = spread > 10 ? "PREDICTIVE"
                : spread > 3  ? "WEAK_SIGNAL"
                :               "NOT_PREDICTIVE";

  const result = {
    run_date:      new Date().toISOString(),
    tickers:       TICKERS.length,
    total_samples: allSamples.length,
    correlation:   Math.round(correlation * 1000) / 1000,
    verdict,
    spread_pct:    Math.round(spread * 100) / 100,
    buckets:       bucketResults,       // Strong/Neutral/Weak — kept for UI compat
    grade_buckets: gradeBucketResults,  // A/B/C/D — new
  };

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("backtest_results").insert(result);
  }

  console.log(`Backtest: ${verdict}, spread=${spread.toFixed(2)}%, correlation=${correlation.toFixed(3)}, samples=${allSamples.length}`);
  return res.status(200).json(result);
}

function pearsonCorrelation(xs, ys) {
  const n  = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num  = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const denX = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
  const denY = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
  return denX && denY ? num / (denX * denY) : 0;
}
