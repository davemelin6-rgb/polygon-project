import { useState } from "react";
import "./ContactModal.css";

export default function ContactModal({ onClose, userEmail }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Failed to send"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Network error — please try again");
    }
    setLoading(false);
  }

  return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal">
        <div className="cm-header">
          <div>
            <div className="cm-eyebrow">Support</div>
            <h2 className="cm-title">Contact us</h2>
          </div>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="cm-sent">
            <div className="cm-sent-icon">✓</div>
            <p className="cm-sent-msg">Message sent — we'll get back to you shortly.</p>
            <button className="cm-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="cm-form" onSubmit={handleSubmit}>
            <div className="cm-row">
              <label className="cm-label">NAME <span className="cm-opt">(optional)</span></label>
              <input className="cm-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="cm-row">
              <label className="cm-label">EMAIL</label>
              <input className="cm-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="cm-row">
              <label className="cm-label">SUBJECT <span className="cm-opt">(optional)</span></label>
              <input className="cm-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?" />
            </div>
            <div className="cm-row">
              <label className="cm-label">MESSAGE</label>
              <textarea className="cm-input cm-textarea" required value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue or question…" rows={5} />
            </div>
            {error && <p className="cm-error">{error}</p>}
            <button className="cm-btn" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send message →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
