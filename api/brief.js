// api/brief.js — Daily Brief: sector movers + news + macro events
// GET /api/brief

import { verifySession } from "../lib/apiGuard.js";

const POLYGON = "https://api.polygon.io";
const FMP     = "https://financialmodelingprep.com/stable";

const SECTORS = [
  { id: "quantum",  name: "Quantum Stocks",   icon: "⚛️",  accent: "#8B5CF6",
    tickers: ["IONQ","RGTI","QUBT","QBTS","IBM","GOOGL","MSFT"] },
  { id: "ai",       name: "AI Stocks",         icon: "🧠",  accent: "#22D3EE",
    tickers: ["NVDA","AMD","META","MSFT","PLTR","AI","SOUN","SMCI"] },
  { id: "defence",  name: "Defence & Space",   icon: "🛡️",  accent: "#F59E0B",
    tickers: ["LMT","RTX","NOC","GD","BA","RKLB","ASTS","KTOS"] },
];

const ALL_TICKERS = [...new Set(SECTORS.flatMap(s => s.tickers))];

const FLAGS = {
  US:"🇺🇸", EU:"🇪🇺", GB:"🇬🇧", SE:"🇸🇪", JP:"🇯🇵",
  CN:"🇨🇳", CA:"🇨🇦", AU:"🇦🇺", DE:"🇩🇪", FR:"🇫🇷",
  CH:"🇨🇭", NZ:"🇳🇿", KR:"🇰🇷", IT:"🇮🇹", ES:"🇪🇸",
};

const cache = new Map();
const TTL   = 5 * 60_000;

export default async function handler(req, res) {
  const authed = await verifySession(req);
  if (authed === "rate_limited") return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed) return res.status(401).json({ error: "Unauthorized" });

  const polygonKey = process.env.POLYGON_API_KEY;
  const fmpKey     = process.env.FMP_API_KEY;
  if (!polygonKey)  return res.status(500).json({ error: "No Polygon key" });

  const today    = new Date().toISOString().slice(0, 10);
  const cacheKey = today + "-" + new Date().getUTCHours() + "-v2"; // bust old cache
  const hit      = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return res.status(200).json(hit.data);

  try {
    const tickerStr = ALL_TICKERS.join(",");

    // Fetch news per sector via Polygon /v2/reference/news (FMP Starter has no news)
    const KEY_TICKERS = {
      quantum: ["IONQ", "IBM", "GOOGL", "MSFT"],
      ai:      ["NVDA", "AMD", "META", "PLTR"],
      defence: ["LMT",  "RTX", "BA",   "RKLB"],
    };

    const sectorNewsFetches = SECTORS.map(async s => {
      const picks = KEY_TICKERS[s.id] || s.tickers.slice(0, 4);
      const results = await Promise.all(
        picks.map(ticker =>
          fetch(`${POLYGON}/v2/reference/news?ticker=${ticker}&limit=3&order=desc&sort=published_utc&apiKey=${polygonKey}`)
            .then(r => r.ok ? r.json() : { results: [] })
            .then(j => (j.results || []).map(a => ({
              symbol:    ticker,
              title:     a.title,
              text:      a.description ? a.description.slice(0, 300).trim() : null,
              url:       a.article_url,
              published: a.published_utc,
              source:    a.publisher?.name || "",
            })))
            .catch(() => [])
        )
      );
      const items = results.flat();
      return { items, _raw: `array[${items.length}]` };
    });

    const [snapRes, calRes, ...sectorNewsResults] = await Promise.all([
      fetch(`${POLYGON}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${encodeURIComponent(tickerStr)}&apiKey=${polygonKey}`),
      fmpKey ? fetch(`${FMP}/economic-calendar?from=${today}&to=${today}&apikey=${fmpKey}`) : Promise.resolve(null),
      ...sectorNewsFetches,
    ]);

    // ── Prices ──────────────────────────────────────────────
    const snapJson  = snapRes.ok ? await snapRes.json() : { tickers: [] };
    const priceMap  = {};
    for (const t of (snapJson.tickers || [])) {
      priceMap[t.ticker] = {
        symbol:        t.ticker,
        price:         t.lastTrade?.p ?? t.day?.c ?? null,
        change:        t.todaysChange ?? null,
        changePercent: t.todaysChangePerc ?? null,
      };
    }

    // ── Sector movers ────────────────────────────────────────
    const sectors = SECTORS.map(s => ({
      id:     s.id,
      name:   s.name,
      icon:   s.icon,
      accent: s.accent,
      stocks: s.tickers
        .map(t => priceMap[t])
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0)),
    }));

    // ── News — one fetch per sector, deduplicated by URL ─────
    const seenUrls = new Set();
    const newsBySector = {};
    const news = [];

    for (let i = 0; i < SECTORS.length; i++) {
      const s   = SECTORS[i];
      const raw = (sectorNewsResults[i]?.items) || [];
      const mapped  = raw
        .filter(a => a.url && !seenUrls.has(a.url))
        .slice(0, 5)
        .map(a => {
          seenUrls.add(a.url);
          return {
            symbol:    a.symbol,
            title:     a.title,
            text:      a.text ? a.text.slice(0, 300).replace(/<[^>]+>/g, "").trim() : null,
            url:       a.url,
            published: a.publishedDate,
            source:    a.site,
          };
        });
      newsBySector[s.id] = mapped;
      news.push(...mapped);
    }

    // ── Economic calendar ────────────────────────────────────
    const calArr = (calRes && calRes.ok) ? await calRes.json() : [];

    const events = (Array.isArray(calArr) ? calArr : [])
      .filter(e => e.impact === "High" || e.impact === "Medium")
      .sort((a, b) => {
        const ord = { High: 0, Medium: 1 };
        return (ord[a.impact] ?? 2) - (ord[b.impact] ?? 2);
      })
      .slice(0, 8)
      .map(e => ({
        time:     e.date ? e.date.slice(11, 16) : null,
        country:  e.country ?? "",
        flag:     FLAGS[e.country] ?? "🌐",
        event:    e.event,
        impact:   e.impact,
        estimate: e.estimate ?? null,
        previous: e.previous ?? null,
        actual:   e.actual ?? null,
        unit:     e.unit ?? "",
      }));

    const data = { sectors, news, newsBySector, events, date: today };
    cache.set(cacheKey, { data, expires: Date.now() + TTL });
    return res.status(200).json(data);

  } catch {
    return res.status(500).json({ error: "Brief failed" });
  }
}
