// Plays the built game in a normal browser: real API routes, fake Redis, one fake Reddit user.
// Run: npm run build && npm run local, then open http://localhost:7474/game.html (or /splash.html).
// Add ?user=name to play as someone else and see rarity and the leaderboard move.
import { register } from 'node:module';
register('./hooks.mjs', import.meta.url);

const { Hono } = await import('hono');
const { serve } = await import('@hono/node-server');
const { serveStatic } = await import('@hono/node-server/serve-static');
const { local } = await import('./fake-devvit.mjs');
const { api } = await import('../../src/server/routes/api.ts');

const app = new Hono();
app.use('/api/*', async (c, next) => {
  const ref = new URL(c.req.header('referer') ?? 'http://x/').searchParams.get(
    'user'
  );
  local.username = ref || 'local_player';
  await next();
});
app.route('/api', api);
app.use('/*', serveStatic({ root: './dist/client' }));

const port = Number(process.env.PORT ?? 7474);
serve({ fetch: app.fetch, port });
console.log(`local harness on http://localhost:${port}/game.html`);
