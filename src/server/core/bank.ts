import days from '../data/questions.json';
import type { PublicQuestion } from '../../shared/game';
import type { Answer } from './rules';

export type Question = PublicQuestion & { answers: Answer[] };

// The first daily quiz. Each day after it takes the next set, and the sets repeat when they run out.
const EPOCH = '2026-11-27';

export function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date());
}

export function questionsFor(day: string): Question[] {
  const n = Math.round((Date.parse(day) - Date.parse(EPOCH)) / 86_400_000);
  const set = days[((n % days.length) + days.length) % days.length]!;
  return set.map((q, i) => ({
    slot: i + 1,
    category: q.category,
    sport: q.sport,
    prompt: q.prompt,
    hint: q.hint,
    timeLimit: q.timeLimit,
    answers: q.answers.map((a) => ({
      answer: a.answer,
      aliases: a.aliases,
      tier: toTier(a.tier),
    })),
  }));
}

const TIER_NAMES = [
  'who_knows_ball',
  'deep_cut',
  'all_star',
  'starter',
  'benchwarmer',
  'auto',
] as const;
function toTier(t: string): Answer['tier'] {
  const found = TIER_NAMES.find((x) => x === t);
  if (!found) throw new Error(`unknown tier ${t}`);
  return found;
}

export const publicQuestion = ({
  answers: _answers,
  ...q
}: Question): PublicQuestion => q;

export function prettyDay(day: string): string {
  return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
