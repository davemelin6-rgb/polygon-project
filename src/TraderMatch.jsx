import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./TraderMatch.css";

const TOPICS = [
  { id: "ai",       label: "AI & Machine Learning", icon: "🧠", color: "#22D3EE" },
  { id: "quantum",  label: "Quantum Computing",      icon: "⚛️", color: "#8B5CF6" },
  { id: "defence",  label: "Defence & Space",        icon: "🛡️", color: "#F59E0B" },
  { id: "biotech",  label: "Biotech & MedTech",      icon: "🧬", color: "#10B981" },
];

function topicInfo(id) { return TOPICS.find(t => t.id === id) || TOPICS[0]; }

function timeStr(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function avatarLetter(name) { return (name || "?")[0].toUpperCase(); }

// Deterministic avatar color from username
const AVATAR_COLORS = ["#00b4ff", "#8B5CF6", "#10B981", "#F59E0B", "#ff3c50", "#06b6d4"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function TraderMatch({ session, dockMode = false, onClose }) {
  const [open,      setOpen]      = useState(false);
  const [state,     setState]     = useState("idle");   // idle | queued | matched | ended
  const [topic,     setTopic]     = useState(null);     // selected topic id while picking
  const [queueId,   setQueueId]   = useState(null);
  const [matchSession, setMatchSession] = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [myName,    setMyName]    = useState("");
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const subRef    = useRef(null);

  // Load own username
  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("username, trading_interests")
      .eq("id", session.user.id).single()
      .then(({ data }) => {
        if (data?.username) setMyName(data.username);
      });
  }, [session]);

  // Restore state on mount (e.g. after page reload)
  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/match?action=status", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(j => {
        if (j.state === "matched") {
          setMatchSession(j.session);
          setState("matched");
          loadMessages(j.session.id);
          setOpen(true);
        } else if (j.state === "queued") {
          setQueueId(j.queueId);
          setTopic(j.topic);
          setState("queued");
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [session]);

  // ── Realtime: watch own queue entry for status → matched ──
  useEffect(() => {
    if (!session || state !== "queued" || !queueId) return;

    const ch = supabase.channel(`queue-watch-${queueId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "match_queue",
        filter: `id=eq.${queueId}`,
      }, payload => {
        if (payload.new?.status === "matched" && payload.new?.session_id) {
          fetchSession(payload.new.session_id);
        }
      })
      .subscribe();

    subRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [session, state, queueId]);

  // ── Realtime: new messages in active session ──────────────
  useEffect(() => {
    if (!session || state !== "matched" || !matchSession) return;

    const ch = supabase.channel(`match-msgs-${matchSession.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "match_messages",
        filter: `session_id=eq.${matchSession.id}`,
      }, payload => {
        const m = payload.new;
        setMessages(prev => {
          if (prev.some(x => x.id === m.id)) return prev;
          return [...prev, m];
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "match_sessions",
        filter: `id=eq.${matchSession.id}`,
      }, payload => {
        if (payload.new?.status === "ended") {
          setState("ended");
        }
      })
      .subscribe();

    subRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [session, state, matchSession]);

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Polling fallback while queued (every 5s) ──────────────
  useEffect(() => {
    if (state !== "queued" || !session?.access_token) return;

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch("/api/match?action=status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const j = await r.json();
        if (j.state === "matched") {
          fetchSession(j.session.id);
        } else if (j.state === "idle") {
          // Queue entry disappeared (shouldn't happen, but handle it)
          setState("idle");
        }
      } catch {}
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [state, session]);

  async function fetchSession(sessionId) {
    const r = await fetch("/api/match?action=status", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const j = await r.json();
    if (j.state === "matched") {
      clearInterval(pollRef.current);
      setMatchSession(j.session);
      setState("matched");
      loadMessages(j.session.id);
    }
  }

  async function loadMessages(sessionId) {
    try {
      const r = await fetch(`/api/match?action=messages&sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const j = await r.json();
      setMessages(j.messages || []);
    } catch {}
  }

  async function joinQueue() {
    if (!topic || !session?.access_token) return;
    setState("queued");
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "join", topic }),
      });
      const j = await r.json();
      if (j.matched) {
        setMatchSession(j.session);
        setState("matched");
        loadMessages(j.session.id);
      } else {
        setQueueId(j.queueId);
      }
    } catch {
      setState("idle");
    }
  }

  async function leaveQueue() {
    if (queueId && session?.access_token) {
      await fetch("/api/match", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "leave", queueId }),
      }).catch(() => {});
    }
    clearInterval(pollRef.current);
    setQueueId(null);
    setState("idle");
  }

  async function endSession() {
    if (matchSession && session?.access_token) {
      await fetch("/api/match", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "leave", sessionId: matchSession.id }),
      }).catch(() => {});
    }
    setMatchSession(null);
    setMessages([]);
    setState("idle");
    setTopic(null);
  }

  async function sendMessage() {
    if (!input.trim() || !matchSession || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic
    const opt = {
      id: `opt-${Date.now()}`,
      user_id: session.user.id,
      username: myName,
      content: text,
      session_id: matchSession.id,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, opt]);

    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "message", sessionId: matchSession.id, content: text }),
      });
      const j = await r.json();
      if (j.message) {
        setMessages(prev => prev.map(m => m.id === opt.id ? j.message : m));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== opt.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  const partnerName = matchSession
    ? (matchSession.user1_id === session?.user?.id ? matchSession.user2_name : matchSession.user1_name)
    : null;

  const currentTopic = topicInfo(matchSession?.topic || topic || "ai");

  function handleClose() {
    if (dockMode) onClose?.();
    else setOpen(false);
  }

  // ── Minimized toggle button ───────────────────────────────
  if (!open && !dockMode) return (
    <button className="tm-toggle" onClick={() => setOpen(true)}>
      🤝
      {state === "queued" && <span className="tm-toggle-badge tm-badge-searching" />}
      {state === "matched" && <span className="tm-toggle-badge tm-badge-live" />}
    </button>
  );

  // ── Ended state ───────────────────────────────────────────
  if (state === "ended") return (
    <div className={`tm-panel${dockMode ? " tm-panel--dock" : ""}`}>
      <div className="tm-header">
        <span className="tm-title">Trader Connect</span>
        <button className="tm-close" onClick={handleClose}>−</button>
      </div>
      <div className="tm-ended">
        <div className="tm-ended-icon">👋</div>
        <p className="tm-ended-text">Session ended</p>
        <p className="tm-ended-sub">Your partner left the conversation.</p>
        <button className="tm-find-btn" onClick={() => { setState("idle"); setTopic(null); setMessages([]); setMatchSession(null); }}>
          Find Another Trader
        </button>
      </div>
    </div>
  );

  // ── Active chat ───────────────────────────────────────────
  if (state === "matched" && matchSession) return (
    <div className={`tm-panel${dockMode ? " tm-panel--dock" : ""}`}>
      <div className="tm-header">
        <div className="tm-header-left">
          <div className="tm-partner-avatar" style={{ background: avatarColor(partnerName) }}>
            {avatarLetter(partnerName)}
          </div>
          <div>
            <div className="tm-partner-name">{partnerName}</div>
            <div className="tm-topic-tag" style={{ color: currentTopic.color }}>
              {currentTopic.icon} {currentTopic.label}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button className="tm-end-btn" onClick={endSession} title="End session">✕ End</button>
          <button className="tm-close" onClick={handleClose}>−</button>
        </div>
      </div>

      <div className="tm-messages">
        {messages.length === 0 && (
          <p className="tm-empty">You matched! Say hello to {partnerName} 👋</p>
        )}
        {messages.map((m, i) => {
          const isOwn = m.user_id === session.user.id;
          return (
            <div key={m.id ?? i} className={`tm-msg ${isOwn ? "own" : ""}`}>
              <div className="tm-avatar" style={{ background: isOwn ? avatarColor(myName) : avatarColor(partnerName) }}>
                {avatarLetter(isOwn ? myName : partnerName)}
              </div>
              <div className="tm-msg-body">
                <div className="tm-msg-meta">
                  <span className="tm-msg-name">{m.username}</span>
                  <span className="tm-msg-time">{timeStr(m.created_at)}</span>
                </div>
                <div className="tm-msg-text">{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="tm-input-row">
        <input
          className="tm-input"
          placeholder={`Message ${partnerName}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          autoFocus
        />
        <button className="tm-send" onClick={sendMessage} disabled={sending || !input.trim()}>→</button>
      </div>
    </div>
  );

  // ── Queue waiting ─────────────────────────────────────────
  if (state === "queued") return (
    <div className={`tm-panel${dockMode ? " tm-panel--dock" : ""}`}>
      <div className="tm-header">
        <span className="tm-title">Trader Connect</span>
        <button className="tm-close" onClick={handleClose}>−</button>
      </div>
      <div className="tm-searching">
        <div className="tm-spinner" />
        <p className="tm-searching-text">
          Finding a {currentTopic.icon} {currentTopic.label} trader…
        </p>
        <p className="tm-searching-sub">You'll be notified when a match is found</p>
        <button className="tm-cancel-btn" onClick={leaveQueue}>Cancel</button>
      </div>
    </div>
  );

  // ── Topic picker (idle) ───────────────────────────────────
  return (
    <div className={`tm-panel${dockMode ? " tm-panel--dock" : ""}`}>
      <div className="tm-header">
        <div>
          <span className="tm-title">Trader Connect</span>
          <div className="tm-subtitle">Match with a real trader</div>
        </div>
        <button className="tm-close" onClick={handleClose}>−</button>
      </div>

      <div className="tm-body">
        <p className="tm-desc">
          Choose a topic and we'll pair you with another QuantDiver member who shares your interest — then chat directly.
        </p>

        <p className="tm-section-label">Select a topic</p>
        <div className="tm-topics">
          {TOPICS.map(t => (
            <button
              key={t.id}
              className={`tm-topic-btn ${topic === t.id ? "selected" : ""}`}
              style={topic === t.id ? { borderColor: t.color, color: t.color, background: `${t.color}10` } : {}}
              onClick={() => setTopic(t.id)}
            >
              <span className="tm-topic-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <button
          className="tm-find-btn"
          disabled={!topic}
          onClick={joinQueue}
        >
          {topic ? `Find ${topicInfo(topic).icon} Trader` : "Select a Topic First"}
        </button>

        <p className="tm-disclaimer">
          Connections are voluntary and anonymous. Never share personal financial details.
        </p>
      </div>
    </div>
  );
}
