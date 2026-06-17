// api/score-history.js
// GET /api/score-history?ticker=AAPL
// Returns last 60 days of score snapshots for one ticker.

import { getSupabase }           from "../lib/supabase.js";
import { verifySession, parseTickers } from "../lib/apiGuard.js";

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed)                    return res.status(401).json({ error: "Unauthorized" });

  const [ticker] = parseTickers(req.query.ticker || "");
  if (!ticker) return res.status(400).json({ error: "Provide ?ticker=AAPL" });

  const supabase = getSupabase();
  if (!supabase) return res.status(200).json({ history: [] });

  const { data, error } = await supabase
    .from("score_history")
    .select("recorded_date, momentum, risk, tech_value, signal")
    .eq("symbol", ticker)
    .order("recorded_date", { ascending: true })
    .limit(60);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ticker, history: data || [] });
}
