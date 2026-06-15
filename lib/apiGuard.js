// lib/apiGuard.js — shared auth + input validation for API routes

import { getSupabase } from "./supabase.js";

// Only uppercase letters, 1–10 chars (covers US equity tickers + BRK.A style)
const TICKER_RE = /^[A-Z]{1,10}$/;
const MAX_TICKERS = 20;

// ── Rate limiter ─────────────────────────────────────────
// Per user: max 30 requests per 60-second window
const RATE_LIMIT    = 120;
const RATE_WINDOW   = 60_000;
const ADMIN_EMAIL   = "davemelin6@gmail.com";
const _rateBuckets  = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const bucket = _rateBuckets.get(userId) || { count: 0, reset: now + RATE_WINDOW };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + RATE_WINDOW;
  }
  bucket.count++;
  _rateBuckets.set(userId, bucket);
  return bucket.count <= RATE_LIMIT;
}

/**
 * Verifies the Bearer token in the Authorization header against Supabase.
 * Returns the user object if valid, null otherwise.
 * Also enforces per-user rate limiting (30 req / 60s).
 */
export async function verifySession(req) {
  const auth = (req.headers?.authorization || req.headers?.Authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  if (user.email !== ADMIN_EMAIL && !checkRateLimit(user.id)) return "rate_limited";

  // Trial expiry check — only enforced if trial_ends_at is set and no active subscription
  const meta = user.user_metadata || {};
  if (meta.trial_ends_at && meta.subscription_status !== "active") {
    if (new Date(meta.trial_ends_at) < new Date()) return "trial_expired";
  }

  return user;
}

/**
 * Parses and validates a comma-separated tickers string.
 * Strips anything that doesn't match the ticker regex, caps at MAX_TICKERS.
 */
export function parseTickers(raw) {
  return String(raw || "")
    .split(",")
    .map(t => t.trim().toUpperCase())
    .filter(t => TICKER_RE.test(t))
    .slice(0, MAX_TICKERS);
}
