import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";

const PROPS = [
  {
    icon: "📊",
    title: "The Market Is Noisy",
    text: "Earnings calls, analyst upgrades, Reddit threads, breaking news — most of it is just noise. Knowing what actually matters, and when, is a full-time job. We made it ours."
  },
  {
    icon: "🔬",
    title: "We Do The Heavy Lifting",
    text: "Our quant team processes thousands of data points per ticker every day — momentum signals, risk indicators, and fundamental health metrics — then refines them into three scores you can act on in seconds."
  },
  {
    icon: "🎯",
    title: "You Stay In Control",
    text: "We give you the data, processed and refined. You make the call. No tips, no predictions, no agenda — just clean signals so your decisions are built on something real."
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
