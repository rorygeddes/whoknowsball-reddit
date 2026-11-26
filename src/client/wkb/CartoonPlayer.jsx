// Bobblehead cartoon of whoever you answered. Looks are seeded from the name so the same
// player always comes out the same.
const SKIN = ['#f6d2b8', '#e8b48f', '#c98e64', '#a86b45', '#7a4a2b', '#5a3420'];
const HAIR = [
  '#1b1209',
  '#3b2412',
  '#6b3e1e',
  '#b8792f',
  '#e3c16f',
  '#8a8a8a',
  '#c4471e',
];
const JERSEY = [
  '#d62839',
  '#1e5bd8',
  '#0f9d58',
  '#ff8a1f',
  '#6c2bd9',
  '#111827',
  '#ffd23f',
  '#00a3a3',
];

function hash(str) {
  let h = 2166136261;
  for (const ch of str || '?') {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export default function CartoonPlayer({
  name,
  sport = '',
  teamColor = null,
  size = 220,
  isTeam = false,
}) {
  const h = hash(name);
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const jersey = teamColor || JERSEY[(h >> 6) % JERSEY.length];
  const style = (h >> 9) % 4;
  const num = isTeam ? initials(name) : String((h % 98) + 1);
  const s = sport.toLowerCase();

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className="cartoon"
      aria-label={`Cartoon of ${name}`}
    >
      <defs>
        <radialGradient id={`glow${h}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={jersey} stopOpacity="0.55" />
          <stop offset="100%" stopColor={jersey} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="100" fill={`url(#glow${h})`} />
      <ellipse cx="100" cy="230" rx="60" ry="7" fill="#000" opacity="0.35" />

      {/* body */}
      <g className="cartoon-body">
        <path
          d="M48 238 L52 170 Q56 146 100 142 Q144 146 148 170 L152 238 Z"
          fill={jersey}
          stroke="#0a0f1c"
          strokeWidth="4"
        />
        <path
          d="M70 146 L100 166 L130 146"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          opacity="0.9"
        />
        <rect
          x="48"
          y="200"
          width="104"
          height="8"
          fill="#fff"
          opacity="0.25"
        />
        <text
          x="100"
          y="198"
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize={isTeam ? 24 : 34}
          fill="#fff"
          stroke="#0a0f1c"
          strokeWidth="1.5"
        >
          {num}
        </text>
        {/* arms */}
        <path
          d="M54 172 Q30 190 36 214"
          stroke={jersey}
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M146 172 Q170 190 164 214"
          stroke={jersey}
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="36"
          cy="216"
          r="10"
          fill={skin}
          stroke="#0a0f1c"
          strokeWidth="3"
        />
        <circle
          cx="164"
          cy="216"
          r="10"
          fill={skin}
          stroke="#0a0f1c"
          strokeWidth="3"
        />
        <Prop sport={s} />
      </g>

      {/* bobble head */}
      <g className="cartoon-head">
        <rect
          x="88"
          y="124"
          width="24"
          height="22"
          fill={skin}
          stroke="#0a0f1c"
          strokeWidth="3"
        />
        <ellipse
          cx="100"
          cy="84"
          rx="52"
          ry="56"
          fill={skin}
          stroke="#0a0f1c"
          strokeWidth="4"
        />
        <Hair style={style} color={hair} />
        {s === 'hockey' && (
          <path
            d="M46 78 Q50 26 100 24 Q150 26 154 78 L150 64 Q100 50 50 64 Z"
            fill={jersey}
            stroke="#0a0f1c"
            strokeWidth="4"
          />
        )}
        {s === 'football' && (
          <path
            d="M44 84 Q44 22 100 22 Q156 22 156 84 L146 72 Q100 56 54 72 Z"
            fill={jersey}
            stroke="#0a0f1c"
            strokeWidth="4"
          />
        )}
        {s === 'baseball' && (
          <path
            d="M50 66 Q54 30 100 28 Q146 30 150 66 L178 70 Q150 74 50 66 Z"
            fill={jersey}
            stroke="#0a0f1c"
            strokeWidth="4"
          />
        )}
        {s === 'tennis' && (
          <rect
            x="50"
            y="52"
            width="100"
            height="12"
            rx="6"
            fill="#fff"
            stroke="#0a0f1c"
            strokeWidth="3"
          />
        )}
        {/* face */}
        <ellipse
          cx="80"
          cy="88"
          rx="9"
          ry="11"
          fill="#fff"
          stroke="#0a0f1c"
          strokeWidth="3"
        />
        <ellipse
          cx="120"
          cy="88"
          rx="9"
          ry="11"
          fill="#fff"
          stroke="#0a0f1c"
          strokeWidth="3"
        />
        <circle
          cx="82"
          cy="90"
          r="4.5"
          fill="#0a0f1c"
          className="cartoon-eye"
        />
        <circle
          cx="122"
          cy="90"
          r="4.5"
          fill="#0a0f1c"
          className="cartoon-eye"
        />
        <path
          d="M68 72 Q80 66 90 72"
          stroke="#0a0f1c"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M110 72 Q120 66 132 72"
          stroke="#0a0f1c"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M80 112 Q100 128 120 112"
          stroke="#0a0f1c"
          strokeWidth="4"
          fill="#fff"
          strokeLinecap="round"
        />
        <ellipse cx="66" cy="106" rx="7" ry="4" fill="#ff7a7a" opacity="0.45" />
        <ellipse
          cx="134"
          cy="106"
          rx="7"
          ry="4"
          fill="#ff7a7a"
          opacity="0.45"
        />
        <path
          d="M70 98 L92 98 M108 98 L130 98"
          stroke="#0a0f1c"
          strokeWidth="2.5"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

function Hair({ style, color }) {
  if (style === 0)
    return (
      <path
        d="M50 70 Q52 26 100 26 Q148 26 150 70 Q130 46 100 48 Q70 46 50 70 Z"
        fill={color}
        stroke="#0a0f1c"
        strokeWidth="4"
      />
    );
  if (style === 1)
    return (
      <path
        d="M48 76 Q40 20 100 22 Q160 20 152 76 Q148 54 132 46 Q120 60 100 50 Q80 62 66 46 Q52 56 48 76 Z"
        fill={color}
        stroke="#0a0f1c"
        strokeWidth="4"
      />
    );
  if (style === 2)
    return (
      <g fill={color} stroke="#0a0f1c" strokeWidth="3">
        {[60, 76, 92, 108, 124, 140].map((x, i) => (
          <circle key={i} cx={x} cy={38 + (i % 2) * 6} r="14" />
        ))}
      </g>
    );
  return (
    <path
      d="M56 50 Q100 18 144 50 Q100 38 56 50 Z"
      fill={color}
      stroke="#0a0f1c"
      strokeWidth="4"
    />
  );
}

function Prop({ sport }) {
  switch (sport) {
    case 'hockey':
      return (
        <g>
          <path
            d="M170 120 L160 220 L128 226"
            stroke="#c8a165"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="120" y="222" width="18" height="8" rx="3" fill="#111" />
        </g>
      );
    case 'basketball':
      return (
        <g>
          <circle
            cx="168"
            cy="196"
            r="20"
            fill="#ff8a1f"
            stroke="#0a0f1c"
            strokeWidth="3"
          />
          <path
            d="M148 196 H188 M168 176 V216 M154 182 Q168 196 154 210 M182 182 Q168 196 182 210"
            stroke="#0a0f1c"
            strokeWidth="2"
            fill="none"
          />
        </g>
      );
    case 'soccer':
      return (
        <g>
          <circle
            cx="40"
            cy="226"
            r="13"
            fill="#fff"
            stroke="#0a0f1c"
            strokeWidth="3"
          />
          <path d="M40 219 L46 224 L44 231 L36 231 L34 224 Z" fill="#0a0f1c" />
        </g>
      );
    case 'tennis':
      return (
        <g>
          <ellipse
            cx="176"
            cy="180"
            rx="16"
            ry="22"
            fill="none"
            stroke="#0a0f1c"
            strokeWidth="5"
          />
          <path
            d="M172 202 L166 220"
            stroke="#0a0f1c"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle
            cx="30"
            cy="200"
            r="7"
            fill="#d4ff3a"
            stroke="#0a0f1c"
            strokeWidth="2"
          />
        </g>
      );
    case 'football':
      return (
        <g>
          <ellipse
            cx="168"
            cy="200"
            rx="18"
            ry="11"
            fill="#8b4513"
            stroke="#0a0f1c"
            strokeWidth="3"
            transform="rotate(-30 168 200)"
          />
          <path d="M162 200 L174 196" stroke="#fff" strokeWidth="2" />
        </g>
      );
    case 'baseball':
      return (
        <g>
          <path
            d="M170 214 L190 130"
            stroke="#c8a165"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>
      );
    case 'golf':
      return (
        <g>
          <path d="M164 214 L178 128" stroke="#ccc" strokeWidth="4" />
          <path
            d="M164 214 L176 216"
            stroke="#555"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      );
    case 'olympics':
    default:
      return (
        <g>
          <path
            d="M86 146 L100 176 L114 146"
            stroke="#3fa9ff"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="100"
            cy="182"
            r="11"
            fill="#ffd23f"
            stroke="#0a0f1c"
            strokeWidth="3"
          />
          <text
            x="100"
            y="186"
            textAnchor="middle"
            fontSize="10"
            fontWeight="900"
            fill="#0a0f1c"
          >
            1
          </text>
        </g>
      );
  }
}
