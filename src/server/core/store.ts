import { redis } from '@devvit/web/server';
import {
  TIERS,
  type BoardRow,
  type HitTier,
  type Segment,
  type Tier,
} from '../../shared/game';
import type { Question } from './bank';
import type { Streak } from './rules';

// Redis keys, all scoped to the subreddit the app is installed on.
const segKey = (day: string, slot: number, user: string) =>
  `seg:${day}:${slot}:${user}`;
const picksKey = (day: string, slot: number) => `picks:${day}:${slot}`;
const lbKey = (day: string) => `lb:${day}`;
const streakKey = (user: string) => `streak:${user}`;
export const postDayKey = (postId: string) => `postday:${postId}`;
export const dayPostKey = (day: string) => `daypost:${day}`;

const GRACE_MS = 3000;
const TIER_LIST: Tier[] = [
  'who_knows_ball',
  'deep_cut',
  'all_star',
  'starter',
  'benchwarmer',
  'miss',
  'timeout',
];
const asTier = (t: string | undefined): Tier =>
  TIER_LIST.find((x) => x === t) ?? 'miss';

export async function readSegment(
  day: string,
  q: Question,
  user: string
): Promise<Segment> {
  const h = await redis.hGetAll(segKey(day, q.slot, user));
  if (h.done === '1')
    return {
      status: 'done',
      tier: asTier(h.tier),
      points: Number(h.points ?? 0),
      answer: h.answer || null,
    };
  if (!h.startedAt) return { status: 'unstarted' };
  const endsAt = Number(h.startedAt) + q.timeLimit * 1000;
  if (Date.now() > endsAt + GRACE_MS)
    return finish(day, q, user, 'timeout', null);
  return { status: 'playing', endsAt, strikes: Number(h.strikes ?? 0) };
}

export async function start(
  day: string,
  q: Question,
  user: string
): Promise<Segment> {
  await redis.hSetNX(
    segKey(day, q.slot, user),
    'startedAt',
    String(Date.now())
  );
  return readSegment(day, q, user);
}

export async function strike(
  day: string,
  q: Question,
  user: string
): Promise<number> {
  return redis.hIncrBy(segKey(day, q.slot, user), 'strikes', 1);
}

// Ends a segment once. A second call (a double tap, a retry) gets the first result back and counts nothing twice.
export async function finish(
  day: string,
  q: Question,
  user: string,
  tier: Tier,
  answer: string | null
): Promise<Extract<Segment, { status: 'done' }>> {
  const key = segKey(day, q.slot, user);
  const first = await redis.hSetNX(key, 'done', '1');
  if (!first) {
    const h = await redis.hGetAll(key);
    return {
      status: 'done',
      tier: asTier(h.tier),
      points: Number(h.points ?? 0),
      answer: h.answer || null,
    };
  }
  const points = TIERS[tier].points;
  await redis.hSet(key, { tier, points: String(points), answer: answer ?? '' });
  if (answer) await redis.hIncrBy(picksKey(day, q.slot), answer, 1);
  await redis.zIncrBy(lbKey(day), user, points);
  return { status: 'done', tier, points, answer };
}

export async function picks(
  day: string,
  slot: number
): Promise<{ counts: Record<string, number>; total: number }> {
  const raw = await redis.hGetAll(picksKey(day, slot));
  const counts = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v)])
  );
  return { counts, total: Object.values(counts).reduce((n, v) => n + v, 0) };
}

export async function board(day: string, q: Question): Promise<BoardRow[]> {
  const { counts, total } = await picks(day, q.slot);
  const fixedOr = (t: Question['answers'][number]['tier']): HitTier =>
    t === 'auto' ? 'all_star' : t;
  return q.answers
    .map((a) => ({
      answer: a.answer,
      tier: fixedOr(a.tier),
      picks: counts[a.answer] ?? 0,
      pct: total ? Math.round((100 * (counts[a.answer] ?? 0)) / total) : 0,
    }))
    .sort(
      (x, y) => y.pct - x.pct || TIERS[x.tier].points - TIERS[y.tier].points
    );
}

export async function readStreak(user: string): Promise<Streak> {
  const h = await redis.hGetAll(streakKey(user));
  return {
    last: h.last || null,
    count: Number(h.count ?? 0),
    best: Number(h.best ?? 0),
  };
}

export async function writeStreak(user: string, s: Streak): Promise<void> {
  await redis.hSet(streakKey(user), {
    last: s.last ?? '',
    count: String(s.count),
    best: String(s.best),
  });
}

export async function leaderboard(day: string, user: string | null) {
  const key = lbKey(day);
  const [top, players, rank, points] = await Promise.all([
    redis.zRange(key, 0, 24, { by: 'rank', reverse: true }),
    redis.zCard(key),
    user ? redis.zRank(key, user) : Promise.resolve(undefined),
    user ? redis.zScore(key, user) : Promise.resolve(undefined),
  ]);
  const me =
    user && rank !== undefined && points !== undefined
      ? { rank: players - rank, points }
      : null;
  return {
    top: top.map((t) => ({ username: t.member, points: t.score })),
    players,
    me,
  };
}
