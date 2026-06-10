import { useState, useEffect, useRef } from "react";
import "./Hugo.css";

const RESPONSES = [
  {
    keywords: ["hello", "hi", "hey", "who are you", "who is"],
    reply: "Gordon Gekko. I've made more money before breakfast than you'll see all year. But I'm feeling generous — ask me about this platform. 📈"
  },
  {
    keywords: ["momentum"],
    reply: "MOMENTUM (0–100). That's your velocity, pal. 1-month & 3-month returns, volume, moving averages. High score means the stock is on the move. You want momentum — it's the difference between winning and watching. 🚀"
  },
  {
    keywords: ["risk"],
    reply: "RISK (0–100). Higher is SAFER — debt levels, liquidity, interest coverage, volatility. Every investment has risk. The question is: are you smart enough to measure it? Now you can. 🛡️"
  },
  {
    keywords: ["tech value", "techvalue", "technology value", "tech"],
    reply: "TECH VALUE (0–100). R&D, gross margins, revenue growth, free cash flow. This is the future, pal. You find a company spending big on R&D with fat margins? That's where the real money is. 💡"
  },
  {
    keywords: ["score", "scores", "what is", "explain", "how does", "how do", "what are"],
    reply: "Three scores. MOMENTUM — is it moving? RISK — is it safe? TECH VALUE — is it built to last? Each 0 to 100. Higher is better. Click any card. The numbers don't lie. 📊"
  },
  {
    keywords: ["click", "card", "select", "panel", "how to use", "use the site", "use this"],
    reply: "Click a stock card. The two panels below show you the full breakdown — risk detail and financial intelligence. Information is the most valuable commodity. Now use it."
  },
  {
    keywords: ["buy", "which stock", "recommend", "best stock", "invest", "should i"],
    reply: "Greed — for lack of a better word — is good. But smart greed. High momentum, high risk score, high tech value. That's your trifecta. Do your homework first."
  },
  {
    keywords: ["refresh", "update", "live", "real time", "real-time", "data", "how often"],
    reply: "Every 60 seconds. Polygon.io for live prices, FMP for fundamentals. In this game, stale data is the same as no data. We stay sharp. ⚡"
  },
  {
    keywords: ["panel", "advanced risk", "risk assessment"],
    reply: "The Risk Assessment panel breaks it all down — debt ratio, liquidity, interest coverage, volatility. Four components. One score. Know your downside before you talk upside."
  },
  {
    keywords: ["financial intelligence", "intelligence", "insight"],
    reply: "Financial Intelligence — plain English analysis based on real scores. Because the numbers only matter if you understand what they mean. That's what separates the players from the spectators."
  },
  {
    keywords: ["greed", "wall street", "gekko", "gordon"],
    reply: "Greed is good. Greed clarifies, cuts through, and captures the essence of the evolutionary spirit. Now stop philosophizing and study those scores. 😏"
  },
];

const SUGGESTIONS = [
  "What are the scores?",
  "What is MOMENTUM?",
  "What is RISK?",
  "How do I use this site?",
];

function getReply(input) {
  const lower = input.toLowerCase();
  for (const r of RESPONSES) {
    if (r.keywords.some(k => lower.includes(k))) return r.reply;
  }
  return "I don't have time for vague questions. Try: MOMENTUM, RISK, TECH VALUE, or how to use the site. Focus. 🎯";
}

export default function Hugo() {
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [input, setInput]         = useState("");
  const [reply, setReply]         = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function send(text) {
    const q = (text !== undefined ? text : input).trim();
    if (!q) return;
    setReply(getReply(q));
    setInput("");
  }

  if (dismissed) return (
    <button className="hugo-revive" onClick={() => { setDismissed(false); setReply(null); }} title="Bring back Gordon">
      <div className="hugo-revive-face">
        <div className="hugo-revive-hair" />
        <div className="hugo-revive-circle">💼</div>
      </div>
    </button>
  );

  return (
    <div className={`hugo-wrap ${visible ? "hugo-in" : ""}`}>
      <div className="hugo-bubble">
        <button className="hugo-close" onClick={() => setDismissed(true)}>×</button>
        <p className="hugo-name">Gordon "Hugo" Gekko</p>

        {!reply ? (
          <>
            <p className="hugo-text">
              Greed is good. And so is knowing your stocks. Ask me anything. 😏
            </p>
            <div className="hugo-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="hugo-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="hugo-text">{reply}</p>
            <button className="hugo-back" onClick={() => setReply(null)}>← Ask another</button>
          </>
        )}

        <div className="hugo-input-row">
          <input
            ref={inputRef}
            className="hugo-input"
            placeholder="Ask Gordon anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button className="hugo-send" onClick={() => send()}>→</button>
        </div>
      </div>

      {/* Gordon Gekko character */}
      <div className="hugo-char">
        <div className="hugo-body">
          {/* Head */}
          <div className="hugo-head">
            <div className="hugo-hair" />
            <div className="hugo-face">
              <div className="hugo-eyes">
                <div className="hugo-eye"><div className="hugo-pupil" /></div>
                <div className="hugo-eye"><div className="hugo-pupil" /></div>
              </div>
              <div className="hugo-nose" />
              <div className="hugo-mouth" />
            </div>
          </div>
          {/* Shirt collar */}
          <div className="hugo-collar">
            <div className="hugo-collar-l" />
            <div className="hugo-tie" />
            <div className="hugo-collar-r" />
          </div>
          {/* Pinstripe suit */}
          <div className="hugo-torso">
            <div className="hugo-lapel hugo-lapel-l" />
            <div className="hugo-lapel hugo-lapel-r" />
            <div className="hugo-arm hugo-arm-l" />
            <div className="hugo-arm hugo-arm-r" />
          </div>
          {/* Trousers */}
          <div className="hugo-legs">
            <div className="hugo-leg" />
            <div className="hugo-leg" />
          </div>
        </div>
      </div>
    </div>
  );
}
