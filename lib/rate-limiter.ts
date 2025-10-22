// lib/rate-limiter.ts
// Simple in-memory rate limiter for server runtime.
// Usage: const r = rateLimit(key, { limit: 20, windowMs: 60_000 });
// If r.ok === false, block the request.

export type RateLimitOptions = {
  /** max requests allowed within the window (default 20) */
  limit?: number;
  /** window length in ms (default 60_000 = 1 minute) */
  windowMs?: number;
};

type HitStore = Map<string, number[]>;

// Singleton store for hits per key
const HIT_STORE: HitStore = new Map();

/**
 * Register a hit and compute current allowance.
 * @returns { ok, remaining, resetMs, limit, count }
 */
export function rateLimit(key: string, opts: RateLimitOptions = {}) {
  const limit = Number.isFinite(opts.limit as number) ? (opts.limit as number) : 20;
  const windowMs = Number.isFinite(opts.windowMs as number) ? (opts.windowMs as number) : 60_000;

  const now = Date.now();
  const windowStart = now - windowMs;

  // get recent hits for this key (within window)
  const list = HIT_STORE.get(key) ?? [];
  const recent = list.filter((ts) => ts > windowStart);

  // add this hit
  recent.push(now);
  HIT_STORE.set(key, recent);

  const count = recent.length;
  const ok = count <= limit;

  // when will the window fully reset (based on oldest hit still in window)
  const oldest = recent[0] ?? now;
  const resetMs = Math.max(0, windowMs - (now - oldest));

  const remaining = Math.max(0, limit - count);

  return { ok, remaining, resetMs, limit, count };
}

/**
 * Helper: throw if over limit.
 */
export function assertRateLimit(key: string, opts?: RateLimitOptions) {
  const r = rateLimit(key, opts);
  if (!r.ok) {
    const err: any = new Error('Rate limit exceeded');
    err.status = 429;
    err.retryAfterMs = r.resetMs;
    throw err;
  }
  return r;
}

/**
 * Reset stored hits (for tests or admin tools).
 * If key omitted, clears all.
 */
export function resetRateLimit(key?: string) {
  if (typeof key === 'string') HIT_STORE.delete(key);
  else HIT_STORE.clear();
}
