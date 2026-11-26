import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TIERS, type DayResponse } from '../shared/game';
import { api, prettyDay } from './api';
import { Dots } from './parts';

// The card people see in the feed. Kept light: the quiz itself loads in game.html.
export const Splash = () => {
  const [day, setDay] = useState<DayResponse | null>(null);
  useEffect(() => {
    api.day().then(setDay).catch(console.error);
  }, []);

  const finished = day?.segments.every((s) => s.status === 'done') ?? false;
  const total =
    day?.segments.reduce(
      (n, s) => n + (s.status === 'done' ? s.points : 0),
      0
    ) ?? 0;
  const started = day?.segments.some((s) => s.status !== 'unstarted') ?? false;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-3 px-5 text-center">
      <div
        className="display text-5xl leading-none"
        style={{ color: 'var(--volt)' }}
      >
        Who Knows Ball
      </div>
      <div className="muted text-sm">{day ? prettyDay(day.day) : ' '}</div>
      <p className="max-w-sm text-[15px]">
        Five sports questions. Three strikes each. The rarer your right answer,
        the more it&apos;s worth.
      </p>
      {day && <Dots segments={day.segments} current={-1} />}
      {day && day.segments.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {day.questions.map((q) => (
            <span key={q.slot} className="chip">
              {q.sport}
            </span>
          ))}
        </div>
      )}
      {finished ? (
        <div className="display text-2xl">
          {total} pts today
          {day && day.streak > 0 ? ` · ${day.streak} day streak` : ''}
        </div>
      ) : (
        day &&
        day.streak > 0 && (
          <div className="muted text-sm">🔥 {day.streak} day streak</div>
        )
      )}
      <button
        className="btn mt-2"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        {finished ? 'See the board' : started ? 'Keep playing' : 'Play today'}
      </button>
      <div className="flex gap-3 text-xs muted mt-1">
        {(
          [
            'who_knows_ball',
            'deep_cut',
            'all_star',
            'starter',
            'benchwarmer',
          ] as const
        ).map((t) => (
          <span key={t} style={{ color: TIERS[t].color }}>
            {TIERS[t].label} {TIERS[t].points}
          </span>
        ))}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
