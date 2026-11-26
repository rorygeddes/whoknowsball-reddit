# Who Knows Ball (Reddit edition)

A daily sports quiz that runs inside a Reddit post. One quiz a day, five segments, and the rarer your right answers are, the more they're worth. Built on Reddit's Developer Platform (Devvit) for the Reddit Game of the Day hackathon, entered under **Best Ported Daily Game**.

## How this started

I built Who Knows Ball for myself first, on November 25, 2026, as a standalone web app: a daily sports quiz with rarity scoring, streaks, live scores and a collectible player vault. It was just something I wanted to play every day.

The next day I looked up hackathons I could submit it to and found the Reddit Game of the Day hackathon. Its rules only accept games that run inside Reddit, so the original site couldn't be entered as it was. Instead I remade the idea from the ground up to fit Reddit: the game lives in a post, it uses Reddit usernames instead of sign-ups, and it uses Reddit's own storage instead of my own database.

This repo is that remake. The original is a separate, private project, and I can show its commit history (first commit November 25, 2026) as proof that I made it.

## What's kept from the original

- The five-segment daily quiz
- Rarity scoring: the fewer players who get an answer right, the more points it earns
- Streaks and a daily leaderboard
- The look and feel

## What's new for Reddit

- The game runs inside a Reddit post
- Your Reddit username is your account, so there's no sign-up
- Scores, streaks and the leaderboard are kept in Devvit's built-in Redis
- A new post goes up automatically every day
- A result card at the end you can share in the comments
- Two weeks of questions written in advance, so judges can play on any day

## What's left out

The original's player vault, trades, live scores ticker, league logos and player photos aren't in this version. Devvit doesn't allow outside logos, outside sign-ups or links to a full version elsewhere, and leaving out real player images avoids rights problems.

## Status

- [x] Devvit project set up from Reddit's React template
- [x] The daily quiz: five segments, a shot clock, three strikes, typo-tolerant answers
- [x] Rarity scoring, from fixed tiers or from the share of players who gave the same answer
- [x] Streaks and a daily leaderboard in Redis
- [x] Automatic daily post (scheduler, just after midnight Eastern), plus a mod menu item to post it by hand
- [x] 7 days of questions (35 questions, 700+ answers), carried over from the original game
- [ ] Result card people can post as a comment
- [ ] Two full weeks of questions
- [ ] Polish, test subreddit and video

## How it works

- `src/server/data/questions.json` holds the question bank. Day 1 is November 27, 2026, and the days repeat when the bank runs out. `tools/import-questions.mjs` builds it from the original game's seed SQL, keeping only questions whose answers can't change.
- `src/server/core/rules.ts` holds the game rules as plain functions: answer matching with autocorrect, rarity tiers and streaks. `npm run test:unit` tests them.
- `src/server/core/store.ts` keeps everything in Redis. Each segment ends once, so a double tap or a retry never counts twice.
- Answers stay on the server. The post only ever sees the question, the clock and your result.

## Built with

- [Devvit](https://developers.reddit.com/) (Devvit Web)
- React, Vite and Tailwind for the post
- Hono for the server, with Devvit's Redis and scheduler

## Running it

Needs Node 24 or newer and a Reddit account linked to [developers.reddit.com](https://developers.reddit.com/).

```bash
npm install
npm run login     # link the CLI to your Reddit account
npm run dev       # playtest live on your test subreddit
npm run deploy    # upload a new version
```

To play it without Reddit, run `npm run build && npm run local` and open http://localhost:7474/game.html. That runs the real server routes with an in-memory Redis. Add `?user=someone` to the URL to play as a second person.

## License

BSD-3-Clause, from Reddit's Devvit template.
