import { useState } from 'react';
import { TIERS } from '../../shared/game';
import Icon from './Icon';

// Board order: the cheap picks first, building up to the Home Run answers.
const BOARD_ORDER = [
  'benchwarmer',
  'starter',
  'all_star',
  'deep_cut',
  'who_knows_ball',
];

// Same idea as the server's name cleanup: lowercase, no accents, letters and numbers only.
const norm = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export default function TierBoard({ reveal, mine }) {
  const [find, setFind] = useState('');
  const f = norm(find);
  const shown = f
    ? reveal.filter(
        (a) =>
          norm(a.answer).includes(f) ||
          (a.answer || '')
            .toLowerCase()
            .split(/\s+/)
            .some((w) => norm(w).startsWith(f))
      )
    : reveal;
  const groups = BOARD_ORDER.map((k) => ({
    key: k,
    t: TIERS[k],
    rows: shown.filter((a) => a.tier === k),
  }));
  const live = shown.filter((a) => !TIERS[a.tier]);
  if (live.length)
    groups.push({
      key: 'live',
      t: { label: 'Live', points: null, color: '#d4ff3a', icon: 'live' },
      rows: live,
    });
  return (
    <>
      <div className="tb-search">
        <Icon name="eye" size={15} />
        <input
          value={find}
          onChange={(e) => setFind(e.target.value)}
          placeholder={`Search all ${reveal.length} answers…`}
          aria-label="Search the answers"
        />
        {find && (
          <button onClick={() => setFind('')} aria-label="Clear search">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      {f && shown.length === 0 && (
        <div className="tb-none">
          &ldquo;{find}&rdquo; isn&apos;t on the board.
        </div>
      )}
      <div className="tierboard">
        {groups
          .filter((g) => g.rows.length)
          .map((g) => (
            <div className="tb-group" key={g.key} style={{ '--c': g.t.color }}>
              <div className="tb-head">
                <span className="ic-row">
                  <Icon name={g.t.icon} size={14} /> {g.t.label}
                </span>
                <b>
                  {g.t.points == null ? 'rarer = more' : `${g.t.points} pts`}
                </b>
              </div>
              {[...g.rows]
                .sort(
                  (a, b) =>
                    b.picks - a.picks || a.answer.localeCompare(b.answer)
                )
                .map((a) => (
                  <div
                    className={`tb-row ${a.answer === mine ? 'mine' : ''}`}
                    key={a.answer}
                  >
                    <span className="tb-name">
                      {a.answer}
                      {a.answer === mine && <em> · you</em>}
                    </span>
                    <span className="tb-pct">
                      {a.picks > 0 ? `${a.pct}%` : '—'}
                    </span>
                  </div>
                ))}
            </div>
          ))}
      </div>
    </>
  );
}
