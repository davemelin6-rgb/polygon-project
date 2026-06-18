import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./Forum.css";

const CATEGORIES = [
  { id: "all",      label: "All",                  icon: "🌐" },
  { id: "ai",       label: "AI & Machine Learning", icon: "🧠", color: "#22D3EE" },
  { id: "quantum",  label: "Quantum Computing",     icon: "⚛️", color: "#8B5CF6" },
  { id: "defence",  label: "Defence & Space",       icon: "🛡️", color: "#F59E0B" },
  { id: "biotech",  label: "Biotech & MedTech",     icon: "🧬", color: "#10B981" },
  { id: "general",  label: "General",               icon: "💬", color: "#6B7280" },
];

const SORTS = [
  { id: "top",  icon: "🔥", label: "Top Posts"   },
  { id: "new",  icon: "✨", label: "Newest"       },
  { id: "most", icon: "💬", label: "Most Replied" },
];

function catInfo(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getContributorRank(postCount = 0) {
  if (postCount >= 100) return { label: "Top Contributor", color: "#f59e0b", icon: "⭐" };
  if (postCount >= 50)  return { label: "Contributor",     color: "#00b4ff", icon: "🔵" };
  if (postCount >= 10)  return { label: "Active",          color: "#00dc82", icon: "✓"  };
  return                       { label: "Member",          color: "#3d5c78", icon: ""   };
}

function RankBadge({ postCount }) {
  const r = getContributorRank(postCount);
  if (!r.icon) return null;
  return (
    <span style={{
      fontSize: ".62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4,
      background: r.color + "18", color: r.color, border: `1px solid ${r.color}30`,
      letterSpacing: ".08em", textTransform: "uppercase",
    }}>
      {r.icon} {r.label}
    </span>
  );
}

// ── New Post Form ───────────────────────────────────────────
function NewPostForm({ session, profile, forumType, onPosted, onCancel }) {
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
      user_id:   session.user.id,
      username:  profile.username,
      category,
      title:     title.trim(),
      body:      body.trim(),
      ticker:    ticker.trim().toUpperCase() || null,
      forum_type: forumType,
    });
    if (!err) {
      // Increment post count
      await supabase.from("profiles")
        .update({ post_count: (profile.post_count || 0) + 1 })
        .eq("id", session.user.id);
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onPosted();
  }

  return (
    <form className="forum-new-post" onSubmit={submit}>
      <div className="fnp-header">
        <span className="fnp-title">New Post — {forumType === "pro" ? "Pro Forum" : "BriefMe Forum"}</span>
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
      <textarea className="fnp-textarea" placeholder="Share your thesis, analysis, or question…"
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

// ── Post Detail ─────────────────────────────────────────────
function PostDetail({ post, session, profile, isMod, onBack, onDeleted }) {
  const [comments,   setComments]   = useState([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [myRating,   setMyRating]   = useState(null); // null | 'useful' | 'very_useful'
  const [usefulCnt,  setUsefulCnt]  = useState(post.useful_count || 0);
  const [vUsefulCnt, setVUsefulCnt] = useState(post.very_useful_count || 0);
  const bottomRef = useRef(null);
  const cat = catInfo(post.category);

  useEffect(() => {
    loadComments();
    checkMyRating();
    const sub = supabase.channel(`forum-comments-${post.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_comments",
        filter: `post_id=eq.${post.id}` }, payload => {
        setComments(prev => prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new]);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [post.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);

  async function loadComments() {
    const { data } = await supabase.from("forum_comments")
      .select("*").eq("post_id", post.id).order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function checkMyRating() {
    const { data } = await supabase.from("forum_post_ratings")
      .select("rating").eq("post_id", post.id).eq("user_id", session.user.id).maybeSingle();
    setMyRating(data?.rating || null);
  }

  async function rate(rating) {
    if (myRating === rating) {
      // Remove rating
      await supabase.from("forum_post_ratings").delete()
        .eq("post_id", post.id).eq("user_id", session.user.id);
      if (rating === "useful")      { await supabase.from("forum_posts").update({ useful_count: Math.max(0, usefulCnt - 1) }).eq("id", post.id); setUsefulCnt(v => Math.max(0, v - 1)); }
      if (rating === "very_useful") { await supabase.from("forum_posts").update({ very_useful_count: Math.max(0, vUsefulCnt - 1) }).eq("id", post.id); setVUsefulCnt(v => Math.max(0, v - 1)); }
      setMyRating(null);
    } else {
      // Remove old rating if any
      if (myRating) {
        await supabase.from("forum_post_ratings").delete().eq("post_id", post.id).eq("user_id", session.user.id);
        if (myRating === "useful")      { await supabase.from("forum_posts").update({ useful_count: Math.max(0, usefulCnt - 1) }).eq("id", post.id); setUsefulCnt(v => Math.max(0, v - 1)); }
        if (myRating === "very_useful") { await supabase.from("forum_posts").update({ very_useful_count: Math.max(0, vUsefulCnt - 1) }).eq("id", post.id); setVUsefulCnt(v => Math.max(0, v - 1)); }
      }
      // Add new rating
      await supabase.from("forum_post_ratings").upsert({ post_id: post.id, user_id: session.user.id, rating }, { onConflict: "post_id,user_id" });
      if (rating === "useful")      { await supabase.from("forum_posts").update({ useful_count: usefulCnt + 1 }).eq("id", post.id); setUsefulCnt(v => v + 1); }
      if (rating === "very_useful") { await supabase.from("forum_posts").update({ very_useful_count: vUsefulCnt + 1 }).eq("id", post.id); setVUsefulCnt(v => v + 1); }
      setMyRating(rating);
    }
  }

  async function sendComment() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await supabase.from("forum_comments").insert({
      post_id: post.id, user_id: session.user.id,
      username: profile.username, body: text,
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
          <button
            className={`fd-vote ${myRating === "very_useful" ? "voted" : ""}`}
            onClick={() => rate("very_useful")}
            title="Very Useful"
          >
            🔥 {vUsefulCnt}
          </button>
          <button
            className={`fd-vote ${myRating === "useful" ? "voted" : ""}`}
            onClick={() => rate("useful")}
            title="Useful"
          >
            👍 {usefulCnt}
          </button>
          <span className="fd-comment-count">💬 {post.comment_count} comments</span>
          {isMod && <button className="fd-mod-btn" onClick={togglePin}>{post.pinned ? "📌 Unpin" : "📌 Pin"}</button>}
          {canDelete && <button className="fd-mod-btn danger" onClick={deletePost}>Delete post</button>}
        </div>
      </div>

      <div className="fd-comments">
        <div className="fd-comments-label">{comments.length} {comments.length === 1 ? "Reply" : "Replies"}</div>
        {comments.length === 0 && <div className="fd-no-comments">No replies yet — be the first to respond.</div>}
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

// ── Post Row ────────────────────────────────────────────────
function PostRow({ post, onClick }) {
  const cat = catInfo(post.category);
  const usefulScore = (post.very_useful_count || 0) * 2 + (post.useful_count || 0);
  return (
    <div className={`forum-post-row ${post.pinned ? "pinned" : ""}`} onClick={onClick}>
      {post.pinned && <span className="fpr-pin">📌</span>}
      <div className="fpr-votes">
        {post.very_useful_count > 0 && <span style={{ fontSize: ".75rem", color: "#f59e0b" }}>🔥{post.very_useful_count}</span>}
        {post.useful_count > 0      && <span style={{ fontSize: ".75rem", color: "#00b4ff" }}>👍{post.useful_count}</span>}
        {usefulScore === 0          && <span className="fpr-vote-count" style={{ color: "#2a4060" }}>—</span>}
      </div>
      <div className="fpr-main">
        <div className="fpr-meta">
          <span className="fpr-cat" style={{ color: cat.color, background: cat.color + "15" }}>
            {cat.icon} {cat.label}
          </span>
          {post.ticker && <span className="fpr-ticker">${post.ticker}</span>}
          {usefulScore >= 10 && (
            <span style={{ fontSize: ".62rem", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 4, padding: "1px 6px" }}>
              🔥 Very Useful
            </span>
          )}
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

// ── Access Gate ─────────────────────────────────────────────
function AccessGate({ onEnterApp }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
      <h3 style={{ color: "#dce8f4", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.75rem" }}>
        Pro Members Only
      </h3>
      <p style={{ color: "#4a6a88", fontSize: ".9rem", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 1.5rem" }}>
        The Pro Forum is exclusively for Pro subscribers. Upgrade to join the conversation and access deeper market analysis.
      </p>
      <button
        onClick={() => onEnterApp?.("plan", "pro")}
        style={{ background: "linear-gradient(135deg,#00b4ff,#1a6bcc)", border: "none", color: "#fff", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontFamily: "inherit", fontSize: ".88rem", fontWeight: 700 }}
      >
        Upgrade to Pro →
      </button>
    </div>
  );
}

// ── Main Forum ──────────────────────────────────────────────
export default function Forum({ session, onClose, onEnterApp }) {
  const [profile,    setProfile]    = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [cat,        setCat]        = useState("all");
  const [sort,       setSort]       = useState("top");
  const [forumType,  setForumType]  = useState("pro");
  const [activePost, setActivePost] = useState(null);
  const [showNew,    setShowNew]    = useState(false);
  const [loading,    setLoading]    = useState(true);

  const isMod     = profile?.is_moderator === true;
  const userPlan  = session?.user?.user_metadata?.plan || null;
  const canAccess = forumType === "briefme" || userPlan === "pro" || isMod;

  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  useEffect(() => { if (canAccess) loadPosts(); }, [cat, sort, forumType, canAccess]);

  async function loadPosts() {
    setLoading(true);
    let q = supabase.from("forum_posts").select("*")
      .eq("forum_type", forumType)
      .order("pinned", { ascending: false });
    if (sort === "top")       q = q.order("very_useful_count", { ascending: false }).order("useful_count", { ascending: false });
    else if (sort === "new")  q = q.order("created_at",    { ascending: false });
    else if (sort === "most") q = q.order("comment_count", { ascending: false });
    if (cat !== "all") q = q.eq("category", cat);
    const { data } = await q.limit(60);
    setPosts(data || []);
    setLoading(false);
  }

  if (activePost) return (
    <div className="forum-overlay-inner">
      <PostDetail
        post={activePost} session={session} profile={profile} isMod={isMod}
        onBack={() => { setActivePost(null); loadPosts(); }}
        onDeleted={() => { setActivePost(null); loadPosts(); }}
      />
    </div>
  );

  return (
    <div className="forum-page">

      {/* Header */}
      <div className="forum-page-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4rem" }}>
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{
              width: 150, height: 170, borderRadius: "50%",
              border: "2px solid rgba(245,158,11,.4)",
              boxShadow: "0 0 28px rgba(245,158,11,.18)",
              marginBottom: "0.6rem",
              backgroundImage: "url('/founders.png')",
              backgroundSize: "210% auto",
              backgroundPosition: "12% 8%",
              backgroundRepeat: "no-repeat",
            }} />
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: ".82rem", color: "#f59e0b", lineHeight: 1.5, maxWidth: 150, margin: "0 auto", fontStyle: "italic" }}>
              "Not talking about money is the first step to losing money."
            </p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: ".72rem", fontWeight: 600, color: "#4a6a88", margin: "0.5rem auto 0", maxWidth: 150, textAlign: "center", letterSpacing: "0.04em" }}>
              Albin Matsson<br />
              <span style={{ color: "#2a4060", fontWeight: 500 }}>Co-founder, QuantDiver</span>
            </p>
          </div>
          <div>
            <div className="forum-eyebrow">QuantDiver Community</div>
            <h2 className="forum-title">Albin's Community</h2>
            {profile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: ".75rem", color: "#3d5c78" }}>{profile.username}</span>
                <RankBadge postCount={profile.post_count || 0} />
              </div>
            )}
          </div>
        </div>
        <div className="forum-header-actions">
          <button className="forum-new-btn" onClick={() => setShowNew(v => !v)}>
            {showNew ? "✕ Cancel" : "+ New Post"}
          </button>
          <button className="forum-close" onClick={onClose}>← Return to Dashboard</button>
        </div>
      </div>

      {/* Forum type tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: "1.5rem" }}>
        {[
          { id: "pro",     label: "🏆 Pro Forum",     sub: "Pro members only"       },
          { id: "briefme", label: "☀️ BriefMe Forum", sub: "BriefMe & above"        },
        ].map(t => (
          <button key={t.id} onClick={() => { setForumType(t.id); setShowNew(false); }} style={{
            padding: "0.7rem 1.4rem", background: "none", border: "none",
            borderBottom: forumType === t.id ? "2px solid #00b4ff" : "2px solid transparent",
            color: forumType === t.id ? "#e2e8f0" : "#3d5c78",
            cursor: "pointer", fontFamily: "inherit", fontSize: ".85rem", fontWeight: 600,
            marginBottom: -1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
          }}>
            {t.label}
            <span style={{ fontSize: ".62rem", color: forumType === t.id ? "#4a6a88" : "#2a4060" }}>{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Access gate for non-Pro trying to access Pro forum */}
      {!canAccess && <AccessGate onEnterApp={onEnterApp} />}

      {canAccess && (
        <>
          {showNew && profile && (
            <NewPostForm
              session={session} profile={profile} forumType={forumType}
              onPosted={() => { setShowNew(false); loadPosts(); setProfile(p => ({ ...p, post_count: (p?.post_count || 0) + 1 })); }}
              onCancel={() => setShowNew(false)}
            />
          )}

          <div className="forum-layout">
            <aside className="forum-sidebar">
              <div className="fsb-section">
                <div className="fsb-label">Sort by</div>
                {SORTS.map(s => (
                  <button key={s.id} className={`fsb-item ${sort === s.id ? "active" : ""}`} onClick={() => setSort(s.id)}>
                    <span className="fsb-item-icon">{s.icon}</span>{s.label}
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
                    <span className="fsb-item-icon">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
              {/* Rank legend */}
              <div className="fsb-section" style={{ marginTop: "0.5rem" }}>
                <div className="fsb-label">Contributor Ranks</div>
                {[
                  { icon: "⭐", label: "Top Contributor", sub: "100+ posts", color: "#f59e0b" },
                  { icon: "🔵", label: "Contributor",     sub: "50+ posts",  color: "#00b4ff" },
                  { icon: "✓",  label: "Active",          sub: "10+ posts",  color: "#00dc82" },
                  { icon: "",   label: "Member",          sub: "0-9 posts",  color: "#3d5c78" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: ".75rem" }}>
                    <span style={{ color: r.color, minWidth: 14 }}>{r.icon}</span>
                    <span style={{ color: "#6a8aac" }}>{r.label}</span>
                    <span style={{ color: "#2a4060", marginLeft: "auto" }}>{r.sub}</span>
                  </div>
                ))}
              </div>
            </aside>

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
        </>
      )}
    </div>
  );
}
