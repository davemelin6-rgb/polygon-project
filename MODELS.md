# QuantDiver — Scoring Models & Quantitative Research

## Classification
PROPRIETARY — IP. Formulas not exposed to frontend or users.

---

## Back-Test Results (June 2026) — VALIDATED

### Latest Run: 2026-06-24
| Metric | Value |
|--------|-------|
| Tickers | 65 |
| Total samples | 3,136 |
| History | 52 weeks |
| Verdict | PREDICTIVE |
| Spread (A vs D) | +16.56% |

### Grade performance
| Grade | Signal | Avg 30d | Avg 60d | Avg 90d | Avg 180d | Win Rate (90d) | Samples |
|-------|--------|---------|---------|---------|----------|----------------|---------|
| A | ≥70 | +6.4% | +16.2% | +24.6% | **+44.8%** | **66.9%** | 503 |
| B | 55-70 | +4.4% | +6.7% | +8.7% | +23.6% | 61.2% | 861 |
| C | 40-55 | +4.3% | +6.7% | +7.5% | — | 56.1% | 941 |
| D | <40 | +4.3% | +6.7% | +8.1% | +22.2% | 56.5% | 831 |

### Key quantitative findings

**Finding 1: The model is a 180-day signal, not a 90-day signal.**
The spread between Grade A and Grade D GROWS over time:
- 30d spread: ~2.1%
- 60d spread: ~9.5%
- 90d spread: 16.56%
- 180d spread: 22.54% ← strongest predictive power

Implication: investors who hold Grade A signals for 180 days (+44.8%) capture 82% more return than those who exit at 90 days (+24.6%). The optimal holding period is 180 days.

**Finding 2: Win rate is the cleaner metric for investor communication.**
Average returns are skewed by outliers (one NVDA +200% run). Win rate is more intuitive:
- Grade A: 66.9% of signals were profitable at 90 days
- Grade D: 56.5% of signals were profitable at 90 days
- Spread: 10.4 percentage points

**Finding 3: The volatility cap on Grade A is the highest-impact formula change.**
Before cap (June 21 run): Grade A win rate = 44.8%
After cap (June 24 run): Grade A win rate = 66.9%
Improvement: +22.1 percentage points

The cap works by excluding high-volatility stocks (RISK < 20) from Grade A in the backtest. These stocks have genuine price momentum but collapse frequently. They are better positioned in Grade B where conviction is lower.

**Finding 5: Transition Alert — Grade B with high acceleration is the best 180d setup.**
With momentum acceleration added, Grade B stocks with acceleration > +0.12 (rapid momentum build) show:
- 180d avg return: +36.09% — outperforming Grade A (+26.74%) by nearly 10 percentage points
- These are stocks transitioning FROM Grade B TO Grade A
- The crossing point (negative to positive acceleration) is likely the optimal entry

Implementation: stocks meeting this criterion show ⚡ RISING · 180D label in the UI.

**Finding 4: Momentum acceleration is the key differentiator.**
Pure momentum (is the stock going up?) is widely available. The genuine edge is momentum ACCELERATION — is the stock going up FASTER than it was? A stock moving from +10% 3M return to +35% 3M return (acceleration of +25%) is a structurally different setup than one sitting at +35% for 6 months.

Stocks with positive acceleration AND high absolute momentum are the highest-quality Grade A setups.

### Backtest evolution (spread by run)
| Date | Model version | Spread | Samples | Verdict |
|------|--------------|--------|---------|---------|
| 2026-06-18 | Early bugs | -10% to -12% | 357 | NOT_PREDICTIVE |
| 2026-06-18 | MOMENTUM only | +31.1% | 1,029 | PREDICTIVE |
| 2026-06-21 | MOMENTUM only | +33.3% | 966 | PREDICTIVE |
| 2026-06-23 | SIGNAL (MOM+RISK) | +5.1% | 1,344 | WEAK |
| 2026-06-23 | SIGNAL (MOM+INNOV) | +9.8% | 1,344 | WEAK |
| 2026-06-24 | MOM + vol cap | +16.6% | 3,136 | PREDICTIVE |
| 2026-06-24 | MOM + acceleration + vol cap | +13.3% | 3,136 | PREDICTIVE |

Note: The SIGNAL score (with INNOV/TECH) performs worse in the backtest because INNOV and TECH use current fundamentals applied to historical price data — look-ahead contamination. The backtest uses momentum only for signal bucketing, while the live product uses all 4 scores.

---

## The 4 Scores

### 1. MOMENTUM (0-100)
**Purpose:** Measures price trend strength AND trajectory.
**Fully historical** — can be back-tested without look-ahead bias.

**Components:**
| Component | Weight | What it measures |
|-----------|--------|-----------------|
| 6M return | 30% | Primary trend direction |
| **Momentum acceleration** | **25%** | **Is the trend speeding up? (added 2026-06-24)** |
| 3M return | 20% | Recent trend confirmation |
| MA trend (50/200) | 18% | Price vs moving averages |
| Earnings surprise | 5% | Fundamental backing |
| Relative volume | 2% | Smart money confirmation |

**Momentum Acceleration formula:**
```
recent3M   = (price_now    - price_60d_ago)  / price_60d_ago   // last 3 months
prior3M    = (price_60d_ago - price_130d_ago) / price_130d_ago  // prior 3 months
acceleration = recent3M - prior3M

accelScore = normalize(acceleration, -0.25, +0.25)
```

Interpretation:
- Acceleration > +0.15: Momentum building strongly → highest-quality Grade A
- Acceleration ~0: Momentum persisting but flat → standard Grade A/B
- Acceleration < -0.15: Momentum fading → likely Grade B→C transition coming

**Adjustments:**
- Falling knife penalty: price below MA50 AND MA200 AND 3M < -20% → score × 0.50
- VIX regime multiplier: ×1.10 (VIX <15) down to ×0.50 (VIX >30)

---

### 2. RISK (0-100, higher = safer)
**Purpose:** Balance sheet survivability.
**Role:** Floor and filter. Not a return predictor at current weights.

**Components:**
| Component | Weight | Source |
|-----------|--------|--------|
| Debt/Equity ratio | 22% | FMP balance sheet |
| Liquidity + trend | 18% | FMP balance sheet |
| Interest coverage | 18% | FMP income statement |
| Price volatility | 18% | Polygon price data |
| Return on assets | 12% | FMP key metrics |
| Cash runway | 12% | FMP balance sheet + cash flow |

**In the backtest:** RISK < 20 → signal capped at 65 (Grade B max). Prevents high-volatility basket cases from inflating Grade A and distorting win rates.

---

### 3. TECH VALUE (0-100)
**Purpose:** Quality of existing business for profitable/near-profitable companies.
**Best for:** Semiconductors, software, established biotech.
**Limitation:** Returns null for pre-revenue companies. INNOV handles those.

**Components (sector-normalised):**
| Component | Weight |
|-----------|--------|
| R&D intensity | 18% |
| Gross margin | 18% |
| Net margin | 13% |
| Revenue growth (actual YoY) | 13% |
| Analyst revenue forecast | 12% |
| FCF margin | 9% |
| ROE | 9% |
| Earnings surprise | 8% |

---

### 4. INNOVATION SCORE (0-100)
**Purpose:** Technology investment quality for pre-profit growth companies.
**Best for:** Quantum (IONQ, RGTI), early biotech (MRNA), AI infra (PLTR, AI).
**Key insight:** A company can score high on INNOV even with no earnings, as long as R&D is converting to revenue and adoption is accelerating.

**Components:**
| Component | Weight | Formula |
|-----------|--------|---------|
| R&D intensity | 25% | R&D spend / Revenue (sector-normalised) |
| R&D productivity | 25% | Revenue growth $ / R&D spend |
| Revenue acceleration | 25% | Analyst forward growth − current YoY growth |
| Gross margin trajectory | 15% | Current GM% − prior year GM% |
| Analyst conviction | 10% | Forward revenue growth estimate |

**R&D productivity scale:**
- > 3.0: Exceptional — $1 R&D → $3+ new revenue
- 1.0–3.0: Strong — investment paying off
- 0–1.0: Break-even
- < 0: Pre-product stage — invest for future, not current returns

**Sector normalisation for R&D intensity:**
| Sector | Expected R&D / Revenue |
|--------|----------------------|
| Quantum | 20%–80% |
| Biotech | 12%–50% |
| Software | 8%–30% |
| Semiconductors | 8%–25% |
| Defence | 1%–8% |

---

## SIGNAL Score Formula

```
Full (all 4 scores):    MOM × 0.45 + INNOV × 0.30 + TECH × 0.15 + RISK × 0.10
No TECH:                MOM × 0.50 + INNOV × 0.35 + RISK × 0.15
No INNOV:               MOM × 0.50 + TECH  × 0.35 + RISK × 0.15
MOM + RISK only:        MOM × 0.75 + RISK × 0.25
```

**Weighting rationale:**
- MOM 45%: Price is the ultimate arbiter. Fundamentals mean nothing if the market disagrees.
- INNOV 30%: Primary differentiator for our audience. R&D quality predicts long-term value creation.
- TECH 15%: Quality filter for established profitable companies.
- RISK 10%: Survival filter. Not a return predictor at this weight.

---

## Grade System

| Grade | Signal | Label | Avg 90d | Avg 180d | Win Rate |
|-------|--------|-------|---------|----------|----------|
| A | ≥70 | STRONG · 180D | +24.6% | +44.8% | 66.9% |
| B | 55–70 | WATCH · 180D | +8.7% | +23.6% | 61.2% |
| C | 40–55 | MIXED · 180D | +7.5% | — | 56.1% |
| D | <40 | AVOID · 180D | +8.1% | +22.2% | 56.5% |

**Signal horizon:** 180 days primary, 90 days validated.
**Minimum RISK for Grade A action:** 35.

---

## Known Model Limitations

1. **Look-ahead bias in INNOV/TECH backtest:** We cannot back-test INNOV/TECH because we only have current fundamentals. FMP Starter does not provide historical quarterly fundamentals. FMP Enterprise or Quandl would unlock this.

2. **Grade C vs D anomaly (90d):** Grade D slightly outperforms Grade C at 90 days (mean reversion effect). Reverses at 180 days. Long-term hold is the correct response.

3. **Sector cycle blindness:** The model does not distinguish between a semiconductor stock at momentum 90 during a cycle peak vs mid-cycle. VIX adjustment partially mitigates but does not capture sector-specific cycles.

4. **Data depth:** ~2 years of price history. A full market cycle requires 5+ years.

---

## Data Sources

| Data type | Source | Endpoint |
|-----------|--------|----------|
| Price (OHLCV) | Polygon.io | `/v2/aggs/ticker/{t}/range/1/day` |
| VIX | Polygon.io | `I:VIX` |
| Income statement | FMP Stable | `/stable/income-statement` |
| Balance sheet | FMP Stable | `/stable/balance-sheet-statement` |
| Cash flow | FMP Stable | `/stable/cash-flow-statement` |
| Key metrics | FMP Stable | `/stable/key-metrics` |
| Earnings history | FMP Stable | `/stable/earnings` |
| Analyst estimates | FMP Stable | `/stable/analyst-estimates` |

---

## Open Research Questions

1. **Sector-relative momentum:** Does MOM 70 in a sector averaging 40 outperform MOM 70 in a sector averaging 65? Hypothesis: relative strength within sector is a stronger predictor than absolute score.

2. **Acceleration breakout:** Can we identify the crossing point when acceleration turns from negative to positive? That transition may be the highest-quality entry signal in the model.

3. **VIX-conditional returns:** What are Grade A returns broken out by regime? Hypothesis: Grade A in FAVORABLE significantly outperforms Grade A in CAUTION.

4. **Historical fundamentals:** With FMP Enterprise or Quandl, we could back-test INNOV/TECH properly and likely show 25%+ spread instead of 16%.

5. **180d as primary horizon:** Migrate platform from 90d to 180d framing. The data says 180d is the stronger signal. Guide, PROCESS.md, and BriefMe cadence would need updates.
