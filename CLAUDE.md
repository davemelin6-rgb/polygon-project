# Project Context — Stock Scoring Platform

## What This Is
A premium stock analysis web app built on Polygon.io market data. The core product is a **proprietary scoring engine** that calculates three scores per stock — MOMENTUM, RISK, and TECH VALUE — before displaying them to users. The formulas are the moat and must stay server-side only.

## How to Run Locally
```bash
# Terminal 1 — API backend (port 3456)
node _preview_server.mjs

# Terminal 2 — React frontend (port 5173)
npm run dev
```
Then open http://localhost:5173

## Tech Stack
- **Frontend**: React 18 + Vite, Space Grotesk + Space Mono fonts, dark futuristic theme
- **Backend**: Node.js serverless functions (built for Vercel deployment)
- **Data sources**:
  - Polygon.io — live snapshots + 200-day price history (unlimited plan, key in .env)
  - FMP (Financial Modeling Prep) — fundamentals: income statement, balance sheet, cash flow (free tier 250 req/day, key in .env)

## File Structure
```
stocks.js                  — Polygon snapshot API endpoint (/api/stocks)
scores.js                  — Scoring engine endpoint (/api/scores)
_preview_server.mjs        — Local dev server (loads .env, routes both endpoints)
lib/
  formulas.js              — THE MOAT: pure scoring functions (no I/O)
  fetchPolygon.js          — Fetches 200d OHLCV aggregates from Polygon
  fetchFMP.js              — Fetches fundamentals from FMP stable API
src/
  App.jsx                  — Full React UI (cards, panels, score bars)
  App.css                  — Premium dark theme styles
  index.css                — Body/font setup
.env                       — API keys (gitignored, never commit)
.gitignore
package.json
vite.config.js             — Vite config + proxy /api → localhost:3456
```

## Environment Variables (.env)
```
POLYGON_API_KEY=...        # Polygon.io key (unlimited plan)
FMP_API_KEY=...            # FMP key (stable API, post-Aug 2025)
```
Add these same vars to Vercel dashboard when deploying.

## The Three Scores (0–100)

### MOMENTUM — Polygon only, fully live
- 1-month return (30%) + 3-month return (35%) + relative volume (15%) + MA trend (20%)
- Uses 200 days of daily OHLCV from `/v2/aggs/ticker/{t}/range/1/day/...`

### RISK — Polygon + FMP, fully live
- Debt ratio (30%) + liquidity/current ratio (25%) + interest coverage (20%) + price volatility (25%)
- FMP: balance sheet + income statement
- Without FMP: volatility-only fallback

### TECH VALUE — FMP only, fully live
- R&D intensity (30%) + gross margin (35%) + revenue growth (20%) + FCF margin (15%)
- FMP: income statement + cash flow statement
- Returns null if FMP unavailable

## FMP API Notes
- FMP changed their API in August 2025 — v3 is legacy, now use `/stable/` endpoints
- Example: `GET https://financialmodelingprep.com/stable/income-statement?symbol=AAPL&apikey=...`
- Free tier: 250 requests/day. 5 tickers × 3 statements = 15 calls per fetch

## Caching
- Scores cache: 60 seconds in-memory Map (price-sensitive)
- Fundamentals cache: 24 hours in-memory Map (quarterly data)
- Both caches are per-instance — fine for single Vercel instance, would need Redis (Upstash free) at scale

## UI Features
- Stock grid with live price, change %, and 3 score bars (MOM/RISK/TECH) per card
- Click a card → both panels below update to show that stock's individual scores + insights
- Click again → deselects, panels return to portfolio aggregate view
- Advanced Risk Assessment panel: risk breakdown with score bars
- Financial Intelligence panel: AI-generated insights from real scores
- Auto-refreshes every 60 seconds

## Current Scores (as of last test)
| Stock | MOMENTUM | RISK | TECH VALUE |
|-------|----------|------|------------|
| AAPL  | 72       | 37   | 49         |
| MSFT  | 29       | 28   | 66         |
| NVDA  | 61       | 21   | 76         |
| GOOGL | —        | —    | —          |
| AMZN  | —        | —    | —          |

## Known Issues / Next Steps
1. **Not deployed** — only runs locally, needs Vercel deployment
2. **No auth** — anyone with the URL can use the Polygon key for free
3. **No database** — no watchlists, no user accounts, nothing persisted
4. **FMP rate limit** — 250 req/day free tier will break with real users
5. **Formula validation** — weights and normalization ranges are first-draft, need back-testing
6. **Mobile layout** — not tested on small screens
7. **Score history** — no tracking of scores over time

## Business Context
The scoring formulas in `lib/formulas.js` are the core product/moat. The idea is to sell access to these scores. Users see the numbers, not how they are calculated. The three scores chosen are RISK, TECH VALUE, and MOMENTUM — chosen to give investors a quick signal on any stock.
