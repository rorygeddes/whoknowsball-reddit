import { TIERS, type BoardRow, type Segment } from '../shared/game';

export function Dots({
  segments,
  current,
}: {
  segments: Segment[];
  current: number;
}) {
  return (
    <div className="dots">
      {segments.map((s, i) =>
        s.status === 'done' ? (
          <i key={i} style={{ background: TIERS[s.tier].color }} />
        ) : (
          <i key={i} className={i === current ? 'cur' : ''} />
        )
      )}
    </div>
  );
}

// Every answer on the board, how often it was picked, and which one was yours.
export function Board({
  rows,
  mine,
}: {
  rows: BoardRow[];
  mine: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
      {rows.map((r) => {
        const t = TIERS[r.tier];
        const me = r.answer === mine;
        return (
          <div
            key={r.answer}
            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px]"
            style={{
              background: me ? t.color : 'var(--panel2)',
              color: me ? '#0a0f1c' : undefined,
              borderLeft: `4px solid ${t.color}`,
            }}
          >
            <span className="truncate font-semibold">{r.answer}</span>
            <span className="shrink-0 opacity-80">{r.pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
