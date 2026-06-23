# QuantDiver — Project Plan

## What It Is
A premium quantitative stock analysis platform for investors focused on AI, quantum computing, defence, and biotech. The core product is three proprietary scores — MOMENTUM, RISK, TECH VALUE — validated by back-test (+29.3% vs -1.79% over 90 days). Live at quantdiver.com.

---

## How to Brief Claude

Describe **what the user experiences**, not how to build it.

**Formula:** "When [user does X], they should see/get [Y]."

**Good:** "When a user clicks a stock card, it should jump to the Analysis tab and show that stock's data."
**Bad:** "Update the handleSelect function to set dashTab state."

For UI bugs: include a screenshot. For new features: describe the outcome + any edge cases (no data, mobile, not logged in).

---

## Current State (as of June 2026)

### What's Built
- Dashboard with 5 sub-tabs: Watchlist / Analysis / Market Intel / Sectors / News
- Analysis tab with 6 toggle-able sections: Technical, Intelligence, Risk, Rankings, Analyst, Ratios
- Market Intel tab: live VIX/S&P/Nasdaq regime + Sector Risk Assessment (pick any sector)
- Sectors tab: 5 sector tables (AI, Semiconductors, Quantum, Defence, Biotech) with sortable columns
- Scoring engine: MOMENTUM + RISK + TECH VALUE + SIGNAL grade (A/B/C/D)
- Back-test: runs every Sunday, currently PREDICTIVE (+33.29% spread, 966 samples)
- Auth: Supabase login, 14-day free trial, BriefMe + Pro plans
- Community: forum, contributor ranks, usefulness voting, Trader Connect (live 1-on-1 matching), live DM messaging with presence
- Crypto tab: BTC/ETH/SOL and 7 others, MOMENTUM + RISK scores
- Daily Brief tab: macro events, sector movers, news
- Guide tab: 5-step QuantDiver Method
- AI assistant: Claude Haiku, closed-domain, 20 msg/day
- Admin panel: user management, model performance, AI knowledge base
- SEO: Google Search Console verified, sitemap submitted, FAQ schema, OG image
- Vercel Analytics live
- Mobile: bottom dock bar, responsive layouts

### Known Issues
- CRON_SECRET missing from Vercel — cron jobs (BriefMe emails, score alerts, weekly back-test) may not fire
- Mobile layout still needs testing on real device in portrait
- tech_value was null for all tickers until env vars were fixed — scores will now populate correctly on next refresh

---

## Roadmap

Priority order: **Revenue first, then product quality, then features.**

---

### 🔴 Critical (blocks revenue)

**1. Stripe Integration**
- What: Users can pay for BriefMe (49 SEK/mo) and Pro (99 SEK/mo) subscriptions
- Why: No payment gate = no revenue. Currently anyone can sign up free forever
- Behaviour: After 14-day trial expires, user sees upgrade screen. Clicking "Upgrade" opens Stripe checkout. On success, subscription status updates in Supabase and user gets full access
- Blocked by: Company registration (Swedish org number needed for Stripe)
- Edge cases: Failed payment → show retry. Cancelled subscription → downgrade gracefully at period end

**2. Fix CRON_SECRET in Vercel**
- What: Add a valid CRON_SECRET env var so scheduled jobs run
- Why: BriefMe emails, score alerts, and the Sunday back-test all require it
- Behaviour: No user-facing change — but emails start sending and back-test runs automatically

---

### 🟡 High Priority (product quality)

**3. BriefMe Emails — End-to-End Verification**
- What: Verify the morning (08:00) and US preview (15:00) emails actually send and look good
- Why: Advertised on the landing page — if they don't work, it's a broken promise
- Behaviour: User with BriefMe subscription receives two emails on weekdays. Each email has sector movers, top signals, and a market condition summary. Unsubscribe link works
- Edge cases: Empty news day → still send with market condition. Unsubscribe should be one-click, no login required

**4. Score Alerts**
- What: Users get notified when a stock they watch drops a grade or its Risk score falls below 35
- Why: Core value of the platform — proactive signal, not just reactive browsing
- Behaviour: Email arrives with: which stock, what changed, current score, link to view on platform
- Edge cases: Don't send duplicate alerts for the same event within 7 days (already has dedup log table)

**5. Mobile Portrait — Final Polish**
- What: Full usability on iPhone/Android in portrait mode
- Why: Many investors check markets on their phone
- Behaviour: All 5 sub-tabs work cleanly. No horizontal overflow. Touch targets big enough. Sector tables scroll horizontally if needed
- How to test: Send a screenshot of any section that still looks broken

---

### 🟢 Product Features (next quarter)

**6. Score Deltas — Week-over-Week**
- What: Each score shows a small ▲/▼ indicator vs 7 days ago
- Why: Trend matters as much as the absolute score. A stock moving from 45→65 is more interesting than one sitting at 70
- Behaviour: On each stock card and in Analysis, scores show e.g. "72 ▲+8" in small text. Only show if delta ≥ 5 points
- Data: Already being written to score_history table daily — just need to read 7-day-old row and diff

**7. Referral System**
- What: Each user gets a referral link. When someone signs up via that link and converts to paid, the referrer gets 30% of the subscription revenue
- Why: Word-of-mouth growth, community incentive
- Blocked by: Stripe integration

**8. Swedish Market Data**
- What: Add Swedish stocks (Börsdata prohibits commercial use — use EODHD instead)
- Why: Dave is Swedish, target audience includes Swedish investors
- Behaviour: New sector "Swedish Tech" appears in Sectors tab with stocks like Spotify, Ericsson, Embracer
- Note: Requires EODHD API key + new fetchEODHD.js lib file

**9. Portfolio Back-Test**
- What: User can enter their own portfolio tickers and see how the model would have rated them historically
- Why: Personalised proof-of-value — "the model said AVOID on INTC 90 days ago, it's down 12%"
- Behaviour: In My Portfolio tab, button "Back-test my portfolio" runs historical scores for their watchlist tickers and shows outcome

---

### 🔵 Growth Features (6+ months)

**10. Trader Connect + Live Messaging — Polish & Promote**
- What: Trader Connect and DM messaging are built and live in the Community tab. Need end-to-end testing and promotion on the landing page
- Why: Real-time investor connection is a core differentiator — no other stock scoring tool has this
- Behaviour: Community tab → Trader Connect sub-tab → pick topic → get matched → chat live. Messages sub-tab shows online members + DM history
- Next: Test full match flow with two real accounts. Add to landing page value proposition.

**11. Public Leaderboard**
- What: Top-ranked stocks across all sectors, updated daily, visible on the landing page (no login required)
- Why: SEO + social proof + converts visitors to sign-ups
- Behaviour: Landing page shows a live "Top 10 Signals Today" table with grade A stocks

**12. Score History Charts**
- What: 30/60/90-day score trend charts per stock
- Why: Visual proof that the model is consistent and predictive
- Status: score_history table is populated — component exists but needs data to build up over time

---

## Business Model

| Plan | Price | Includes |
|------|-------|----------|
| BriefMe | 49 SEK/mo | Daily email brief, basic scores |
| Pro | 99 SEK/mo | Full platform, community, AI assistant |
| Contributor | Free | Full access in exchange for active community participation |
| Referral | 30% kickback | Pending Stripe + company registration |

**Break-even:** ~12 Pro subscribers (~1,200 SEK/mo covers ~$105/mo infrastructure)
**Current burn:** ~$60/mo (Polygon $29 + FMP $29 + Vercel free + Supabase free)

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Space Grotesk font |
| Backend | Node.js serverless functions on Vercel |
| Database | Supabase (PostgreSQL 17, EU-Central) |
| Auth | Supabase Auth (JWT, bcrypt) |
| Market data | Polygon.io (prices, technicals) |
| Fundamentals | FMP Stable API (income, balance sheet, ratios) |
| Email | Resend (briefme@quantdiver.com) |
| AI assistant | Anthropic Claude Haiku (closed-domain) |
| Analytics | Vercel Analytics |
| Domain | quantdiver.com (GoDaddy DNS → Vercel) |
| Repo | github.com/davemelin6-rgb/polygon-project |

---

## The North Star

> "Cut through the noise. Every feature must help the user make a better investment decision."

If a proposed feature doesn't directly help the user decide whether to buy, hold, or sell — it doesn't ship.
