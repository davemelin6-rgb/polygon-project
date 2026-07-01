// api/match.js — Trader matchmaking
// GET  /api/match?action=status
// GET  /api/match?action=messages&sessionId=...
// POST /api/match  { action: "join"|"leave"|"message", ... }

import { verifySession } from "../lib/apiGuard.js";
import { getSupabase }   from "../lib/supabase.js";

const VALID_TOPICS = ["ai", "quantum", "defence", "biotech"];
const STALE_MS     = 10 * 60 * 1000; // remove queue entries older than 10 min

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const sb     = getSupabase();
  const userId = authed.id;

  // ── GET ────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { action, sessionId } = req.query;

    if (action === "status") {
      // Active session?
      const { data: session } = await sb
        .from("match_sessions")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) return res.status(200).json({ state: "matched", session });

      // In queue?
      const { data: entry } = await sb
        .from("match_queue")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "waiting")
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entry) return res.status(200).json({ state: "queued", queueId: entry.id, topic: entry.topic });

      return res.status(200).json({ state: "idle" });
    }

    if (action === "messages") {
      if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

      const { data: session } = await sb
        .from("match_sessions")
        .select("id")
        .eq("id", sessionId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle();

      if (!session) return res.status(403).json({ error: "Not in this session" });

      const { data: messages } = await sb
        .from("match_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(200);

      return res.status(200).json({ messages: messages || [] });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  // ── POST ───────────────────────────────────────────────────
  if (req.method === "POST") {
    let body = {};
    try {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      body = JSON.parse(raw);
    } catch {}

    const { action } = body;

    // Get username for operations that need it
    const { data: profile } = await sb
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    const username = profile?.username || "Trader";

    // ── join ──────────────────────────────────────────────────
    if (action === "join") {
      const topic       = (body.topic || "").toLowerCase();
      const traderType  = (body.trader_type || "swing").toLowerCase();
      const VALID_TYPES = ["day", "swing", "long"];
      if (!VALID_TOPICS.includes(topic)) return res.status(400).json({ error: "Invalid topic" });
      if (!VALID_TYPES.includes(traderType)) return res.status(400).json({ error: "Invalid trader type" });

      // Already in active session?
      const { data: existingSession } = await sb
        .from("match_sessions")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("status", "active")
        .maybeSingle();

      if (existingSession) return res.status(200).json({ matched: true, session: existingSession });

      // Purge own stale queue entries + global stale waiting entries
      await sb.from("match_queue").delete().eq("user_id", userId).in("status", ["waiting", "cancelled"]);
      const cutoff = new Date(Date.now() - STALE_MS).toISOString();
      await sb.from("match_queue").delete().lt("joined_at", cutoff).eq("status", "waiting");

      // Look for a waiting match — same topic AND same trader type
      const { data: waiting } = await sb
        .from("match_queue")
        .select("*")
        .eq("topic", topic)
        .eq("trader_type", traderType)
        .eq("status", "waiting")
        .neq("user_id", userId)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (waiting) {
        const { data: session, error } = await sb
          .from("match_sessions")
          .insert({
            user1_id: waiting.user_id, user1_name: waiting.username,
            user2_id: userId,          user2_name: username,
            topic, trader_type: traderType,
          })
          .select().single();

        if (error) return res.status(500).json({ error: "Session creation failed" });

        await sb.from("match_queue").update({ status: "matched", session_id: session.id }).eq("id", waiting.id);
        const { data: myEntry } = await sb.from("match_queue")
          .insert({ user_id: userId, username, topic, trader_type: traderType, status: "matched", session_id: session.id })
          .select().single();

        return res.status(200).json({ matched: true, session, queueId: myEntry?.id });
      }

      // No match — join queue
      const { data: entry } = await sb
        .from("match_queue")
        .insert({ user_id: userId, username, topic, trader_type: traderType })
        .select().single();

      return res.status(200).json({ matched: false, queueId: entry?.id, topic, trader_type: traderType });
    }

    // ── leave ─────────────────────────────────────────────────
    if (action === "leave") {
      if (body.queueId) {
        await sb.from("match_queue")
          .update({ status: "cancelled" })
          .eq("id", body.queueId)
          .eq("user_id", userId);
      }
      if (body.sessionId) {
        const { data: session } = await sb
          .from("match_sessions")
          .select("id")
          .eq("id", body.sessionId)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .maybeSingle();
        if (session) {
          await sb.from("match_sessions").update({ status: "ended" }).eq("id", body.sessionId);
        }
      }
      return res.status(200).json({ ok: true });
    }

    // ── message ───────────────────────────────────────────────
    if (action === "message") {
      const { sessionId, content } = body;
      if (!sessionId || !content?.trim()) return res.status(400).json({ error: "Missing fields" });

      const text = content.trim().slice(0, 2000);

      const { data: session } = await sb
        .from("match_sessions")
        .select("id")
        .eq("id", sessionId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq("status", "active")
        .maybeSingle();

      if (!session) return res.status(403).json({ error: "Not in an active session" });

      const { data: message } = await sb
        .from("match_messages")
        .insert({ session_id: sessionId, user_id: userId, username, content: text })
        .select().single();

      return res.status(200).json({ message });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
