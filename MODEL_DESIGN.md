# QuantDiver — Model Design Specification
## QuantDiver Engine — Research & Development Document

---

## Purpose & Mission

> **QuantDiver exists to prove that the right combination of data, rigorously aggregated and continuously validated, can help investors make better decisions than they would make alone.**

### The Three Levels of Value

**Level 1 — Data** *(commodity)*
Anyone can buy price data from Polygon, fundamentals from FMP, news from any provider. Data alone is not a product. It is a starting point.

**Level 2 — Aggregation** *(harder)*
Taking 5-8 signals per dimension, combining them with the right weights, normalising for sector differences, and producing one meaningful score per stock. This requires methodology, domain knowledge, and iteration. Most platforms stop here but don't even do it well — they show you the raw data and leave you to figure it out.

**Level 3 — Proven Aggregation** *(the moat)*
Back-testing demonstrates that stocks with high scores actually outperform stocks with low scores over a defined time period. Forward validation records every prediction made today and checks it in 90-180 days. This is what separates a product worth paying for from a data dashboard. This is where QuantDiver must live.

### What This Means for Every Decision We Make

Before adding any signal, score, or feature, ask:
1. Does this improve the predictive power of our aggregation?
2. Can we back-test it — i.e., does it actually help high scores outperform low scores?
3. If we can't back-test it yet, does it have strong theoretical or empirical backing from finance research?

If the answer to all three is no — don't build it.

### Our Differentiation in One Sentence

> *"We don't give you data. We give you a verdict — and we have the back-test to prove it's worth trusting."*

### Why This Is Hard to Replicate

1. The formula weights are derived from back-test outcomes — not theory. They improve every week as the model validates itself.
2. The forward validation dataset is proprietary and grows daily. After 12 months, we will have 365 daily prediction records per ticker. No one else has this dataset for our universe.
3. The sector-specific normalisation means our scores are comparable across sectors — a TECH VALUE of 60 means the same thing for a quantum company as for a semiconductor company, after adjustment.
4. The community intelligence layer (what stocks Pro users are watching and acting on) is a unique signal that no external data provider can replicate.

---

## The Core Question

> What data and signals do we have that others don't — and what do we need to build models that are impossible to replicate cheaply?

Most retail platforms offer:
- Price charts ✓ (commodity)
- Basic technicals (RSI, MACD) ✓ (commodity)
- Fundamental ratios ✓ (commodity)
- Analyst ratings ✓ (commodity)
- News feeds ✓ (commodity)

None of them offer:
- A validated, back-tested scoring engine with real forward prediction records
- Technology-adoption trajectory scoring (where is this tech in its S-curve?)
- Macro-regime adjusted signals (does this sector benefit from current conditions?)
- Community intelligence from investors in the same niche
- A single grade that tells you whether to act or wait

That gap is the moat. The question is how to widen it.

---

## What We Have Today

### Data Sources
| Source | What We Get | Cost | Unique? |
|--------|-------------|------|---------|
| Polygon.io | Price, OHLCV, VIX, technicals | $29/mo | No — widely available |
| FMP Stable | Current fundamentals, ratios, estimates | $29/mo | No — widely available |
| Supabase | Our own score history | $0 | YES — proprietary |
| User behaviour | What stocks users watch, what grades they trust | $0 | YES — proprietary |

### What Makes Us Different Right Now
1. **Score history** — we record every prediction with price and grade. Growing daily. No one else has this specific dataset for our universe.
2. **Our formula weights** — the specific combination of momentum acceleration, R&D productivity, gross margin trajectory, VIX adjustment, volatility cap — this is our IP.
3. **Validated forward predictions** — we're building a real track record. Scores made today will be checked against reality in 90-180 days. No other retail tool does this transparently.
4. **Sector-specific normalisation** — quantum stocks benchmarked against quantum, not S&P 500.

---

## What We Need To Build Genuine Alpha

### Tier 1 — High Priority, Accessible

**A. Macro Regime Integration**
What it does: adjusts all scores based on the current macro environment.
Signals needed:
- Federal Funds Rate direction (rising / flat / cutting)
- Yield curve shape (normal / inverted / steepening)
- Dollar strength index (DXY trend)
- Sector rotation flows (which sectors are receiving institutional money)
- Credit spreads (risk appetite indicator)

Data source: FMP has some macro data. FRED API (Federal Reserve) is free. Alpha Vantage has DXY.
Cost: ~$0-$20/mo additional

Logic: A quantum stock with MOMENTUM 70 in a risk-off, rising-rate environment should score differently than the same stock in a cutting-cycle, risk-on environment. Right now we adjust for VIX but not the full macro picture.

**B. Technology Adoption Trajectory (S-Curve Positioning)**
What it does: estimates where a technology sector is in its adoption cycle.
Signals needed:
- Patent filing volume by sector (increasing = early/growth phase)
- Government contract awards in defence/space (Polygon or USASpending.gov — free API)
- FDA approvals and pipeline stage (biotech — free from FDA API)
- Job posting volume for key roles (LinkedIn/Indeed trends — proxy for industry investment)
- Enterprise customer announcements (news sentiment analysis)

Data source: USASpending.gov (free), FDA API (free), patent data (Google Patents API — free), news via FMP
Cost: ~$0 additional for basic version

Logic: IONQ in 2026 is where NVDA was in 2018. If we can score "how early is this technology?" we can identify the best entry points before momentum is obvious.

**C. Insider Activity Quality Score**
What it does: weights insider transactions by role, size, and clustering.
Current state: FMP Starter doesn't include insider data.
FMP Professional ($59/mo) includes it.

Logic: A CEO buying $5M of stock in a quantum company is a much stronger signal than a board member exercising options. Clustering (multiple insiders buying in the same week) is even stronger.

---

### Tier 2 — Medium Priority, Requires Data Investment

**D. Historical Fundamentals Back-Test**
What it does: allows us to properly back-test INNOV and TECH VALUE scores.
Current limitation: we only have current FMP fundamentals — can't calculate what INNOV would have been in 2023.
Data needed: FMP Enterprise (~$99/mo) or Quandl/Nasdaq Data Link ($50-150/mo)

Impact: If we could prove "Grade A INNOV stocks returned +35% at 180 days" with real historical data, that's an unassailable marketing claim.

**E. Earnings Estimate Revision Momentum**
What it does: tracks whether analysts are raising or cutting estimates over time.
Current state: we get the latest estimate, not the history of revisions.
Data needed: FMP Growth plan or Bloomberg (expensive)

Logic: A stock where 8 of 10 analysts have raised estimates in the last 30 days is fundamentally different from one where estimates are flat. "Estimate revision momentum" is a documented factor in academic finance.

**F. Institutional Flow Data**
What it does: tracks where large funds are moving money (13F filings, ETF flows)
Data source: SEC EDGAR 13F filings — free, updated quarterly
ETF flows: ETF.com or similar

Logic: If Renaissance Technologies and ARK both added IONQ in Q1, that's a signal the crowd hasn't priced in yet.

---

### Tier 3 — Long Term, High Complexity

**G. AI News Sentiment Engine**
What it does: reads and scores news articles for each ticker, detects narrative shifts before price moves.
Technology: Claude API + FMP news feed
Cost: Claude Haiku API usage (~$5-20/mo at current scale)

Logic: "Partnership with Microsoft" and "FDA rejection" affect stock price hours/days before they show in fundamentals. NLP sentiment that detects narrative shifts is a genuine edge.

**H. User Portfolio Intelligence**
What it does: anonymously aggregates what stocks QuantDiver users are watching and what grades they're acting on.
Data: we already have this in Supabase (user_watchlists)
Logic: If 80% of Pro users have added RKLB to their watchlist and it's Grade A, that's a community intelligence signal.

**I. Custom Model Builder**
What it does: lets users adjust signal weights to match their own investment philosophy.
Example: a user who only cares about R&D intensity can weight INNOV at 70%.
Technology: frontend sliders that call our scoring functions with custom weights.

---

## The QuantDiver Proof of Concept

### Concept
A public-facing section on the landing page (no login required) that shows the full QuantDiver pipeline visually and interactively. Any visitor can see exactly how we go from raw data to a grade — and why it's not just another momentum screener.

### The Pipeline (7 Stages)

```
Stage 1: UNIVERSE
Which stocks enter the system and why
↓
Stage 2: DATA INGESTION
Price data (Polygon) + Fundamentals (FMP) + Macro (FRED)
↓
Stage 3: FOUR MODELS
MOMENTUM → RISK → TECH VALUE → INNOVATION
Each calculated independently, no overlap
↓
Stage 4: SIGNAL SYNTHESIS
Weighted combination into one score (0-100)
Grade: A / B / C / D
↓
Stage 5: MACRO OVERLAY
Is the macro environment confirming or contradicting the signal?
↓
Stage 6: VALIDATION
We record the prediction. We check it 90 and 180 days later.
↓
Stage 7: ITERATION
Every Sunday, the model re-validates. If it drifts, we fix it.
```

### What the User Experiences
- Animated pipeline diagram showing data flowing from sources → models → grade
- Live example: pick any stock, watch the QuantDiver Engine process it in real time
- The "proof" section: "On [date] we graded NVDA as A. Here's what happened."
- Clear explanation of each model in plain English (no formulas)

### Why "QuantDiver"
- **Neuro**: the system learns from its own predictions and improves iteratively, like a neural loop
- **Quant**: grounded in quantitative, mathematical models — not opinion or gut feel
- Together: intelligent quantitative analysis that improves over time

---

## Customer Communication Strategy

### The Three Things a Customer Needs to Understand

**1. What it does (one sentence)**
"QuantDiver runs your stocks through four proprietary models and tells you whether to act or wait — with a track record to prove it."

**2. Why it's different (one visual)**
A diagram showing the pipeline: data in → four models → one grade. Compared to a traditional screener that just shows you data and leaves you to figure it out.

**3. Why to trust it (one number)**
"75.6% of our Grade A signals were profitable at 90 days — measured on real predictions, not back-tests."

### What the Customer Can Do

**Option A — Use our universe (default)**
65 stocks across AI, Quantum, Defence, Biotech, Semiconductors. Pre-analysed, ranked, updated hourly.

**Option B — Analyse any stock**
Type in any ticker. The QuantDiver Engine runs all four models and returns a grade in seconds.

**Option C (future) — Build your own model**
Adjust the signal weights to match your philosophy. More momentum-focused? More INNOV? Your call.

---

## Prioritised Build Order

### Phase 1 — Foundation (Now)
1. QuantDiver Proof of Concept section on landing page (visual pipeline)
2. "Analyse any stock" feature — prominent on dashboard
3. Forward validation results on landing page (our real track record)

### Phase 2 — Data Expansion (~1 month)
4. FRED API integration for macro regime (free)
5. USASpending.gov for defence contract flow (free)
6. FDA approval pipeline for biotech (free)
7. Update MACRO score component

### Phase 3 — Model Improvement (~3 months)
8. Historical fundamentals (FMP upgrade or Quandl)
9. Insider activity quality score (FMP Professional)
10. Earnings estimate revision momentum
11. Proper INNOV/TECH back-test with historical data

### Phase 4 — Intelligence Layer (~6 months)
12. AI news sentiment engine (Claude API)
13. Custom model builder (user-defined weights)
14. Institutional flow signals (SEC 13F)
15. Community intelligence score (user watchlist aggregation)

---

## Open Questions

1. Should "QuantDiver" be the product name, a sub-brand, or just the engine name?
2. Do we launch the Proof of Concept section before or after Phase 2 data expansion?
3. What is the minimum viable macro signal that adds real value without complexity?
4. Should the "analyse any stock" feature be gated (Pro only) or open to all?
5. How do we communicate the difference between our back-test (retrospective) and our forward validation (genuine predictions)? The distinction matters for credibility.
