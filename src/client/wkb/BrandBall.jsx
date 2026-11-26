import { useEffect, useState } from 'react';
import Icon from './Icon';

const Puck = () => (
  <svg viewBox="0 0 32 32" width="1em" height="1em" aria-hidden>
    <path
      d="M3,13 L3,20 A13,6 0 0,0 29,20 L29,13"
      fill="#1a1a1a"
      stroke="#cfd6ee"
      strokeWidth="1.6"
    />
    <ellipse
      cx="16"
      cy="13"
      rx="13"
      ry="6"
      fill="#3a3a3a"
      stroke="#e6ebff"
      strokeWidth="1.6"
    />
    <ellipse cx="12" cy="12" rx="5" ry="1.6" fill="#fff" opacity=".35" />
  </svg>
);
const BALLS = [
  <Icon
    key="b"
    name="basketball"
    size="1em"
    color="#ff8a1f"
    strokeWidth={2.4}
  />,
  <Puck key="p" />,
  <Icon key="f" name="football" size="1em" color="#c8763a" strokeWidth={2.4} />,
  <Icon key="s" name="soccer" size="1em" color="#eef2ff" strokeWidth={2.2} />,
];

// Logo icon: basketball, puck, football, soccer ball. Each gets shot off to the left, then the next one drops in.
export default function BrandBall() {
  const [i, setI] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    let t1, t2;
    const cycle = () => {
      t1 = setTimeout(() => setOut(true), 750);
      t2 = setTimeout(() => {
        setOut(false);
        setI((x) => (x + 1) % BALLS.length);
        cycle();
      }, 1000);
    };
    cycle();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <span className="brand-slot" aria-hidden>
      <span key={i} className={`brand-ball2 ${out ? 'shot' : ''}`}>
        {BALLS[i]}
      </span>
    </span>
  );
}
