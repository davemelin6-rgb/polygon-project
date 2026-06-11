import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./Chat.css";

export default function Chat({ session }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [online, setOnline]       = useState([]);
  const [profile, setProfile]     = useState(null);
  const [search, setSearch]       = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [tab, setTab]             = useState("chat"); // "chat" | "members"
  const [open, setOpen]           = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  // Load own profile
  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  // Load contacts
  useEffect(() => {
    if (!session) return;
    supabase.from("contacts").select("contact_id, profiles!contacts_contact_id_fkey(username, avatar_color)")
      .eq("user_id", session.user.id)
      .then(({ data }) => setContacts(data || []));
  }, [session]);

  // Load last 50 messages sent after this user joined
  useEffect(() => {
    if (!profile) return;
    supabase.from("messages")
      .select("*")
      .gte("created_at", profile.created_at)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => setMessages(data || []));
  }, [profile]);

  // Realtime messages + presence
  useEffect(() => {
    if (!session || !profile) return;

    const channel = supabase.channel("global-chat", {
      config: { presence: { key: session.user.id } }
    });

    // Presence — deduplicate by user ID, exclude self
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

    // New messages
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      setMessages(prev => [...prev, payload.new]);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ username: profile.username, avatar_color: profile.avatar_color });
      }
    });

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [session, profile]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("profiles")
        .select("id, username, avatar_color")
        .ilike("username", `%${search}%`)
        .neq("id", session.user.id)
        .limit(5);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function sendMessage() {
    if (!input.trim() || !profile) return;
    await supabase.from("messages").insert({
      user_id:  session.user.id,
      username: profile.username,
      content:  input.trim(),
    });
    setInput("");
  }

  async function addContact(contactId) {
    await supabase.from("contacts").insert({ user_id: session.user.id, contact_id: contactId });
    const { data } = await supabase.from("contacts")
      .select("contact_id, profiles!contacts_contact_id_fkey(username, avatar_color)")
      .eq("user_id", session.user.id);
    setContacts(data || []);
    setSearch("");
    setSearchResults([]);
  }

  function avatarLetter(username) {
    return (username || "?")[0].toUpperCase();
  }

  function timeStr(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const isOnline = (userId) => online.some(p => p.username === userId);

  if (!open) return (
    <button className="chat-toggle" onClick={() => setOpen(true)}>
      <span>💬</span>
      {messages.length > 0 && <span className="chat-toggle-badge">{online.length}</span>}
    </button>
  );

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-tabs">
          <button className={`chat-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>Chat</button>
          <button className={`chat-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
            Members <span className="online-count">{online.length}</span>
          </button>
        </div>
        <button className="chat-search-btn" onClick={() => { setShowSearch(s => !s); setTab("chat"); }} title="Find member">
          🔍
        </button>
        <button className="chat-minimize" onClick={() => setOpen(false)}>−</button>
      </div>

      {tab === "chat" && (
        <>
          {/* Quick member search */}
          {showSearch && (
            <div className="chat-quicksearch">
              <input
                className="chat-search"
                placeholder="Search username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="chat-search-results">
                  {searchResults.map(u => (
                    <div key={u.id} className="chat-search-row">
                      <div className="chat-avatar sm" style={{ background: u.avatar_color }}>{avatarLetter(u.username)}</div>
                      <span>{u.username}</span>
                      <button className="chat-add-btn" onClick={() => { addContact(u.id); setShowSearch(false); }}>+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Who's online strip */}
          <div className="chat-online-strip">
            {online.length === 0 ? (
              <span className="chat-online-empty">No one else online</span>
            ) : (
              <>
                <span className="chat-online-label">Online:</span>
                {online.map((u, i) => (
                  <div key={i} className="chat-online-pill" title={u.username}>
                    <div className="chat-avatar" style={{ background: u.avatar_color || "#00b4ff", width: 22, height: 22, fontSize: "0.65rem" }}>
                      {avatarLetter(u.username)}
                    </div>
                    <span>{u.username}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.user_id === session.user.id ? "own" : ""}`}>
                <div className="chat-avatar" style={{ background: m.avatar_color || "#00b4ff" }}>
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
              placeholder="Message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage}>→</button>
          </div>
        </>
      )}

      {tab === "members" && (
        <div className="chat-members">
          {/* Search */}
          <div className="chat-search-wrap">
            <input
              className="chat-search"
              placeholder="Search username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="chat-search-results">
                {searchResults.map(u => (
                  <div key={u.id} className="chat-search-row">
                    <div className="chat-avatar sm" style={{ background: u.avatar_color }}>{avatarLetter(u.username)}</div>
                    <span>{u.username}</span>
                    <button className="chat-add-btn" onClick={() => addContact(u.id)}>+ Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Online now */}
          <p className="chat-section-label">Online Now</p>
          {online.map((u, i) => (
            <div key={i} className="chat-member-row">
              <div className="chat-avatar sm" style={{ background: u.avatar_color || "#00b4ff" }}>{avatarLetter(u.username)}</div>
              <span>{u.username}</span>
              <span className="online-dot" />
            </div>
          ))}

          {/* Contacts */}
          {contacts.length > 0 && (
            <>
              <p className="chat-section-label" style={{ marginTop: "1rem" }}>Contacts</p>
              {contacts.map(c => (
                <div key={c.contact_id} className="chat-member-row">
                  <div className="chat-avatar sm" style={{ background: c.profiles?.avatar_color || "#00b4ff" }}>
                    {avatarLetter(c.profiles?.username)}
                  </div>
                  <span>{c.profiles?.username}</span>
                  {isOnline(c.profiles?.username) && <span className="online-dot" />}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
