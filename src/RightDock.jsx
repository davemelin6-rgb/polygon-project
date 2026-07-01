import { useState, useRef } from "react";
import Chat        from "./Chat.jsx";
import TraderMatch from "./TraderMatch.jsx";
import AIChat      from "./AIChat.jsx";
import "./RightDock.css";

// Gordon Gekko chat — inline panel (no floating character)
const RESPONSES = [
  // Identity / greeting
  { keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    reply: "Gordon Gekko. I've made more money before breakfast than you'll see all year. Welcome to QuantDiver — the sharpest stock scoring platform on the web. What do you need? 📈" },

  { keywords: ["who are you", "who is gordon", "who is hugo", "your name", "what are you"],
    reply: "Gordon Gekko. Fictional? On Wall Street, maybe. Here? I'm your edge. Ask me about the scores, the features, or how to find your next trade. I don't have time for small talk — but I'll make time for smart questions." },

  // What is the site
  { keywords: ["what is this site", "what is quantdiver", "what does this do", "what is this", "about this", "what does quantdiver", "explain the site", "tell me about", "site about", "platform", "this app"],
    reply: "QuantDiver scores every stock on three dimensions — MOMENTUM, RISK, and TECH VALUE — using live market data. No opinions. No noise. Pure numbers from Polygon.io and FMP. Type a ticker, see the scores, click the card, read the analysis. That's the edge." },

  { keywords: ["how does it work", "how does this work", "how do i", "how to use", "get started", "where do i start", "what do i do first"],
    reply: "Simple. Type any ticker (like AAPL, NVDA, MSFT) in the search bar and hit Analyze. Each stock card shows live price and three scores. Click a card to unlock the full breakdown — price chart, technical signals, analyst consensus, insider trades, and key ratios. All in one place. 📊" },

  // The three scores overview
  { keywords: ["three scores", "all scores", "what are the scores", "explain scores", "score system", "scoring"],
    reply: "Three scores, each 0–100:\n\n• MOMENTUM — Is the stock accelerating? Price trend + volume.\n• RISK — How dangerous is the balance sheet? Higher = safer.\n• TECH VALUE — Is the business built to last? R&D + margins + growth.\n\nTogether they give you signal on any stock in seconds. 🎯" },

  // Momentum
  { keywords: ["momentum"],
    reply: "MOMENTUM (0–100) — your velocity score. Combines 1-month return (30%), 3-month return (35%), relative volume (15%), and moving average trend (20%). Score above 65? The stock is running. Below 40? It's stalling. You want momentum — that's the difference between winning and watching. 🚀" },

  // Risk
  { keywords: ["risk score", "risk", "what is risk", "safety"],
    reply: "RISK (0–100) — counterintuitive: HIGHER means SAFER. We score debt ratio, current ratio (liquidity), interest coverage, and price volatility. A score of 75 means solid balance sheet, manageable debt, low volatility. A score of 25 means the company is skating on thin ice. Know your downside before you talk upside. 🛡️" },

  // Tech Value
  { keywords: ["tech value", "techvalue", "technology value", "what is tech value"],
    reply: "TECH VALUE (0–100) — the moat score. R&D intensity (30%), gross margin (35%), revenue growth (20%), free cash flow margin (15%). A company with fat margins AND big R&D spending? That's durable competitive advantage. That's where the real money compounds. 💡" },

  // Sectors
  { keywords: ["sector", "sectors", "categories", "market sectors"],
    reply: "Four sectors tracked on QuantDiver:\n\n🧠 AI & Machine Learning — NVDA, AMD, META, PLTR...\n⚛️ Quantum Computing — IONQ, RGTI, IBM, GOOGL...\n🛡️ Defence & Space — LMT, RTX, RKLB, ASTS...\n🧬 Biotech & MedTech — LLY, MRNA, VRTX, ISRG...\n\nScroll down on any page to browse by sector. 📊" },

  { keywords: ["quantum", "quantum computing", "quantum stocks"],
    reply: "Quantum Computing — the next arms race. IONQ, RGTI, QUBT, QBTS are the pure plays. IBM and Google are the big-tech entries. High volatility, high upside, high risk. Check the RISK score before you swing. ⚛️" },

  { keywords: ["ai stocks", "artificial intelligence", "ai sector"],
    reply: "AI stocks: NVDA leads the infrastructure layer. AMD is the competitor. META, MSFT are the application layer. PLTR is the enterprise data play. SOUN is speculative. The MOMENTUM score tells you who's actually running right now. 🧠" },

  { keywords: ["defence", "defense", "space", "aerospace"],
    reply: "Defence & Space: LMT, RTX, NOC, GD are the primes. RKLB and ASTS are the new-space plays. BA is the turnaround story. KTOS is the drone angle. Budget cycles drive these — low RISK scores, steady MOMENTUM. 🛡️" },

  { keywords: ["biotech", "medtech", "pharmaceutical", "health"],
    reply: "Biotech & MedTech: LLY and NVO are the GLP-1 duopoly — massive growth. VRTX owns cystic fibrosis. ISRG dominates surgical robotics. MRNA is speculative. GILD is steady cash flow. TECH VALUE score matters most here — check those margins. 🧬" },

  // Features
  { keywords: ["price chart", "chart", "candlestick", "graph"],
    reply: "Click any stock card to open the Price Chart — 6-month daily closes for that ticker. It's your visual momentum check. Does the line go up and to the right? Good. Are you watching a cliff? Different story." },

  { keywords: ["technical signals", "technicals", "rsi", "macd", "bollinger", "moving average"],
    reply: "Technical Signals panel appears when you click a stock. It shows RSI, MACD, Bollinger Bands, and moving average trends — calculated from live price history. Green signals = bullish. Red = bearish. Use it alongside the MOMENTUM score." },

  { keywords: ["analyst", "analyst consensus", "wall street consensus", "buy rating", "price target"],
    reply: "The Analyst Consensus panel shows you what Wall Street thinks — Strong Buy/Buy/Hold/Sell breakdown, average price target, and the last 4 earnings surprises. Did the company beat or miss? By how much? That's the institutional temperature on any stock." },

  { keywords: ["insider", "insider trading", "insider buy", "insider sell", "executive"],
    reply: "Insider Trading panel shows you when CEOs, CFOs, and directors are buying or selling their own stock. Insiders buying with their own money? That's a signal. Insiders mass-selling? Pay attention. We pull the last 15 transactions from SEC filings. 👀" },

  { keywords: ["key ratios", "fundamentals", "pe ratio", "price earnings", "revenue", "earnings per share", "eps"],
    reply: "Key Ratios panel: P/E ratio, revenue, gross margin, debt-to-equity, EV/EBITDA, and more — pulled live from FMP financial statements. These are the numbers that tell you if a stock is cheap or expensive relative to its business. 📋" },

  { keywords: ["daily brief", "brief", "morning brief", "news summary", "briefing"],
    reply: "The Daily Brief is your morning intelligence report — top news headlines from the last 48 hours across your watchlist, upcoming earnings in the next 7 days, and macro sector context. Refreshed hourly. Read it before the market opens. ☕" },

  { keywords: ["news", "news feed", "headlines", "articles"],
    reply: "The News & Sentiment feed shows the latest articles for whatever stock you've selected — or your full watchlist if nothing is selected. Articles are filtered to the last 48 hours. No noise from last week." },

  { keywords: ["trader connect", "matchmaking", "find trader", "trader chat", "connect with"],
    reply: "Trader Connect pairs you with another real QuantDiver member who shares your sector interest. Pick AI, Quantum, Defence, or Biotech — we match you in real time. Completely voluntary, completely anonymous. Human-to-human alpha. 🤝" },

  // Data & refresh
  { keywords: ["data", "where does the data", "data source", "polygon", "fmp", "how accurate"],
    reply: "Two sources. Polygon.io for live prices, volume, and 200 days of price history — updated every 30 seconds. FMP (Financial Modeling Prep) for fundamentals: income statements, balance sheets, cash flow, analyst data. Institutional-grade inputs. 📡" },

  { keywords: ["refresh", "update", "how often", "real time", "live", "delay", "delayed"],
    reply: "Prices refresh every 30 seconds. Full scores and charts every 60 seconds. News and the Daily Brief update hourly. Market data is 15-minute delayed per exchange rules — you'll see it noted in the header. ⚡" },

  // Watchlist
  { keywords: ["watchlist", "my stocks", "add stock", "search", "ticker", "symbol"],
    reply: "Type any US stock ticker in the search bar — comma-separated for multiple. AAPL,MSFT,NVDA — hit Analyze. To save your default watchlist permanently, go to Settings (⚙ gear icon top right) and set Default Watchlist. It loads every time you log in. 📋" },

  // Investment advice
  { keywords: ["should i buy", "should i sell", "what to buy", "best stock", "recommend", "invest in", "which stock"],
    reply: "I don't give financial advice — that's not what I do. What I do: give you MOMENTUM, RISK, and TECH VALUE scores so you can make a smarter decision yourself. High momentum + low risk + high tech value = interesting. Do your own homework. I just make it faster." },

  { keywords: ["buy", "sell", "trade", "portfolio"],
    reply: "QuantDiver doesn't execute trades — we score them. Find a stock with strong MOMENTUM, solid RISK score, and high TECH VALUE? That's your starting point for research. The rest is yours to decide. Greed without discipline is just gambling. 🎯" },

  // Subscription / pricing
  { keywords: ["price", "cost", "subscription", "how much", "free", "trial", "pay", "upgrade", "plan"],
    reply: "There's a 90-day free trial — full access, no credit card required during trial. After that, a subscription keeps you in the game. Contact support if you have questions about plans. The scores don't come cheap to build — but they're cheaper than a bad trade. 💳" },

  // Settings
  { keywords: ["settings", "profile", "avatar", "theme", "color", "dark mode", "customize"],
    reply: "Hit the ⚙ gear icon top right for Settings. You can set your display brightness, accent color, avatar color, default watchlist tickers, and trading interests (used for Trader Connect matching). Saves to your profile automatically." },

  // Gordon Gekko / personality
  { keywords: ["greed", "greed is good", "wall street", "gordon gekko", "movie"],
    reply: "Greed — for lack of a better word — is good. Greed is right. Greed works. Greed clarifies, cuts through, and captures the essence of the evolutionary spirit. That's the monologue. The real lesson? Know what you own and why you own it. 😏" },

  { keywords: ["joke", "funny", "humor", "laugh"],
    reply: "Why did the stock broker bring a ladder to work? Because he heard the market was going up. ...I don't do comedy. I do returns. Ask me something useful. 📊" },

  // Catch-all (keep last)
];

const SUGGESTIONS = [
  "What is this site about?",
  "How do the 3 scores work?",
  "What is Trader Connect?",
  "What data sources do you use?",
];

function getReply(input) {
  const lower = input.toLowerCase().replace(/[?!.,]/g, "");
  for (const r of RESPONSES) {
    if (r.keywords.some(k => lower.includes(k))) return r.reply;
  }
  return "Good question — but outside my coverage. Try asking about the scores (Momentum, Risk, Tech Value), a specific feature like Daily Brief or Insider Trading, or what this site is about. I don't speculate. I analyze. 🎯";
}

function GordonPanel({ onClose }) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(null);

  function send(text) {
    const q = (text !== undefined ? text : input).trim();
    if (!q) return;
    setReply(getReply(q));
    setInput("");
  }

  return (
    <div className="rd-panel rd-gordon">
      <div className="rd-panel-header">
        <div>
          <div className="rd-panel-eyebrow">AI Assistant</div>
          <div className="rd-panel-title">Gordon "Hugo" Gekko</div>
        </div>
        <button className="rd-panel-close" onClick={onClose}>−</button>
      </div>

      <div className="rd-gordon-body">
        {!reply ? (
          <>
            <p className="rd-gordon-intro">
              Greed is good. And so is knowing your stocks. Ask me anything. 😏
            </p>
            <div className="rd-gordon-chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="rd-gordon-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="rd-gordon-reply">{reply}</p>
            <button className="rd-gordon-back" onClick={() => setReply(null)}>← Ask another</button>
          </>
        )}
      </div>

      <div className="rd-gordon-input-row">
        <input
          className="rd-gordon-input"
          placeholder="Ask Gordon anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          autoFocus
        />
        <button className="rd-gordon-send" onClick={() => send()}>→</button>
      </div>
    </div>
  );
}

// ── RightDock ───────────────────────────────────────────────
const TABS = [
  { id: "ai",    icon: "🤖", label: "AI Assistant"   },
  { id: "match", icon: "🤝", label: "Trader Connect" },
  { id: "chat",  icon: "💬", label: "Messages"       },
];

export default function RightDock({ session }) {
  const [active, setActive] = useState(null);

  function toggle(id) {
    setActive(prev => prev === id ? null : id);
  }

  return (
    <>
      {/* Side panels — rendered to the left of the dock */}
      {active === "ai"    && (
        <div className="rd-panel">
          <div className="rd-panel-header">
            <span>🤖 QuantDiver AI</span>
            <button className="rd-panel-close" onClick={() => setActive(null)}>✕</button>
          </div>
          <AIChat session={session} />
        </div>
      )}
      {active === "chat"  && <Chat        session={session} dockMode onClose={() => setActive(null)} />}
      {active === "match" && <TraderMatch session={session} dockMode onClose={() => setActive(null)} />}

      {/* Dock strip */}
      <div className="rd-dock">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`rd-tab ${active === tab.id ? "active" : ""}`}
            onClick={() => toggle(tab.id)}
            title={tab.label}
          >
            <span className="rd-tab-icon">{tab.icon}</span>
            <span className="rd-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
