import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";
import QDLogo from "./QDLogo.jsx";

const PLANS = [
  {
    id: "briefme",
    name: "BriefMe",
    price: "99",
    currency: "SEK",
    tagline: "Daily intelligence briefs",
    features: [
      "Morning brief at 08:00 · Stockholm",
      "US market preview at 15:00",
      "David Score leaderboard — 6 dimensions",
      "Sector signals & momentum indicators",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "249",
    currency: "SEK",
    tagline: "Full platform access",
    recommended: true,
    features: [
      "Everything in BriefMe",
      "Live MOMENTUM · RISK · TECH VALUE scores",
      "Advanced risk assessment breakdown",
      "Financial intelligence & AI insights",
      "Real-time price data & sparklines",
    ],
  },
];

const PROPS = [
  { icon: "☀️", title: "The Daily Brief", text: "Every morning: the stocks moving in AI, semiconductors, biotech, and clean energy — ranked by our scores. No headlines. No filler. Just the ones worth watching today." },
  { icon: "⚡", title: "Financial Intelligence Dashboard", text: "Live MOMENTUM, RISK, and TECH VALUE scores across the hottest tickers. Real data, processed in real time, laid out so you can read the market in under a minute." },
  { icon: "🛡️", title: "Advanced Risk Assessment", text: "Debt load, liquidity, interest coverage, price volatility — we run the full picture and hand you one number. Know exactly what you're walking into before you move." },
  { icon: "🔬", title: "Cutting-Edge Tech, Analyzed", text: "AI, quantum computing, semiconductors — the sectors defining the next decade. The same depth institutional desks have, without the institutional price tag." },
  { icon: "💬", title: "Talk to Real Traders, Live", text: "Connect directly with experienced traders on the platform in real time. Ask questions, share what you're seeing, trade ideas — with people who actually know the market." },
];

export default function Login({ onLogin, onBack }) {
  const [mode,     setMode]     = useState("signin");
  const [plan,     setPlan]     = useState("pro");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError("Invalid email or password."); return; }
    onLogin(data.session);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name.trim() || null, plan, trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) { onLogin(data.session); return; }
    setMode("done");
  }

  const switchMode = (m) => { setError(null); setResetSent(false); setMode(m); };

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email address above first."); return; }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setResetSent(true);
  }

  const selectedPlan = PLANS.find(p => p.id === plan);

  // ── shared sub-elements ────────────────────────────────────
  const mobileBrand = (
    <div className="login-mobile-brand">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <QDLogo size={40} />
        <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", background: "linear-gradient(125deg,#fff 0%,#c8e4f8 45%,#00b4ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>QuantDiver</h1>
      </div>
      <span className="login-badge">● MEMBERS ONLY</span>
    </div>
  );

  const tabs = (
    <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: "2rem" }}>
      {[["signin", "Sign in"], ["plan", "Create account"]].map(([m, label]) => (
        <button key={m} onClick={() => switchMode(m)} style={{
          flex: 1, padding: "0.75rem", background: "none", border: "none",
          cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem",
          fontWeight: mode === m || (mode !== "signin" && m === "plan") ? 700 : 500,
          color: mode === m || (mode !== "signin" && m === "plan") ? "#e2e8f0" : "#3d5c78",
          borderBottom: mode === m || (mode !== "signin" && m === "plan") ? "2px solid #00b4ff" : "2px solid transparent",
          transition: "all .15s", marginBottom: "-1px",
        }}>{label}</button>
      ))}
    </div>
  );

  const backLink = onBack && (
    <button onClick={onBack} style={{
      display: "block", width: "100%", marginTop: "0.9rem",
      background: "transparent", border: "none", color: "#2a3f55",
      fontSize: "0.8rem", cursor: "pointer", textAlign: "center", padding: "0.4rem",
    }}>← Back to QuantDiver</button>
  );

  return (
    <div className="login-page">

      {/* ── left panel ──────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-top">
            <QDLogo size={56} />
            <h1>QuantDiver</h1>
          </div>
          <span className="login-badge">● MEMBERS ONLY</span>
        </div>

        <p className="login-tagline">We do the math.<br />You make the call.</p>

        <div className="login-origin">
          <p>We spent years staring at Yahoo Finance, Bloomberg, every screener we could find — and kept hitting the same wall. Mountains of data. Dozens of metrics. Zero clarity. The signal was buried somewhere under all that noise. We just couldn't get to it fast enough.</p>
          <p>So we built what we couldn't find. A system that takes raw market data and runs it through layer after layer of quantitative analysis — refining it, scoring it, stress-testing it — until what comes out is clean. The kind of depth that institutional desks have quietly been sitting on for years. We reverse-engineered it, built our own version, and made it faster.</p>
          <p>Most of us on this team have been actively trading US equities and financial instruments for over fifteen years. We built QuantDiver for ourselves first. Now we're sharing it.</p>
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
          QuantDiver provides data and proprietary scores for informational purposes only.
          Nothing on this platform constitutes financial advice.
          Always conduct your own research before making any investment decision.
        </p>
      </div>

      {/* ── right panel ─────────────────────────────────────── */}
      <div className="login-right">

        {/* Sign In */}
        {mode === "signin" && (
          <div className="login-box">
            {mobileBrand}
            {tabs}
            <div className="login-box-header">
              <p className="login-welcome">Welcome back</p>
              <p className="login-sub">Enter your credentials to continue</p>
            </div>
            <form className="login-form" onSubmit={handleSignIn}>
              <div className="login-field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <p className="login-error">{error}</p>}
              {resetSent && (
                <p style={{ color: "#00dc82", fontSize: ".85rem", margin: "0 0 0.5rem" }}>
                  Reset link sent — check your inbox.
                </p>
              )}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <button type="button" onClick={handleForgotPassword} disabled={loading} style={{
                display: "block", width: "100%", marginTop: "0.6rem",
                background: "transparent", border: "none", color: "#3d5c78",
                fontSize: "0.8rem", cursor: "pointer", textAlign: "center", padding: "0.4rem",
              }}>
                Forgot password?
              </button>
            </form>
            {backLink}
          </div>
        )}

        {/* Plan selection */}
        {mode === "plan" && (
          <div className="login-box">
            {mobileBrand}
            {tabs}
            <div className="login-box-header">
              <p className="login-welcome">Choose your plan</p>
              <p className="login-sub">Cancel anytime — no lock-in</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "1.5rem" }}>
              {PLANS.map(p => {
                const sel = plan === p.id;
                return (
                  <button key={p.id} onClick={() => setPlan(p.id)} style={{
                    background: sel ? "rgba(0,180,255,.06)" : "rgba(255,255,255,.02)",
                    border: sel ? "1px solid rgba(0,180,255,.4)" : "1px solid rgba(255,255,255,.07)",
                    borderRadius: 14, padding: "18px 18px", cursor: "pointer", textAlign: "left",
                    boxShadow: sel ? "0 0 0 3px rgba(0,180,255,.08), 0 0 28px rgba(0,180,255,.12)" : "none",
                    transition: "all .18s", color: "inherit", fontFamily: "inherit", position: "relative",
                  }}>
                    {p.recommended && (
                      <span style={{ position: "absolute", top: -10, right: 14, background: "linear-gradient(135deg,#00b4ff,#1a6bcc)", color: "#fff", fontSize: ".62rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "2px 10px", borderRadius: 999, boxShadow: "0 2px 12px rgba(0,180,255,.35)" }}>Recommended</span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#dce8f4", marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: ".78rem", color: "#3d5c78" }}>{p.tagline}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: "1.25rem", color: sel ? "#00b4ff" : "#6a8aac" }}>{p.price}</span>
                        <span style={{ fontSize: ".75rem", color: "#3d5c78" }}> {p.currency}/mo</span>
                      </div>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                      {p.features.map((f, i) => (
                        <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: ".82rem", color: "#3d5c78" }}>
                          <span style={{ color: sel ? "#00b4ff" : "#2a4055", fontSize: ".65rem", paddingTop: 2, flexShrink: 0 }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <button className="login-btn" onClick={() => switchMode("form")}>
              Continue with {selectedPlan?.name} →
            </button>
            {backLink}
          </div>
        )}

        {/* Sign Up form */}
        {mode === "form" && (
          <div className="login-box">
            {mobileBrand}
            {tabs}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,180,255,.05)", border: "1px solid rgba(0,180,255,.18)", borderRadius: 10, padding: "10px 14px", marginBottom: "1.75rem" }}>
              <div>
                <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#00b4ff" }}>{selectedPlan?.name}</span>
                <span style={{ fontSize: ".82rem", color: "#3d5c78", marginLeft: 10 }}>{selectedPlan?.price} {selectedPlan?.currency}/month</span>
              </div>
              <button onClick={() => switchMode("plan")} style={{ background: "none", border: "none", color: "#3d5c78", fontSize: ".78rem", cursor: "pointer", padding: 0 }}>Change</button>
            </div>
            <div className="login-box-header">
              <p className="login-welcome">Start your free trial</p>
              <p className="login-sub">14 days free — no card required</p>
            </div>
            <form className="login-form" onSubmit={handleSignUp}>
              <div className="login-field">
                <label>Name <span style={{ color: "#1e3048", fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="login-field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
              </div>
              {error && <p className="login-error">{error}</p>}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Starting trial…" : "Start 14-day free trial →"}
              </button>
            </form>
            <p className="login-footer" style={{ marginTop: "1.25rem" }}>
              By signing up you agree to our{" "}
              <a href="#" onClick={e => e.preventDefault()} style={{ color: "#3d5c78", textDecoration: "underline" }}>Terms of Service</a>
            </p>
            {backLink}
          </div>
        )}

        {/* Done / check email */}
        {mode === "done" && (
          <div className="login-box" style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 1.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", background: "rgba(0,180,255,.08)", border: "1px solid rgba(0,180,255,.2)" }}>
              ✉️
            </div>
            <p className="login-welcome" style={{ marginBottom: "0.6rem" }}>Check your inbox</p>
            <p style={{ color: "#3d5c78", fontSize: ".92rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              We sent a confirmation link to <b style={{ color: "#6a8aac" }}>{email}</b>. Click it to activate your account and access your dashboard.
            </p>
            <button className="login-btn" onClick={() => switchMode("signin")} style={{ marginBottom: "0.75rem" }}>
              Back to Sign In
            </button>
            {backLink}
          </div>
        )}

      </div>
    </div>
  );
}
