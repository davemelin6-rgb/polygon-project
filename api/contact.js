// api/contact.js — Contact form email via Resend
// POST /api/contact  { name, email, subject, message }

const RESEND_API = "https://api.resend.com/emails";
const TO_EMAIL   = "davemelin6@gmail.com";

// Simple in-memory rate limit: max 3 submissions per IP per hour
const ipLog = new Map();
function rateOk(ip) {
  const now = Date.now();
  const hits = (ipLog.get(ip) || []).filter(t => now - t < 60 * 60 * 1000);
  if (hits.length >= 3) return false;
  hits.push(now);
  ipLog.set(ip, hits);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Email service not configured" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (!rateOk(ip)) return res.status(429).json({ error: "Too many requests — please wait before sending another message" });

  const { name, email, subject, message } = req.body || {};

  if (!email || !message) return res.status(400).json({ error: "Email and message are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email address" });
  if (message.length > 2000) return res.status(400).json({ error: "Message too long (max 2000 characters)" });

  const safeName    = (name    || "").slice(0, 100).replace(/[<>]/g, "");
  const safeSubject = (subject || "").slice(0, 200).replace(/[<>]/g, "");
  const safeMsg     = message.slice(0, 2000).replace(/[<>]/g, "");

  try {
    const r = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:     "QuantDiver Support <onboarding@resend.dev>",
        to:       [TO_EMAIL],
        reply_to: email,
        subject:  `[QuantDiver Support] ${safeSubject || "New message"}`,
        html: `
          <p><strong>From:</strong> ${safeName || "Anonymous"} &lt;${email}&gt;</p>
          <p><strong>Subject:</strong> ${safeSubject || "(none)"}</p>
          <hr/>
          <p>${safeMsg.replace(/\n/g, "<br/>")}</p>
        `,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error("Resend error:", err);
      return res.status(500).json({ error: "Failed to send message" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Contact send error:", e);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
