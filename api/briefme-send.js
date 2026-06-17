// api/briefme-send.js — BriefMe scheduled email sender
// Called by Vercel Cron — secured by CRON_SECRET header
// GET /api/briefme-send?type=morning   (08:00 Stockholm = 06:00 UTC)
// GET /api/briefme-send?type=us        (15:00 Stockholm = 13:00 UTC)

const RESEND_API = "https://api.resend.com/emails";

export default async function handler(req, res) {
  // Verify cron secret
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const type = (req.query.type || "").toLowerCase();
  if (!["morning", "us"].includes(type)) {
    return res.status(400).json({ error: "Invalid type — use ?type=morning or ?type=us" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "RESEND_API_KEY not configured" });

  const { getSupabase } = await import("../lib/supabase.js");
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const field = type === "morning" ? "briefme_morning" : "briefme_us";
  const { data: subscribers, error } = await supabase
    .from("profiles")
    .select("email, username")
    .eq(field, true)
    .not("email", "is", null);

  if (error) {
    console.error("Supabase query error:", error);
    return res.status(500).json({ error: "Failed to fetch subscribers" });
  }

  if (!subscribers?.length) {
    return res.status(200).json({ sent: 0, message: "No subscribers" });
  }

  const subject = type === "morning"
    ? "☀️ QuantDiver Morning Brief — Market Intelligence, 08:00"
    : "🇺🇸 QuantDiver US Market Preview — Pre-Market Signals, 15:00";

  const preheader = type === "morning"
    ? "Overnight movers, top scores, sector signals — your edge before the open."
    : "Pre-market signals on US tech, semis, biotech and defence before Wall Street opens.";

  const bodyIntro = type === "morning"
    ? `<p>Good morning. Here's your QuantDiver Morning Brief — what moved overnight and what the scores are saying before the European open.</p>`
    : `<p>US markets open in 30 minutes. Here are the pre-market signals QuantDiver is tracking right now.</p>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#070d16;font-family:'Helvetica Neue',Arial,sans-serif;color:#c8d8e8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070d16;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:0 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">
                QuantDiver
              </td>
              <td align="right" style="font-size:11px;color:#445268;letter-spacing:0.12em;text-transform:uppercase;">
                ${type === "morning" ? "Morning Brief" : "US Market Preview"}
              </td>
            </tr>
          </table>
          <div style="height:1px;background:linear-gradient(90deg,rgba(0,180,255,0.4),transparent);margin-top:16px;"></div>
        </td></tr>

        <!-- Preheader / intro -->
        <tr><td style="padding:0 0 28px;">
          <p style="margin:0 0 12px;font-size:13px;color:#445268;letter-spacing:0.1em;text-transform:uppercase;">
            ${new Date().toLocaleDateString("en-SE", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
          ${bodyIntro}
        </td></tr>

        <!-- Placeholder score block -->
        <tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(90,130,200,0.15);border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00b4ff;">
            Top Scores Today
          </p>
          <p style="margin:0;font-size:14px;color:#6a8aaa;line-height:1.7;">
            Log in to QuantDiver to see live MOMENTUM, RISK, and TECH VALUE scores across all tracked sectors — AI, Quantum, Defence &amp; Space, and Biotech.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 0;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#0078dc,#0050aa);border-radius:10px;padding:14px 28px;">
              <a href="https://quantdiver.com" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">
                Open QuantDiver →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:12px;color:#2a3f55;line-height:1.6;">
            You're receiving this because you subscribed to QuantDiver BriefMe.<br/>
            To unsubscribe, go to <a href="https://quantdiver.com" style="color:#445268;">Settings</a> inside your account and toggle off this brief.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      const r = await fetch(RESEND_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "QuantDiver BriefMe <briefme@quantdiver.com>",
          to:      [sub.email],
          subject,
          html,
        }),
      });
      if (r.ok) sent++;
      else failed++;
    } catch (e) {
      console.error(`Failed to send to ${sub.email}:`, e);
      failed++;
    }
  }

  console.log(`BriefMe ${type}: sent=${sent} failed=${failed}`);
  return res.status(200).json({ sent, failed });
}
