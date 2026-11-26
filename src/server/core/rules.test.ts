import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveStreak, match, nextStreak, rarity, type Answer } from './rules.ts';

const board: Answer[] = [
  { answer: 'Mario Lemieux', aliases: ['Super Mario'], tier: 'starter' },
  { answer: 'Wayne Gretzky', aliases: ['The Great One'], tier: 'benchwarmer' },
  { answer: 'Bobby Hull', aliases: [], tier: 'starter' },
  { answer: 'Brett Hull', aliases: [], tier: 'starter' },
  { answer: 'Teemu Selänne', aliases: [], tier: 'auto' },
];

void test('matches full names, aliases and accents', () => {
  assert.equal(match(board, 'wayne gretzky')?.answer, 'Wayne Gretzky');
  assert.equal(match(board, 'The Great One')?.answer, 'Wayne Gretzky');
  assert.equal(match(board, 'Teemu Selanne')?.answer, 'Teemu Selänne');
});

void test('a last name works only when one answer has it', () => {
  assert.equal(match(board, 'Lemieux')?.answer, 'Mario Lemieux');
  assert.equal(match(board, 'Hull'), null);
});

void test('autocorrects clear typos and refuses close calls', () => {
  assert.equal(match(board, 'lemiuex')?.answer, 'Mario Lemieux');
  assert.equal(match(board, 'Gretsky')?.answer, 'Wayne Gretzky');
  assert.equal(match(board, 'Hul'), null);
  assert.equal(match(board, 'Sidney Crosby'), null);
  assert.equal(match(board, 'x'), null);
});

void test('fixed tiers win, auto tiers follow the share of players', () => {
  assert.equal(rarity('deep_cut', 50, 60), 'deep_cut');
  assert.equal(rarity('auto', 0, 1), 'all_star');
  assert.equal(rarity('auto', 40, 99), 'benchwarmer');
  assert.equal(rarity('auto', 1, 99), 'who_knows_ball');
  assert.equal(rarity('auto', 3, 99), 'deep_cut');
});

void test('streaks count days in a row', () => {
  let s = nextStreak({ last: null, count: 0, best: 0 }, '2026-12-01');
  s = nextStreak(s, '2026-12-02');
  assert.deepEqual(s, { last: '2026-12-02', count: 2, best: 2 });
  assert.deepEqual(nextStreak(s, '2026-12-02'), s);
  assert.deepEqual(nextStreak(s, '2026-11-30'), s);
  assert.deepEqual(nextStreak(s, '2026-12-05'), {
    last: '2026-12-05',
    count: 1,
    best: 2,
  });
  assert.equal(liveStreak(s, '2026-12-03'), 2);
  assert.equal(liveStreak(s, '2026-12-04'), 0);
});
