import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Two-second full-screen cartoon "boom" after every answer, one scene per tier. Click anywhere to skip.
const OUT = '#141a33';

const SCENES = {
  who_knows_ball: {
    word: 'HOME RUN!',
    color: '#ffd23f',
    ink: '#3a2a00',
    shake: true,
    Prop: HomeRun,
  },
  deep_cut: {
    word: 'HAT TRICK!',
    color: '#ff8a1f',
    ink: '#2e1300',
    shake: true,
    Prop: HatTrick,
  },
  all_star: {
    word: 'TRICK PLAY!',
    color: '#35e08a',
    ink: '#04210f',
    Prop: TrickPlay,
  },
  starter: { word: 'BIRDIE!', color: '#3fa9ff', ink: '#04172b', Prop: Birdie },
  benchwarmer: {
    word: 'BENCH WARMER',
    color: '#9aa4b8',
    ink: '#1d2333',
    Prop: Bench,
    soft: true,
  },
  miss: {
    word: 'K.O.!',
    color: '#ff4d5e',
    ink: '#2b0006',
    shake: true,
    Prop: Knockout,
  },
  timeout: {
    word: 'K.O.!',
    color: '#ff4d5e',
    ink: '#2b0006',
    shake: true,
    Prop: Knockout,
  },
};

function burst(points, r1, r2, cx = 500, cy = 500) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? r2 * (0.86 + ((i * 37) % 10) / 70) : r1;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

export default function TierBoom({ tier, onDone }) {
  const s = SCENES[tier] || SCENES.miss;
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (s.shake) {
      document.body.classList.add('boom-shake');
      setTimeout(() => document.body.classList.remove('boom-shake'), 600);
    }
    const t = setTimeout(() => done.current?.(), 2000);
    return () => {
      clearTimeout(t);
      document.body.classList.remove('boom-shake');
    };
  }, [s.shake]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { Prop } = s;
  if (!mounted) return null;
  return createPortal(
    <div
      className={`boom ${s.soft ? 'soft' : ''}`}
      style={{ '--c': s.color, '--ink': s.ink }}
      onClick={() => done.current?.()}
      role="presentation"
    >
      <svg
        className="boom-bg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern
            id="boomDots"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="11" cy="11" r="4" fill="#000" opacity=".16" />
          </pattern>
        </defs>
        <g className="boom-rays">
          {Array.from({ length: 24 }, (_, i) => (
            <polygon
              key={i}
              points="500,500 1600,470 1600,530"
              fill={i % 2 ? s.color : '#fff'}
              opacity={i % 2 ? 0.9 : 0.12}
              transform={`rotate(${i * 15} 500 500)`}
            />
          ))}
        </g>
        <rect width="1000" height="1000" fill="url(#boomDots)" />
        <polygon
          className="boom-burst"
          points={burst(16, 330, 250)}
          fill="#fff"
          stroke={OUT}
          strokeWidth="14"
          strokeLinejoin="round"
        />
        <polygon
          className="boom-burst2"
          points={burst(16, 290, 215)}
          fill={s.color}
          stroke={OUT}
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </svg>
      <div className="boom-prop">
        <Prop />
      </div>
      <div className="boom-word">
        {s.word.split('').map((ch, i) => (
          <span key={i} style={{ animationDelay: `${0.12 + i * 0.03}s` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </div>,
    document.body
  );
}

// Bat cracks, ball rockets off into the sky.
function HomeRun() {
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <g className="hr-bat">
        <rect
          x="40"
          y="200"
          width="200"
          height="22"
          rx="11"
          fill="#c8874a"
          stroke={OUT}
          strokeWidth="6"
          transform="rotate(-28 140 211)"
        />
      </g>
      <g className="hr-ball">
        <circle
          cx="200"
          cy="170"
          r="26"
          fill="#fff"
          stroke={OUT}
          strokeWidth="6"
        />
        <path
          d="M184,152 C192,164 192,176 184,188 M216,152 C208,164 208,176 216,188"
          stroke="#e3343f"
          strokeWidth="4"
          fill="none"
        />
      </g>
      <g
        className="hr-crack"
        stroke={OUT}
        strokeWidth="6"
        strokeLinecap="round"
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1="200"
            y1="170"
            x2={200 + 60 * Math.cos((a * Math.PI) / 180)}
            y2={170 + 60 * Math.sin((a * Math.PI) / 180)}
          />
        ))}
      </g>
    </svg>
  );
}

// Three hats rain down one after another.
function HatTrick() {
  const Hat = ({ x, d, c }) => (
    <g className="ht-hat" style={{ animationDelay: d }}>
      <ellipse
        cx={x}
        cy="230"
        rx="62"
        ry="16"
        fill={c}
        stroke={OUT}
        strokeWidth="6"
      />
      <path
        d={`M${x - 40},228 C${x - 42},170 ${x - 30},150 ${x},150 C${x + 30},150 ${x + 42},170 ${x + 40},228 Z`}
        fill={c}
        stroke={OUT}
        strokeWidth="6"
      />
      <rect
        x={x - 40}
        y="206"
        width="80"
        height="12"
        fill="#141a33"
        opacity=".35"
      />
    </g>
  );
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <Hat x={80} d="0.1s" c="#3fa9ff" />
      <Hat x={200} d="0.35s" c="#ff4d5e" />
      <Hat x={320} d="0.6s" c="#ffd23f" />
    </svg>
  );
}

// Football spins through a looping trick path.
function TrickPlay() {
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <path
        className="tp-trail"
        d="M30,250 C120,40 220,300 300,120 S380,60 380,60"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeDasharray="14 14"
        strokeLinecap="round"
      />
      <g className="tp-ball">
        <ellipse
          cx="0"
          cy="0"
          rx="44"
          ry="26"
          fill="#a0522d"
          stroke={OUT}
          strokeWidth="6"
        />
        <path
          d="M-16,0 L16,0 M-8,-7 L-8,7 M0,-7 L0,7 M8,-7 L8,7"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <animateMotion
          dur="1.3s"
          begin="0.1s"
          fill="freeze"
          rotate="auto"
          path="M30,250 C120,40 220,300 300,120 S380,60 380,60"
          calcMode="spline"
          keyPoints="0;1"
          keyTimes="0;1"
          keySplines="0.4 0 0.3 1"
        />
      </g>
    </svg>
  );
}

// Golf ball rolls and drops into the cup, flag waves.
function Birdie() {
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <ellipse
        cx="290"
        cy="250"
        rx="46"
        ry="12"
        fill="#0a2a14"
        stroke={OUT}
        strokeWidth="5"
      />
      <line
        x1="300"
        y1="250"
        x2="300"
        y2="70"
        stroke={OUT}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        className="bd-flag"
        d="M300,72 L372,92 L300,112 Z"
        fill="#ff4d5e"
        stroke={OUT}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <g className="bd-ball">
        <circle cx="0" cy="0" r="18" fill="#fff" stroke={OUT} strokeWidth="5" />
        <circle cx="-5" cy="-4" r="2.4" fill="#c9d1e3" />
        <circle cx="5" cy="3" r="2.4" fill="#c9d1e3" />
        <animateMotion
          dur="1.1s"
          begin="0.1s"
          fill="freeze"
          path="M20,232 L262,236 Q282,238 286,262"
          calcMode="spline"
          keyPoints="0;1"
          keyTimes="0;1"
          keySplines="0.3 0 0.6 1"
        />
      </g>
      <g className="bd-bird">
        <animateMotion
          dur="1.6s"
          begin="0.2s"
          fill="freeze"
          path="M-60,60 C100,10 220,90 460,20"
        />
        <path
          d="M0,0 C-20,-24 -44,-10 -54,-2 C-36,-6 -20,2 0,0 C20,2 36,-6 54,-2 C44,-10 20,-24 0,0 Z"
          fill="#fff"
          stroke={OUT}
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}

// A bench slides in and sags.
function Bench() {
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <g className="bw-bench">
        <rect
          x="60"
          y="150"
          width="280"
          height="26"
          rx="8"
          fill="#c8874a"
          stroke={OUT}
          strokeWidth="6"
        />
        <rect
          x="60"
          y="100"
          width="280"
          height="22"
          rx="8"
          fill="#b77d3d"
          stroke={OUT}
          strokeWidth="6"
        />
        <rect
          x="88"
          y="176"
          width="16"
          height="70"
          rx="4"
          fill="#5a5f73"
          stroke={OUT}
          strokeWidth="5"
        />
        <rect
          x="296"
          y="176"
          width="16"
          height="70"
          rx="4"
          fill="#5a5f73"
          stroke={OUT}
          strokeWidth="5"
        />
      </g>
      <g
        className="bw-zz"
        fill="#fff"
        stroke={OUT}
        strokeWidth="3"
        fontFamily="Anton, Impact, sans-serif"
        fontSize="44"
      >
        <text x="300" y="80">
          z
        </text>
        <text x="330" y="50" fontSize="30">
          z
        </text>
      </g>
    </svg>
  );
}

// Boxing glove punches in from the side, stars spin.
function Knockout() {
  return (
    <svg viewBox="0 0 400 300" className="prop-svg">
      <g className="ko-glove">
        <rect
          x="-150"
          y="128"
          width="120"
          height="44"
          rx="10"
          fill="#fff"
          stroke={OUT}
          strokeWidth="6"
        />
        <path
          d="M-40,90 C40,70 120,90 120,150 C120,210 40,230 -40,210 Z"
          fill="#e3343f"
          stroke={OUT}
          strokeWidth="7"
        />
        <path
          d="M30,110 C70,104 96,120 96,140"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          opacity=".6"
        />
      </g>
      <g
        className="ko-stars"
        fill="#ffd23f"
        stroke={OUT}
        strokeWidth="4"
        strokeLinejoin="round"
      >
        {[
          [260, 80],
          [320, 140],
          [250, 200],
        ].map(([x, y], i) => (
          <polygon
            key={i}
            style={{ animationDelay: `${0.3 + i * 0.08}s` }}
            points={burst(5, 22, 9, x, y)}
          />
        ))}
      </g>
    </svg>
  );
}
