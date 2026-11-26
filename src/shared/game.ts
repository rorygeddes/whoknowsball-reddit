// Krillion-style scoring: the more niche the right answer, the more it's worth.
export type HitTier =
  'who_knows_ball' | 'deep_cut' | 'all_star' | 'starter' | 'benchwarmer';
export type Tier = HitTier | 'miss' | 'timeout';

export const TIERS: Record<
  Tier,
  { label: string; points: number; color: string; emoji: string; blurb: string }
> = {
  who_knows_ball: {
    label: 'Home Run',
    points: 100,
    color: '#ffd23f',
    emoji: '🟨',
    blurb: 'Gone. One in a million. You know ball.',
  },
  deep_cut: {
    label: 'Hat Trick',
    points: 85,
    color: '#ff8a1f',
    emoji: '🟧',
    blurb: 'Real fans only.',
  },
  all_star: {
    label: 'Trick Play',
    points: 60,
    color: '#35e08a',
    emoji: '🟩',
    blurb: 'Now we are talking.',
  },
  starter: {
    label: 'Birdie',
    points: 30,
    color: '#3fa9ff',
    emoji: '🟦',
    blurb: 'Solid. Common pick.',
  },
  benchwarmer: {
    label: 'Bench Warmer',
    points: 10,
    color: '#9aa4b8',
    emoji: '⬜',
    blurb: 'Everybody had this one.',
  },
  miss: {
    label: 'KO',
    points: 0,
    color: '#ff4d5e',
    emoji: '❌',
    blurb: 'Three strikes. Down for the count.',
  },
  timeout: {
    label: 'KO',
    points: 0,
    color: '#ff4d5e',
    emoji: '⏱️',
    blurb: 'Out of time. Down for the count.',
  },
};

export const STRIKES = 3;

export type PublicQuestion = {
  slot: number;
  category: string;
  sport: string;
  prompt: string;
  hint: string | null;
  timeLimit: number;
};

export type Segment =
  | { status: 'unstarted' }
  | { status: 'playing'; endsAt: number; strikes: number }
  | { status: 'done'; tier: Tier; points: number; answer: string | null };

export type DayResponse = {
  day: string;
  username: string | null;
  questions: PublicQuestion[];
  segments: Segment[];
  streak: number;
  serverNow: number;
};

export type BoardRow = { answer: string; tier: HitTier; pct: number };

export type GuessResponse =
  | { kind: 'invalid' }
  | { kind: 'miss'; strikes: number }
  | {
      kind: 'done';
      segment: Extract<Segment, { status: 'done' }>;
      sharePct: number | null;
      players: number;
      board: BoardRow[];
      streak: number;
    };

export type LeaderboardResponse = {
  day: string;
  top: { username: string; points: number }[];
  me: { rank: number; points: number } | null;
  players: number;
};

export type ErrorResponse = { status: 'error'; message: string };

export function shareText(day: string, segments: Segment[]): string {
  const done = segments.filter((s) => s.status === 'done');
  const total = done.reduce((n, s) => n + s.points, 0);
  const line = done.map((s) => TIERS[s.tier].emoji).join('');
  return `WHO KNOWS BALL · ${day}\n${line}  ${total}/${segments.length * 100}`;
}
