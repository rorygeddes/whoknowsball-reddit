import { Hono, type Context } from 'hono';
import { context, reddit, redis } from '@devvit/web/server';
import type {
  DayResponse,
  ErrorResponse,
  GuessResponse,
  LeaderboardResponse,
  Segment,
} from '../../shared/game';
import { STRIKES } from '../../shared/game';
import {
  publicQuestion,
  questionsFor,
  todayET,
  type Question,
} from '../core/bank';
import { liveStreak, match, nextStreak, rarity } from '../core/rules';
import * as store from '../core/store';

export const api = new Hono();

// Each daily post plays the day it was made for. A post made any other way plays today.
async function postDay(): Promise<string> {
  const saved = context.postId
    ? await redis.get(store.postDayKey(context.postId))
    : undefined;
  return saved ?? todayET();
}

const fail = (c: Context, message: string, code: 400 | 401 | 404 = 400) =>
  c.json<ErrorResponse>({ status: 'error', message }, code);

async function player(c: Context) {
  const username = await reddit.getCurrentUsername();
  const day = await postDay();
  const body: { slot?: unknown; guess?: unknown } = await c.req.json();
  const q = questionsFor(day).find((x) => x.slot === body.slot);
  return {
    username,
    day,
    q,
    guess: typeof body.guess === 'string' ? body.guess.trim() : '',
  };
}

// After the last segment of a day, the streak moves on.
async function closeDay(day: string, user: string): Promise<number> {
  const segs = await Promise.all(
    questionsFor(day).map((q) => store.readSegment(day, q, user))
  );
  let s = await store.readStreak(user);
  if (segs.every((x) => x.status === 'done')) {
    s = nextStreak(s, day);
    await store.writeStreak(user, s);
  }
  return liveStreak(s, todayET());
}

async function done(
  day: string,
  q: Question,
  user: string,
  segment: Extract<Segment, { status: 'done' }>,
  same: number,
  total: number
): Promise<GuessResponse> {
  return {
    kind: 'done',
    segment,
    sharePct: segment.answer
      ? Math.round((100 * (same + 1)) / (total + 1))
      : null,
    players: total + 1,
    board: await store.board(day, q),
    streak: await closeDay(day, user),
  };
}

api.get('/day', async (c) => {
  const username = await reddit.getCurrentUsername();
  const day = await postDay();
  const questions = questionsFor(day);
  const segments: Segment[] = username
    ? await Promise.all(
        questions.map((q) => store.readSegment(day, q, username))
      )
    : questions.map(() => ({ status: 'unstarted' }));
  const streak = username
    ? liveStreak(await store.readStreak(username), todayET())
    : 0;
  return c.json<DayResponse>({
    day,
    username: username ?? null,
    questions: questions.map(publicQuestion),
    segments,
    streak,
    serverNow: Date.now(),
  });
});

api.post('/start', async (c) => {
  const { username, day, q } = await player(c);
  if (!username) return fail(c, 'Log in to Reddit to play.', 401);
  if (!q) return fail(c, 'No such segment.', 404);
  return c.json<Segment>(await store.start(day, q, username));
});

api.post('/guess', async (c) => {
  const { username, day, q, guess } = await player(c);
  if (!username) return fail(c, 'Log in to Reddit to play.', 401);
  if (!q) return fail(c, 'No such segment.', 404);

  const seg = await store.readSegment(day, q, username);
  if (seg.status === 'unstarted') return fail(c, 'Start the segment first.');
  if (seg.status === 'done')
    return c.json<GuessResponse>(await done(day, q, username, seg, 0, 0));
  if (guess.length < 2) return c.json<GuessResponse>({ kind: 'invalid' });

  const hit = match(q.answers, guess);
  if (!hit) {
    const strikes = await store.strike(day, q, username);
    if (strikes < STRIKES)
      return c.json<GuessResponse>({ kind: 'miss', strikes });
    return c.json<GuessResponse>(
      await done(
        day,
        q,
        username,
        await store.finish(day, q, username, 'miss', null),
        0,
        0
      )
    );
  }

  const { counts, total } = await store.picks(day, q.slot);
  const same = counts[hit.answer] ?? 0;
  const segment = await store.finish(
    day,
    q,
    username,
    rarity(hit.tier, same, total),
    hit.answer
  );
  return c.json<GuessResponse>(
    await done(day, q, username, segment, same, total)
  );
});

api.post('/forfeit', async (c) => {
  const { username, day, q } = await player(c);
  if (!username) return fail(c, 'Log in to Reddit to play.', 401);
  if (!q) return fail(c, 'No such segment.', 404);
  const seg = await store.readSegment(day, q, username);
  if (seg.status === 'unstarted') return fail(c, 'Start the segment first.');
  const segment =
    seg.status === 'done'
      ? seg
      : await store.finish(day, q, username, 'timeout', null);
  return c.json<GuessResponse>(await done(day, q, username, segment, 0, 0));
});

api.get('/leaderboard', async (c) => {
  const username = await reddit.getCurrentUsername();
  const day = await postDay();
  const lb = await store.leaderboard(day, username ?? null);
  return c.json<LeaderboardResponse>({ day, ...lb });
});
