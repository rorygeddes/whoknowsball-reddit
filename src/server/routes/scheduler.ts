import { Hono } from 'hono';
import { createDailyPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  const post = await createDailyPost();
  console.log(
    `daily post ${post.created ? 'created' : 'already there'}: ${post.id}`
  );
  return c.json({ status: 'ok' }, 200);
});
