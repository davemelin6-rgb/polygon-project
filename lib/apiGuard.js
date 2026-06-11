// lib/apiGuard.js — shared auth + input validation for API routes

import { getSupabase } from "./supabase.js";

// Only uppercase letters, 1–10 chars (covers US equity tickers + BRK.A style)
const TICKER_RE = /^[A-Z]{1,10}$/;
const MAX_TICKERS = 20;

/**
 * Verifies the Bearer token in the Authorization header against Supabase.
 * Returns true if the session is valid, false otherwise.
 */
export async function verifySession(req) {
  const auth = (req.headers?.authorization || req.headers?.Authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  return !error && !!user;
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
