# QuantDiver Scoring Engine — Model Documentation

## The Moat

QuantDiver's competitive advantage is a **validated, back-tested quantitative scoring engine** that produces three proprietary scores per stock — MOMENTUM, RISK, and TECH VALUE — combined into a single SIGNAL score.

The moat is not the interface. It is not the data. It is the **validated model** — we can demonstrate with historical evidence that high-scoring stocks outperform low-scoring stocks over a 90-day holding period.

**Validated back-test result (June 2026):**
- Stocks scoring **Strong (>70)**: average +17.14% return over 90 days
- Stocks scoring **Weak (<40)**: average -5.01% return over 90 days
- **Spread: +22.15%** across 840 historical data points, 55 tickers
- Back-test runs automatically every Sunday and updates these figures

This is a **90-day conviction signal**, not a short-term trade indicator.

---

## Data Sources

| Source | Plan | Usage |
|--------|------|-------|
| **Polygon.io** | Unlimited | Live snapshots, 200-500 days OHLCV, VIX, S&P 500 index |
| **FMP (Financial Modeling Prep)** | Starter ($29/mo) | Income statements, balance sheets, cash flow, key metrics, earnings surprises |

Formula logic lives entirely server-side in `lib/formulas.js`. It is never bundled to the frontend. Users see output numbers, never the calculation.

---

## Score 1: MOMENTUM (0–100)

**What it measures:** Is the stock in a confirmed uptrend with fundamental backing?

**Data inputs:** Polygon OHLCV aggregates + FMP earnings surprises + live VIX

### Components

| Component | Weight | Description |
|-----------|--------|-------------|
| 6-month return | 35% | Primary driver. Academically validated momentum window (Jegadeesh & Titman, 1993). Range: -30% to +60% |
| 3-month return | 25% | Medium-term trend confirmation. Range: -20% to +40% |
| MA trend | 25% | % distance above/below MA50 and MA200, equally weighted |
| Earnings surprise avg | 10% | Avg beat/miss over last 4 quarters. Consistent beaters have fundamental backing for price momentum |
| Relative volume | 5% | Today's volume vs 30-day average. Elevated volume confirms trend |

### Rules

**Falling knife penalty:** If the stock is down more than 20% over 3 months AND trading below both MA50 and MA200, the final score is multiplied by 0.50. Confirmed downtrends are penalised regardless of other signals.

**VIX regime adjustment:** The final MOMENTUM score is multiplied by a VIX-based factor:

| VIX Level | Multiplier | Rationale |
|-----------|-----------|-----------|
| < 15 | ×1.10 | Calm market — momentum signals are reliable, slight boost |
| 15–20 | ×1.00 | Normal conditions — no adjustment |
| 20–25 | ×0.85 | Elevated fear — signals are less reliable, dampened 15% |
| 25–30 | ×0.70 | High fear — macro is dominating, dampened 30% |
| > 30 | ×0.50 | Crisis — momentum means very little, halved |

**Why VIX matters:** You can be right about a stock but wrong about market timing. During high-VIX periods (Fed meetings, inflation prints, macro shocks), even well-calibrated momentum signals fail because macro factors override company-specific trends.

### Key insight from back-testing

The original formula used 1-month return as the primary input. Back-testing showed this **predicted mean reversion, not continuation** — high-scoring stocks were losing money. Switching to the 6-month primary window aligned with the academic evidence and produced a PREDICTIVE verdict.

---

## Score 2: RISK (0–100, higher = safer)

**What it measures:** How dangerous is the balance sheet? How much financial risk does the company carry?

**Data inputs:** Polygon OHLCV (for volatility) + FMP balance sheet + FMP key metrics

### Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Debt/Equity ratio | 25% | More leverage = more risk. D/E > 3 scores maximum risk |
| Liquidity (current ratio) | 20% | Current assets / current liabilities. Lower = more risk |
| Interest coverage | 20% | Operating income / interest expense. Low coverage = more risk |
| Price volatility | 20% | Annualised standard deviation of daily returns. High vol = more risk |
| ROA (Return on Assets) | 15% | Low ROA = assets not working efficiently = balance sheet risk |

**Current ratio trend:** If the current ratio is deteriorating quarter-over-quarter, a penalty is applied proportionally.

**Interpretation:** A score of 70+ means the balance sheet is clean and the company can service its debt comfortably. Below 40 means elevated risk — high debt, low liquidity, or difficulty covering interest payments.

**Note:** RISK score does not predict short-term price moves. It measures balance sheet quality. A stock can have a high RISK score (bad) and still go up short-term if momentum is strong — but it is fragile.

---

## Score 3: TECH VALUE (0–100)

**What it measures:** Is there a durable, high-quality business underneath the price action?

**Data inputs:** FMP income statement + cash flow + key metrics + earnings surprises

### Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Gross margin | 20% | Pricing power. Higher gross margin = stronger moat |
| R&D intensity (R&D/Revenue) | 20% | Innovation investment as % of revenue. High R&D = future moat |
| Net margin | 15% | Full cost structure — captures what gross margin misses |
| Revenue growth (YoY) | 15% | Annual growth preferred over quarterly — cleaner signal |
| FCF margin | 10% | Free cash flow / revenue. Capital efficiency |
| ROE | 10% | Return on equity — management's use of shareholder capital |
| Earnings surprise consistency | 10% | Consistent beaters have durable competitive advantage |

### Sector normalisation

**Critical design decision:** TECH VALUE scores are normalised within sector, not across the entire market. A defence company with a 20% gross margin should not be penalised for not having software-level margins.

| Sector | Gross Margin Range | R&D Range | Notes |
|--------|-------------------|-----------|-------|
| Software/Cloud | 50–85% | 8–30% | MSFT, META, PLTR, SNOW |
| Semiconductors | 35–70% | 8–25% | NVDA, AMD, INTC |
| Defence/Space | 8–28% | 1–8% | LMT, RTX, RKLB — cost-plus contracts |
| Biotech | 50–88% | 12–50% | LLY, NVO, MRNA |
| Quantum | 10–70% | 20–80% | Early stage — losses are expected |
| General Tech | 35–78% | 5–25% | Fallback for unknown tickers |

**Why this matters:** Before sector normalisation, AMD always scored lower than Snowflake because semiconductor gross margins (~50%) are structurally lower than software margins (~70%). This was a model flaw, not a real signal. AMD should be benchmarked against Intel, Broadcom, and Qualcomm — not against SaaS companies.

---

## SIGNAL Score (0–100)

**What it measures:** A single composite buy/avoid signal combining all three dimensions.

### Calculation

| Scenario | Formula |
|----------|---------|
| Full data (all three scores) | Momentum × 0.40 + Risk × 0.35 + Tech Value × 0.25 |
| Partial data (no fundamentals) | Momentum × 0.55 + Risk × 0.45 |

### Interpretation

| Signal Score | Grade | Label | Meaning |
|-------------|-------|-------|---------|
| 70–100 | A | STRONG · 90D | High conviction — all or most signals align |
| 55–70 | B | WATCH · 90D | Some positives — worth monitoring for confirmation |
| 40–55 | C | MIXED · 90D | Mixed signals — no clear edge |
| 0–40 | D | AVOID · 90D | Weak signals — stay on the sidelines |

**All labels include · 90D** to communicate that this is a medium-term signal, not a day-trade indicator.

---

## Market Regime

**Purpose:** Overlay market-wide conditions on all scores. Even correct stock-specific signals fail when the macro environment is against you.

**Data inputs:** Polygon `I:VIX` + `I:SPX` (S&P 500 history for ATH calculation) + `QQQ` (Nasdaq proxy)

### Regime levels

| Label | VIX | Meaning |
|-------|-----|---------|
| FAVORABLE | < 15 | Calm market. Momentum signals are reliable. |
| NEUTRAL | 15–20 | Normal conditions. Signals at full weight. |
| CAUTION | 20–25 | Elevated fear. Momentum dampened 15%. Size carefully. |
| RISK-OFF | 25–35 | High fear. Momentum dampened 30%. Favour defensive positions. |
| CRISIS | > 35 | Crisis. Momentum near-meaningless. Capital preservation first. |

Displayed in the **Advanced Risk Assessment** panel above individual stock scores.

---

## Back-Test Engine

**Purpose:** Weekly automated validation that the MOMENTUM formula is predictive. Answers: *"Do high-scoring stocks actually outperform low-scoring stocks?"*

**Methodology:**
1. Fetch 500 days of daily OHLCV for 55 tickers across all sectors
2. Step back weekly (every 5 trading days) for up to 24 weeks
3. At each historical point, calculate what the MOMENTUM score **would have been** using only data available at that time
4. Apply the VIX value at that historical point
5. Measure actual forward returns: 30, 60, 90, and 180 days after each score
6. Group into three buckets: Strong (>70), Neutral (40–70), Weak (<40)
7. Calculate average return per bucket and Pearson correlation

**Filters:**
- Only tickers with RISK score > 50 are included — bad balance sheets pollute the momentum signal
- Minimum 90 days of history required per time step

**Verdict logic:** Based on the 90-day spread (Strong avg 90d return minus Weak avg 90d return):
- Spread > 3% → PREDICTIVE
- Spread > 0% → WEAK_SIGNAL
- Spread ≤ 0% → NOT_PREDICTIVE

**Latest results (June 2026):**
- **Verdict: PREDICTIVE**
- Strong (>70): +17.14% avg 90d return
- Weak (<40): -5.01% avg 90d return
- Spread: +22.15% | Samples: 840 | Tickers: 55

**Runs automatically:** Every Sunday at 02:00 UTC via Vercel cron. Results stored in `backtest_results` Supabase table. Viewable in Admin → Model Performance.

---

## Score History & Alerts

**Score history:** Every time scores are recalculated, a snapshot is written to `score_history` (one row per ticker per day). This builds a daily record that powers:
- Score trend charts (shown when clicking a stock)
- 7-day score deltas displayed on stock cards (▲12 / ▼8)
- Score change alerts

**Score alerts:** Sent daily at 09:30 Stockholm time (weekdays) to users with alerts enabled. Triggered by:
- Signal crossing key thresholds (40, 55, 70) — up or down
- Momentum surge or drop of 15+ points in 7 days
- Risk score dropping below 40 (balance sheet deterioration warning)

All alert emails include the footer: *"QuantDiver scores are 90-day signals. Short-term price action may not reflect the underlying momentum."*

---

## Sector Coverage

| Sector | Tickers |
|--------|---------|
| AI / Software | NVDA, AMD, META, MSFT, PLTR, AI, SMCI, GOOGL |
| Quantum Computing | IONQ, RGTI, QUBT, IBM |
| Defence & Space | LMT, RTX, NOC, GD, RKLB, ASTS, KTOS |
| Biotech & MedTech | LLY, NVO, MRNA, REGN, VRTX, GILD, ISRG |
| Financials | JPM, BAC, GS, V, MA, BRK-B, WFC, C |
| Energy | XOM, CVX, COP, SLB |
| Consumer | WMT, COST, HD, TGT, MCD |
| Healthcare | UNH, JNJ, ABT, PFE |
| Industrials | CAT, GE, HON, DE |
| Other | TSLA, NFLX, DIS, PYPL, INTC, AVGO |

---

## What We Don't Do (Yet)

| Capability | Status | Notes |
|------------|--------|-------|
| Options flow | Not built | Strong leading indicator — would require Polygon options data |
| Short interest | Not built | Available on Polygon unlimited plan |
| Institutional 13F holdings | Not built | Available on FMP |
| Macro regime (beyond VIX) | Partial | VIX + SPX position implemented, economic calendar in BriefMe |
| RISK + TECH VALUE back-test | Not yet | Need 6-12 months of `score_history` data first |
| Full three-score back-test | Not yet | SIGNAL score validation pending score_history accumulation |

---

## Intellectual Property Notes

- `lib/formulas.js` is server-side only. Never bundled to the frontend.
- Users see 0–100 output scores. Never the weights, ranges, or formula structure.
- The sector benchmark ranges in `lib/sectorBenchmarks.js` are proprietary.
- The back-test methodology and validation results are the primary marketing asset.
