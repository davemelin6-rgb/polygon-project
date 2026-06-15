import { useState, useEffect } from "react";

export default function AdminPanel({ session, onBack }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [newPass,  setNewPass]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetch("/api/admin", { headers })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#6a8aac", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: ".82rem" }}>
            ← Back
          </button>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#dce8f4", margin: 0 }}>Admin — Users</h1>
          <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "#3d5c78" }}>{users.length} users</span>
        </div>

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
      </div>
    </div>
  );
}
