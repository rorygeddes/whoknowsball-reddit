import './index.css';

import { showToast } from '@devvit/web/client';
import {
  StrictMode,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  STRIKES,
  TIERS,
  shareText,
  type DayResponse,
  type GuessResponse,
  type LeaderboardResponse,
  type PublicQuestion,
  type Segment,
} from '../shared/game';
import { api, prettyDay } from './api';
import { Board, Dots } from './parts';

type Done = Extract<GuessResponse, { kind: 'done' }>;
type Phase =
  | { at: 'loading' }
  | { at: 'error'; message: string }
  | { at: 'intro'; i: number }
  | { at: 'question'; i: number }
  | { at: 'result'; i: number; r: Done }
  | { at: 'summary' };

const firstOpen = (segs: Segment[]) =>
  segs.findIndex((s) => s.status !== 'done');

export const App = () => {
  const [day, setDay] = useState<DayResponse | null>(null);
  const [phase, setPhase] = useState<Phase>({ at: 'loading' });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api
      .day()
      .then((d) => {
        setOffset(Date.now() - d.serverNow);
        setDay(d);
        const i = firstOpen(d.segments);
        if (i === -1) setPhase({ at: 'summary' });
        else
          setPhase(
            d.segments[i]!.status === 'playing'
              ? { at: 'question', i }
              : { at: 'intro', i }
          );
      })
      .catch((e: Error) => setPhase({ at: 'error', message: e.message }));
  }, []);

  const finish = useCallback((i: number, r: Done) => {
    setDay(
      (d) =>
        d && {
          ...d,
          streak: r.streak,
          segments: d.segments.map((s, k) => (k === i ? r.segment : s)),
        }
    );
    setPhase({ at: 'result', i, r });
  }, []);

  const next = (i: number) =>
    setPhase(
      i + 1 < (day?.questions.length ?? 0)
        ? { at: 'intro', i: i + 1 }
        : { at: 'summary' }
    );

  if (phase.at === 'loading') return <Center>Warming up…</Center>;
  if (phase.at === 'error') return <Center>{phase.message}</Center>;
  if (!day) return null;
  if (!day.username)
    return <Center>Log in to Reddit to play today&apos;s quiz.</Center>;

  const current = 'i' in phase ? phase.i : -1;
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-5 gap-4">
      <div className="flex w-full max-w-xl items-center justify-between">
        <span className="display text-xl" style={{ color: 'var(--volt)' }}>
          Who Knows Ball
        </span>
        <Dots segments={day.segments} current={current} />
      </div>
      <div className="w-full max-w-xl flex-1 flex flex-col justify-center">
        {phase.at === 'intro' && (
          <Intro
            q={day.questions[phase.i]!}
            onGo={() => setPhase({ at: 'question', i: phase.i })}
          />
        )}
        {phase.at === 'question' && (
          <Question
            key={phase.i}
            q={day.questions[phase.i]!}
            offset={offset}
            onDone={(r) => finish(phase.i, r)}
          />
        )}
        {phase.at === 'result' && (
          <Result
            q={day.questions[phase.i]!}
            r={phase.r}
            last={phase.i === day.questions.length - 1}
            onNext={() => next(phase.i)}
          />
        )}
        {phase.at === 'summary' && <Summary day={day} />}
      </div>
    </div>
  );
};

const Center = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center display text-2xl px-6 text-center">
    {children}
  </div>
);

function Intro({ q, onGo }: { q: PublicQuestion; onGo: () => void }) {
  const go = useEffectEvent(onGo);
  useEffect(() => {
    const t = setTimeout(() => go(), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <button className="pop text-center cursor-pointer" onClick={onGo}>
      <div
        className="display text-[120px] leading-none"
        style={{ color: 'var(--volt)' }}
      >
        0{q.slot}
      </div>
      <div className="display text-4xl">{q.category}</div>
      <div className="chip mt-3">{q.sport}</div>
    </button>
  );
}

function Question({
  q,
  offset,
  onDone,
}: {
  q: PublicQuestion;
  offset: number;
  onDone: (r: Done) => void;
}) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(q.timeLimit);
  const [strikes, setStrikes] = useState(0);
  const [guess, setGuess] = useState('');
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const over = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const settle = (r: GuessResponse) => {
    if (r.kind !== 'done' || over.current) return;
    over.current = true;
    onDone(r);
  };
  const end = useEffectEvent(settle);

  useEffect(() => {
    api
      .start(q.slot)
      .then((s) => {
        if (s.status === 'playing') {
          setEndsAt(s.endsAt + offset);
          setStrikes(s.strikes);
          setTimeout(() => input.current?.focus(), 30);
        } else if (s.status === 'done')
          api.forfeit(q.slot).then(end).catch(console.error);
      })
      .catch((e: Error) => setMsg(e.message));
  }, [q.slot, offset]);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !over.current)
        api.forfeit(q.slot).then(end).catch(console.error);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [endsAt, q.slot]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const g = guess.trim();
    if (!g || busy || over.current) return;
    setBusy(true);
    try {
      const r = await api.guess(q.slot, g);
      if (r.kind === 'done') return settle(r);
      if (r.kind === 'invalid') return setMsg('Give us a real name.');
      setStrikes(r.strikes);
      setMsg(`Not on the board: "${g}"`);
      setGuess('');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`panel p-5 flex flex-col gap-4 rise ${shake ? 'shake' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="chip">
          {q.sport} · {q.category}
        </span>
        <span className={`shotclock ${left > 10 ? 'ok' : ''}`}>
          {String(left).padStart(2, '0')}
        </span>
      </div>
      <div className="timebar">
        <i
          style={{
            width: `${Math.max(0, Math.min(100, (left / q.timeLimit) * 100))}%`,
          }}
        />
      </div>
      <div className="text-2xl font-extrabold leading-snug">{q.prompt}</div>
      {q.hint && <div className="muted text-sm">💡 {q.hint}</div>}
      <form className="guess" onSubmit={submit}>
        <input
          ref={input}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your answer…"
          autoComplete="off"
          disabled={!endsAt}
        />
        <button className="btn" disabled={busy || !endsAt}>
          Shoot
        </button>
      </form>
      <div className="flex items-center justify-between min-h-7">
        <span className="text-sm" style={{ color: 'var(--red)' }}>
          {msg}
        </span>
        <span className="flex gap-1.5 text-xl font-black">
          {Array.from({ length: STRIKES }, (_, k) => (
            <span
              key={k}
              style={{ color: k < strikes ? 'var(--red)' : 'var(--line)' }}
            >
              ✕
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function Result({
  q,
  r,
  last,
  onNext,
}: {
  q: PublicQuestion;
  r: Done;
  last: boolean;
  onNext: () => void;
}) {
  const t = TIERS[r.segment.tier];
  const hit = r.segment.answer !== null;
  return (
    <div className="flex flex-col gap-4 rise">
      <div
        className="panel p-5 text-center"
        style={{ borderColor: t.color, boxShadow: `0 0 40px -12px ${t.color}` }}
      >
        <div className="display text-5xl pop" style={{ color: t.color }}>
          {t.label}
        </div>
        <div className="display text-3xl mt-1">
          {hit
            ? r.segment.answer
            : r.segment.tier === 'timeout'
              ? 'Out of time'
              : 'Three strikes'}
        </div>
        <div className="display text-6xl mt-2">
          +{r.segment.points}
          <span className="text-xl muted"> pts</span>
        </div>
        <p className="muted text-sm mt-1">
          {hit && r.sharePct !== null
            ? `${r.sharePct}% of ${r.players} player${r.players === 1 ? '' : 's'} said this so far. ${t.blurb}`
            : t.blurb}
        </p>
      </div>
      <div>
        <div className="text-xs font-bold tracking-widest uppercase muted mb-2">
          The board · {q.prompt}
        </div>
        <Board rows={r.board} mine={r.segment.answer} />
      </div>
      <button className="btn self-center" onClick={onNext}>
        {last ? 'Final score' : 'Next segment'}
      </button>
    </div>
  );
}

function Summary({ day }: { day: DayResponse }) {
  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  useEffect(() => {
    api.leaderboard().then(setLb).catch(console.error);
  }, []);
  const total = day.segments.reduce(
    (n, s) => n + (s.status === 'done' ? s.points : 0),
    0
  );

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText(day.day, day.segments));
      showToast('Copied. Paste it in the comments!');
    } catch {
      showToast(shareText(day.day, day.segments));
    }
  };

  return (
    <div className="flex flex-col gap-4 rise">
      <div className="panel p-5 text-center">
        <div className="muted text-sm">{prettyDay(day.day)} · Final</div>
        <div className="display text-7xl pop" style={{ color: 'var(--volt)' }}>
          {total}
        </div>
        <div className="muted display">out of {day.segments.length * 100}</div>
        {day.streak > 0 && (
          <div className="chip mt-2">🔥 {day.streak} day streak</div>
        )}
        <div className="text-2xl mt-3 tracking-widest">
          {day.segments
            .map((s) => (s.status === 'done' ? TIERS[s.tier].emoji : ''))
            .join('')}
        </div>
        <button className="btn mt-3" onClick={share}>
          Share result
        </button>
      </div>
      <div className="panel p-4 flex flex-col gap-1.5">
        {day.questions.map((q, i) => {
          const s = day.segments[i]!;
          const t = s.status === 'done' ? TIERS[s.tier] : null;
          return (
            <div
              key={q.slot}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">
                <b>{q.sport}</b>{' '}
                <span className="muted">
                  {s.status === 'done' ? (s.answer ?? t?.label) : '…'}
                </span>
              </span>
              <span className="shrink-0 font-bold" style={{ color: t?.color }}>
                {t ? `${t.label} +${s.status === 'done' ? s.points : 0}` : ''}
              </span>
            </div>
          );
        })}
      </div>
      <div className="panel p-4">
        <div className="display text-xl mb-2">Today&apos;s leaderboard</div>
        {!lb ? (
          <div className="muted text-sm">Loading…</div>
        ) : (
          <>
            {lb.top.map((p, k) => (
              <div
                key={p.username}
                className="flex justify-between text-sm py-0.5"
                style={{
                  color:
                    p.username === day.username ? 'var(--volt)' : undefined,
                }}
              >
                <span>
                  {k + 1}. u/{p.username}
                </span>
                <b>{p.points}</b>
              </div>
            ))}
            {lb.me && lb.me.rank > lb.top.length && (
              <div
                className="flex justify-between text-sm pt-2 mt-1 border-t"
                style={{ borderColor: 'var(--line)', color: 'var(--volt)' }}
              >
                <span>
                  {lb.me.rank}. u/{day.username}
                </span>
                <b>{lb.me.points}</b>
              </div>
            )}
            <div className="muted text-xs mt-2">
              {lb.players} player{lb.players === 1 ? '' : 's'} today
            </div>
          </>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
