import { reddit, redis } from '@devvit/web/server';
import { prettyDay, todayET } from './bank';
import { dayPostKey, postDayKey } from './store';

// One post per day. Running it again the same day returns the post that already exists.
export async function createDailyPost(
  day = todayET()
): Promise<{ id: string; created: boolean }> {
  const existing = await redis.get(dayPostKey(day));
  if (existing) return { id: existing, created: false };
  const post = await reddit.submitCustomPost({
    title: `Who Knows Ball · ${prettyDay(day)}: five questions, and the rarer your answer the more it's worth`,
  });
  await redis.set(postDayKey(post.id), day);
  await redis.set(dayPostKey(day), post.id);
  return { id: post.id, created: true };
}
