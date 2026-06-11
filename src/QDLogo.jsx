export default function QDLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qd-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60d8ff" />
          <stop offset="60%" stopColor="#0099ee" />
          <stop offset="100%" stopColor="#0055bb" />
        </linearGradient>
        <linearGradient id="qd-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8c8c8" />
          <stop offset="50%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>
        <linearGradient id="qd-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e080" />
          <stop offset="50%" stopColor="#d4a020" />
          <stop offset="100%" stopColor="#a07010" />
        </linearGradient>
        <linearGradient id="qd-gold2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0d060" />
          <stop offset="100%" stopColor="#c09020" />
        </linearGradient>
      </defs>

      {/* ── Outer ring ── */}
      {/* Blue arc — sweeps the long way from lower-left gap, up and around through top to lower-right */}
      <path
        d="M 7,31 A 17,17 0 1,1 37,31"
        stroke="url(#qd-blue)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Silver arc — short lower arc connecting right back to left (the bottom of the Q) */}
      <path
        d="M 37,31 A 17,17 0 0,1 7,31"
        stroke="url(#qd-silver)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* ── Inner diagonal bars (the "diver" marks) ── */}
      <line x1="17" y1="13" x2="23" y2="33" stroke="url(#qd-gold)"  strokeWidth="4.5" strokeLinecap="round" />
      <line x1="22" y1="12" x2="28" y2="32" stroke="url(#qd-gold2)" strokeWidth="3"   strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}
