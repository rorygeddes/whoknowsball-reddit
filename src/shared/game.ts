// Krillion-style scoring: the more niche the right answer, the more it's worth.
export type HitTier =
  'who_knows_ball' | 'deep_cut' | 'all_star' | 'starter' | 'benchwarmer';
export type Tier = HitTier | 'miss' | 'timeout';

export const TIERS: Record<
  Tier,
  {
    label: string;
    points: number;
    color: string;
    icon: string;
    emoji: string;
    blurb: string;
  }
> = {
  who_knows_ball: {
    icon: 'baseball',
    label: 'Home Run',
    points: 100,
    color: '#ffd23f',
    emoji: '🟨',
    blurb: 'Gone. One in a million. You know ball.',
  },
  deep_cut: {
    icon: 'hockey',
    label: 'Hat Trick',
    points: 85,
    color: '#ff8a1f',
    emoji: '🟧',
    blurb: 'Real fans only.',
  },
  all_star: {
    icon: 'sparkles',
    label: 'Trick Play',
    points: 60,
    color: '#35e08a',
    emoji: '🟩',
    blurb: 'Now we are talking.',
  },
  starter: {
    icon: 'flag',
    label: 'Birdie',
    points: 30,
    color: '#3fa9ff',
    emoji: '🟦',
    blurb: 'Solid. Common pick.',
  },
  benchwarmer: {
    icon: 'bench',
    label: 'Bench Warmer',
    points: 10,
    color: '#9aa4b8',
    emoji: '⬜',
    blurb: 'Everybody had this one.',
  },
  miss: {
    icon: 'x',
    label: 'KO',
    points: 0,
    color: '#ff4d5e',
    emoji: '❌',
    blurb: 'Three strikes. Down for the count.',
  },
  timeout: {
    icon: 'timer',
    label: 'KO',
    points: 0,
    color: '#ff4d5e',
    emoji: '⏱️',
    blurb: 'Out of time. Down for the count.',
  },
};

export const STRIKES = 3;

// The wheel always lands on the question's sport.
export const WHEEL_SPORTS = ['Hockey', 'Basketball', 'Football', 'Baseball', 'Soccer', 'Tennis', 'Golf', 'Olympics'];

const SPORT_STYLE: Record<string, { icon: string; color: string }> = {
  hockey: { icon: 'hockey', color: '#3fa9ff' },
  basketball: { icon: 'basketball', color: '#ff8a1f' },
  football: { icon: 'football', color: '#b5651d' },
  baseball: { icon: 'baseball', color: '#ff4d5e' },
  soccer: { icon: 'soccer', color: '#35e08a' },
  tennis: { icon: 'tennis', color: '#d4ff3a' },
  golf: { icon: 'golf', color: '#7ee0a5' },
  olympics: { icon: 'olympics', color: '#ffd23f' },
  swimming: { icon: 'medal', color: '#3fd0ff' },
  f1: { icon: 'f1', color: '#ff2a2a' },
  'all sports': { icon: 'trophy', color: '#d4ff3a' },
};
export const sportStyle = (s: string | null | undefined) =>
  SPORT_STYLE[(s ?? '').toLowerCase()] ?? { icon: 'medal', color: '#d4ff3a' };

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

export type BoardRow = {
  answer: string;
  tier: HitTier;
  picks: number;
  pct: number;
};

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
