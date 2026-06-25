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

  // Pre-fetch VIX + benchmarks in parallel
  let vixHistory = [], spyAggs = [], qqqAggs = [];
  await Promise.all([
    fetchAggregates("I:VIX", polygonKey, 600).then(d => { vixHistory = d || []; }).catch(() => {}),
    fetchAggregates("SPY",   polygonKey, 600).then(d => { spyAggs   = d || []; }).catch(() => {}),
    fetchAggregates("QQQ",   polygonKey, 600).then(d => { qqqAggs   = d || []; }).catch(() => {}),
  ]);

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

        // Benchmark returns for the SAME time window (SPY + QQQ)
        const spyCutoff  = spyAggs.length  - (weeksBack * 5);
        const qqqCutoff  = qqqAggs.length  - (weeksBack * 5);
        const spyNow  = spyCutoff > 0 ? spyAggs[spyCutoff]?.c  : null;
        const qqqNow  = qqqCutoff > 0 ? qqqAggs[qqqCutoff]?.c  : null;
        const spy90   = spyCutoff > 0 ? spyAggs[spyCutoff + 89]?.c  : null;
        const qqq90   = qqqCutoff > 0 ? qqqAggs[qqqCutoff + 89]?.c  : null;
        const spy180  = spyCutoff > 0 ? spyAggs[spyCutoff + 179]?.c : null;
        const qqq180  = qqqCutoff > 0 ? qqqAggs[qqqCutoff + 179]?.c : null;

        const spyReturn90d  = spyNow && spy90  ? (spy90  - spyNow) / spyNow : null;
        const qqqReturn90d  = qqqNow && qqq90  ? (qqq90  - qqqNow) / qqqNow : null;
        const spyReturn180d = spyNow && spy180 ? (spy180 - spyNow) / spyNow : null;
        const qqqReturn180d = qqqNow && qqq180 ? (qqq180 - qqqNow) / qqqNow : null;

        const ret90d  = p90  != null ? (p90  - price) / price : null;
        const ret180d = p180 != null ? (p180 - price) / price : null;

        allSamples.push({
          ticker, momentum, risk, signal, weeksBack,
          return30d:  p30  != null ? (p30  - price) / price : null,
          return60d:  p60  != null ? (p60  - price) / price : null,
          return90d:  ret90d,
          return180d: ret180d,
          // Alpha = stock return minus benchmark return (same time window)
          alpha90d_spy:  ret90d  != null && spyReturn90d  != null ? ret90d  - spyReturn90d  : null,
          alpha90d_qqq:  ret90d  != null && qqqReturn90d  != null ? ret90d  - qqqReturn90d  : null,
          alpha180d_spy: ret180d != null && spyReturn180d != null ? ret180d - spyReturn180d : null,
          alpha180d_qqq: ret180d != null && qqqReturn180d != null ? ret180d - qqqReturn180d : null,
          spyReturn90d, qqqReturn90d,
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
      const with90  = samples.filter(s => s.return90d  !== null);
      const with180 = samples.filter(s => s.return180d !== null);
      const withAlpha90SPY  = samples.filter(s => s.alpha90d_spy  !== null);
      const withAlpha90QQQ  = samples.filter(s => s.alpha90d_qqq  !== null);
      const withAlpha180SPY = samples.filter(s => s.alpha180d_spy !== null);

      const avg = (arr, key) => arr.length
        ? Math.round(arr.reduce((s, x) => s + x[key], 0) / arr.length * 10000) / 100
        : null;

      const stdDev = (arr, key) => {
        if (arr.length < 2) return null;
        const mean = arr.reduce((s, x) => s + x[key], 0) / arr.length;
        const variance = arr.reduce((s, x) => s + Math.pow(x[key] - mean, 2), 0) / (arr.length - 1);
        return Math.round(Math.sqrt(variance) * 10000) / 100;
      };

      // t-statistic: tests if avg alpha is significantly different from zero
      // t = mean / (stdDev / sqrt(n))
      const tStat = (arr, key) => {
        if (arr.length < 10) return null;
        const mean = arr.reduce((s, x) => s + x[key], 0) / arr.length;
        const sd   = Math.sqrt(arr.reduce((s, x) => s + Math.pow(x[key] - mean, 2), 0) / (arr.length - 1));
        return sd > 0 ? Math.round((mean / (sd / Math.sqrt(arr.length))) * 100) / 100 : null;
      };

      const wins90   = with90.filter(s => s.return90d > 0).length;
      const winRate  = with90.length ? Math.round(wins90 / with90.length * 1000) / 10 : null;

      // Sharpe approximation (using 0% risk-free rate for simplicity)
      const avg90Raw  = with90.length  ? with90.reduce((s, x)  => s + x.return90d,  0) / with90.length  : null;
      const std90     = stdDev(with90,  "return90d");
      const sharpe90  = avg90Raw != null && std90 ? Math.round((avg90Raw / (std90 / 100)) * 100) / 100 : null;

      return {
        bucket:   bucket.label,
        samples:  samples.length,
        avg30d:   avg(samples.filter(s => s.return30d !== null), "return30d"),
        avg60d:   avg(samples.filter(s => s.return60d !== null), "return60d"),
        avg90d:   avg(with90,  "return90d"),
        avg180d:  avg(with180, "return180d"),
        winRate,
        // Alpha vs benchmarks (excess return over index, same time window)
        alpha90d_spy:   avg(withAlpha90SPY,  "alpha90d_spy"),
        alpha90d_qqq:   avg(withAlpha90QQQ,  "alpha90d_qqq"),
        alpha180d_spy:  avg(withAlpha180SPY, "alpha180d_spy"),
        // Standard deviation of 90d returns (volatility measure)
        stdDev90d:      stdDev(with90, "return90d"),
        // Sharpe ratio approximation
        sharpe90d:      sharpe90,
        // t-statistic for alpha vs SPY (is outperformance statistically significant?)
        tStat_alpha_spy: tStat(withAlpha90SPY, "alpha90d_spy"),
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
