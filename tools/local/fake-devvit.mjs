// Stands in for @devvit/web/server so the real API routes run locally. Redis is an in-memory map.
const strings = new Map();
const hashes = new Map();
const zsets = new Map();
const hash = (k) => hashes.get(k) ?? hashes.set(k, new Map()).get(k);
const zset = (k) => zsets.get(k) ?? zsets.set(k, new Map()).get(k);

export const context = { postId: undefined, subredditName: 'local' };
export const local = { username: 'local_player' };

export const reddit = {
  getCurrentUsername: async () => local.username,
  submitCustomPost: async () => ({ id: `t3_local${Date.now()}` }),
};

export const redis = {
  get: async (k) => strings.get(k),
  set: async (k, v) => (strings.set(k, v), 'OK'),
  hGetAll: async (k) => Object.fromEntries(hash(k)),
  hSet: async (k, fv) => (
    Object.entries(fv).forEach(([f, v]) => hash(k).set(f, v)),
    Object.keys(fv).length
  ),
  hSetNX: async (k, f, v) => (hash(k).has(f) ? 0 : (hash(k).set(f, v), 1)),
  hIncrBy: async (k, f, n) => {
    const v = Number(hash(k).get(f) ?? 0) + n;
    hash(k).set(f, String(v));
    return v;
  },
  zIncrBy: async (k, m, n) => {
    const v = (zset(k).get(m) ?? 0) + n;
    zset(k).set(m, v);
    return v;
  },
  zCard: async (k) => zset(k).size,
  zScore: async (k, m) => zset(k).get(m),
  zRank: async (k, m) => {
    const asc = [...zset(k)].sort((a, b) => a[1] - b[1]).map(([x]) => x);
    const i = asc.indexOf(m);
    return i === -1 ? undefined : i;
  },
  zRange: async (k, start, stop, opts) => {
    const all = [...zset(k)].sort((a, b) =>
      opts?.reverse ? b[1] - a[1] : a[1] - b[1]
    );
    return all
      .slice(start, stop + 1)
      .map(([member, score]) => ({ member, score }));
  },
};
