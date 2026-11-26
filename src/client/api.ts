import type {
  DayResponse,
  ErrorResponse,
  GuessResponse,
  LeaderboardResponse,
  Segment,
} from '../shared/game';

async function call<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(
    `/api/${path}`,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(isError(data) ? data.message : `HTTP ${res.status}`);
  return data;
}

function isError(d: unknown): d is ErrorResponse {
  return (
    typeof d === 'object' && d !== null && 'status' in d && d.status === 'error'
  );
}

export const api = {
  day: () => call<DayResponse>('day'),
  start: (slot: number) => call<Segment>('start', { slot }),
  guess: (slot: number, guess: string) =>
    call<GuessResponse>('guess', { slot, guess }),
  forfeit: (slot: number) => call<GuessResponse>('forfeit', { slot }),
  leaderboard: () => call<LeaderboardResponse>('leaderboard'),
};

export const prettyDay = (day: string) =>
  new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
