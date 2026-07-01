// api/scores-summary.js
// Returns all scores from DB for Trade Planner
// Uses service role (bypasses RLS) after verifying user JWT

import { verifySession } from "../lib/apiGuard.js";
import { getSupabase }   from "../lib/supabase.js";

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "DB unavailable" });

  const { data, error } = await supabase
    .from("scores")
    .select("symbol, signal, momentum, risk")
    .order("signal", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ scores: data || [] });
}
