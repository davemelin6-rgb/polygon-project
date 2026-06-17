// api/briefme-send.js — BriefMe scheduled email sender
// Called by Vercel Cron — secured by CRON_SECRET header
// GET /api/briefme-send?type=morning   (08:00 Stockholm = 06:00 UTC, weekdays)
// GET /api/briefme-send?type=us        (15:00 Stockholm = 13:00 UTC, weekdays)

const POLYGON = "https://api.polygon.io";
const FMP     = "https://financialmodelingprep.com/stable";
const RESEND  = "https://api.resend.com/emails";

const SECTORS = [
  { id: "quantum",  name: "Quantum",        icon: "⚛️",  tickers: ["IONQ","RGTI","QUBT","IBM","GOOGL","MSFT"] },
  { id: "ai",       name: "AI",             icon: "🧠",  tickers: ["NVDA","AMD","META","MSFT","PLTR","AI"] },
  { id: "defence",  name: "Defence & Space",icon: "🛡️",  tickers: ["LMT","RTX","NOC","GD","RKLB","ASTS"] },
  { id: "biotech",  name: "Biotech",        icon: "🧬",  tickers: ["LLY","NVO","MRNA","REGN","VRTX","GILD"] },
];
const ALL_TICKERS = [...new Set(SECTORS.flatMap(s => s.tickers))];

const FLAGS = { US:"🇺🇸", EU:"🇪🇺", GB:"🇬🇧", SE:"🇸🇪", JP:"🇯🇵", CN:"🇨🇳", CA:"🇨🇦", DE:"🇩🇪" };

function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toFixed(decimals);
}

function sign(n) { return n >= 0 ? "+" : ""; }
function arrow(n) { return n >= 0 ? "▲" : "▼"; }
function color(n) { return n >= 0 ? "#00dc82" : "#ff3c50"; }

async function fetchBriefData(polygonKey, fmpKey) {
  const today   = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tickerStr = ALL_TICKERS.join(",");

  const [snapRes, calRes, earningsRes] = await Promise.all([
    fetch(`${POLYGON}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${encodeURIComponent(tickerStr)}&apiKey=${polygonKey}`),
    fmpKey ? fetch(`${FMP}/economic-calendar?from=${today}&to=${today}&apikey=${fmpKey}`) : Promise.resolve(null),
    fmpKey ? fetch(`${FMP}/earnings-calendar?from=${today}&to=${nextWeek}&apikey=${fmpKey}`) : Promise.resolve(null),
  ]);

  // Prices
  const snapJson = snapRes.ok ? await snapRes.json() : { tickers: [] };
  const priceMap = {};
  for (const t of (snapJson.tickers || [])) {
    priceMap[t.ticker] = {
      symbol:        t.ticker,
      price:         t.lastTrade?.p ?? t.day?.c ?? null,
      changePercent: t.todaysChangePerc ?? null,
    };
  }

  // Sector movers — top 2 by absolute % change
  const sectors = SECTORS.map(s => ({
    ...s,
    movers: s.tickers
      .map(t => priceMap[t])
      .filter(t => t && t.changePercent != null)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 2),
  }));

  // Top 5 movers across all sectors
  const allMovers = ALL_TICKERS
    .map(t => priceMap[t])
    .filter(t => t && t.changePercent != null)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  // Economic events
  const calArr = (calRes && calRes.ok) ? await calRes.json() : [];
  const events = (Array.isArray(calArr) ? calArr : [])
    .filter(e => e.impact === "High" || e.impact === "Medium")
    .sort((a, b) => (a.impact === "High" ? 0 : 1) - (b.impact === "High" ? 0 : 1))
    .slice(0, 6)
    .map(e => ({
      time:     e.date ? e.date.slice(11, 16) : "",
      flag:     FLAGS[e.country] ?? "🌐",
      event:    e.event,
      impact:   e.impact,
      estimate: e.estimate ?? null,
      previous: e.previous ?? null,
      actual:   e.actual ?? null,
    }));

  // Earnings (next 7 days, tracked tickers only)
  const trackedSet = new Set(ALL_TICKERS);
  const earningsArr = (earningsRes && earningsRes.ok) ? await earningsRes.json() : [];
  const earnings = (Array.isArray(earningsArr) ? earningsArr : [])
    .filter(e => trackedSet.has(e.symbol))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)
    .map(e => ({ symbol: e.symbol, date: e.date, epsEst: e.epsEstimated ?? null }));

  return { sectors, allMovers, events, earnings, today };
}

function buildEmail(type, data, dateStr) {
  const { sectors, allMovers, events, earnings } = data;
  const ismorning = type === "morning";

  const subjectDate = new Date().toLocaleDateString("en-SE", { weekday: "long", day: "numeric", month: "long" });
  const subject = ismorning
    ? `☀️ Morning Brief · ${subjectDate}`
    : `🇺🇸 US Market Preview · ${subjectDate}`;

  // Top movers table rows
  const moverRows = allMovers.map(m => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#c8d8e8;">${m.symbol}</td>
      <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Courier New',monospace;font-size:13px;color:#6a8aaa;text-align:right;">$${fmt(m.price)}</td>
      <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:${color(m.changePercent)};text-align:right;">${arrow(m.changePercent)} ${sign(m.changePercent)}${fmt(m.changePercent)}%</td>
    </tr>`).join("");

  // Sector blocks
  const sectorBlocks = sectors.filter(s => s.movers.length > 0).map(s => `
    <tr><td style="padding:0 0 16px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#445268;margin-bottom:8px;">${s.icon} ${s.name}</div>
      ${s.movers.map(m => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#c8d8e8;">${m.symbol}</span>
          <span style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:${color(m.changePercent)};">${sign(m.changePercent)}${fmt(m.changePercent)}%</span>
        </div>`).join("")}
    </td></tr>`).join("");

  // Events
  const eventsHtml = events.length ? events.map(e => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#445268;white-space:nowrap;">${e.flag} ${e.time || ""}</td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:#c8d8e8;">${e.event}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px;font-weight:700;color:${e.impact === "High" ? "#ff3c50" : "#f59e0b"};text-align:right;white-space:nowrap;">${e.impact}</td>
    </tr>`).join("")
    : `<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:#445268;">No high-impact events today.</td></tr>`;

  // Earnings
  const earningsHtml = earnings.length ? earnings.map(e => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:14px;font-weight:700;color:#c8d8e8;">${e.symbol}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:#6a8aaa;">${e.date}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px;color:#445268;text-align:right;">${e.epsEst != null ? "EPS est. $" + fmt(e.epsEst) : "—"}</td>
    </tr>`).join("")
    : `<tr><td colspan="3" style="padding:12px 0;font-size:13px;color:#445268;">No tracked earnings this week.</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#070d16;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070d16;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- Header -->
  <tr><td style="padding-bottom:28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">QuantDiver</td>
        <td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:#445268;letter-spacing:0.12em;text-transform:uppercase;">${ismorning ? "Morning Brief" : "US Market Preview"}</td>
      </tr>
    </table>
    <div style="height:1px;background:linear-gradient(90deg,rgba(0,180,255,0.5),transparent);margin-top:14px;"></div>
  </td></tr>

  <!-- Date + intro -->
  <tr><td style="padding-bottom:28px;">
    <div style="font-family:'Courier New',monospace;font-size:11px;color:#445268;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">${subjectDate}</div>
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#8a9ec0;line-height:1.6;">
      ${ismorning
        ? "Good morning. Here are the biggest movers, today's macro events, and upcoming earnings across your sectors."
        : "US markets open in under 30 minutes. Here is what QuantDiver is tracking pre-market."}
    </p>
  </td></tr>

  <!-- Top movers -->
  <tr><td style="padding-bottom:28px;">
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(90,130,200,0.15);border-radius:12px;padding:20px 22px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00b4ff;margin-bottom:14px;">Top Movers Today</div>
      <table width="100%" cellpadding="0" cellspacing="0">${moverRows}</table>
    </div>
  </td></tr>

  <!-- Sectors -->
  <tr><td style="padding-bottom:28px;">
    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#445268;margin-bottom:16px;">By Sector</div>
    <table width="100%" cellpadding="0" cellspacing="0">${sectorBlocks}</table>
  </td></tr>

  <!-- Macro events -->
  <tr><td style="padding-bottom:28px;">
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(90,130,200,0.15);border-radius:12px;padding:20px 22px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#f59e0b;margin-bottom:14px;">Macro Events Today</div>
      <table width="100%" cellpadding="0" cellspacing="0">${eventsHtml}</table>
    </div>
  </td></tr>

  <!-- Earnings watch -->
  <tr><td style="padding-bottom:32px;">
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(90,130,200,0.15);border-radius:12px;padding:20px 22px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8b5cf6;margin-bottom:14px;">Earnings Watch · Next 7 Days</div>
      <table width="100%" cellpadding="0" cellspacing="0">${earningsHtml}</table>
    </div>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding-bottom:32px;text-align:center;">
    <a href="https://quantdiver.com" style="display:inline-block;background:linear-gradient(135deg,#0078dc,#0050aa);color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:-0.01em;">Open QuantDiver →</a>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#2a3f55;margin-top:10px;">Live MOMENTUM · RISK · TECH VALUE scores inside</div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1e3048;line-height:1.7;">
      You're receiving this because you subscribed to QuantDiver BriefMe.<br/>
      To unsubscribe, open <a href="https://quantdiver.com" style="color:#2a3f55;">Settings</a> in your account and toggle off this brief.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const type = (req.query.type || "").toLowerCase();
  if (!["morning", "us"].includes(type)) {
    return res.status(400).json({ error: "Use ?type=morning or ?type=us" });
  }

  const resendKey  = process.env.RESEND_API_KEY;
  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;
  if (!resendKey)  return res.status(500).json({ error: "RESEND_API_KEY not configured" });
  if (!polygonKey) return res.status(500).json({ error: "POLYGON_API_KEY not configured" });

  const { getSupabase } = await import("../lib/supabase.js");
  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const field = type === "morning" ? "briefme_morning" : "briefme_us";
  const { data: subscribers, error } = await supabase
    .from("profiles")
    .select("email, username")
    .eq(field, true)
    .not("email", "is", null);

  if (error) return res.status(500).json({ error: "Failed to fetch subscribers" });
  if (!subscribers?.length) return res.status(200).json({ sent: 0, message: "No subscribers" });

  const today = new Date().toISOString().slice(0, 10);
  let briefData;
  try {
    briefData = await fetchBriefData(polygonKey, fmpKey);
  } catch (e) {
    console.error("Brief data fetch failed:", e);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }

  const { subject, html } = buildEmail(type, briefData, today);

  let sent = 0, failed = 0;
  for (const sub of subscribers) {
    try {
      const r = await fetch(RESEND, {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "QuantDiver BriefMe <briefme@quantdiver.com>",
          to:      [sub.email],
          subject,
          html,
        }),
      });
      if (r.ok) sent++; else failed++;
    } catch (e) {
      console.error(`Failed sending to ${sub.email}:`, e);
      failed++;
    }
  }

  console.log(`BriefMe ${type}: sent=${sent} failed=${failed}`);
  return res.status(200).json({ sent, failed });
}
