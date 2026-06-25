// api/demo-score.js
// Public endpoint — no auth required. Rate-limited by IP.
// Gives landing page visitors a live taste of the scoring engine.

import { fetchAggregates }   from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechQuality, calcInnovation, calcTechDemand, calcSentiment, calcSignal, calcAcceleration } from "../lib/formulas.js";
import { getSectorBenchmarks, getSectorPE, getSectorDemandScore, getSectorETF } from "../lib/sectorBenchmarks.js";
import { getSupabase } from "../lib/supabase.js";

// Simple in-memory IP rate limiter (resets on cold start)
const ipHits = new Map();
const RATE_LIMIT = 5;     // requests per window
const WINDOW_MS  = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now  = Date.now();
  const hits = ipHits.get(ip) || [];
  const recent = hits.filter(t => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  ipHits.set(ip, [...recent, now]);
  return true;
}

// Only allow tickers from our curated universe + common large caps
const ALLOWED_TICKERS = new Set([
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","AMD","PLTR","IBM","AI","SOUN","SMCI",
  "TSM","AVGO","QCOM","INTC","MU","ASML","TXN","AMAT",
  "IONQ","RGTI","QUBT","QBTS","LMT","RTX","RKLB","ASTS","NOC","GD","BA","KTOS",
  "LLY","NVO","MRNA","REGN","VRTX","GILD","ISRG","DXCM",
  "JPM","BAC","GS","V","MA","TSLA","NFLX","XOM","CVX","WMT","COST",
  "SPY","QQQ","SOXX","IBB","XAR","ARKQ",
]);

export default async function handler(req, res) {
  // CORS for landing page
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // IP rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in an hour." });
  }

  const ticker = (req.query.ticker || "").toUpperCase().trim();
  if (!ticker) return res.status(400).json({ error: "Provide ?ticker=NVDA" });
  if (!ALLOWED_TICKERS.has(ticker)) {
    return res.status(400).json({ error: `${ticker} is not in our tracked universe. Try NVDA, AAPL, IONQ, MRNA, or RKLB.` });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "Configuration error" });

  // Check Supabase cache first (scores refresh hourly)
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("symbol", ticker)
      .maybeSingle();

    if (data) {
      const sig   = data.signal ?? null;
      const grade = sig >= 63 ? "A" : sig >= 48 ? "B" : sig >= 35 ? "C" : "D";
      return res.status(200).json({
        ticker,
        momentum:   data.momentum,
        risk:       data.risk,
        techValue:  data.tech_value,
        techDemand: data.tech_demand,
        innovation: data.innovation,
        sentiment:  data.sentiment,
        signal:     data.signal,
        grade,
        fromCache:  true,
      });
    }
  }

  // Calculate live
  try {
    const [aggs, fundamentals] = await Promise.all([
      fetchAggregates(ticker, polygonKey, 300),
      fmpKey ? fetchFundamentals(ticker, fmpKey).catch(() => null) : null,
    ]);

    if (!aggs || aggs.length < 60) {
      return res.status(404).json({ error: `No price data found for ${ticker}` });
    }

    const price     = aggs.at(-1).c;
    const benchmarks = getSectorBenchmarks(ticker);
    const sectorDemandScore = getSectorDemandScore(ticker);

    // Fetch sector ETF for demand signal
    const etfTicker = getSectorETF(ticker);
    const etfAggs   = etfTicker ? await fetchAggregates(etfTicker, polygonKey, 70).catch(() => null) : null;

    // VIX for momentum
    const vixAggs = await fetchAggregates("I:VIX", polygonKey, 10).catch(() => null);
    const vix     = vixAggs?.at(-1)?.c ?? null;

    const momentum    = calcMomentum({ price, aggs, fundamentals, vix });
    const risk        = calcRisk({ aggs, fundamentals });
    const tech_value  = calcTechQuality({ fundamentals, benchmarks });
    const innovation  = calcInnovation({ fundamentals, benchmarks });
    const tech_demand = calcTechDemand({ fundamentals, sectorDemandScore, sectorEtfAggs: etfAggs });
    const sentiment   = calcSentiment({ fundamentals });
    const signal      = calcSignal({ momentum, risk, techValue: tech_value, innovation, techDemand: tech_demand, sentiment });

    const sig   = signal ?? momentum ?? 0;
    const grade = sig >= 63 ? "A" : sig >= 48 ? "B" : sig >= 35 ? "C" : "D";

    // Get Grade A average for comparison
    let gradeAAvg = null;
    if (supabase) {
      const { data: gradeAStocks } = await supabase
        .from("scores")
        .select("momentum, risk, tech_value, tech_demand, innovation, sentiment, signal")
        .gte("signal", 63)
        .limit(50);
      if (gradeAStocks?.length) {
        const avg = key => Math.round(gradeAStocks.filter(s => s[key] != null).reduce((s, x) => s + x[key], 0) / gradeAStocks.filter(s => s[key] != null).length);
        gradeAAvg = {
          momentum:  avg("momentum"),
          risk:      avg("risk"),
          techValue: avg("tech_value"),
          techDemand:avg("tech_demand"),
          innovation:avg("innovation"),
          sentiment: avg("sentiment"),
          signal:    avg("signal"),
          count:     gradeAStocks.length,
        };
      }
    }

    return res.status(200).json({
      ticker,
      momentum, risk,
      techValue:  tech_value,
      techDemand: tech_demand,
      innovation, sentiment, signal, grade,
      price:      Math.round(price * 100) / 100,
      fromCache:  false,
      gradeAAvg,
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to calculate scores. Try again." });
  }
}
