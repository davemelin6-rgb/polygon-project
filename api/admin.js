import { getSupabase } from "../lib/supabase.js";
import { verifySession } from "../lib/apiGuard.js";

const ADMIN_EMAIL = "davemelin6@gmail.com";

export default async function handler(req, res) {
  // Must be authenticated
  const authed = await verifySession(req);
  if (!authed || typeof authed !== "object") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Must be the admin
  if (authed.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const supabase = getSupabase();

  // GET — list all users
  if (req.method === "GET") {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) return res.status(500).json({ error: error.message });
    const users = data.users.map(u => ({
      id:            u.id,
      email:         u.email,
      name:          u.user_metadata?.full_name || null,
      plan:          u.user_metadata?.plan || null,
      trial_ends_at: u.user_metadata?.trial_ends_at || null,
      status:        u.user_metadata?.subscription_status || null,
      created_at:    u.created_at,
      last_sign_in:  u.last_sign_in_at,
    }));
    return res.status(200).json({ users });
  }

  // POST — update a user's password
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { userId, password } = body || {};
    if (!userId || !password || password.length < 6) {
      return res.status(400).json({ error: "userId and password (min 6 chars) required" });
    }
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
