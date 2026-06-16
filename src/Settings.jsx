import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Settings.css";

const ACCENTS = [
  { key: "blue",   label: "Blue",   color: "#00b4ff" },
  { key: "teal",   label: "Teal",   color: "#00dc82" },
  { key: "purple", label: "Purple", color: "#7c3aed" },
];

const AVATAR_COLORS = [
  "#00b4ff", "#00dc82", "#7c3aed", "#f59e0b",
  "#ff3c50", "#e67e22", "#e91e8c", "#06b6d4",
];

const TRADING_INTEREST_OPTIONS = [
  { id: "ai",       label: "AI & Machine Learning", icon: "🧠" },
  { id: "quantum",  label: "Quantum Computing",      icon: "⚛️" },
  { id: "defence",  label: "Defence & Space",        icon: "🛡️" },
  { id: "biotech",  label: "Biotech & MedTech",      icon: "🧬" },
];

export default function Settings({ session, profile, settings, onSave, onClose }) {
  const [brightness,       setBrightness]      = useState(settings.brightness      || "dark");
  const [accent,           setAccent]          = useState(settings.accent          || "blue");
  const [avatarColor,      setAvatarColor]     = useState(settings.avatarColor     || profile?.avatar_color || "#00b4ff");
  const [defaultTickers,   setDefaultTickers]  = useState(settings.defaultTickers  || "AAPL,MSFT,NVDA,GOOGL,AMZN");
  const [interests,        setInterests]       = useState(profile?.trading_interests || []);
  const [saving,           setSaving]          = useState(false);

  function toggleInterest(id) {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  async function handleSave() {
    setSaving(true);
    const newSettings = { brightness, accent, avatarColor, defaultTickers };
    await supabase.from("profiles")
      .update({ settings: newSettings, avatar_color: avatarColor, trading_interests: interests })
      .eq("id", session.user.id);
    onSave(newSettings, avatarColor);
    setSaving(false);
    onClose();
  }

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">

          {/* Brightness */}
          <div className="settings-section">
            <p className="settings-label">Display Brightness</p>
            <div className="settings-row-btns">
              {["dark", "balanced", "bright"].map(b => (
                <button
                  key={b}
                  className={`settings-opt-btn ${brightness === b ? "active" : ""}`}
                  onClick={() => setBrightness(b)}
                >
                  {b === "dark" ? "🌑 Dark" : b === "balanced" ? "🌗 Balanced" : "🌕 Bright"}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div className="settings-section">
            <p className="settings-label">Accent Color</p>
            <div className="settings-row-btns">
              {ACCENTS.map(a => (
                <button
                  key={a.key}
                  className={`settings-opt-btn ${accent === a.key ? "active" : ""}`}
                  style={accent === a.key ? { borderColor: a.color, color: a.color } : {}}
                  onClick={() => setAccent(a.key)}
                >
                  <span style={{ color: a.color }}>●</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar color */}
          <div className="settings-section">
            <p className="settings-label">Avatar Color</p>
            <div className="settings-avatar-grid">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  className={`settings-avatar-swatch ${avatarColor === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
            <div className="settings-avatar-preview">
              <div className="settings-avatar-circle" style={{ background: avatarColor }}>
                {(profile?.username || "?")[0].toUpperCase()}
              </div>
              <span>{profile?.username}</span>
            </div>
          </div>

          {/* Default watchlist */}
          <div className="settings-section">
            <p className="settings-label">Default Watchlist</p>
            <p className="settings-hint">Comma-separated tickers, loaded on every login</p>
            <input
              className="settings-input"
              value={defaultTickers}
              onChange={e => setDefaultTickers(e.target.value.toUpperCase())}
              placeholder="AAPL,MSFT,NVDA,GOOGL,AMZN"
            />
          </div>

          {/* Trading interests */}
          <div className="settings-section">
            <p className="settings-label">Trading Interests</p>
            <p className="settings-hint">Used to match you with traders who share your focus</p>
            <div className="settings-interests">
              {TRADING_INTEREST_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`settings-interest-btn ${interests.includes(opt.id) ? "active" : ""}`}
                  onClick={() => toggleInterest(opt.id)}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="settings-footer">
          <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
