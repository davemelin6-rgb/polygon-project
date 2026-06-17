// api/score-alerts.js
// Daily cron — detects significant score changes and notifies users
// GET /api/score-alerts  (secured by CRON_SECRET)
// Runs 07:30 UTC = 09:30 Stockholm, weekdays

import { getSupabase } from "../lib/supabase.js";

const RESEND = "https://api.resend.com/emails";

// Alert trigger rules
const SIGNAL_THRESHOLDS = [40, 55, 70];
const MOMENTUM_DELTA_TRIGGER = 15;  // points in 7 days
const RISK_DANGER_THRESHOLD  = 40;  // alert if risk drops below this

function crossed(prev, curr, threshold) {
  if (prev == null || curr == null) return false;
  return (prev < threshold && curr >= threshold) ||
         (prev >= threshold && curr < threshold);
}

function signChange(prev, curr) {
  if (prev == null || curr == null) return false;
  return Math.abs(curr - prev) >= MOMENTUM_DELTA_TRIGGER;
}

function buildAlertEmail(username, alerts) {
  const rows = alerts.map(a => {
    const icon = a.type === "signal_up"   ? "🟢" :
                 a.type === "signal_down" ? "🔴" :
                 a.type === "risk_danger" ? "⚠️" :
                 a.type === "momentum_surge" ? "🚀" :
                 a.type === "momentum_drop" ? "📉" : "📊";
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#e8f0fa;">${icon} ${a.symbol}</td>
      <td style="padding:10px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:13px;color:#4a6a88;">${a.message}</td>
      <td style="padding:10px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${a.color};text-align:right;">${a.score}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#040810;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;">
  <tr><td style="padding:24px 32px 0;">
    <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#1a3050;">QUANTDIVER</div>
  </td></tr>
  <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #0d1f38;">
    <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00b4ff;margin-bottom:12px;">📊 Score Alert</div>
    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#ffffff;margin-bottom:10px;">Scores have moved.</div>
    <div style="font-family:Georgia,serif;font-size:15px;color:#6a8aaa;">Significant changes detected in your watchlist, ${username}.</div>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr><td align="center" style="background:#060f20;border:1px solid #0d1f38;border-radius:12px;padding:22px;">
        <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#ffffff;margin-bottom:14px;">Open QuantDiver for full analysis</div>
        <a href="https://quantdiver.com" style="display:inline-block;background:#0066cc;color:#fff;font-family:'Courier New',monospace;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">View Dashboard →</a>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:'Courier New',monospace;font-size:10px;color:#12253a;line-height:1.8;">
      QUANTDIVER · SCORE ALERTS<br/>
      Manage alerts in Settings at quantdiver.com · This is not financial advice.
    </p>
  </td></tr>
</table>
</body></html>`;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth   = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase   = getSupabase();
  const resendKey  = process.env.RESEND_API_KEY;
  if (!supabase || !resendKey) return res.status(500).json({ error: "Not configured" });

  // Get users with alerts enabled + their watchlists + email
  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, email, settings")
    .eq("score_alerts", true)
    .not("email", "is", null);

  if (!users?.length) return res.status(200).json({ sent: 0, message: "No subscribers" });

  const today     = new Date().toISOString().slice(0, 10);
  const sevenAgo  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  let totalSent = 0;

  for (const user of users) {
    // Get their watchlist tickers
    const tickers = (user.settings?.defaultTickers || "AAPL,MSFT,NVDA,GOOGL,AMZN")
      .split(",").map(t => t.trim()).filter(Boolean).slice(0, 20);

    // Get current scores
    const { data: current } = await supabase
      .from("scores")
      .select("symbol, momentum, risk, tech_value, signal")
      .in("symbol", tickers);

    // Get scores from 7 days ago
    const { data: historic } = await supabase
      .from("score_history")
      .select("symbol, momentum, risk, tech_value, signal, recorded_date")
      .in("symbol", tickers)
      .gte("recorded_date", sevenAgo)
      .lte("recorded_date", sevenAgo)
      .order("recorded_date", { ascending: false });

    if (!current?.length) continue;

    const currMap = Object.fromEntries(current.map(r => [r.symbol, r]));
    const histMap = Object.fromEntries((historic || []).map(r => [r.symbol, r]));

    // Get already-sent alerts today to avoid duplicates
    const { data: sentToday } = await supabase
      .from("score_alert_log")
      .select("symbol, alert_type")
      .eq("user_id", user.id)
      .eq("alert_date", today);

    const sentSet = new Set((sentToday || []).map(r => `${r.symbol}:${r.alert_type}`));

    const alerts = [];

    for (const symbol of tickers) {
      const curr = currMap[symbol];
      const hist = histMap[symbol];
      if (!curr) continue;

      // Signal threshold crossings
      for (const threshold of SIGNAL_THRESHOLDS) {
        const upKey   = `${symbol}:signal_cross_${threshold}_up`;
        const downKey = `${symbol}:signal_cross_${threshold}_down`;

        if (!sentSet.has(upKey) && hist && curr.signal >= threshold && (hist.signal || 0) < threshold) {
          alerts.push({ symbol, type: "signal_up", message: `Signal crossed ${threshold}`, score: `${curr.signal}/100`, color: "#00dc82" });
          sentSet.add(upKey);
          await supabase.from("score_alert_log").insert({ user_id: user.id, symbol, alert_type: `signal_cross_${threshold}_up`, alert_date: today }).catch(() => {});
        }
        if (!sentSet.has(downKey) && hist && curr.signal < threshold && (hist.signal || 0) >= threshold) {
          alerts.push({ symbol, type: "signal_down", message: `Signal dropped below ${threshold}`, score: `${curr.signal}/100`, color: "#ff3c50" });
          sentSet.add(downKey);
          await supabase.from("score_alert_log").insert({ user_id: user.id, symbol, alert_type: `signal_cross_${threshold}_down`, alert_date: today }).catch(() => {});
        }
      }

      // Momentum surge/drop
      if (hist && signChange(hist.momentum, curr.momentum)) {
        const up     = curr.momentum > hist.momentum;
        const type   = up ? "momentum_surge" : "momentum_drop";
        const key    = `${symbol}:${type}`;
        const delta  = curr.momentum - hist.momentum;
        if (!sentSet.has(key)) {
          alerts.push({ symbol, type, message: `Momentum ${up ? "▲" : "▼"} ${Math.abs(delta)} pts in 7 days`, score: `${curr.momentum}/100`, color: up ? "#00dc82" : "#f59e0b" });
          sentSet.add(key);
          await supabase.from("score_alert_log").insert({ user_id: user.id, symbol, alert_type: type, alert_date: today }).catch(() => {});
        }
      }

      // Risk danger — balance sheet deterioration
      const riskKey = `${symbol}:risk_danger`;
      if (!sentSet.has(riskKey) && curr.risk != null && curr.risk < RISK_DANGER_THRESHOLD &&
          (!hist || hist.risk == null || hist.risk >= RISK_DANGER_THRESHOLD)) {
        alerts.push({ symbol, type: "risk_danger", message: `Risk score below ${RISK_DANGER_THRESHOLD} — balance sheet warning`, score: `${curr.risk}/100`, color: "#ff3c50" });
        sentSet.add(riskKey);
        await supabase.from("score_alert_log").insert({ user_id: user.id, symbol, alert_type: "risk_danger" }).catch(() => {});
      }
    }

    if (!alerts.length) continue;

    // Send alert email
    const html = buildAlertEmail(user.username || "there", alerts);
    const r = await fetch(RESEND, {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    "QuantDiver Alerts <briefme@quantdiver.com>",
        to:      [user.email],
        subject: `📊 Score Alert — ${alerts.length} change${alerts.length > 1 ? "s" : ""} in your watchlist`,
        html,
      }),
    });
    if (r.ok) totalSent++;
  }

  return res.status(200).json({ sent: totalSent, users: users.length });
}
