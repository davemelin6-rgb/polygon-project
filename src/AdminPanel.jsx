import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function AdminPanel({ session, onBack }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [newPass,    setNewPass]    = useState("");
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [backtest,   setBacktest]   = useState(null);
  const [btLoading,  setBtLoading]  = useState(true);
  const [btRunning,  setBtRunning]  = useState(false);
  const [activeTab,  setActiveTab]  = useState("users");

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetch("/api/admin", { headers })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));

    // Load latest back-test result
    supabase.from("backtest_results")
      .select("*")
      .order("run_date", { ascending: false })
      .limit(5)
      .then(({ data }) => { setBacktest(data || []); setBtLoading(false); });
  }, []);

  async function runBacktest() {
    setBtRunning(true);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "run_backtest" }),
      });
      // Reload results
      const { data } = await supabase.from("backtest_results").select("*").order("run_date", { ascending: false }).limit(5);
      setBacktest(data || []);
    } catch {}
    setBtRunning(false);
  }

  async function savePassword(e) {
    e.preventDefault();
    if (!selected || newPass.length < 6) return;
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/admin", {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: selected.id, password: newPass }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.ok) {
      setMsg({ ok: true, text: `Password updated for ${selected.email}` });
      setNewPass("");
    } else {
      setMsg({ ok: false, text: d.error || "Failed" });
    }
  }

  function fmt(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060d14", color: "#c8d8e8", fontFamily: "'Space Grotesk', sans-serif", padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#6a8aac", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: ".82rem" }}>
            ← Back
          </button>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#dce8f4", margin: 0 }}>Admin</h1>
          <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "#3d5c78" }}>{users.length} users</span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          {[["users","👥 Users"], ["model","📊 Model Performance"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: "0.6rem 1.2rem", background: "none", border: "none",
              borderBottom: activeTab === id ? "2px solid #00b4ff" : "2px solid transparent",
              color: activeTab === id ? "#e2e8f0" : "#3d5c78",
              cursor: "pointer", fontFamily: "inherit", fontSize: ".82rem", fontWeight: 600,
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {/* ── Users tab ── */}
        {activeTab === "users" && <>
        {loading && <p style={{ color: "#3d5c78" }}>Loading…</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>

          {/* User table */}
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  {["Email", "Name", "Plan", "Trial ends", "Joined"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#3d5c78", fontWeight: 600, fontSize: ".7rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => { setSelected(u); setMsg(null); setNewPass(""); }}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      background: selected?.id === u.id ? "rgba(0,180,255,.06)" : "transparent",
                      cursor: "pointer",
                      transition: "background .12s",
                    }}
                  >
                    <td style={{ padding: "10px 14px", color: "#dce8f4" }}>{u.email}</td>
                    <td style={{ padding: "10px 14px", color: "#6a8aac" }}>{u.name || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {u.plan ? (
                        <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(0,180,255,.1)", color: "#00b4ff", border: "1px solid rgba(0,180,255,.2)" }}>
                          {u.plan}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6a8aac", fontFamily: "'Space Mono', monospace", fontSize: ".72rem" }}>{fmt(u.trial_ends_at)}</td>
                    <td style={{ padding: "10px 14px", color: "#6a8aac", fontFamily: "'Space Mono', monospace", fontSize: ".72rem" }}>{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Password panel */}
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "1.5rem" }}>
            {!selected ? (
              <p style={{ color: "#3d5c78", fontSize: ".85rem" }}>← Select a user to set their password</p>
            ) : (
              <>
                <p style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#3d5c78", marginBottom: ".5rem" }}>Set password for</p>
                <p style={{ color: "#00b4ff", fontSize: ".9rem", marginBottom: "1.5rem", wordBreak: "break-all" }}>{selected.email}</p>
                <form onSubmit={savePassword}>
                  <label style={{ display: "block", fontSize: ".75rem", color: "#3d5c78", marginBottom: ".4rem", letterSpacing: ".06em" }}>New password</label>
                  <input
                    type="text"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="min 6 characters"
                    minLength={6}
                    required
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 8, padding: "10px 12px", color: "#dce8f4",
                      fontFamily: "'Space Mono', monospace", fontSize: ".88rem",
                      marginBottom: "1rem", outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={saving || newPass.length < 6}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 8,
                      background: "linear-gradient(135deg,#00b4ff,#1a6bcc)",
                      border: "none", color: "#fff", fontWeight: 700,
                      fontSize: ".88rem", cursor: saving ? "default" : "pointer",
                      opacity: newPass.length < 6 ? .4 : 1,
                    }}
                  >
                    {saving ? "Saving…" : "Set Password"}
                  </button>
                </form>
                {msg && (
                  <p style={{ marginTop: "1rem", fontSize: ".82rem", color: msg.ok ? "#00dc82" : "#ff3c50" }}>
                    {msg.text}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        </> /* end users tab */}

        {/* ── Model Performance tab ── */}
        {activeTab === "model" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <p style={{ color: "#3d5c78", fontSize: ".82rem", margin: 0 }}>
                Weekly back-test: does high MOMENTUM predict positive 30-day returns?
              </p>
              <button
                onClick={runBacktest}
                disabled={btRunning}
                style={{ background: "rgba(0,180,255,.1)", border: "1px solid rgba(0,180,255,.3)", color: "#00b4ff", borderRadius: 8, padding: "6px 16px", cursor: btRunning ? "default" : "pointer", fontSize: ".78rem", fontWeight: 700, opacity: btRunning ? .5 : 1 }}
              >
                {btRunning ? "Running…" : "▶ Run Now"}
              </button>
            </div>

            {btLoading && <p style={{ color: "#3d5c78" }}>Loading…</p>}

            {!btLoading && backtest.length === 0 && (
              <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "2rem", textAlign: "center" }}>
                <p style={{ color: "#3d5c78", marginBottom: "0.75rem" }}>No back-test results yet.</p>
                <p style={{ color: "#2a4060", fontSize: ".82rem" }}>First run is scheduled for Sunday 02:00 UTC. Click "Run Now" to trigger manually.</p>
              </div>
            )}

            {backtest.map((bt, i) => {
              const verdictColor = bt.verdict === "PREDICTIVE" ? "#00dc82" : bt.verdict === "WEAK_SIGNAL" ? "#f59e0b" : "#ff3c50";
              const buckets = bt.buckets || [];
              return (
                <div key={bt.id} style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${i === 0 ? "rgba(0,180,255,.2)" : "rgba(255,255,255,.06)"}`, borderRadius: 14, padding: "1.5rem", marginBottom: "1rem" }}>
                  {i === 0 && <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#00b4ff", marginBottom: "0.75rem" }}>Latest Run</div>}

                  {/* Header stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1, background: "rgba(255,255,255,.04)", borderRadius: 10, overflow: "hidden", marginBottom: "1.25rem" }}>
                    {[
                      ["Run Date",    new Date(bt.run_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), "#c8d8e8"],
                      ["Verdict",     bt.verdict,        verdictColor],
                      ["Spread",      bt.spread_pct != null ? `${bt.spread_pct > 0 ? "+" : ""}${bt.spread_pct}%` : "—", bt.spread_pct > 3 ? "#00dc82" : bt.spread_pct > 0 ? "#f59e0b" : "#ff3c50"],
                      ["Correlation", bt.correlation != null ? bt.correlation.toFixed(3) : "—", bt.correlation > 0.2 ? "#00dc82" : bt.correlation > 0 ? "#f59e0b" : "#ff3c50"],
                      ["Samples",     bt.total_samples ?? "—", "#6a8aac"],
                      ["Tickers",     bt.tickers ?? "—", "#6a8aac"],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ background: "rgba(5,10,18,.95)", padding: "0.9rem 1rem" }}>
                        <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 5 }}>{label}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: ".95rem", fontWeight: 700, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bucket breakdown */}
                  {buckets.length > 0 && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                          {["Score Bucket", "Samples", "Avg 30d Return", "Avg 60d Return", "Win Rate"].map(h => (
                            <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "#3d5c78", fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {buckets.map((b, j) => {
                          const ret30Color = b.avg30d > 3 ? "#00dc82" : b.avg30d > 0 ? "#f59e0b" : "#ff3c50";
                          const ret60Color = b.avg60d > 5 ? "#00dc82" : b.avg60d > 0 ? "#f59e0b" : "#ff3c50";
                          return (
                            <tr key={j} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                              <td style={{ padding: "8px 10px", color: "#c8d8e8", fontWeight: 700 }}>{b.bucket}</td>
                              <td style={{ padding: "8px 10px", color: "#6a8aac", fontFamily: "'Space Mono',monospace" }}>{b.samples}</td>
                              <td style={{ padding: "8px 10px", fontFamily: "'Space Mono',monospace", fontWeight: 700, color: ret30Color }}>{b.avg30d != null ? `${b.avg30d > 0 ? "+" : ""}${b.avg30d}%` : "—"}</td>
                              <td style={{ padding: "8px 10px", fontFamily: "'Space Mono',monospace", fontWeight: 700, color: ret60Color }}>{b.avg60d != null ? `${b.avg60d > 0 ? "+" : ""}${b.avg60d}%` : "—"}</td>
                              <td style={{ padding: "8px 10px", fontFamily: "'Space Mono',monospace", color: b.winRate > 55 ? "#00dc82" : b.winRate > 45 ? "#f59e0b" : "#ff3c50" }}>{b.winRate != null ? `${b.winRate}%` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Interpretation */}
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: `${verdictColor}08`, border: `1px solid ${verdictColor}20`, borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: ".78rem", color: "#6a8aac", lineHeight: 1.7 }}>
                      {bt.verdict === "PREDICTIVE"
                        ? `✅ Model is working. High-scoring stocks are outperforming low-scoring stocks by ${bt.spread_pct}% over 30 days. The formula weights are calibrated correctly.`
                        : bt.verdict === "WEAK_SIGNAL"
                        ? `⚠️ Weak signal. Some predictive power detected (${bt.spread_pct}% spread) but not strong enough to be conclusive. Consider adjusting weights.`
                        : `❌ Model not predictive. High scores are not outperforming low scores. Formula weights need recalibration.`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
