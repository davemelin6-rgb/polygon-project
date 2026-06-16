import { useState, useRef } from "react";
import Chat        from "./Chat.jsx";
import TraderMatch from "./TraderMatch.jsx";
import "./RightDock.css";

// Gordon Gekko chat — inline panel (no floating character)
const RESPONSES = [
  { keywords: ["hello","hi","hey","who are you","who is"],
    reply: "Gordon Gekko. I've made more money before breakfast than you'll see all year. But I'm feeling generous — ask me about this platform. 📈" },
  { keywords: ["momentum"],
    reply: "MOMENTUM (0–100). That's your velocity. 1-month & 3-month returns, volume, moving averages. High score means the stock is on the move. You want momentum — it's the difference between winning and watching. 🚀" },
  { keywords: ["risk"],
    reply: "RISK (0–100). Higher is SAFER — debt levels, liquidity, interest coverage, volatility. Every investment has risk. The question is: are you smart enough to measure it? Now you can. 🛡️" },
  { keywords: ["tech value","techvalue","technology value","tech"],
    reply: "TECH VALUE (0–100). R&D, gross margins, revenue growth, free cash flow. Find a company spending big on R&D with fat margins? That's where the real money is. 💡" },
  { keywords: ["score","scores","what is","explain","how does","how do","what are"],
    reply: "Three scores. MOMENTUM — is it moving? RISK — is it safe? TECH VALUE — is it built to last? Each 0 to 100. Higher is better. Click any card. The numbers don't lie. 📊" },
  { keywords: ["click","card","select","panel","how to use","use the site"],
    reply: "Click a stock card. The panels below show you the full breakdown — risk detail and financial intelligence. Information is the most valuable commodity. Now use it." },
  { keywords: ["buy","which stock","recommend","best stock","invest","should i"],
    reply: "Greed — for lack of a better word — is good. But smart greed. High momentum, high risk score, high tech value. That's your trifecta. Do your homework first." },
  { keywords: ["refresh","update","live","real time","data","how often"],
    reply: "Every 60 seconds. Polygon.io for live prices, FMP for fundamentals. Stale data is the same as no data. We stay sharp. ⚡" },
  { keywords: ["greed","wall street","gekko","gordon"],
    reply: "Greed is good. Greed clarifies, cuts through, and captures the essence of the evolutionary spirit. Now stop philosophizing and study those scores. 😏" },
];

const SUGGESTIONS = ["What are the scores?","What is MOMENTUM?","What is RISK?","How do I use this site?"];

function getReply(input) {
  const lower = input.toLowerCase();
  for (const r of RESPONSES) {
    if (r.keywords.some(k => lower.includes(k))) return r.reply;
  }
  return "I don't have time for vague questions. Try: MOMENTUM, RISK, TECH VALUE, or how to use the site. Focus. 🎯";
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
  { id: "match",  icon: "🤝", label: "Trader Connect" },
  { id: "chat",   icon: "💬", label: "Messages"        },
  { id: "gordon", icon: "🤖", label: "AI Assistant"    },
];

export default function RightDock({ session }) {
  const [active, setActive] = useState(null);

  function toggle(id) {
    setActive(prev => prev === id ? null : id);
  }

  return (
    <>
      {/* Active panel — rendered to the left of the dock */}
      {active === "chat"   && <Chat        session={session} dockMode onClose={() => setActive(null)} />}
      {active === "match"  && <TraderMatch session={session} dockMode onClose={() => setActive(null)} />}
      {active === "gordon" && <GordonPanel onClose={() => setActive(null)} />}

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
