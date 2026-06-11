import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./Chat.css";

export default function Chat({ session }) {
  const [profile, setProfile]   = useState(null);
  const [online, setOnline]     = useState([]);   // other online users
  const [activeDM, setActiveDM] = useState(null); // { id, username, avatar_color }
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [open, setOpen]         = useState(true);
  const bottomRef  = useRef(null);
  const channelRef = useRef(null);

  // Load own profile
  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  // Realtime presence
  useEffect(() => {
    if (!session || !profile) return;

    const channel = supabase.channel("global-chat", {
      config: { presence: { key: session.user.id } }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const seen = new Set();
      const others = Object.values(state).flat().filter(u => {
        if (u.username === profile.username) return false;
        if (seen.has(u.username)) return false;
        seen.add(u.username);
        return true;
      });
      setOnline(others);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ username: profile.username, avatar_color: profile.avatar_color, user_id: session.user.id });
      }
    });

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [session, profile]);

  // Load DM messages when activeDM changes
  useEffect(() => {
    if (!activeDM || !profile) return;
    const myId   = session.user.id;
    const theirId = activeDM.id;

    supabase.from("messages")
      .select("*")
      .or(`and(user_id.eq.${myId},recipient_id.eq.${theirId}),and(user_id.eq.${theirId},recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data || []));
  }, [activeDM, profile]);

  // Realtime new DM messages
  useEffect(() => {
    if (!activeDM || !session) return;
    const myId    = session.user.id;
    const theirId = activeDM.id;

    const sub = supabase.channel(`dm-${myId}-${theirId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        const m = payload.new;
        const relevant =
          (m.user_id === myId    && m.recipient_id === theirId) ||
          (m.user_id === theirId && m.recipient_id === myId);
        if (relevant) setMessages(prev => [...prev, m]);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [activeDM, session]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !profile || !activeDM) return;
    await supabase.from("messages").insert({
      user_id:      session.user.id,
      username:     profile.username,
      content:      input.trim(),
      recipient_id: activeDM.id,
    });
    setInput("");
  }

  function avatarLetter(username) {
    return (username || "?")[0].toUpperCase();
  }

  function timeStr(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // ── Minimized bubble ───────────────────────────────────────
  if (!open) return (
    <button className="chat-toggle" onClick={() => setOpen(true)}>
      <span>💬</span>
      {online.length > 0 && <span className="chat-toggle-badge">{online.length}</span>}
    </button>
  );

  // ── DM conversation view ───────────────────────────────────
  if (activeDM) return (
    <div className="chat-panel">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => { setActiveDM(null); setMessages([]); }}>
          ← Back
        </button>
        <div className="chat-dm-who">
          <div className="chat-avatar" style={{ background: activeDM.avatar_color || "#00b4ff", width: 26, height: 26, fontSize: "0.7rem" }}>
            {avatarLetter(activeDM.username)}
          </div>
          <span>{activeDM.username}</span>
          <span className="chat-dm-online-dot" />
        </div>
        <button className="chat-minimize" onClick={() => setOpen(false)}>−</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Say hello to {activeDM.username} 👋</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`chat-msg ${m.user_id === session.user.id ? "own" : ""}`}>
            <div className="chat-avatar" style={{ background: m.user_id === session.user.id ? (profile?.avatar_color || "#00b4ff") : (activeDM.avatar_color || "#00b4ff") }}>
              {avatarLetter(m.username)}
            </div>
            <div className="chat-msg-body">
              <div className="chat-msg-meta">
                <span className="chat-msg-name">{m.username}</span>
                <span className="chat-msg-time">{timeStr(m.created_at)}</span>
              </div>
              <div className="chat-msg-text">{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder={`Message ${activeDM.username}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          autoFocus
        />
        <button className="chat-send" onClick={sendMessage}>→</button>
      </div>
    </div>
  );

  // ── Member picker view ─────────────────────────────────────
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-title">Messages</span>
        <button className="chat-minimize" onClick={() => setOpen(false)}>−</button>
      </div>

      <div className="chat-member-picker">
        {online.length === 0 ? (
          <div className="chat-no-online">
            <span>🔍</span>
            <p>No members online right now</p>
          </div>
        ) : (
          <>
            <p className="chat-picker-label">Online now — tap to chat</p>
            {online.map((u, i) => (
              <button key={i} className="chat-picker-row" onClick={() => setActiveDM(u)}>
                <div className="chat-avatar" style={{ background: u.avatar_color || "#00b4ff" }}>
                  {avatarLetter(u.username)}
                </div>
                <div className="chat-picker-info">
                  <span className="chat-picker-name">{u.username}</span>
                  <span className="chat-picker-hint">Tap to open conversation</span>
                </div>
                <span className="chat-picker-arrow">→</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
