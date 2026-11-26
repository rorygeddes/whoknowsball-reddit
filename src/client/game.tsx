import './index.css';

import { showToast } from '@devvit/web/client';
import {
  StrictMode,
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
  sportStyle,
  type BoardRow,
  type DayResponse,
  type GuessResponse,
  type LeaderboardResponse,
  type PublicQuestion,
  type Segment,
  type Tier,
} from '../shared/game';
import { api, prettyDay } from './api';
import BrandBall from './wkb/BrandBall';
import CartoonPlayer from './wkb/CartoonPlayer';
import Confetti from './wkb/Confetti';
import CountUp from './wkb/CountUp';
import Icon from './wkb/Icon';
import StadiumBg from './wkb/StadiumBg';
import TierBadge from './wkb/TierBadge';
import TierBoard from './wkb/TierBoard';
import TierBoom from './wkb/TierBoom';
import Wheel from './wkb/Wheel';

type Done = Extract<GuessResponse, { kind: 'done' }> & { guess?: string };
type Phase =
  | { at: 'loading' }
  | { at: 'error'; message: string }
  | { at: 'intro'; i: number }
  | { at: 'spin'; i: number }
  | { at: 'question'; i: number }
  | { at: 'result'; i: number; r: Done }
  | { at: 'summary' };

const firstOpen = (segs: Segment[]) =>
  segs.findIndex((s) => s.status !== 'done');
const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const App = () => {
  const [day, setDay] = useState<DayResponse | null>(null);
  const [phase, setPhase] = useState<Phase>({ at: 'loading' });
  const [offset, setOffset] = useState(0);
  const [boom, setBoom] = useState<{ tier: Tier; key: number } | null>(null);

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

  const finish = (i: number, r: Done) => {
    setDay(
      (d) =>
        d && {
          ...d,
          streak: r.streak,
          segments: d.segments.map((s, k) => (k === i ? r.segment : s)),
        }
    );
    setBoom({ tier: r.segment.tier, key: i });
    setPhase({ at: 'result', i, r });
  };

  const next = (i: number) =>
    setPhase(
      i + 1 < (day?.questions.length ?? 0)
        ? { at: 'intro', i: i + 1 }
        : { at: 'summary' }
    );

  if (phase.at === 'loading') return <Shell>Warming up…</Shell>;
  if (phase.at === 'error') return <Shell>{phase.message}</Shell>;
  if (!day) return null;
  if (!day.username)
    return <Shell>Log in to Reddit to play today&apos;s quiz.</Shell>;

  const current = 'i' in phase ? phase.i : -1;
  return (
    <>
      <StadiumBg />
      <div className={`app ${phase.at === 'result' ? 'fit' : ''}`}>
        <header className="post-head">
          <span className="brand">
            <BrandBall /> Who Knows Ball
          </span>
          {day.streak > 0 && (
            <span className="streak-pill">
              <Icon name="flame" size={14} /> {day.streak}
            </span>
          )}
        </header>
        <main>
          <div className="stage">
            {phase.at !== 'summary' && (
              <div className="progress">
                {day.segments.map((s, k) =>
                  s.status === 'done' ? (
                    <i
                      key={k}
                      className="on"
                      style={{ ['--c' as string]: TIERS[s.tier].color }}
                    />
                  ) : (
                    <i key={k} className={k === current ? 'cur' : ''} />
                  )
                )}
              </div>
            )}
            {phase.at === 'intro' && (
              <Intro
                q={day.questions[phase.i]!}
                onGo={() => setPhase({ at: 'spin', i: phase.i })}
              />
            )}
            {phase.at === 'spin' && (
              <Spin
                q={day.questions[phase.i]!}
                onDone={() => setPhase({ at: 'question', i: phase.i })}
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
        </main>
      </div>
      {boom && (
        <TierBoom
          key={boom.key}
          tier={boom.tier}
          onDone={() => setBoom(null)}
        />
      )}
    </>
  );
};

const Shell = ({ children }: { children: ReactNode }) => (
  <>
    <StadiumBg />
    <main>
      <div className="stage">
        <div className="intro-cat">{children}</div>
      </div>
    </main>
  </>
);

function Intro({ q, onGo }: { q: PublicQuestion; onGo: () => void }) {
  const go = useEffectEvent(onGo);
  useEffect(() => {
    const t = setTimeout(() => go(), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div onClick={onGo} style={{ cursor: 'pointer' }}>
      <div className="intro-num">0{q.slot}</div>
      <div className="intro-cat">{q.category}</div>
    </div>
  );
}

function Spin({ q, onDone }: { q: PublicQuestion; onDone: () => void }) {
  return (
    <div>
      <div className="intro-cat" style={{ fontSize: 34, marginBottom: 20 }}>
        Spinning for the sport…
      </div>
      <Wheel target={q.sport} onDone={onDone} />
    </div>
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

  const settle = (r: GuessResponse, typed?: string) => {
    if (r.kind !== 'done' || over.current) return;
    over.current = true;
    onDone(typed ? { ...r, guess: typed } : r);
  };
  const end = useEffectEvent((r: GuessResponse) => settle(r));

  useEffect(() => {
    api
      .start(q.slot)
      .then((s) => {
        if (s.status === 'playing') {
          setEndsAt(s.endsAt + offset);
          setStrikes(s.strikes);
          setTimeout(() => input.current?.focus(), 50);
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
      if (r.kind === 'done') return settle(r, g);
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

  const st = sportStyle(q.sport);
  const pct = Math.max(0, Math.min(100, (left / q.timeLimit) * 100));
  return (
    <div className={`qcard ${shake ? 'shake' : ''}`}>
      <div className="qmeta">
        <span className="chip" style={{ color: st.color }}>
          <Icon name={st.icon} size={15} /> {q.sport} · {q.category}
        </span>
        <span className={`shotclock ${left > 10 ? 'ok' : ''}`}>
          {String(left).padStart(2, '0')}
        </span>
      </div>
      <div className="timebar">
        <i style={{ width: pct + '%' }} />
      </div>
      <div className="qprompt">{q.prompt}</div>
      {q.hint && (
        <div className="qhint ic-row">
          <Icon name="hint" size={16} /> {q.hint}
        </div>
      )}
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
      <div className="missmsg">{msg}</div>
      <div className="strikes">
        {Array.from({ length: STRIKES }, (_, k) => (
          <span key={k} className={k < strikes ? 'x' : ''}>
            <Icon name="x" size={22} strokeWidth={3} />
          </span>
        ))}
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
  const fixed =
    hit && r.guess && norm(r.guess) !== norm(r.segment.answer ?? '');
  return (
    <>
      {r.segment.points >= 85 && <Confetti />}
      <div className="result" style={{ ['--c' as string]: t.color }}>
        <div className="result-top">
          <div className="playercard">
            <span className="ptier">{t.label.toUpperCase()}</span>
            {hit ? (
              <CartoonPlayer
                name={r.segment.answer}
                sport={q.sport}
                isTeam={false}
              />
            ) : (
              <div className="ko-icon">
                <Icon
                  name={r.segment.tier === 'timeout' ? 'timer' : 'wall'}
                  size={110}
                  strokeWidth={1.6}
                  color={t.color}
                />
              </div>
            )}
            <div className="pname">{hit ? r.segment.answer : t.label}</div>
          </div>
          <div className="result-score">
            <TierBadge tier={r.segment.tier} big />
            <div className="bigpoints">
              +<CountUp to={r.segment.points} />
              <small>pts</small>
            </div>
            <p className="muted result-blurb">
              {hit && r.sharePct !== null
                ? `${r.sharePct}% of ${r.players} player${r.players === 1 ? '' : 's'} said this so far. ${t.blurb}`
                : t.blurb}
            </p>
          </div>
        </div>
        {fixed && (
          <p className="autocorrect">
            <Icon name="hint" size={15} /> Autocorrected: you typed{' '}
            <s>{r.guess}</s> <b>{r.segment.answer}</b>
          </p>
        )}
        <div className="result-board">
          <div className="board-label muted">The board</div>
          <TierBoard reveal={r.board} mine={r.segment.answer} />
        </div>
        <button className="btn result-next" onClick={onNext}>
          {last ? 'Final score' : 'Next segment'} <Icon name="play" size={18} />
        </button>
      </div>
    </>
  );
}

function Summary({ day }: { day: DayResponse }) {
  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  const [sheet, setSheet] = useState<number | null>(null);
  useEffect(() => {
    api.leaderboard().then(setLb).catch(console.error);
  }, []);
  const total = day.segments.reduce(
    (n, s) => n + (s.status === 'done' ? s.points : 0),
    0
  );
  const [weekday, ...rest] = prettyDay(day.day).split(', ');

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText(day.day, day.segments));
      showToast('Copied. Paste it in the comments!');
    } catch {
      showToast(shareText(day.day, day.segments));
    }
  };

  return (
    <div className="final-wrap">
      <div className="final">
        {total >= 300 && <Confetti count={90} />}
        <div className="final-left">
          <CartoonPlayer
            name={day.username}
            sport=""
            size={150}
            isTeam={false}
          />
          <div className="final-user">u/{day.username}</div>
          <div className="summary-score">
            <CountUp to={total} ms={1400} />
          </div>
          <div className="muted display" style={{ fontSize: 18 }}>
            out of {day.questions.length * 100}
          </div>
          {day.streak > 0 && (
            <div className="streak-pill" style={{ marginTop: 12 }}>
              <Icon name="flame" size={16} /> {day.streak} day streak
            </div>
          )}
          <button
            className="btn"
            style={{ marginTop: 16, fontSize: 18, padding: '12px 22px' }}
            onClick={share}
          >
            <Icon name="copy" size={18} /> Share
          </button>
        </div>
        <div className="final-center">
          <div className="final-date">
            {weekday}
            <br />
            {rest.join(', ')}
          </div>
          <div className="final-title">FINAL</div>
        </div>
        <div className="final-right">
          {day.questions.map((q, i) => {
            const s = day.segments[i]!;
            const t = s.status === 'done' ? TIERS[s.tier] : TIERS.miss;
            const st = sportStyle(q.sport);
            return (
              <button
                className="fseg"
                key={q.slot}
                style={{
                  ['--c' as string]: st.color,
                  animationDelay: `${i * 0.08}s`,
                }}
                onClick={() => setSheet(i)}
                title="See every answer"
              >
                <span className="fseg-icon">
                  <Icon name={st.icon} size={22} color={st.color} />
                </span>
                <div className="fseg-mid">
                  <div className="fseg-cat">{q.category}</div>
                  <div className="fseg-ans">
                    {s.status === 'done' ? (s.answer ?? t.label) : t.label}
                  </div>
                </div>
                <div className="fseg-pts">
                  <span>{t.label}</span>
                  <b>+{s.status === 'done' ? s.points : 0}</b>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Standings lb={lb} me={day.username} />
      {sheet !== null && (
        <AnswerSheet
          q={day.questions[sheet]!}
          seg={day.segments[sheet]!}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function Standings({
  lb,
  me,
}: {
  lb: LeaderboardResponse | null;
  me: string | null;
}) {
  const meBelow = lb?.me && lb.me.rank > lb.top.length ? lb.me : null;
  return (
    <section className="standings">
      <div className="standings-head">
        <span className="display">Standings</span>
        {lb && (
          <span className="muted">
            {lb.players} player{lb.players === 1 ? '' : 's'} today
          </span>
        )}
      </div>
      {!lb ? (
        <div className="muted">Loading…</div>
      ) : (
        <ol>
          {lb.top.map((p, k) => (
            <li key={p.username} className={p.username === me ? 'me' : ''}>
              <span className={`rank r${k + 1}`}>{k + 1}</span>
              <span className="who">u/{p.username}</span>
              <b>{p.points}</b>
            </li>
          ))}
          {meBelow && (
            <li className="me gap">
              <span className="rank">{meBelow.rank}</span>
              <span className="who">u/{me}</span>
              <b>{meBelow.points}</b>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}

function AnswerSheet({
  q,
  seg,
  onClose,
}: {
  q: PublicQuestion;
  seg: Segment;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  useEffect(() => {
    api.board(q.slot).then(setRows).catch(console.error);
  }, [q.slot]);
  const mine = seg.status === 'done' ? seg.answer : null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="card answer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="badges-top">
          <div className="fseg-cat">
            0{q.slot} · {q.category}
          </div>
          <button className="mini" onClick={onClose} aria-label="Close">
            <Icon name="x" size={14} />
          </button>
        </div>
        <h2 style={{ margin: '6px 0 4px' }}>{q.prompt}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {mine ? (
            <>
              You said <b style={{ color: 'var(--volt)' }}>{mine}</b>.
            </>
          ) : (
            'No answer this time.'
          )}
        </p>
        {rows ? (
          <TierBoard reveal={rows} mine={mine} />
        ) : (
          <p className="muted">Loading the board…</p>
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
