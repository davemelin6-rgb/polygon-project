import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "What does a MOMENTUM score of 76 mean?",
  "How should I interpret the STRONG · 90D signal?",
  "What is the market regime and why does it matter?",
  "Explain the difference between RISK and TECH VALUE",
  "How was the scoring model validated?",
];

export default function AIChat({ session }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setError(null);

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      };
      const r = await fetch("/api/ai-chat", {
        method:  "POST",
        headers,
        body:    JSON.stringify({ messages: newMessages }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>

      {/* Header */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#00b4ff", marginBottom: 3 }}>
          🤖 QuantDiver AI
        </div>
        <div style={{ fontSize: ".72rem", color: "#2a4060" }}>
          Asks answered about scores, models, and platform only
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>

        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: ".82rem", color: "#3d5c78", marginBottom: "0.85rem", lineHeight: 1.6 }}>
              Ask me anything about QuantDiver scores, models, or how to use the platform.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: "rgba(0,180,255,.04)", border: "1px solid rgba(0,180,255,.12)",
                  borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer",
                  fontFamily: "inherit", fontSize: ".75rem", color: "#4a6a88",
                  textAlign: "left", transition: "all .15s",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              background: m.role === "user"
                ? "rgba(0,180,255,.12)"
                : "rgba(255,255,255,.04)",
              border: m.role === "user"
                ? "1px solid rgba(0,180,255,.2)"
                : "1px solid rgba(255,255,255,.07)",
              borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              padding: "0.65rem 0.85rem",
            }}>
              {m.role === "assistant" && (
                <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#00b4ff", marginBottom: 5 }}>
                  QuantDiver AI
                </div>
              )}
              <p style={{
                margin: 0,
                fontSize: ".82rem",
                color: m.role === "user" ? "#c8e4f8" : "#8aaec8",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "12px 12px 12px 4px", padding: "0.65rem 0.85rem" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#00b4ff",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p style={{ fontSize: ".78rem", color: "#ff3c50", margin: 0 }}>{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: "0.5rem" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about scores, models, signals…"
          disabled={loading}
          style={{
            flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: ".82rem",
            padding: "0.55rem 0.75rem", outline: "none",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: "rgba(0,180,255,.15)", border: "1px solid rgba(0,180,255,.3)",
            borderRadius: 8, color: "#00b4ff", cursor: loading || !input.trim() ? "default" : "pointer",
            padding: "0.55rem 0.85rem", fontWeight: 700, fontSize: ".82rem",
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >→</button>
      </div>

      <p style={{ margin: 0, padding: "0 0.75rem 0.5rem", fontSize: ".65rem", color: "#1a3050", lineHeight: 1.5 }}>
        Only answers questions about QuantDiver. Not financial advice.
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
