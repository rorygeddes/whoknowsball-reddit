// Burst of jersey-coloured confetti for big answers.
const COLORS = [
  '#d4ff3a',
  '#ffd23f',
  '#ff8a1f',
  '#3fa9ff',
  '#35e08a',
  '#ff4d5e',
];
export default function Confetti({ count = 60 }) {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 10) * 0.04}s`,
            animationDuration: `${1.4 + (i % 7) * 0.18}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}
