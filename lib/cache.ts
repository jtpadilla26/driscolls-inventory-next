// lib/cache.ts
// Optional Redis cache. Falls back to simple in-memory cache if ioredis is not installed.

type CacheDriver = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
};

function createMemoryCache(): CacheDriver {
  const store = new Map<string, { v: string; exp: number | null }>();
  return {
    async get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.exp && Date.now() > hit.exp) {
        store.delete(key);
        return null;
      }
      return hit.v;
    },
    async set(key, value, ttlSeconds) {
      const exp = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      store.set(key, { v: value, exp });
    },
    async del(key) {
      store.delete(key);
    },
  };
}

async function createRedisCache(): Promise<CacheDriver | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ioredis types may not be installed in CI
    const Redis = (await import('ioredis')).default;
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!url) return null;
    const client = new Redis(url);
    return {
      async get(key) {
        return client.get(key);
      },
      async set(key, value, ttlSeconds) {
        if (ttlSeconds) await client.set(key, value, 'EX', ttlSeconds);
        else await client.set(key, value);
      },
      async del(key) {
        await client.del(key);
      },
    };
  } catch {
    return null;
  }
}

let driverPromise: Promise<CacheDriver> | null = null;

export async function getCache(): Promise<CacheDriver> {
  if (!driverPromise) {
    driverPromise = (async () => (await createRedisCache()) || createMemoryCache())();
  }
  return driverPromise;
}
