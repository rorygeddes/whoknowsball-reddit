// Builds src/server/data/questions.json from the original Who Knows Ball seed SQL.
// Usage: node tools/import-questions.mjs <path to original repo>
// Keeps evergreen questions only: live, "this season" and "current roster" questions go stale.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('pass the original whoknowsball repo path');
const supa = join(root, 'supabase');
const seeds = readdirSync(supa)
  .filter((f) => f.startsWith('seed') && f.endsWith('.sql'))
  .sort();

const STALE =
  /this season|current|last night|anyone who has played|in 20\d\d\./i;
const TIERS = new Set([
  'who_knows_ball',
  'deep_cut',
  'all_star',
  'starter',
  'benchwarmer',
  'auto',
]);

// Reads one SQL value at s[i]: 'text', array['a','b'], '{}'::text[], array[]::text[], numbers, true/false/null, bare words.
function readValue(s, i) {
  while (/\s/.test(s[i])) i++;
  if (s[i] === "'") {
    let out = '';
    i++;
    for (;;) {
      if (s[i] === "'" && s[i + 1] === "'") {
        out += "'";
        i += 2;
        continue;
      }
      if (s[i] === "'") {
        i++;
        break;
      }
      out += s[i++];
    }
    if (s.startsWith('::text[]', i)) {
      i += 8;
      return { v: [], i };
    }
    return { v: out, i };
  }
  if (s.slice(i, i + 6).toLowerCase() === 'array[') {
    i += 6;
    const arr = [];
    for (;;) {
      while (/[\s,]/.test(s[i])) i++;
      if (s[i] === ']') {
        i++;
        break;
      }
      const r = readValue(s, i);
      arr.push(r.v);
      i = r.i;
    }
    if (s.startsWith('::text[]', i)) i += 8;
    return { v: arr, i };
  }
  const m = /^[A-Za-z0-9_.-]+/.exec(s.slice(i));
  const word = m[0];
  i += word.length;
  if (/^-?\d+$/.test(word)) return { v: Number(word), i };
  if (word === 'null') return { v: null, i };
  if (word === 'true' || word === 'false') return { v: word === 'true', i };
  return { v: word, i };
}

// Reads "(v, v, ...)" tuples one after another, starting at s[i]; stops at the first thing that isn't a tuple.
function readTuples(s, i) {
  const tuples = [];
  for (;;) {
    while (/[\s,]/.test(s[i])) i++;
    if (s[i] !== '(') return { tuples, i };
    i++;
    const t = [];
    for (;;) {
      while (/[\s,]/.test(s[i])) i++;
      if (s[i] === ')') {
        i++;
        break;
      }
      const r = readValue(s, i);
      t.push(r.v);
      i = r.i;
    }
    tuples.push(t);
  }
}

// Aliases come as array['a'], or as a Postgres literal string '{"a","b"}'.
function pgArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  const inner = v.trim().replace(/^\{|\}$/g, '');
  if (!inner) return [];
  return [...inner.matchAll(/"((?:[^"\\]|\\.)*)"|([^,]+)/g)].map((m) =>
    (m[1] ?? m[2]).replace(/\\(.)/g, '$1').trim()
  );
}

const cols = (str) => str.split(',').map((c) => c.trim());
const questions = [];
const byPrompt = new Map();

for (const f of seeds) {
  const sql = readFileSync(join(supa, f), 'utf8');
  const re =
    /insert into public\.wkb_(questions|answers) \(([^)]*)\)\s*values/g;
  let m;
  let current = null;
  while ((m = re.exec(sql))) {
    const names = cols(m[2]);
    const { tuples } = readTuples(sql, re.lastIndex);
    for (const t of tuples) {
      const row = Object.fromEntries(names.map((n, k) => [n, t[k]]));
      if (m[1] === 'questions') {
        current = null;
        if (row.is_live || STALE.test(row.prompt) || byPrompt.has(row.prompt))
          continue;
        current = {
          category: row.category,
          sport: row.sport,
          prompt: row.prompt,
          hint: row.hint ?? null,
          timeLimit: row.time_limit ?? 30,
          answers: [],
        };
        byPrompt.set(row.prompt, current);
        questions.push(current);
      } else if (current) {
        if (!TIERS.has(row.tier))
          throw new Error(`${f}: unknown tier ${row.tier} for ${row.answer}`);
        current.answers.push({
          answer: row.answer,
          aliases: pgArray(row.aliases),
          tier: row.tier,
        });
      }
    }
  }
}

// The 50-goal scorers that a later migration added to the original board.
const extra = readFileSync(
  join(supa, 'migrations/20261126061000_wkb_hockey_50_goal_answers.sql'),
  'utf8'
);
const fifty = questions.find((q) =>
  q.prompt.includes('50+ goals in a single NHL season')
);
if (fifty) {
  const start = extra.indexOf('as (values') + 'as (values'.length;
  const have = new Set(fifty.answers.map((a) => a.answer.toLowerCase()));
  for (const [answer, tier, aliases] of readTuples(extra, start).tuples) {
    if (!have.has(answer.toLowerCase()))
      fifty.answers.push({ answer, aliases, tier });
  }
}

for (const q of questions)
  if (q.answers.length < 5) throw new Error(`too few answers: ${q.prompt}`);

// Five a day, no sport twice in a day. Questions that can't fill a whole day are left out.
const PER_DAY = 5;
const pool = [...questions];
const days = [];
while (pool.length >= PER_DAY) {
  const day = [];
  for (let k = 0; k < pool.length && day.length < PER_DAY;) {
    if (day.some((q) => q.sport === pool[k].sport)) {
      k++;
      continue;
    }
    day.push(pool.splice(k, 1)[0]);
  }
  if (day.length < PER_DAY) break;
  days.push(day);
}

const out = join(process.cwd(), 'src/server/data/questions.json');
writeFileSync(out, JSON.stringify(days, null, 1) + '\n');
console.log(`${days.length} days from ${questions.length} questions -> ${out}`);
days.forEach((d, n) =>
  console.log(`  day ${n + 1}: ${d.map((q) => q.sport).join(', ')}`)
);
if (pool.length)
  console.log(`  left out: ${pool.map((q) => q.prompt).join(' | ')}`);
