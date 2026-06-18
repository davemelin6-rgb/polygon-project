# QuantDiver — Technical Infrastructure & Stack

## Overview

QuantDiver is a full-stack SaaS application with a React frontend, Node.js serverless backend, and cloud-managed database and authentication. All infrastructure is cloud-hosted with zero self-managed servers.

---

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI framework |
| **Vite** | Latest | Build tool and dev server |
| **Space Grotesk** | Google Fonts | Display / heading font |
| **Space Mono** | Google Fonts | Monospace / data font |

**Entry point:** `src/main.jsx`
**Build output:** `dist/` (bundled by Vite for production)
**Dev server:** `npm run dev` → `localhost:5173`

### Key frontend components

| File | Purpose |
|------|---------|
| `src/main.jsx` | Root — session management, routing between login/dashboard/admin |
| `src/App.jsx` | Main dashboard — stock cards, panels, nav tabs |
| `src/QuantDiverSite.jsx` | Public landing page — all pages before login |
| `src/Login.jsx` | Auth flow — sign in / create account / plan selection |
| `src/Portfolio.jsx` | My Portfolio tab — aggregate scoring |
| `src/SectorRanking.jsx` | Peer ranking panel — z-scores, percentiles |
| `src/ScoreHistory.jsx` | SVG score trend chart |
| `src/MarketRegime.jsx` | VIX / market condition panel |
| `src/SectorSection.jsx` | Market sector tables with Top Rank badge |
| `src/Forum.jsx` | Community forum |
| `src/Settings.jsx` | User preferences panel |
| `src/AdminPanel.jsx` | Admin — users + model performance |
| `src/DailyBrief.jsx` | Daily market intelligence brief |

---

## Backend

All API endpoints are **Node.js serverless functions** deployed on Vercel. Each file in `api/` becomes one serverless endpoint.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stocks` | GET | Live price snapshots from Polygon |
| `/api/scores` | GET | MOMENTUM/RISK/TECH VALUE scores + 7-day deltas |
| `/api/charts` | GET | Price chart data |
| `/api/score-history` | GET | Historical score snapshots per ticker |
| `/api/sector-scores` | GET | All scores in a sector + rank/percentile/z-score |
| `/api/market-regime` | GET | VIX + SPX position + overall regime |
| `/api/backtest-run` | GET | Weekly MOMENTUM back-test (cron-triggered) |
| `/api/score-alerts` | GET | Daily score change alert emails (cron-triggered) |
| `/api/briefme-send` | GET | BriefMe scheduled email sender (cron-triggered) |
| `/api/briefme-unsubscribe` | GET | One-click unsubscribe (HMAC-signed) |
| `/api/brief` | GET | Daily Brief panel data |
| `/api/news` | GET | News feed per ticker |
| `/api/technicals` | GET | Technical indicators (RSI, MACD, etc.) |
| `/api/analyst` | GET | Analyst consensus data |
| `/api/insider` | GET | Insider trading feed |
| `/api/ratios` | GET | Key financial ratios |
| `/api/history` | GET | Price history for charts |
| `/api/contributor-apply` | POST | Contributor application form |
| `/api/contact` | POST | Contact support form |
| `/api/admin` | GET/POST | Admin panel — user management + backtest trigger |
| `/api/match` | GET/POST | Trader Connect matchmaking |

### Shared libraries

| File | Purpose |
|------|---------|
| `lib/formulas.js` | **THE MOAT** — pure scoring functions, never exposed to frontend |
| `lib/fetchPolygon.js` | Polygon OHLCV aggregates (supports custom day count) |
| `lib/fetchFMP.js` | FMP fundamentals — income, balance sheet, cashflow, key-metrics, earnings |
| `lib/sectorBenchmarks.js` | Per-sector normalization ranges for TECH VALUE |
| `lib/apiGuard.js` | JWT verification + rate limiting (120 req/60s per user) |
| `lib/supabase.js` | Service role Supabase client (bypasses RLS — server only) |

---

## Infrastructure & Services

### Hosting — Vercel
- **Plan:** Hobby (free) → upgrade to Pro ($20/mo) when needed
- **Deployment:** Auto-deploys on every `git push` to `main`
- **Functions timeout:** 60 seconds (300s on Pro)
- **Domain:** `quantdiver.com` + `www.quantdiver.com`
- **Environment variables:** All API keys stored in Vercel dashboard

### Database & Auth — Supabase
- **Plan:** Free → upgrade to Pro ($25/mo) when needed
- **Region:** EU Central (Frankfurt)
- **Auth:** Supabase Auth — bcrypt password hashing, JWT sessions
- **Database:** PostgreSQL 17

#### Database tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, settings, BriefMe toggles, alert preferences |
| `scores` | Cached scores per ticker (refreshed hourly) |
| `score_history` | Daily score snapshots — powers trend charts and alerts |
| `backtest_results` | Weekly back-test output — verdict, spread, bucket data |
| `score_alert_log` | Dedup log for score change alerts |
| `user_watchlists` | Saved portfolio tickers per user |
| `contributor_applications` | Contributor program applications |
| `forum_posts` | Community forum posts |
| `forum_comments` | Forum comments |
| `forum_votes` | Forum upvotes |
| `user_subscriptions` | Subscription status per user |
| `messages` | Direct messages between users |
| `match_queue` | Trader Connect matchmaking queue |
| `match_sessions` | Active trader match sessions |
| `match_messages` | Messages within match sessions |

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only read/write their own rows
- Service role (server-side) bypasses RLS for all backend operations
- `scores` and `score_history` readable by any authenticated user
- Admin-only tables (`backtest_results`, `contributor_applications`) not readable via frontend

### Email — Resend
- **Plan:** Free (3,000 emails/month) → $20/mo for 50,000
- **Sending domain:** `briefme@quantdiver.com`
- **Use cases:** BriefMe emails, score alerts, contact form, contributor applications
- **DNS:** SPF + DKIM configured in Vercel DNS

### Market Data — Polygon.io
- **Plan:** Unlimited ($29/mo)
- **Usage:** Live snapshots, OHLCV aggregates (200-500 days), VIX index, S&P 500
- **Cache:** Polygon data cached in-memory per request

### Fundamentals — FMP (Financial Modeling Prep)
- **Plan:** Starter ($29/mo, 300 req/min)
- **API version:** Stable (post-Aug 2025) — `/stable/` endpoints
- **Usage:** Income statements, balance sheets, cash flow, key metrics, earnings surprises
- **Cache:** 7-day in-memory cache (fundamentals are quarterly, rarely change)

### Domain — GoDaddy
- **Domain:** `quantdiver.com`
- **Renewal:** Jun 2027 — kr249/yr
- **DNS:** Managed by Vercel (nameservers point to Vercel)
- **Email:** GoDaddy email product — `administrator@quantdiver.com` forwards to `davemelin6@gmail.com`

---

## Scheduled Jobs (Vercel Cron)

All crons are secured with `CRON_SECRET` Bearer token.

| Job | Schedule | Time (Stockholm) | Purpose |
|-----|----------|-----------------|---------|
| BriefMe Morning | `0 6 * * 1-5` | 08:00 weekdays | Morning market brief email |
| BriefMe US Preview | `0 13 * * 1-5` | 15:00 weekdays | US market preview email |
| Score Alerts | `30 7 * * 1-5` | 09:30 weekdays | Score change notifications |
| Back-test | `0 2 * * 0` | 04:00 Sunday | Weekly model validation |

---

## Environment Variables

All stored in Vercel dashboard AND local `.env` file (gitignored).

| Variable | Used By | Purpose |
|----------|---------|---------|
| `POLYGON_API_KEY` | Backend | Polygon.io market data |
| `FMP_API_KEY` | Backend | FMP fundamentals |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role — bypasses RLS |
| `VITE_SUPABASE_URL` | Frontend | Supabase URL (public) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anon key (public) |
| `RESEND_API_KEY` | Backend | Resend email sending |
| `CRON_SECRET` | Backend | Secures cron endpoints |
| `UNSUB_SECRET` | Backend | HMAC signing for unsubscribe links |

---

## Local Development

```bash
# Terminal 1 — API backend (port 3456)
node _preview_server.mjs

# Terminal 2 — React frontend (port 5173)
npm run dev
```

Then open `http://localhost:5173`

The Vite dev server proxies all `/api/*` requests to `localhost:3456` (configured in `vite.config.js`).

---

## Deployment

```bash
git add .
git commit -m "description"
git push
```

Vercel auto-deploys on every push to `main`. Deployment takes ~30 seconds. No manual steps required.

**GitHub repo:** `davemelin6-rgb/polygon-project`

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Authentication | Supabase JWT — bcrypt passwords, short-lived access tokens |
| API authorisation | `verifySession()` on every endpoint — 401 if no valid JWT |
| Rate limiting | 120 requests per 60 seconds per user |
| Trial enforcement | Server-side expiry check on every API call |
| RLS | Row-level security on all Supabase tables |
| Cron security | CRON_SECRET Bearer token on all scheduled endpoints |
| Email security | HMAC-SHA256 signed unsubscribe tokens (UNSUB_SECRET) |
| HTML injection | Full entity escaping in all user-generated email content |
| Formula protection | `lib/formulas.js` server-side only — never bundled to frontend |
| HTTPS | Automatic via Vercel — all traffic encrypted in transit |

---

## Monthly Costs

| Service | Cost |
|---------|------|
| Polygon.io | $29/mo |
| FMP Starter | $29/mo |
| Vercel | $0 (Hobby) → $20/mo (Pro) |
| Supabase | $0 (Free) → $25/mo (Pro) |
| Resend | $0 (Free) → $20/mo (50k emails) |
| GoDaddy domain | ~$2.50/mo (kr249/yr) |
| **Current total** | **~$60/mo** |
| **At scale** | **~$105/mo** |

**Break-even:** ~12 Pro subscribers (99 SEK/mo each).

---

## PC Setup (New Machine)

To replicate the development environment on a new PC:

1. Copy `C:\Users\Dave\Documents\polygon` (includes `.env`)
2. Copy `C:\Users\Dave\.claude\` (Claude memory + settings)
3. Install: Node.js, Git, VS Code
4. Install Claude Code extension in VS Code
5. Run `npm install` inside the project folder
6. Run `node _preview_server.mjs` + `npm run dev`
