import { useState, useEffect } from "react";

const SECTORS = {
  IONQ: "quantum", RGTI: "quantum", QUBT: "quantum", IBM: "quantum",
  NVDA: "ai",  AMD: "ai",   META: "ai",   MSFT: ["quantum","ai"], PLTR: "ai",   AI: "ai",   SMCI: "ai",
  GOOGL: "quantum",
  LMT: "defence", RTX: "defence", NOC: "defence", GD: "defence", RKLB: "defence", ASTS: "defence", KTOS: "defence",
  LLY: "biotech",  NVO: "biotech", MRNA: "biotech", REGN: "biotech", VRTX: "biotech", GILD: "biotech", ISRG: "biotech",
};

const SECTOR_NAMES = { quantum: "Quantum", ai: "AI", defence: "Defence & Space", biotech: "Biotech" };

const DIMS = [
  { key: "signal",    label: "Signal",    color: "#00b4ff" },
  { key: "momentum",  label: "Momentum",  color: "#00dc82" },
  { key: "risk",      label: "Risk",      color: "#f59e0b" },
  { key: "techValue", label: "Tech Value",color: "#8b5cf6" },
];

function ordinal(n) {
  if (n == null) return "—";
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function sign(n) { return n > 0 ? "+" : ""; }

function ZBar({ z }) {
  if (z == null) return <span style={{ color: "#2a4060", fontSize: ".75rem" }}>—</span>;
  const color = z >= 1 ? "#00dc82" : z >= 0 ? "#00b4ff" : z >= -1 ? "#f59e0b" : "#ff3c50";
  const label = z >= 1.5 ? "Elite" : z >= 0.5 ? "Above avg" : z >= -0.5 ? "Average" : z >= -1.5 ? "Below avg" : "Lagging";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: `${Math.min(100, Math.max(2, (z + 3) / 6 * 100))}%`, transition: "width .6s ease" }} />
      </div>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color, fontWeight: 700, minWidth: 70, textAlign: "right" }}>{label}</span>
    </div>
  );
}

export default function SectorRanking({ stock, session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const rawSector = SECTORS[stock?.symbol];
  const sector    = Array.isArray(rawSector) ? rawSector[0] : rawSector;

  useEffect(() => {
    if (!stock?.symbol || !sector) return;
    setData(null);
    setLoading(true);
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    fetch(`/api/sector-scores?sector=${sector}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(j => setData(j))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stock?.symbol, sector, session]);

  if (!sector) return null;
  if (loading) return (
    <section className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-eyebrow">Sector Analysis</div>
      <p style={{ color: "#2a4060", fontSize: ".85rem", marginTop: "1rem" }}>Loading peer data…</p>
    </section>
  );
  if (!data) return (
    <section className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-eyebrow">Sector Analysis</div>
      <p style={{ color: "#ff3c50", fontSize: ".85rem", marginTop: "1rem" }}>Could not load sector data — check API or auth.</p>
    </section>
  );

  const me      = data.tickers?.find(t => t.symbol === stock.symbol);
  const peers   = data.tickers?.filter(t => t.symbol !== stock.symbol) || [];
  const total   = data.tickers?.length || 1;
  const stats   = data.stats || {};

  if (!me) return null;

  return (
    <section className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-eyebrow">Sector Analysis · {SECTOR_NAMES[sector]}</div>
        <h2 className="panel-title">Peer Ranking</h2>
      </div>

      {/* Hero rank strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: "2rem" }}>
        {DIMS.map(d => {
          const rankVal  = me.ranks?.[d.key];
          const pctVal   = me.percentiles?.[d.key];
          const deltaVal = me.deltas?.[d.key];
          const score    = me[d.key];
          return (
            <div key={d.key} style={{ background: "rgba(5,10,18,0.95)", padding: "1.1rem 1.25rem" }}>
              <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#3d5c78", marginBottom: 6 }}>{d.label}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "1.5rem", fontWeight: 700, color: d.color, lineHeight: 1 }}>
                {score ?? "—"}
              </div>
              <div style={{ marginTop: 6, fontSize: ".72rem", color: "#3d5c78" }}>
                {rankVal != null ? <><span style={{ color: d.color, fontWeight: 700 }}>{ordinal(rankVal)}</span> of {total}</> : "—"}
              </div>
              {deltaVal != null && (
                <div style={{ marginTop: 3, fontSize: ".7rem", fontFamily: "'Space Mono',monospace", color: deltaVal >= 0 ? "#00dc82" : "#ff3c50", fontWeight: 700 }}>
                  {sign(deltaVal)}{deltaVal} vs avg
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Z-score breakdown */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1rem" }}>
          vs Sector Peers
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {DIMS.map(d => (
            <div key={d.key} style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: d.color }}>{d.label}</span>
              <ZBar z={me.zScores?.[d.key]} />
            </div>
          ))}
        </div>
      </div>

      {/* Sector leaderboard */}
      <div>
        <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#3d5c78", marginBottom: "1rem" }}>
          {SECTOR_NAMES[sector]} · Signal Leaderboard
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {data.tickers?.map((t, i) => {
            const isMe = t.symbol === stock.symbol;
            return (
              <div key={t.symbol} style={{
                display: "grid", gridTemplateColumns: "28px 1fr 48px 48px 48px 56px",
                alignItems: "center", gap: "0.75rem",
                padding: "0.65rem 0.9rem",
                borderRadius: 8,
                background: isMe ? "rgba(0,180,255,0.07)" : "transparent",
                border: isMe ? "1px solid rgba(0,180,255,0.2)" : "1px solid transparent",
                transition: "background .15s",
              }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#2a4060" }}>{i + 1}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".85rem", fontWeight: 700, color: isMe ? "#00b4ff" : "#5a7a9a" }}>{t.symbol}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".75rem", color: "#00dc82", textAlign: "right" }}>{t.momentum ?? "—"}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".75rem", color: "#f59e0b", textAlign: "right" }}>{t.risk ?? "—"}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".75rem", color: "#8b5cf6", textAlign: "right" }}>{t.techValue ?? "—"}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".82rem", fontWeight: 700, color: "#00b4ff", textAlign: "right" }}>{t.signal ?? "—"}</span>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 48px 48px 48px 56px", gap: "0.75rem", padding: "0.5rem 0.9rem", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 4 }}>
            <span />
            <span style={{ fontSize: ".62rem", color: "#2a4060", letterSpacing: ".08em", textTransform: "uppercase" }}>Sector avg</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#2a4060", textAlign: "right" }}>{stats.momentum?.avg ?? "—"}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#2a4060", textAlign: "right" }}>{stats.risk?.avg ?? "—"}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#2a4060", textAlign: "right" }}>{stats.techValue?.avg ?? "—"}</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: ".72rem", color: "#2a4060", textAlign: "right" }}>{stats.signal?.avg ?? "—"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", paddingLeft: "0.9rem" }}>
          {[["MOM","#00dc82"],["RISK","#f59e0b"],["TECH","#8b5cf6"],["SIG","#00b4ff"]].map(([l,c]) => (
            <span key={l} style={{ fontSize: ".62rem", color: c, fontWeight: 700, letterSpacing: ".1em" }}>{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
