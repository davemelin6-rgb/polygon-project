// api/insider.js — Insider trading transactions via FMP
// GET /api/insider?ticker=AAPL

import { verifySession } from "../lib/apiGuard.js";

const FMP   = "https://financialmodelingprep.com/stable";
const cache = new Map();
const TTL   = 60 * 60_000; // 1 hour

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired")  return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No FMP key" });

  const ticker = (req.query.ticker || "").toString().trim().toUpperCase();
  if (!ticker || !/^[A-Z]{1,10}$/.test(ticker))
    return res.status(400).json({ error: "Invalid ticker" });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const r = await fetch(`${FMP}/insider-trading?symbol=${ticker}&limit=15&apikey=${apiKey}`);
    const arr = r.ok ? await r.json() : [];

    const transactions = (Array.isArray(arr) ? arr : [])
      .filter(t => t.transactionType)
      .slice(0, 12)
      .map(t => {
        const isBuy = /purchase|buy|acquisition/i.test(t.transactionType);
        const isSell = /sale|sell/i.test(t.transactionType);
        const value = t.price && t.securitiesTransacted
          ? t.price * t.securitiesTransacted
          : null;
        return {
          name:     t.reportingName    || t.insiderName  || "Unknown",
          title:    t.typeOfOwner      || t.reportingCik || "",
          type:     isBuy ? "BUY" : isSell ? "SELL" : t.transactionType,
          shares:   t.securitiesTransacted ?? null,
          price:    t.price             ?? null,
          value,
          date:     t.filingDate        ?? t.transactionDate ?? null,
        };
      });

    const data = { ticker, transactions };
    cache.set(ticker, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ ticker, transactions: [] });
  }
}
