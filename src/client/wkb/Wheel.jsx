import { useEffect, useMemo, useRef, useState } from 'react';
import { WHEEL_SPORTS, sportStyle } from '../../shared/game';
import Icon from './Icon';

// Game-show wheel. It always lands on today's sport, set by the admin.
export default function Wheel({ target, onDone }) {
  const sports = useMemo(() => {
    const list = [...WHEEL_SPORTS];
    if (!list.some((s) => s.toLowerCase() === (target || '').toLowerCase()))
      list[list.length - 1] = target;
    return list;
  }, [target]);
  const n = sports.length;
  const slice = 360 / n;
  const idx = Math.max(
    0,
    sports.findIndex((s) => s.toLowerCase() === (target || '').toLowerCase())
  );
  const [angle, setAngle] = useState(0);
  const [landed, setLanded] = useState(false);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const t = setTimeout(
      () => setAngle(360 * 6 - (idx * slice + slice / 2)),
      120
    );
    const d = setTimeout(() => {
      setLanded(true);
      setTimeout(() => done.current(), 1100);
    }, 120 + 3600);
    return () => {
      clearTimeout(t);
      clearTimeout(d);
    };
  }, [idx, slice]);

  const r = 150;
  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer">▼</div>
      <svg
        viewBox="-160 -160 320 320"
        className="wheel"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {sports.map((s, i) => {
          const a0 = ((i * slice - 90) * Math.PI) / 180,
            a1 = (((i + 1) * slice - 90) * Math.PI) / 180;
          const mid = (((i + 0.5) * slice - 90) * Math.PI) / 180;
          const st = sportStyle(s);
          return (
            <g key={s + i}>
              <path
                d={`M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`}
                fill={i % 2 ? '#131c33' : '#1b2747'}
                stroke="#d4ff3a"
                strokeWidth="2"
              />
              <g
                transform={`translate(${Math.cos(mid) * 98} ${Math.sin(mid) * 98}) rotate(${(i + 0.5) * slice})`}
              >
                <Icon
                  name={st.icon}
                  x="-13"
                  y="-32"
                  width="26"
                  height="26"
                  size={26}
                  color={st.color}
                  strokeWidth={2.4}
                />
                <text
                  textAnchor="middle"
                  y="16"
                  fontSize="12"
                  fill={st.color}
                  fontFamily="Anton, Impact, sans-serif"
                  letterSpacing="1"
                >
                  {s.toUpperCase()}
                </text>
              </g>
            </g>
          );
        })}
        <circle r="30" fill="#0a0f1c" stroke="#d4ff3a" strokeWidth="4" />
        <text
          textAnchor="middle"
          y="7"
          fontSize="18"
          fill="#d4ff3a"
          fontFamily="Anton, Impact, sans-serif"
        >
          WKB
        </text>
      </svg>
      <div className={`wheel-result ${landed ? 'show' : ''}`}>
        <Icon
          name={sportStyle(target).icon}
          size={40}
          color={sportStyle(target).color}
        />{' '}
        {String(target).toUpperCase()}
      </div>
    </div>
  );
}
