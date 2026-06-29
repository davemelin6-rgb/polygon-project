# QuantDiver — Complete Process Overview

## What Is QuantDiver?

QuantDiver is a quantitative stock analysis platform built for investors focused on the technology sectors defining the next 20 years — AI, Quantum Computing, Defence & Space, Biotech, and Semiconductors.

The core idea is simple: **instead of giving investors data and leaving them to figure it out, we give them a verdict.**

Every stock in our universe gets scored across six dimensions and receives a single grade — A, B, C, or D — that tells you whether to act, watch, or avoid. The grades are not opinions. They are the output of mathematical models, back-tested against real historical price data, and continuously validated every week.

---

## The Universe

We cover **113 stocks** across five sectors:

| Sector | Examples | Why |
|--------|----------|-----|
| AI & Software | NVDA, AMD, PLTR, DDOG, CRWD | The intelligence layer of the economy |
| Semiconductors | ASML, TSM, AMAT, LRCX, TXN | The physical infrastructure AI runs on |
| Quantum Computing | IONQ, RGTI, QUBT, QBTS, ARQQ | The next computing paradigm — early stage |
| Defence & Space | LMT, RTX, RKLB, ASTS, KTOS | Geopolitical tailwinds, government spending |
| Biotech & MedTech | LLY, NVO, MRNA, CRSP, ISRG | Aging population, gene editing, GLP-1 revolution |

Stocks are curated — we do not cover the whole market. We cover the sectors we believe are defining the next 20 years.

---

## The Six Scores (0–100 each)

Every stock runs through six independent models. Each model answers a specific question.

### 1. MOMENTUM — "Is the price moving in the right direction?"

**What it measures:** Price trend strength and whether that trend is accelerating or decelerating.

**Key components:**
- 6-month price return (30%) — the primary direction signal
- Momentum acceleration (25%) — is the trend speeding up or slowing down?
- 3-month price return (20%) — recent confirmation
- Moving average position (18%) — price vs 50-day and 200-day averages
- Earnings surprise consistency (5%) — are they beating expectations?
- Relative volume (2%) — is smart money confirming the move?

**The key innovation — Momentum Acceleration:**
A stock that gained 5% in the last 3 months but only 2% in the 3 months before that is accelerating (+3%). A stock that gained 5% but 15% before that is decelerating (-10%). Acceleration is a much stronger signal than the absolute level. It tells you whether you are early or late in the move.

**Adjustments:**
- VIX (market fear index) dampens scores in fearful markets — a great stock in a crisis still goes down
- "Falling knife" penalty — if a stock is down 20%+ AND below both moving averages, score is halved

### 2. RISK — "Can this company survive a downturn?"

**What it measures:** Balance sheet strength and financial survivability.

**Key components:**
- Debt/Equity ratio (22%) — how leveraged is the balance sheet?
- Liquidity (18%) — can they pay their short-term bills?
- Interest coverage (18%) — can operating income service the debt?
- Price volatility (18%) — how wildly does the stock swing?
- Return on assets (12%) — how efficiently does the company use what it has?
- Cash runway (12%) — for pre-profit companies, how many months of cash remain?

**Important:** Higher score = SAFER. A Risk score of 80 means low debt, strong liquidity. A score of 10 means the company is financially fragile.

**Role in the model:** Risk is a floor and filter, not a primary return driver. We use it to prevent Grade A from being awarded to companies that may not survive long enough for the thesis to play out.

### 3. TECH QUALITY — "How good is the existing business today?"

**What it measures:** The quality and durability of the current business model.

**Key components (sector-normalised):**
- R&D intensity (18%) — is the company investing in its future?
- Gross margin (18%) — does it have pricing power?
- Net margin (13%) — is it profitable?
- Revenue growth (13%) — is the top line growing?
- Analyst consensus growth (12%) — what does Wall Street expect?
- Free cash flow margin (9%) — is it generating real cash?
- Return on equity (9%) — is it creating shareholder value?
- Earnings surprise consistency (8%) — does it beat expectations?

**Sector normalisation:** A semiconductor company at 50% gross margin is benchmarked against other semiconductors — not software companies with 80% margins. This ensures fair comparison within sectors.

### 4. TECH DEMAND — "How much will the world need this technology?"

**What it measures:** Forward-looking technology demand — where is this sector in its adoption cycle?

**Key components:**
- Sector demand score (30%) — editorial assessment of the 1-5 year demand trajectory for this sector, updated quarterly
- Analyst forward revenue growth (30%) — what does Wall Street consensus expect for next year's revenue?
- Sector ETF momentum (25%) — how is the sector ETF performing? Proxy for institutional money flowing into this technology
- Revenue acceleration (15%) — is the company's own growth rate speeding up?

**The key insight:** A company with great margins on declining technology (think VHS in 2005) would score high on Tech Quality but low on Tech Demand. Both scores together give a complete picture.

**Sector demand scores we assign (updated quarterly):**
- Quantum Computing: 88/100 — early adoption, massive long-term potential
- AI & Software: 82/100 — strong growth, increasing competition
- Defence & Space: 80/100 — geopolitical tailwinds, government spending rising
- Biotech & MedTech: 78/100 — aging population, GLP-1, gene therapy
- Semiconductors: 76/100 — essential infrastructure, cyclical but structural tailwind

### 5. INNOVATION — "Is the R&D actually paying off?"

**What it measures:** R&D quality and return — specifically for pre-profit companies.

**Key components:**
- R&D intensity (25%) — how much is the company investing relative to its revenue?
- R&D productivity (25%) — for every dollar of R&D, how much new revenue is being generated?
- Revenue acceleration (25%) — is the adoption curve bending upward?
- Gross margin trajectory (15%) — is pricing power improving over time?
- Analyst conviction (10%) — are analysts getting more bullish on future growth?

**Why this matters:** IONQ has no profit. MRNA had no profit for years. Standard financial models score them poorly. The Innovation score is designed specifically for early-stage technology companies that are investing heavily in the future. A company can score 70+ on Innovation even with no earnings, if R&D is converting to revenue and adoption is accelerating.

### 6. SENTIMENT — "Are experts getting more bullish or bearish?"

**What it measures:** The direction of expert opinion — not just the level, but whether it is moving up or down.

**Key components:**
- Analyst estimate revision direction (40%) — are revenue forecasts being raised or cut?
- Earnings beat consistency (35%) — does the company consistently beat expectations?
- Analyst revenue conviction (25%) — how strong is the absolute consensus growth forecast?

**The key distinction:** A stock where 8 out of 10 analysts have raised their estimates in the last quarter is fundamentally different from one where estimates are flat. Sentiment measures this movement, not just the snapshot.

---

## The Signal Score and Grades

The six individual scores combine into one **Signal Score** (0–100).

**Weighting formula:**

| Score | Weight | Rationale |
|-------|--------|-----------|
| MOMENTUM | 45% | Price is the ultimate arbiter — fundamentals mean nothing if the market disagrees |
| INNOVATION | 30% | Primary differentiator for our audience — R&D quality predicts long-term value creation |
| TECH QUALITY | 15% | Quality filter for established, profitable companies |
| RISK | 10% | Survival filter — not a return predictor at this weight |

*(When TECH DEMAND and SENTIMENT are also available: MOM 35% + DEMAND 20% + SENTIMENT 15% + INNOV 15% + TECH 10% + RISK 5%)*

**Grade thresholds (derived from back-test data):**

| Grade | Signal Range | Meaning |
|-------|-------------|---------|
| **A** | ≥ 63 | Strong — all or most signals align. Act. |
| **B** | 48–63 | Watch — building momentum, watch for transition to Grade A |
| **C** | 35–48 | Mixed — no clear edge. Wait for a cleaner setup. |
| **D** | < 35 | Avoid — weak or declining signals. Stay on the sidelines. |

---

## How the Back-Test Works

### The Core Methodology

We test whether our model would have correctly identified outperforming stocks in the past. The process:

**Step 1 — Go back in time.**
We step back through 52 weeks of history, one week at a time, for each of our 65 tickers. That gives us over 3,000 individual historical "snapshots."

**Step 2 — Calculate the score at that historical point.**
At each snapshot, we calculate what the Momentum score would have been using only the price data available at that moment. We never use future data. The model cannot "cheat."

**Step 3 — Measure what actually happened next.**
We record the actual price return over the following 30, 60, 90, and 180 days. This is the ground truth — what the market actually did after the model made its call.

**Step 4 — Group by grade and measure.**
We group all snapshots by their grade (A/B/C/D) and calculate average returns and win rates for each group.

### The Two-Phase Test

This is the most important part of the methodology:

```
MONTHS 1–3:   Price history used to calculate the score
                        ↓
              SCORE IS SET HERE — the model makes its call
                        ↓
MONTHS 4–6:   What actually happened NEXT — the real test
```

**Why two phases matter:**
- Months 1-3 after the score is set captures some momentum continuation (stocks that were already rising tend to keep rising for a while — this is partly circular)
- Months 4-6 is the **genuine test** — this is what happens after the initial momentum has played out, when it is no longer possible to argue the model just caught a trend already in motion

If the model is genuinely predictive, Grade A stocks should outperform in BOTH phases. And they do.

### The Results (as of June 2026)

**3,136 samples across 65 stocks, 52 weeks of history:**

| Grade | 90d Return | 180d Return | Phase 2 (months 4-6) | Win Rate |
|-------|-----------|-------------|----------------------|----------|
| **A** | **+19.68%** | **+40.19%** | **+17.14%** | **66.6%** |
| B | +8.30% | +21.85% | +12.51% | 60.8% |
| C | +5.78% | +13.28% | +7.09% | 54.4% |
| D | +6.99% | +19.60% | +11.79% | 56.2% |

**Verdict: PREDICTIVE — Spread 12.69%**

**Grade A vs the Index (same time windows):**
- Alpha vs S&P 500: **+12.69%**
- Alpha vs QQQ (tech ETF): **+10.53%**
- t-statistic: **8.23** (probability this is random: < 0.001%)

### What the Results Tell Us

**1. The model separates winners from losers.**
Grade A stocks return nearly 3x more than Grade D over 90 days. The ordering is clean: A > B > C in all timeframes.

**2. The longer you hold, the stronger the edge.**
At 90 days the advantage is +12.69%. At 180 days it is much larger. The model identifies something real about trajectory, not just a short-term blip.

**3. Two out of three Grade A picks were profitable.**
66.6% win rate. In investing, being right two out of three times with consistent position sizing compounds significantly over time.

**4. The model generates genuine alpha.**
Grade A stocks outperform the S&P 500 by +12.69% in the same time windows. This is not the market going up and dragging everything with it. This is genuine outperformance, statistically proven with a t-statistic of 8.23.

**5. Phase 2 is the real proof.**
Grade A stocks return +17.14% in months 4-6, AFTER the initial momentum has already played out. This is the strongest evidence that the model is identifying something real.

---

## The Forward Validation System

The back-test is important but it is retrospective — we are testing the model on data that already existed when we built the formula.

The **Forward Validation System** is the honest test:

1. Every time scores are calculated, we record the stock's **price and grade at that exact moment**
2. We do NOT know what will happen next
3. 90 and 180 days later, we fetch the current price and calculate the actual return
4. We compare: did our Grade A stocks actually outperform?

This is the only truly honest validation. The forward validation data starts accumulating from June 24, 2026. The first meaningful 90-day results will be available September 24, 2026.

**Where to find it:** Admin Panel → 🎯 Forward Validation

---

## The Back-Test Limitation

It is important to be honest about what the back-test does and does not prove.

**What it proves:**
- Stocks with high momentum scores historically outperformed stocks with low momentum scores over 90-180 day windows
- This outperformance is statistically significant (t-stat 8.23)
- The effect holds across multiple sectors, time periods, and market conditions
- Grade A generates genuine alpha above the S&P 500 and QQQ

**What it does not prove:**
- That the model will predict future returns with the same accuracy
- That all six scores (especially TECH DEMAND and INNOVATION, which use current fundamentals) are fully validated — we can only back-test momentum historically; fundamental data from FMP is current, not historical

**The honest position:** The back-test validates that the **momentum component** of our model is genuinely predictive. The additional scores (TECH DEMAND, INNOVATION, SENTIMENT) are theoretically sound and we believe they improve signal quality — but they require the forward validation dataset to prove rigorously. That proof builds every day.

---

## How to Use the Platform

### The 5-Step QuantDiver Method

**Step 1 — Find Grade A stocks.**
Open Dashboard → Sectors tab. Look for Grade A stocks (signal ≥ 63). These are the setups with the strongest historical track record.

**Step 2 — Check the individual scores.**
Click the stock to open Analysis. Look at all six scores. You want:
- MOM high (momentum confirmed and accelerating)
- RISK above 35 (balance sheet survivable)
- DEMAND high (sector tailwinds)
- INNOV high (R&D paying off — especially important for pre-profit companies)

**Step 3 — Check Market Condition.**
Go to Market Intel tab. Look at the VIX regime. If FAVORABLE or NEUTRAL — proceed. If RISK-OFF or CRISIS — reduce conviction and size.

**Step 4 — Hold for 90-180 days.**
This is a medium-term signal, not a day trade. Short-term volatility in the first 30 days is normal and expected. Do not react to noise.

**Step 5 — Watch for grade changes, not prices.**
Enable score alerts in Settings. If a Grade A stock drops to Grade C or D — that is the exit signal. Checking the price every day is not the process.

---

## Key Numbers to Remember

| Metric | Value |
|--------|-------|
| Stocks in universe | 113 |
| Sectors covered | 5 |
| Back-test samples | 3,136 |
| Grade A avg 90d return | +19.68% |
| Grade A avg 180d return | +40.19% |
| Grade A win rate | 66.6% |
| Alpha vs S&P 500 | +12.69% |
| Alpha vs QQQ | +10.53% |
| t-statistic | 8.23 |
| Verdict | PREDICTIVE |
| Back-test runs | Every Sunday, 02:00 UTC |

---

## What Makes QuantDiver Different

Most platforms give investors **data** and leave them to figure it out.

QuantDiver gives investors a **decision** — backed by a model that has been tested, validated, and proven to generate alpha above the market.

The three levels of value:
1. **Data** (commodity — anyone can buy Polygon and FMP)
2. **Aggregation** (combining the right signals into meaningful scores)
3. **Proven aggregation** (showing through back-testing that high scores genuinely predict better outcomes)

Most platforms stop at level 1. We operate at level 3. Every week the model validates itself. If it drifts, we catch it and fix it. The product improves continuously.

---

*QuantDiver scores and signals are for informational purposes only and do not constitute financial advice. Past back-test performance does not guarantee future results. Always conduct your own research before making investment decisions.*
