# QuantDiver Investment Process

## Philosophy

A good investment process is repeatable. It works on NVDA today, on RKLB next month, and on a stock you haven't discovered yet. It removes emotion and replaces it with evidence. You follow the same steps every time — and the model tells you whether to act or wait.

This document defines that process.

---

## Stage 1 — Universe Selection

**What it is:** Deciding which stocks enter the system at all.

**How it works:**
QuantDiver tracks five sectors — AI, Quantum Computing, Defence & Space, Biotech & MedTech, and Crypto. These are the sectors defining the next 20 years. Stocks are added to a sector when they meet two criteria:
1. They operate in one of the five sectors
2. They are liquid enough to trade (listed on a major exchange, sufficient volume)

**What we don't do:** We don't chase every trending stock. The universe is curated. Quality of coverage beats quantity of tickers.

**Output:** A tracked universe of ~55 stocks + 10 cryptocurrencies, updated manually when relevant new listings emerge.

---

## Stage 2 — Scoring

**What it is:** Running every stock through the three proprietary models.

**How it works:**
Every hour, three scores are calculated for each stock in the universe:

**MOMENTUM (0–100)**
Does the market agree? Is price trending up with volume confirmation and fundamental backing?
- 6-month price return (primary driver)
- 3-month price return
- Moving average trend (MA50 vs MA200)
- Earnings surprise consistency
- Relative volume

**RISK (0–100, higher = safer)**
Is the balance sheet solid enough to survive a downturn?
- Debt/equity ratio
- Liquidity (current ratio + trend)
- Interest coverage
- Price volatility
- Return on assets
- Cash runway (months before the company needs to raise)

**TECH VALUE (0–100)**
Is there a durable, high-quality business underneath the price action?
- Gross margin (sector-normalised)
- R&D intensity
- Net margin
- Revenue growth (actual YoY)
- Analyst revenue growth forecast (Wall Street consensus)
- Free cash flow margin
- Return on equity
- Earnings surprise consistency

**Output:** Three scores (0–100) and one combined SIGNAL score (0–100) with a grade: A, B, C, or D.

---

## Stage 3 — Filtering

**What it is:** Separating the stocks worth your attention from the ones that aren't.

**The filter criteria:**
A stock passes to the next stage if it meets ALL of the following:

| Criteria | Threshold | Why |
|----------|-----------|-----|
| SIGNAL grade | A (≥70) | Only high-conviction setups |
| RISK score | ≥40 | Balance sheet must be survivable |
| Cash Runway | >12 months OR FCF positive | Company must be able to operate |
| Market Condition | NEUTRAL or better | Don't fight a RISK-OFF market |

**What gets rejected:**
- Grade B/C/D stocks — not enough conviction
- Stocks with short cash runway and losses — binary outcomes, not systematic
- High-momentum stocks in RISK-OFF market regime — macro overrides individual signals

**Output:** A shortlist of 3–8 stocks at any given time that pass all four criteria simultaneously.

---

## Stage 4 — Peer Comparison

**What it is:** Checking whether the shortlisted stock is strong within its sector, not just in absolute terms.

**How it works:**
Use the Sector Ranking panel on QuantDiver. For a stock to progress, it should:
- Rank in the top 3 of its sector on SIGNAL score
- Have a z-score of +0.5 or higher (above average for its peers)
- Not be the entire sector moving — that's a macro move, not a stock-specific signal

**Why this matters:**
If every AI stock scores 75, the signal is the sector, not the individual stock. You want a stock that stands out from its peers — not one that's just riding a wave everyone is on.

**Output:** 1–3 stocks that are genuinely strong relative to peers, not just riding sector momentum.

---

## Stage 5 — Signal Breakdown Check

**What it is:** A final qualitative review of the five key metrics before acting.

**Check each of the five:**

| Metric | Green light | Red flag |
|--------|-------------|----------|
| 🏃 Runway | SAFE (>24mo) or FCF positive | SHORT (<12mo) |
| 📈 Growth | STRONG (>30%) or GROWING | DECLINING |
| 💧 Dilution | LOW or BUYBACKS | HIGH |
| 💰 Valuation | CHEAP or FAIR | EXPENSIVE |
| 📊 Market | FAVORABLE or NEUTRAL | RISK-OFF or CRISIS |

A stock needs at least 3 green lights to proceed. Any single CRITICAL red flag (very short runway, high dilution, RISK-OFF market) is a veto regardless of the score.

**Output:** Conviction level — HIGH (4-5 green), MODERATE (3 green), or PASS.

---

## Stage 6 — Entry

**What it is:** Acting on the signal.

**The rule:**
- HIGH conviction → full position
- MODERATE conviction → half position, wait for confirmation
- Grade B (55-70) → watchlist only, no action yet

**This is a 90-day signal.** The model is validated on 90-day holding periods. Do not expect immediate results. Short-term volatility (days 1-30) is expected and normal. The signal is for the next quarter, not the next week.

**Timing:**
- Do not chase a stock that already ran 20% this week
- If a stock just scored high after a spike, check if the MA trend confirms the move or if it looks extended
- The best entries are when the score just crossed 70 — not when it's been 85 for 3 months

---

## Stage 7 — Monitoring

**What it is:** Watching for score changes that signal the thesis is breaking down.

**Use Score Alerts:**
Enable score alerts in Settings. You will be notified if:
- Signal drops below 70 (grade change)
- Momentum drops 15+ points in a week
- Risk score drops below 40 (balance sheet warning)

**Review weekly:**
- Has anything changed in the Signal Breakdown? (Runway shortening, dilution increasing)
- Is the Market Condition still NEUTRAL or better?
- Is the stock still in the top 3 of its sector?

**When to exit early (before 90 days):**
- Signal drops to Grade C or D
- Risk score drops below 35 (balance sheet deterioration)
- Cash runway drops below 6 months
- Market enters CRISIS regime

---

## Stage 8 — Exit

**What it is:** Taking profit or accepting the outcome after 90 days.

**The default rule:**
Review at 90 days. If the thesis held (stock up, signal still strong), you decide to hold or take profit. If the thesis broke (signal deteriorated during the hold), you already exited early per Stage 7.

**After exit:**
1. Note the outcome — was the model right or wrong?
2. If wrong — was it a formula issue or a macro event? Check the back-test for context.
3. The process starts again from Stage 3. The universe is always running. New signals will emerge.

---

## Stage 9 — Back-Test Review (Weekly)

**What it is:** Checking whether the model is still working.

**Every Sunday the back-test runs automatically.** On Monday morning, check Admin → Model Performance.

**What to look for:**
- Is the verdict still PREDICTIVE?
- Is the Strong (>70) bucket still outperforming Weak (<40) on 90-day returns?
- Is the spread growing or shrinking?

**If NOT_PREDICTIVE:**
The model is giving noisy signals. Reduce position sizes, increase the RISK filter threshold, and wait for the next Sunday's run before acting on new signals.

**If PREDICTIVE with spread >20%:**
High confidence in the model. Proceed with normal position sizing.

---

## Summary

```
Universe (55 stocks + crypto)
    ↓
Score every hour (MOMENTUM / RISK / TECH VALUE)
    ↓
Filter: Grade A + RISK ≥40 + Runway >12mo + Market NEUTRAL+
    ↓
Peer comparison: top 3 in sector, z-score ≥ +0.5
    ↓
Signal Breakdown: 3+ green lights, no critical red flags
    ↓
Entry: 90-day hold, full or half position
    ↓
Monitor: score alerts, weekly review
    ↓
Exit: 90 days or early if signal breaks
    ↓
Review: was the model right? Back-test confirms.
    ↓
Repeat.
```

---

## What Makes This Process Work

1. **It is repeatable.** The same steps work on any stock in any sector. You are not making different decisions each time — you are applying the same filter.

2. **It is evidence-based.** The back-test validates that the process produces outcomes — +29.3% average 90-day return for Grade A signals vs -1.79% for Grade D, across 1,029 historical data points.

3. **It removes emotion.** You do not act because a stock is exciting. You act because it passed all the filters. You exit because the score broke — not because you are scared.

4. **It improves over time.** Every Sunday the model validates itself. If it drifts, you know immediately. The process self-corrects.

5. **It is honest.** A 90-day signal is a 90-day signal. Short-term volatility is expected. The model does not promise you will be right every time — it promises that following the process will, over time, put the odds in your favour.
