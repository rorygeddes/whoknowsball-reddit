import type { HitTier } from '../../shared/game';

export type Answer = {
  answer: string;
  aliases: string[];
  tier: HitTier | 'auto';
};

// Lowercase, no accents, letters and numbers only.
export const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const lastName = (name: string) => name.replace(/^.*\s/, '');

// Optimal string alignment: Levenshtein that also counts two swapped letters as one typo.
export function osa(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + c
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[n]![m]!;
}

// Exact name or alias, then a last name only one answer has, then autocorrect.
// Autocorrect allows 1 typo for 4-7 letters, 2 for 8-11, 3 for 12+, and gives up when two names fit about as well.
export function match(answers: Answer[], guess: string): Answer | null {
  const g = norm(guess);
  if (g.length < 2) return null;

  const exact = answers.find(
    (a) => norm(a.answer) === g || a.aliases.some((al) => norm(al) === g)
  );
  if (exact) return exact;

  const byLast = answers.filter((a) => norm(lastName(a.answer)) === g);
  if (byLast.length === 1) return byLast[0]!;
  if (byLast.length > 1 || g.length < 4) return null;

  const scored = answers
    .map((a) => {
      const keys = [a.answer, ...a.aliases, lastName(a.answer)]
        .map(norm)
        .filter((k) => k.length >= 4);
      const over = Math.min(
        ...keys.map((k) => osa(g, k) - Math.min(3, Math.floor(k.length / 4)))
      );
      return { a, over };
    })
    .sort((x, y) => x.over - y.over);
  const [best, second] = scored;
  if (!best || best.over > 0) return null;
  if (second && second.over <= 0 && second.over - best.over < 2) return null;
  return best.a;
}

// A fixed tier wins. Otherwise the share of finished players who gave the same answer decides it.
export function rarity(
  fixed: Answer['tier'],
  same: number,
  total: number
): HitTier {
  if (fixed !== 'auto') return fixed;
  const share = (same + 1) / (total + 1);
  if (total < 3) return 'all_star';
  if (share >= 0.3) return 'benchwarmer';
  if (share >= 0.15) return 'starter';
  if (share >= 0.07) return 'all_star';
  if (share >= 0.03) return 'deep_cut';
  return 'who_knows_ball';
}

export type Streak = { last: string | null; count: number; best: number };

const dayGap = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

// Finishing day `day`: the next day in a row adds one, a gap starts over, an older day changes nothing.
export function nextStreak(s: Streak, day: string): Streak {
  if (!s.last) return { last: day, count: 1, best: Math.max(1, s.best) };
  const gap = dayGap(s.last, day);
  if (gap <= 0) return s;
  const count = gap === 1 ? s.count + 1 : 1;
  return { last: day, count, best: Math.max(count, s.best) };
}

// A streak only shows if the last finished day is today or yesterday.
export const liveStreak = (s: Streak, today: string) =>
  s.last && dayGap(s.last, today) <= 1 ? s.count : 0;
