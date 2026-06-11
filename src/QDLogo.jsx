export default function QDLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Blue — top arc highlight */}
        <linearGradient id="qdB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#a0ecff" />
          <stop offset="45%"  stopColor="#1aabf0" />
          <stop offset="100%" stopColor="#0044bb" />
        </linearGradient>

        {/* Silver — main arc body */}
        <linearGradient id="qdS" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c0c0c0" />
          <stop offset="30%"  stopColor="#eeeeee" />
          <stop offset="65%"  stopColor="#aaaaaa" />
          <stop offset="100%" stopColor="#707070" />
        </linearGradient>

        {/* Gold — left bar */}
        <linearGradient id="qdG1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f8e870" />
          <stop offset="40%"  stopColor="#d4a020" />
          <stop offset="100%" stopColor="#8a5c08" />
        </linearGradient>

        {/* Gold — right bar (slightly lighter face) */}
        <linearGradient id="qdG2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f0d858" />
          <stop offset="100%" stopColor="#b88018" />
        </linearGradient>

        {/* Clip to circle interior for bars */}
        <clipPath id="qdC">
          <circle cx="30" cy="26" r="14" />
        </clipPath>
      </defs>

      {/* ── Shadow ring (depth effect) ──────────────────────── */}
      <path d="M 13.1,32.2 A 18,18 0 0,1 39,10.4"
        stroke="rgba(0,0,0,0.35)" strokeWidth="9.5" strokeLinecap="round" />
      <path d="M 39,10.4 A 18,18 0 1,1 18.4,39.8"
        stroke="rgba(0,0,0,0.35)" strokeWidth="9.5" strokeLinecap="round" />

      {/* ── Silver arc — the large portion (1 o'clock → 7 o'clock CW) ── */}
      <path d="M 39,10.4 A 18,18 0 1,1 18.4,39.8"
        stroke="url(#qdS)" strokeWidth="7.5" strokeLinecap="round" />

      {/* ── Blue arc — top portion (8 o'clock → 1 o'clock CW through top) ── */}
      <path d="M 13.1,32.2 A 18,18 0 0,1 39,10.4"
        stroke="url(#qdB)" strokeWidth="7.5" strokeLinecap="round" />

      {/* ── Inner gold bars — clipped to circle interior ──── */}
      {/* Single shared rotation keeps both bars perfectly parallel */}
      <g clipPath="url(#qdC)" transform="rotate(28 30 27)">
        {/* Left bar */}
        <rect x="18.5" y="14" width="7" height="26" rx="2.5"
          fill="url(#qdG1)" />
        {/* Highlight stripe on left bar */}
        <rect x="19.5" y="14" width="2" height="26" rx="1"
          fill="rgba(255,255,255,0.22)" />
        {/* Right bar — same rotation context, shifted right */}
        <rect x="28" y="14" width="5.5" height="26" rx="2"
          fill="url(#qdG2)"
          opacity="0.9" />
      </g>
    </svg>
  );
}
