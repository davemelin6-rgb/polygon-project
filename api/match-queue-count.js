// api/match-queue-count.js — public, returns how many people waiting per topic+trader_type
import { getSupabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sb = getSupabase();
  if (!sb) return res.status(500).json({ error: "DB unavailable" });

  const { data } = await sb
    .from("match_queue")
    .select("topic, trader_type")
    .eq("status", "waiting");

  // Count by topic + trader_type
  const counts = {};
  for (const row of data || []) {
    const key = `${row.topic}__${row.trader_type || "swing"}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return res.status(200).json({ counts });
}
