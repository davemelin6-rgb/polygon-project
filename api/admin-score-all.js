// api/admin-score-all.js
// Admin endpoint to pre-score all sector tickers
// Secured with admin-trigger (same as backtest)

import { fetchAggregates }  from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechQuality, calcInnovation, calcAcceleration, calcTechDemand, calcSentiment, calcSignal, calcSignalBreakdown } from "../lib/formulas.js";
import { getSectorBenchmarks, getSectorPE, getSectorDemandScore, getSectorETF } from "../lib/sectorBenchmarks.js";
import { getSupabase } from "../lib/supabase.js";

const ALL_TICKERS = [
  // AI
  "NVDA","AMD","META","MSFT","GOOGL","AMZN","PLTR","IBM","AI","SOUN","SMCI",
  "ORCL","CRM","NOW","SNOW","MDB","DDOG","NET","PATH","BBAI","UPST","ANET","CRWD","ZS","AVGO","MRVL","QCOM","TSM",
  // Quantum
  "IONQ","RGTI","QUBT","QBTS","ARQQ","HON","INTC","ONTO","MKSI",
  // Defence
  "LMT","RTX","NOC","GD","BA","HII","LHX","TXT","KTOS","AXON","AVAV","CACI","LDOS","SAIC","BWXT","DRS","RKLB","ASTS","IRDM","VSAT","BAH",
  // Biotech
  "LLY","NVO","ABBV","BMY","AMGN","GILD","BIIB","REGN","VRTX","MRNA",
  "ALNY","INCY","EXEL","ALKS","ACAD","AXSM","RARE","CRSP","EDIT","BEAM","NTLA",
  "ISRG","DXCM","ILMN","MDT","ABT","SYK","HOLX",
  // Semiconductors
  "MU","ASML","TXN","AMAT","LRCX","KLAC","TER","ACLS","ENTG",
  "ADI","NXPI","ON","MPWR","SWKS","WOLF","SLAB","CRUS","AMBA","PI","FORM",
  // General
  "AAPL","TSLA","JPM","V","MA","SPY","QQQ",
];

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer admin-trigger") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY missing" });

  const supabase  = getSupabase();
  const results   = [];
  const errors    = [];

  // VIX
  let vix = null;
  try {
    const vixAggs = await fetchAggregates("I:VIX", polygonKey, 5);
    vix = vixAggs?.at(-1)?.c ?? null;
  } catch {}

  // Process in batches of 10 to avoid overwhelming APIs
  const BATCH = 10;
  for (let i = 0; i < ALL_TICKERS.length; i += BATCH) {
    const batch = ALL_TICKERS.slice(i, i + BATCH);
    await Promise.all(batch.map(async ticker => {
      try {
        const [aggs, fundamentals] = await Promise.all([
          fetchAggregates(ticker, polygonKey, 300),
          fmpKey ? fetchFundamentals(ticker, fmpKey).catch(() => null) : null,
        ]);
        if (!aggs || aggs.length < 30) { errors.push(`${ticker}: no data`); return; }

        const price          = aggs.at(-1).c;
        const benchmarks     = getSectorBenchmarks(ticker);
        const sectorPE       = getSectorPE(ticker);
        const sectorDemand   = getSectorDemandScore(ticker);
        const etfTicker      = getSectorETF(ticker);
        const etfAggs        = etfTicker ? await fetchAggregates(etfTicker, polygonKey, 70).catch(() => null) : null;

        const momentum    = calcMomentum({ price, aggs, fundamentals, vix });
        const risk        = calcRisk({ aggs, fundamentals });
        const tech_value  = calcTechQuality({ fundamentals, benchmarks });
        const innovation  = calcInnovation({ fundamentals, benchmarks });
        const acceleration = calcAcceleration({ aggs });
        const tech_demand = calcTechDemand({ fundamentals, sectorDemandScore: sectorDemand, sectorEtfAggs: etfAggs });
        const sentiment   = calcSentiment({ fundamentals });
        const breakdown   = calcSignalBreakdown({ fundamentals, sectorPE });
        const signal      = calcSignal({ momentum, risk, techValue: tech_value, innovation, techDemand: tech_demand, sentiment });

        const sig   = signal ?? momentum ?? 0;
        const grade = sig >= 63 ? "A" : sig >= 48 ? "B" : sig >= 35 ? "C" : "D";

        const row = {
          symbol: ticker, momentum, risk, tech_value, innovation,
          tech_demand, sentiment, acceleration, signal, price,
          has_fundamentals: !!fundamentals,
          calculated_at: new Date().toISOString(),
        };

        if (supabase) {
          await supabase.from("scores").upsert(row, { onConflict: "symbol" });
          // Write to score_history
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from("score_history").upsert(
            { symbol: ticker, momentum, risk, tech_value, signal, grade, price, recorded_date: today },
            { onConflict: "symbol,recorded_date", ignoreDuplicates: true }
          );
        }

        results.push({ ticker, signal, grade, momentum, risk });
      } catch (e) {
        errors.push(`${ticker}: ${e.message}`);
      }
    }));
  }

  return res.status(200).json({
    scored: results.length,
    errors: errors.length,
    results: results.sort((a, b) => (b.signal ?? 0) - (a.signal ?? 0)),
    errorList: errors,
  });
}
