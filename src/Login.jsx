import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";

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
          <h1>QuantDiver</h1>
          <span className="login-badge">● MEMBERS ONLY</span>
        </div>

        <p className="login-tagline">
          We do the math.<br />You make the call.
        </p>

        <p className="login-team-intro">
          A dedicated team of quantitative analysts and tech professionals,
          100% focused on one thing: giving you the most refined, processed
          market data available — so every decision you make is backed by
          something real.
        </p>

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
          <div className="login-box-header">
            <p className="login-welcome">Welcome back</p>
            <p className="login-sub">Sign in to your QuantDiver account</p>
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
