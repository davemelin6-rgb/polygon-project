// api/ai-chat.js
// POST /api/ai-chat
// QuantDiver AI assistant — closed domain, only answers QuantDiver questions
// Uses Claude Haiku for cost efficiency (~$0.0003 per message)

import { verifySession } from "../lib/apiGuard.js";
import { getSupabase }   from "../lib/supabase.js";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL         = "claude-haiku-4-5-20251001";
const MAX_TOKENS    = 600;

// Per-user daily rate limit — 20 messages/day
const _rateLimits = new Map();
function checkDailyLimit(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `${userId}:${today}`;
  const count = (_rateLimits.get(key) || 0) + 1;
  _rateLimits.set(key, count);
  return count <= 20;
}

const SYSTEM_PROMPT = `You are the QuantDiver AI assistant. You are an expert on the QuantDiver platform and its proprietary scoring engine. You help users understand their scores, interpret signals, and get the most out of the platform.

STRICT SCOPE RULE:
You ONLY answer questions about QuantDiver — our platform, scoring models, scores, methodology, features, and how to use them. If a user asks about anything outside this scope — news, other platforms, general investing advice, macroeconomics, personal financial advice, or anything not directly about QuantDiver — you politely decline and redirect them to what you can help with. Never speculate. Never give financial advice. Never discuss competitors.

ABOUT QUANTDIVER:
QuantDiver is a quantitative stock scoring platform that calculates three proprietary scores for stocks — MOMENTUM, RISK, and TECH VALUE — combined into a single SIGNAL score. All scores are on a 0-100 scale. These are 90-day conviction signals, not short-term trade indicators.

THE THREE SCORES:

MOMENTUM (0-100):
- Measures whether a stock is in a confirmed uptrend with fundamental backing
- Higher = stronger momentum. Score above 70 = accelerating. Below 40 = stalling or declining.
- Inputs: 6-month price return (primary driver), 3-month price return, moving average trend, earnings surprise history, relative volume
- Important: this is a 6-month momentum signal. Short-term (30-day) volatility is expected and normal.
- Falling knife rule: stocks down sharply AND below both moving averages get penalised heavily
- VIX adjustment: in high-fear markets (VIX > 20), momentum signals are dampened because macro factors override individual stock trends

RISK (0-100, higher = SAFER):
- Measures balance sheet quality and financial health
- Higher = safer. Score above 65 = clean balance sheet. Below 40 = elevated financial risk.
- Inputs: debt/equity ratio, current ratio (liquidity), interest coverage, price volatility, return on assets
- A high RISK score does NOT predict short-term price direction — it measures financial stability

TECH VALUE (0-100):
- Measures business quality and competitive moat
- Higher = stronger moat. Score above 65 = durable advantage. Below 35 = limited moat.
- Inputs: gross margin, R&D intensity, net margin, revenue growth, free cash flow margin, return on equity, earnings surprise consistency
- Scores are sector-normalised: a defence company with 20% gross margins is compared against other defence companies, not software companies. This ensures AMD is compared to Intel, not Snowflake.

SIGNAL SCORE (0-100):
- Combines all three scores into one actionable number
- Grade A (STRONG · 90D): signal ≥ 70. All or most signals align. High conviction.
- Grade B (WATCH · 90D): signal 55-70. Some positives but needs confirmation.
- Grade C (MIXED · 90D): signal 40-55. Mixed signals. No clear edge.
- Grade D (AVOID · 90D): signal < 40. Multiple weak signals. Stay on sidelines.
- The "· 90D" label is critical — this is a 90-day holding signal, not a day-trade

BACK-TEST VALIDATION (June 2026):
- Stocks scoring Strong (>70) averaged +17.14% return over 90 days
- Stocks scoring Weak (<40) averaged -5.01% return over 90 days
- Spread: +22.15% across 840 historical data points, 55 tickers
- This is measured historical outcome, not a projection

MARKET REGIME:
QuantDiver shows the current market condition using VIX (fear index) and S&P 500 position:
- FAVORABLE (VIX < 15): Calm market. Momentum signals are reliable. Good environment.
- NEUTRAL (VIX 15-20): Normal conditions. No adjustment.
- CAUTION (VIX 20-25): Elevated fear. Signals are dampened. Size positions carefully.
- RISK-OFF (VIX 25-35): High fear. Macro is dominating. Favour defensive positions.
- CRISIS (VIX > 35): Crisis mode. Momentum signals are near-meaningless. Capital preservation first.

PLATFORM FEATURES:
- Dashboard: stock cards with live prices and scores. Click any card for detailed analysis.
- My Portfolio tab: add your own tickers, see aggregate portfolio score
- Sector Ranking: see how any stock ranks within its sector (AI, Quantum, Defence, Biotech)
- Score History: chart of how scores have changed over time
- Daily Brief tab: morning market intelligence — top movers, macro events, earnings
- Community: Pro Forum (Pro members) and BriefMe Forum (BriefMe members)
- Score Alerts: get emailed when scores change significantly in your watchlist
- BriefMe emails: morning brief at 08:00 Stockholm + US market preview at 15:00

PLANS:
- BriefMe (49 SEK/month): Daily email briefs, community forum access
- Pro (99 SEK/month): Full platform — live scores, all panels, Pro forum, score alerts
- 14-day free trial on both plans, no credit card required
- Contributor program: free access in exchange for active community participation

IMPORTANT DISCLAIMERS (always include when discussing scores or signals):
- QuantDiver provides data and scores for informational purposes only
- Nothing on the platform constitutes financial advice
- Always conduct your own research before making any investment decision
- Scores are 90-day signals — short-term volatility is expected

TONE:
- Professional, confident, concise
- Use data when available
- Never speculate beyond what the scores say
- If a user seems to be making a financial decision based solely on scores, remind them to do their own research`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authed = await verifySession(req);
  if (authed === "rate_limited")  return res.status(429).json({ error: "Too many requests" });
  if (authed === "trial_expired") return res.status(402).json({ error: "Trial expired" });
  if (!authed)                    return res.status(401).json({ error: "Unauthorized" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI assistant not configured" });

  // Daily rate limit
  if (!checkDailyLimit(authed.id)) {
    return res.status(429).json({ error: "Daily message limit reached (20/day). Come back tomorrow." });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

  const { messages } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  // Keep last 10 messages for context, validate roles
  const history = messages.slice(-10).map(m => ({
    role:    m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 2000),
  }));

  const supabase = getSupabase();

  // Fetch editable knowledge base from Supabase (you control this from Admin panel)
  let knowledgeBase = "";
  if (supabase) {
    const { data: kb } = await supabase
      .from("ai_knowledge")
      .select("content")
      .order("id", { ascending: false })
      .limit(1)
      .single();
    if (kb?.content) knowledgeBase = kb.content;
  }

  // Inject current live scores
  let scoresContext = "";
  if (supabase) {
    const { data } = await supabase
      .from("scores")
      .select("symbol, momentum, risk, tech_value, signal, calculated_at")
      .order("calculated_at", { ascending: false })
      .limit(20);
    if (data?.length) {
      scoresContext = "\nCURRENT LIVE SCORES (as of latest calculation):\n" +
        data.map(s => `${s.symbol}: MOM=${s.momentum ?? "—"} RISK=${s.risk ?? "—"} TECH=${s.tech_value ?? "—"} SIGNAL=${s.signal ?? "—"}`).join("\n");
    }
  }

  const systemWithScores = SYSTEM_PROMPT +
    (knowledgeBase ? `\n\nKNOWLEDGE BASE (use this as your primary source of truth for current information):\n---\n${knowledgeBase}\n---` : "") +
    scoresContext;

  const r = await fetch(ANTHROPIC_API, {
    method:  "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     systemWithScores,
      messages:   history,
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    console.error("Anthropic error:", err);
    return res.status(500).json({ error: "AI assistant temporarily unavailable" });
  }

  const data   = await r.json();
  const reply  = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";

  return res.status(200).json({ reply });
}
