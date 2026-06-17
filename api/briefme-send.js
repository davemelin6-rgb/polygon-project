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
      price:         t.lastTrade?.p || t.day?.c || t.prevDay?.c || null,
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

  const now = new Date();
  const subjectDate = now.toLocaleDateString("en-SE", { weekday: "long", day: "numeric", month: "long" });
  const dateShort   = now.toLocaleDateString("en-SE", { day: "numeric", month: "long", year: "numeric" });
  const subject = ismorning
    ? `☀️ Morning Brief · ${subjectDate}`
    : `🇺🇸 US Market Preview · ${subjectDate}`;

  const titleEmoji = ismorning ? "☀️" : "🇺🇸";
  const titleText  = ismorning ? "Morning Brief" : "US Market Preview";
  const intro      = ismorning
    ? "The biggest movers, macro events, and upcoming earnings — before the market opens."
    : "Pre-market signals across AI, Quantum, Defence and Biotech — 30 minutes before Wall Street opens.";

  // Top movers rows
  const moverRows = allMovers.map(m => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#e8f0fa;">${m.symbol}</td>
      <td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:13px;color:#4a6a88;text-align:center;">$${fmt(m.price)}</td>
      <td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${color(m.changePercent)};text-align:right;">${arrow(m.changePercent)} ${sign(m.changePercent)}${fmt(m.changePercent)}%</td>
    </tr>`).join("");

  // Sector blocks — 2 per row using nested table
  const sectorPairs = [];
  const filtered = sectors.filter(s => s.movers.length > 0);
  for (let i = 0; i < filtered.length; i += 2) sectorPairs.push(filtered.slice(i, i + 2));

  const sectorGrid = sectorPairs.map(pair => `
    <tr>
      ${pair.map(s => `
        <td width="50%" valign="top" style="padding:0 8px 16px 0;">
          <div style="background:#060c18;border:1px solid #0f1e36;border-radius:10px;padding:16px 18px;">
            <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#2a4060;margin-bottom:12px;">${s.icon} ${s.name}</div>
            ${s.movers.map(m => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                <tr>
                  <td style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#c8d8e8;">${m.symbol}</td>
                  <td align="right" style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:${color(m.changePercent)};">${sign(m.changePercent)}${fmt(m.changePercent)}%</td>
                </tr>
                <tr><td colspan="2" style="font-family:'Courier New',monospace;font-size:11px;color:#2a4060;padding-bottom:6px;border-bottom:1px solid #0a1428;">$${fmt(m.price)}</td></tr>
              </table>`).join("")}
          </div>
        </td>`).join("")}
      ${pair.length === 1 ? `<td width="50%"></td>` : ""}
    </tr>`).join("");

  // Events
  const eventsHtml = events.length ? events.map(e => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-size:13px;color:#4a6a88;white-space:nowrap;">${e.flag}&nbsp;${e.time || ""}</td>
      <td style="padding:9px 14px;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:13px;color:#c8d8e8;">${e.event}</td>
      <td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:11px;font-weight:700;color:${e.impact === "High" ? "#ff3c50" : "#f59e0b"};text-align:right;white-space:nowrap;">${e.impact.toUpperCase()}</td>
    </tr>`).join("")
    : `<tr><td colspan="3" style="padding:14px 0;font-size:13px;color:#2a4060;">No high-impact events today.</td></tr>`;

  // Earnings
  const earningsHtml = earnings.length ? earnings.map(e => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#e8f0fa;">${e.symbol}</td>
      <td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:12px;color:#4a6a88;">${e.date}</td>
      <td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:12px;color:#2a4060;text-align:right;">${e.epsEst != null ? "EPS est. $" + fmt(e.epsEst) : "—"}</td>
    </tr>`).join("")
    : `<tr><td colspan="3" style="padding:14px 0;font-size:13px;color:#2a4060;">No tracked earnings this week.</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#040810;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#040810;padding:0;">
<tr><td align="center" style="padding:0;">

<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Top bar -->
  <tr><td style="background:#040810;padding:24px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#1a3050;">QUANTDIVER</td>
      <td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:#1a3050;letter-spacing:0.12em;text-transform:uppercase;">${dateShort}</td>
    </tr></table>
  </td></tr>

  <!-- Hero title block -->
  <tr><td style="background:linear-gradient(180deg,#060f20 0%,#040810 100%);padding:36px 32px 32px;border-bottom:1px solid #0d1f38;">
    <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00b4ff;margin-bottom:14px;">${titleEmoji} ${titleText}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.1;margin-bottom:18px;">${ismorning ? "Good morning." : "Market opens soon."}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#6a8aaa;line-height:1.65;">${intro}</div>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#040810;padding:32px;">

    <!-- Top movers -->
    <div style="margin-bottom:32px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00b4ff;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">TOP MOVERS TODAY</div>
      <table width="100%" cellpadding="0" cellspacing="0">${moverRows}</table>
    </div>

    <!-- Sectors -->
    <div style="margin-bottom:32px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#1a3050;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">BY SECTOR</div>
      <table width="100%" cellpadding="0" cellspacing="0">${sectorGrid}</table>
    </div>

    <!-- Macro events -->
    <div style="margin-bottom:32px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">MACRO EVENTS TODAY</div>
      <table width="100%" cellpadding="0" cellspacing="0">${eventsHtml}</table>
    </div>

    <!-- Earnings -->
    <div style="margin-bottom:36px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8b5cf6;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">EARNINGS WATCH · NEXT 7 DAYS</div>
      <table width="100%" cellpadding="0" cellspacing="0">${earningsHtml}</table>
    </div>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
      <tr><td align="center" style="background:#060f20;border:1px solid #0d1f38;border-radius:12px;padding:28px;">
        <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;margin-bottom:6px;">Full scores are live.</div>
        <div style="font-family:Georgia,serif;font-size:14px;color:#4a6a88;margin-bottom:20px;">MOMENTUM · RISK · TECH VALUE — updated every 60 seconds.</div>
        <a href="https://quantdiver.com" style="display:inline-block;background:#0066cc;color:#ffffff;font-family:'Courier New',monospace;font-size:13px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">Open QuantDiver</a>
      </td></tr>
    </table>

    <!-- Footer -->
    <div style="border-top:1px solid #0a1428;padding-top:20px;">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#12253a;line-height:1.8;letter-spacing:0.04em;">
        QUANTDIVER · BRIEFME SUBSCRIPTION<br/>
        <a href="%%UNSUB_LINK%%" style="color:#1a3050;">Unsubscribe from this brief</a> &nbsp;·&nbsp; Manage all emails in Settings at quantdiver.com<br/>
        This is not financial advice. QuantDiver provides data and scores for informational purposes only.
      </p>
    </div>

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
    .select("id, email, username")
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
      const uid      = Buffer.from(sub.id).toString("base64url");
      const unsubUrl = `https://quantdiver.com/api/briefme-unsubscribe?uid=${uid}&type=${type}`;
      const subHtml  = html.replace("%%UNSUB_LINK%%", unsubUrl);

      const r = await fetch(RESEND, {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "QuantDiver BriefMe <briefme@quantdiver.com>",
          to:      [sub.email],
          subject,
          html:    subHtml,
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
