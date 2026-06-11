export default function Sparkline({ bars, ticker = "x" }) {
  if (!bars || bars.length < 2) return <div style={{ height: 42 }} />;

  const W = 120, H = 42, PAD = 2;
  const prices = bars.map(b => b.c);
  const lo     = Math.min(...prices);
  const hi     = Math.max(...prices);
  const range  = hi - lo || 1;

  const pts = bars.map((b, i) => {
    const x = PAD + (i / (bars.length - 1)) * (W - PAD * 2);
    const y = (H - PAD) - ((b.c - lo) / range) * (H - PAD * 2);
    return [x, y];
  });

  const polyline = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = [
    `${pts[0][0].toFixed(2)},${(H - PAD).toFixed(2)}`,
    ...pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`),
    `${pts[pts.length - 1][0].toFixed(2)},${(H - PAD).toFixed(2)}`,
  ].join(" ");

  const up    = prices[prices.length - 1] >= prices[0];
  const color = up ? "#00dc82" : "#ff3c50";
  const gId   = `sg-${ticker}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts[pts.length - 1][0].toFixed(2)}
        cy={pts[pts.length - 1][1].toFixed(2)}
        r="2.2"
        fill={color}
      />
    </svg>
  );
}
