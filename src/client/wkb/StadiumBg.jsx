// Night stadium behind every page: black sky on top, stands and bright light towers in the lower half.
function crowd(seed, rows, y0, y1, xPad) {
  const dots = [];
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let r = 0; r < rows; r++) {
    const y = y0 + ((y1 - y0) * r) / rows;
    const inset = xPad * (1 - r / rows);
    for (let x = inset; x < 1600 - inset; x += 9 + rnd() * 6) {
      dots.push({
        x,
        y: y + rnd() * 4,
        o: 0.15 + rnd() * 0.35,
        f: rnd() > 0.985,
      });
    }
  }
  return dots;
}
const UPPER = crowd(7, 7, 610, 700, 260);
const LOWER = crowd(19, 6, 735, 815, 120);

function Tower({ x, flip }) {
  return (
    <g transform={`translate(${x} 0) ${flip ? 'scale(-1 1)' : ''}`}>
      <polygon points="-6,1000 6,1000 3,520 -3,520" fill="#05070c" />
      <rect
        x="-46"
        y="470"
        width="92"
        height="56"
        rx="4"
        fill="#0a0d16"
        stroke="#1a2236"
        strokeWidth="2"
      />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <circle
            key={`${r}${c}`}
            cx={-34 + c * 17}
            cy={484 + r * 15}
            r="5.5"
            fill="#fffbe6"
            className="bulb"
            style={{ animationDelay: `${(r + c) * 0.17}s` }}
          />
        ))
      )}
      <ellipse cx="0" cy="498" rx="120" ry="70" fill="url(#bulbGlow)" />
    </g>
  );
}

export default function StadiumBg() {
  return (
    <div className="stadium-bg" aria-hidden>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="bulbGlow">
            <stop offset="0%" stopColor="#fff6cc" stopOpacity=".55" />
            <stop offset="100%" stopColor="#fff6cc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbe6" stopOpacity=".22" />
            <stop offset="100%" stopColor="#fffbe6" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="fieldGlow" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#3fd17a" stopOpacity=".28" />
            <stop offset="60%" stopColor="#1c5a3a" stopOpacity=".08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" />
            <stop offset="50%" stopColor="#000" />
            <stop offset="72%" stopColor="#0a1124" />
            <stop offset="100%" stopColor="#0c1830" />
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#sky)" />
        {/* light beams from the towers down onto the field */}
        <polygon
          points="140,500 230,500 760,1000 260,1000"
          fill="url(#beam)"
          className="beam"
        />
        <polygon
          points="1460,500 1370,500 840,1000 1340,1000"
          fill="url(#beam)"
          className="beam"
          style={{ animationDelay: '-3s' }}
        />
        {/* upper deck */}
        <path
          d="M0 590 Q800 540 1600 590 L1600 712 Q800 690 0 712 Z"
          fill="#070b16"
        />
        <path
          d="M0 590 Q800 540 1600 590"
          stroke="#1f2a44"
          strokeWidth="3"
          fill="none"
        />
        {UPPER.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.f ? 2.4 : 1.7}
            fill={d.f ? '#fff' : '#9fb0d8'}
            opacity={d.f ? 0.9 : d.o}
            className={d.f ? 'flash' : undefined}
            style={d.f ? { animationDelay: `${(i % 9) * 0.7}s` } : undefined}
          />
        ))}
        {/* ribbon board */}
        <path
          d="M0 716 Q800 694 1600 716 L1600 728 Q800 706 0 728 Z"
          fill="#0d1a10"
        />
        <path
          d="M0 720 Q800 698 1600 720"
          stroke="#d4ff3a"
          strokeWidth="2.5"
          opacity=".55"
          fill="none"
          className="ribbon"
        />
        {/* lower bowl */}
        <path
          d="M0 728 Q800 706 1600 728 L1600 830 Q800 800 0 830 Z"
          fill="#060a14"
        />
        {LOWER.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.f ? 2.6 : 2}
            fill={d.f ? '#fff' : '#8a9cc6'}
            opacity={d.f ? 0.9 : d.o}
            className={d.f ? 'flash' : undefined}
            style={d.f ? { animationDelay: `${(i % 7) * 0.9}s` } : undefined}
          />
        ))}
        {/* field */}
        <path
          d="M0 830 Q800 800 1600 830 L1600 1000 L0 1000 Z"
          fill="#071410"
        />
        <rect width="1600" height="1000" fill="url(#fieldGlow)" />
        <Tower x={185} />
        <Tower x={1415} flip />
      </svg>
      <div className="stadium-fade" />
    </div>
  );
}
