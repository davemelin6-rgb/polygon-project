// api/briefme-unsubscribe.js
// GET /api/briefme-unsubscribe?uid=<base64-user-id>&type=morning|us|all
// No auth required — token is the unguessable UUID

import { getSupabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  const { uid, type = "all" } = req.query;
  if (!uid) return res.status(400).send(page("Invalid link", "This unsubscribe link is invalid or has expired."));

  let userId;
  try {
    userId = Buffer.from(uid, "base64url").toString("utf8");
  } catch {
    return res.status(400).send(page("Invalid link", "This unsubscribe link is invalid."));
  }

  const supabase = getSupabase();
  if (!supabase) return res.status(500).send(page("Error", "Service unavailable. Please try again later."));

  const update = type === "morning" ? { briefme_morning: false }
               : type === "us"      ? { briefme_us: false }
               :                      { briefme_morning: false, briefme_us: false };

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) return res.status(500).send(page("Error", "Could not update your preferences. Please try again."));

  const label = type === "morning" ? "Morning Brief"
              : type === "us"      ? "US Market Preview"
              :                      "all BriefMe emails";

  return res.status(200).send(page("Unsubscribed", `You have been unsubscribed from ${label}. You can re-enable emails anytime in Settings on QuantDiver.`));
}

function page(title, message) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} — QuantDiver</title>
<style>body{margin:0;background:#040810;color:#8aaec8;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.box{text-align:center;padding:3rem 2rem;max-width:440px;}
h1{color:#fff;font-size:1.8rem;margin-bottom:1rem;}
p{color:#4a6a88;line-height:1.7;margin-bottom:2rem;}
a{display:inline-block;background:#0066cc;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:.9rem;font-weight:700;}
</style></head><body><div class="box">
<div style="font-family:monospace;font-size:.8rem;letter-spacing:.2em;color:#1a3050;margin-bottom:1.5rem;">QUANTDIVER</div>
<h1>${title}</h1><p>${message}</p>
<a href="https://quantdiver.com">Return to QuantDiver</a>
</div></body></html>`;
}
