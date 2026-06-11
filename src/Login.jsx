import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";

const PROPS = [
  {
    icon: "⚡",
    title: "The Problem",
    text: "Choosing the right investment is hard. Every day you're buried under earnings reports, price charts, analyst opinions, and noise. Most investors never get past the surface."
  },
  {
    icon: "🎯",
    title: "The Solution",
    text: "QuantDiver cuts through it all. Three proprietary scores — MOMENTUM, RISK, and TECH VALUE — distill thousands of data points into one clear signal per stock."
  },
  {
    icon: "🚀",
    title: "The Experience",
    text: "Not a spreadsheet. Not a news feed. A live, premium intelligence platform built for investors who want answers, not more questions."
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
          Stop guessing.<br />Start diving deep.
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
