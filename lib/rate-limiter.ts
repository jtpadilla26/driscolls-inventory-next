// lib/rate-limiter.ts
// Backward-compatible rate limiter that supports both styles:
//
// A) Old style:
//    const limiter = rateLimit({ limit: 5, windowMs: 60_000 });
//    limiter.check("ip-or-user-id");
//
// B) Direct style (also OK):
//    const r = rateLimit("ip-or-user-id", { limit: 5, windowMs: 60_000 });
//    if (!r.ok) ... r.resetMs

export type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
};

type HitStore = Map<string, number[]>;
const STORE: HitStore = new Map();

type Result = {
  ok: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
  count: number;
  check: (key?: string, opts?: RateLimitOptions) => Result;
};

function compute(key: string, opts: RateLimitOptions = {}): Result {
  const limit = Number.isFinite(opts.limit as number) ? (opts.limit as number) : 20;
  const windowMs = Number.isFinite(opts.windowMs as number) ? (opts.windowMs as number) : 60_000;

  const now = Date.now();
  const windowStart = now - windowMs;

  const list = STORE.get(key) ?? [];
  const recent = list.filter((ts) => ts > windowStart);
  recent.push(now);
  STORE.set(key, recent);

  const count = recent.length;
  const ok = count <= limit;
  const oldest = recent[0] ?? now;
  const resetMs = Math.max(0, windowMs - (now - oldest));
  const remaining = Math.max(0, limit - count);

  const check = (k = key, extra?: RateLimitOptions) => compute(k, { limit, windowMs, ...extra });

  return { ok, remaining, resetMs, limit, count, check };
}

// Overload: (key, opts) OR (opts) -> { check(...) }
export function rateLimit(key: string, opts?: RateLimitOptions): Result;
export function rateLimit(opts: RateLimitOptions): { check: (key: string, opts?: RateLimitOptions) => Result };
export function rateLimit(a: string | RateLimitOptions, b?: RateLimitOptions): any {
  if (typeof a === 'string') return compute(a, b);
  const base = a || {};
  return {
    check: (key: string, extra?: RateLimitOptions) => compute(key, { ...base, ...extra }),
  };
}
