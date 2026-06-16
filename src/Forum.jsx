import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./Forum.css";

const CATEGORIES = [
  { id: "all",      label: "All",             icon: "🌐" },
  { id: "ai",       label: "AI & Machine Learning", icon: "🧠", color: "#22D3EE" },
  { id: "quantum",  label: "Quantum Computing",     icon: "⚛️", color: "#8B5CF6" },
  { id: "defence",  label: "Defence & Space",       icon: "🛡️", color: "#F59E0B" },
  { id: "biotech",  label: "Biotech & MedTech",     icon: "🧬", color: "#10B981" },
  { id: "general",  label: "General",               icon: "💬", color: "#6B7280" },
];

function catInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── New Post Form ──────────────────────────────────────────
function NewPostForm({ session, profile, onPosted, onCancel }) {
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [category, setCategory] = useState("general");
  const [ticker,   setTicker]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("forum_posts").insert({
      user_id:  session.user.id,
      username: profile.username,
      category,
      title:    title.trim(),
      body:     body.trim(),
      ticker:   ticker.trim().toUpperCase() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onPosted();
  }

  return (
    <form className="forum-new-post" onSubmit={submit}>
      <div className="fnp-header">
        <span className="fnp-title">New Post</span>
        <button type="button" className="fnp-cancel" onClick={onCancel}>✕</button>
      </div>

      <div className="fnp-cats">
        {CATEGORIES.filter(c => c.id !== "all").map(c => (
          <button key={c.id} type="button"
            className={`fnp-cat ${category === c.id ? "active" : ""}`}
            style={category === c.id ? { borderColor: c.color, color: c.color, background: c.color + "18" } : {}}
            onClick={() => setCategory(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <input className="fnp-input" placeholder="Title" value={title}
        onChange={e => setTitle(e.target.value)} maxLength={120} required />

      <textarea className="fnp-textarea" placeholder="What's on your mind? Share your thesis, analysis, or question..."
        value={body} onChange={e => setBody(e.target.value)} rows={5} required />

      <div className="fnp-footer">
        <input className="fnp-ticker" placeholder="Ticker (optional)" value={ticker}
          onChange={e => setTicker(e.target.value)} maxLength={10} />
        {error && <span className="fnp-error">{error}</span>}
        <button className="fnp-submit" type="submit" disabled={saving || !title.trim() || !body.trim()}>
          {saving ? "Posting…" : "Post →"}
        </button>
      </div>
    </form>
  );
}

// ── Post Detail (with comments) ────────────────────────────
function PostDetail({ post, session, profile, isMod, onBack, onDeleted }) {
  const [comments, setComments] = useState([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [voted,    setVoted]    = useState(false);
  const [upvotes,  setUpvotes]  = useState(post.upvotes);
  const bottomRef = useRef(null);
  const cat = catInfo(post.category);

  useEffect(() => {
    loadComments();
    checkVote();

    const sub = supabase.channel(`forum-comments-${post.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_comments",
        filter: `post_id=eq.${post.id}` }, payload => {
        setComments(prev => prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new]);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [post.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function loadComments() {
    const { data } = await supabase.from("forum_comments")
      .select("*").eq("post_id", post.id).order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function checkVote() {
    const { data } = await supabase.from("forum_votes")
      .select("id").eq("post_id", post.id).eq("user_id", session.user.id).maybeSingle();
    setVoted(!!data);
  }

  async function toggleVote() {
    if (voted) {
      await supabase.from("forum_votes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
      await supabase.from("forum_posts").update({ upvotes: Math.max(0, upvotes - 1) }).eq("id", post.id);
      setUpvotes(v => Math.max(0, v - 1));
      setVoted(false);
    } else {
      await supabase.from("forum_votes").insert({ post_id: post.id, user_id: session.user.id });
      await supabase.from("forum_posts").update({ upvotes: upvotes + 1 }).eq("id", post.id);
      setUpvotes(v => v + 1);
      setVoted(true);
    }
  }

  async function sendComment() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await supabase.from("forum_comments").insert({
      post_id:  post.id,
      user_id:  session.user.id,
      username: profile.username,
      body:     text,
    });
    setSending(false);
  }

  async function deletePost() {
    if (!window.confirm("Delete this post?")) return;
    await supabase.from("forum_posts").delete().eq("id", post.id);
    onDeleted();
  }

  async function deleteComment(id) {
    await supabase.from("forum_comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  async function togglePin() {
    await supabase.from("forum_posts").update({ pinned: !post.pinned }).eq("id", post.id);
    onBack();
  }

  const canDelete = isMod || post.user_id === session.user.id;

  return (
    <div className="forum-detail">
      <button className="forum-back" onClick={onBack}>← Back to posts</button>

      <div className="fd-post">
        <div className="fd-meta">
          <span className="fd-cat" style={{ color: cat.color, background: cat.color + "18", borderColor: cat.color + "35" }}>
            {cat.icon} {cat.label}
          </span>
          {post.ticker && <span className="fd-ticker">${post.ticker}</span>}
          {post.pinned && <span className="fd-pinned">📌 Pinned</span>}
          <span className="fd-time">{timeAgo(post.created_at)}</span>
          <span className="fd-author">by {post.username}</span>
        </div>

        <h2 className="fd-title">{post.title}</h2>
        <p className="fd-body">{post.body}</p>

        <div className="fd-actions">
          <button className={`fd-vote ${voted ? "voted" : ""}`} onClick={toggleVote}>
            ▲ {upvotes}
          </button>
          <span className="fd-comment-count">💬 {post.comment_count} comments</span>
          {isMod && (
            <button className="fd-mod-btn" onClick={togglePin}>
              {post.pinned ? "📌 Unpin" : "📌 Pin"}
            </button>
          )}
          {canDelete && (
            <button className="fd-mod-btn danger" onClick={deletePost}>Delete post</button>
          )}
        </div>
      </div>

      <div className="fd-comments">
        <div className="fd-comments-label">{comments.length} {comments.length === 1 ? "Reply" : "Replies"}</div>

        {comments.length === 0 && (
          <div className="fd-no-comments">No replies yet — be the first to respond.</div>
        )}

        {comments.map(c => (
          <div key={c.id} className="fd-comment">
            <div className="fd-comment-meta">
              <span className="fd-comment-author">{c.username}</span>
              <span className="fd-comment-time">{timeAgo(c.created_at)}</span>
              {(isMod || c.user_id === session.user.id) && (
                <button className="fd-comment-delete" onClick={() => deleteComment(c.id)}>✕</button>
              )}
            </div>
            <p className="fd-comment-body">{c.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fd-reply-row">
        <input className="fd-reply-input" placeholder="Write a reply…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendComment()}
        />
        <button className="fd-reply-send" onClick={sendComment} disabled={sending || !input.trim()}>→</button>
      </div>
    </div>
  );
}

// ── Post Row ───────────────────────────────────────────────
function PostRow({ post, onClick }) {
  const cat = catInfo(post.category);
  return (
    <div className={`forum-post-row ${post.pinned ? "pinned" : ""}`} onClick={onClick}>
      {post.pinned && <span className="fpr-pin">📌</span>}
      <div className="fpr-votes">
        <span className="fpr-vote-count">{post.upvotes}</span>
        <span className="fpr-vote-label">▲</span>
      </div>
      <div className="fpr-main">
        <div className="fpr-meta">
          <span className="fpr-cat" style={{ color: cat.color, background: cat.color + "15" }}>
            {cat.icon} {cat.label}
          </span>
          {post.ticker && <span className="fpr-ticker">${post.ticker}</span>}
        </div>
        <div className="fpr-title">{post.title}</div>
        <div className="fpr-sub">
          <span>{post.username}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span>·</span>
          <span>💬 {post.comment_count}</span>
        </div>
      </div>
    </div>
  );
}

const SORTS = [
  { id: "top",  icon: "🔥", label: "Top Posts"    },
  { id: "new",  icon: "✨", label: "Newest"        },
  { id: "most", icon: "💬", label: "Most Replied"  },
];

// ── Main Forum ─────────────────────────────────────────────
export default function Forum({ session, onClose }) {
  const [profile,    setProfile]    = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [cat,        setCat]        = useState("all");
  const [sort,       setSort]       = useState("top");
  const [activePost, setActivePost] = useState(null);
  const [showNew,    setShowNew]    = useState(false);
  const [loading,    setLoading]    = useState(true);

  const isMod = profile?.is_moderator === true;

  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  useEffect(() => { loadPosts(); }, [cat, sort]);

  async function loadPosts() {
    setLoading(true);
    let q = supabase.from("forum_posts").select("*").order("pinned", { ascending: false });
    if (sort === "top")  q = q.order("upvotes",       { ascending: false });
    if (sort === "new")  q = q.order("created_at",    { ascending: false });
    if (sort === "most") q = q.order("comment_count", { ascending: false });
    if (cat !== "all")   q = q.eq("category", cat);
    const { data } = await q.limit(60);
    setPosts(data || []);
    setLoading(false);
  }

  if (activePost) return (
    <div className="forum-overlay-inner">
      <PostDetail
        post={activePost}
        session={session}
        profile={profile}
        isMod={isMod}
        onBack={() => { setActivePost(null); loadPosts(); }}
        onDeleted={() => { setActivePost(null); loadPosts(); }}
      />
    </div>
  );

  return (
    <div className="forum-page">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="forum-page-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4rem" }}>
          {/* Albin portrait — cropped from left half of founders.png */}
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{
              width: 150, height: 170, borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(245,158,11,.4)",
              boxShadow: "0 0 28px rgba(245,158,11,.18)",
              marginBottom: "0.6rem",
            }}>
              <img src="/founders.png" alt="Albin"
                style={{ width: "200%", height: "130%", objectFit: "cover", objectPosition: "5% 5%", display: "block" }}
              />
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: ".62rem", color: "#f59e0b", lineHeight: 1.5, maxWidth: 130, margin: "0 auto", fontStyle: "italic" }}>
              "Not talking about money is the first step to losing money."
            </p>
          </div>
          <div>
            <div className="forum-eyebrow">QuantDiver Community</div>
            <h2 className="forum-title">Albin's Community</h2>
          </div>
        </div>
        <div className="forum-header-actions">
          <button className="forum-new-btn" onClick={() => setShowNew(v => !v)}>
            {showNew ? "✕ Cancel" : "+ New Post"}
          </button>
          <button className="forum-close" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {/* ── New post form ─────────────────────────────── */}
      {showNew && profile && (
        <NewPostForm
          session={session}
          profile={profile}
          onPosted={() => { setShowNew(false); loadPosts(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* ── Two-column layout ────────────────────────── */}
      <div className="forum-layout">

        {/* Sidebar */}
        <aside className="forum-sidebar">

          <div className="fsb-section">
            <div className="fsb-label">Sort by</div>
            {SORTS.map(s => (
              <button key={s.id}
                className={`fsb-item ${sort === s.id ? "active" : ""}`}
                onClick={() => setSort(s.id)}
              >
                <span className="fsb-item-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          <div className="fsb-section">
            <div className="fsb-label">Category</div>
            {CATEGORIES.map(c => (
              <button key={c.id}
                className={`fsb-item ${cat === c.id ? "active" : ""}`}
                style={cat === c.id && c.color ? { color: c.color, borderColor: c.color + "40", background: c.color + "12" } : {}}
                onClick={() => setCat(c.id)}
              >
                <span className="fsb-item-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

        </aside>

        {/* Post list */}
        <main className="forum-main">
          <div className="forum-list">
            {loading && <div className="forum-loading">Loading…</div>}
            {!loading && posts.length === 0 && (
              <div className="forum-empty">
                <div className="forum-empty-icon">💬</div>
                <p>No posts yet in this category.</p>
                <button className="forum-new-btn" onClick={() => setShowNew(true)}>Be the first to post →</button>
              </div>
            )}
            {posts.map(p => (
              <PostRow key={p.id} post={p} onClick={() => setActivePost(p)} />
            ))}
          </div>
        </main>

      </div>
    </div>
  );
}
