// api/contributor-apply.js
// POST /api/contributor-apply
// Public endpoint — no auth required

import { getSupabase } from "../lib/supabase.js";

const RESEND      = "https://api.resend.com/emails";
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const ADMIN_EMAIL = "administrator@quantdiver.com";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, background, whyJoin } = req.body || {};
  if (!name?.trim() || !email?.trim() || !background?.trim() || !whyJoin?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase.from("contributor_applications").insert({
      name:       name.trim(),
      email:      email.trim().toLowerCase(),
      background: background.trim(),
      why_join:   whyJoin.trim(),
    });
  }

  // Notify admin via email
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch(RESEND, {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "QuantDiver <briefme@quantdiver.com>",
        to:      [ADMIN_EMAIL],
        subject: `New contributor application — ${esc(name.trim())}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;padding:2rem;">
            <p style="font-size:.75rem;letter-spacing:.2em;color:#666;text-transform:uppercase;">QuantDiver · Contributor Application</p>
            <h2 style="margin:0.5rem 0 1.5rem;">${esc(name.trim())}</h2>
            <p><strong>Email:</strong> ${esc(email.trim())}</p>
            <p><strong>Background:</strong><br>${esc(background.trim()).replace(/\n/g,"<br/>")}</p>
            <p><strong>Why they want to join:</strong><br>${esc(whyJoin.trim()).replace(/\n/g,"<br/>")}</p>
          </div>
        `,
      }),
    }).catch(() => {});
  }

  return res.status(200).json({ success: true });
}
