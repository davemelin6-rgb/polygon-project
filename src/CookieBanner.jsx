import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner if user hasn't consented yet
    if (!localStorage.getItem("qd_cookie_consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("qd_cookie_consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("qd_cookie_consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "rgba(7,13,22,.97)", borderTop: "1px solid rgba(255,255,255,.08)",
      padding: "16px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      backdropFilter: "blur(20px)",
    }}>
      <p style={{ fontSize: ".82rem", color: "#8A9EC0", margin: 0, lineHeight: 1.6, flex: 1, minWidth: 260 }}>
        🍪 We use cookies to keep you logged in and improve your experience.
        QuantDiver does not sell your data. See our{" "}
        <a href="#" onClick={e => e.preventDefault()} style={{ color: "#22D3EE", textDecoration: "none" }}>Privacy Policy</a>.
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={decline} style={{
          background: "none", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8,
          color: "#4a6a88", cursor: "pointer", fontFamily: "inherit",
          fontSize: ".78rem", fontWeight: 600, padding: "8px 16px",
        }}>
          Decline
        </button>
        <button onClick={accept} style={{
          background: "#22D3EE", border: "none", borderRadius: 8,
          color: "#04080F", cursor: "pointer", fontFamily: "inherit",
          fontSize: ".78rem", fontWeight: 700, padding: "8px 20px",
        }}>
          Accept
        </button>
      </div>
    </div>
  );
}
