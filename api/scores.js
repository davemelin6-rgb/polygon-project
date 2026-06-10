// api/scores.js — Scoring engine endpoint
// GET /api/scores?tickers=AAPL,MSFT,NVDA

import { fetchAggregates }   from "../lib/fetchPolygon.js";
import { fetchFundamentals } from "../lib/fetchFMP.js";
import { calcMomentum, calcRisk, calcTechValue } from "../lib/formulas.js";

const CACHE_TTL_MS        = 60_000;
const FUNDAMENTALS_TTL_MS = 24 * 60 * 60 * 1000;

const scoreCache       = new Map();
const fundamentalCache = new Map();

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

  const cacheKey = tickers.join(",");
  const cached   = scoreCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.status(200).json({ cached: true, scores: cached.data });
  }

  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const aggsPromise = fetchAggregates(ticker, polygonKey);

      let fundamentalsPromise;
      const cachedFundamentals = fundamentalCache.get(ticker);
      if (cachedFundamentals && cachedFundamentals.expires > Date.now()) {
        fundamentalsPromise = Promise.resolve(cachedFundamentals.data);
      } else {
        fundamentalsPromise = fetchFundamentals(ticker, fmpKey).then((data) => {
          fundamentalCache.set(ticker, { data, expires: Date.now() + FUNDAMENTALS_TTL_MS });
          return data;
        });
      }

      const [aggs, fundamentals] = await Promise.all([aggsPromise, fundamentalsPromise]);
      const price = aggs?.at(-1)?.c ?? null;

      return {
        symbol:          ticker,
        momentum:        calcMomentum({ price, aggs }),
        risk:            calcRisk({ aggs, fundamentals }),
        techValue:       calcTechValue({ fundamentals }),
        hasFundamentals: !!fundamentals,
      };
    })
  );

  scoreCache.set(cacheKey, { data: results, expires: Date.now() + CACHE_TTL_MS });
  return res.status(200).json({ cached: false, scores: results });
}
