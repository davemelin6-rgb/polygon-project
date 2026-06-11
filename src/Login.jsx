import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";
import QDLogo from "./QDLogo.jsx";

const PROPS = [
  {
    icon: "☀️",
    title: "The Daily Brief",
    text: "Every morning: the stocks moving in AI, semiconductors, biotech, and clean energy — ranked by our scores. No headlines. No filler. Just the ones worth watching today."
  },
  {
    icon: "⚡",
    title: "Financial Intelligence Dashboard",
    text: "Live MOMENTUM, RISK, and TECH VALUE scores across the hottest tickers. Real data, processed in real time, laid out so you can read the market in under a minute."
  },
  {
    icon: "🛡️",
    title: "Advanced Risk Assessment",
    text: "Debt load, liquidity, interest coverage, price volatility — we run the full picture and hand you one number. Know exactly what you're walking into before you move."
  },
  {
    icon: "🔬",
    title: "Cutting-Edge Tech, Analyzed",
    text: "AI, quantum computing, semiconductors — the sectors that are defining the next decade. We dig into the fundamentals institutions look at, without the institutional price tag."
  },
  {
    icon: "💬",
    title: "Talk to Real Traders, Live",
    text: "Connect directly with experienced traders on the platform in real time. Ask questions, share what you're seeing, trade ideas — with people who actually know the market."
  },
];

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Invalid email or password.");
    } else {
      onLogin(data.session);
    }
  }

  return (
    <div className="login-page">

      {/* Left — value proposition */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-top">
            <QDLogo size={56} />
            <h1>QuantDiver</h1>
          </div>
          <span className="login-badge">● MEMBERS ONLY</span>
        </div>

        <p className="login-tagline">
          We do the math.<br />You make the call.
        </p>

        <div className="login-origin">
          <p>
            We spent years staring at Yahoo Finance, Bloomberg, every screener
            we could find — and kept hitting the same wall. Mountains of data.
            Dozens of metrics. Zero clarity. The signal was buried somewhere
            under all that noise. We just couldn't get to it fast enough.
          </p>
          <p>
            So we built what we couldn't find. A system that takes raw market
            data and runs it through layer after layer of quantitative analysis
            — refining it, scoring it, stress-testing it — until what comes
            out is clean. The kind of depth that institutional desks have
            quietly been sitting on for years. We reverse-engineered it, built
            our own version, and made it faster.
          </p>
          <p>
            Most of us on this team have been actively trading US equities and
            financial instruments for over fifteen years. We built QuantDiver
            for ourselves first. Now we're sharing it.
          </p>
        </div>

        <p className="login-section-label">What We Offer</p>

        <div className="login-props">
          {PROPS.map(p => (
            <div key={p.title} className="login-prop">
              <div className="login-prop-icon">{p.icon}</div>
              <div>
                <p className="login-prop-title">{p.title}</p>
                <p className="login-prop-text">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="login-disclaimer">
          QuantDiver provides data and proprietary scores for informational
          purposes only. Nothing on this platform constitutes financial advice.
          Always conduct your own research before making any investment decision.
        </p>
      </div>

      {/* Right — login form */}
      <div className="login-right">
        <div className="login-box">
          {/* Logo shown only on mobile */}
          <div className="login-mobile-brand">
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <QDLogo size={40} />
              <h1 style={{ fontSize:"2rem", fontWeight:700, letterSpacing:"-0.04em", background:"linear-gradient(125deg,#fff 0%,#c8e4f8 45%,#00b4ff 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1 }}>QuantDiver</h1>
            </div>
            <span className="login-badge">● MEMBERS ONLY</span>
          </div>

          <div className="login-box-header">
            <p className="login-welcome">Member Access</p>
            <p className="login-sub">Enter your credentials to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="login-footer">Access by invitation only.</p>
        </div>
      </div>

    </div>
  );
}
