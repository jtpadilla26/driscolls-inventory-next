// Simple in-memory sliding-window limiter (per key).
// Usage: const r = rateLimit(key, { limit: 20, windowMs: 60_000 });

type Options = { limit?: number; windowMs?: number };
const hits = new Map<string, number[]>();

export function rateLimit(key: string, opts: Options = {}) {
  const limit = opts.limit ?? 20;
  const windowMs = opts.windowMs ?? 60_000;

  const now = Date.now();
  const cutoff = now - windowMs;

  const arr = hits.get(key)?.filter((t) => t > cutoff) ?? [];
  if (arr.length >= limit) {
    const resetInMs = Math.max(0, windowMs - (now - arr[0]));
    return { allowed: false, remaining: 0, resetInMs };
  }

  arr.push(now);
  hits.set(key, arr);

  return { allowed: true, remaining: Math.max(0, limit - arr.length), resetInMs: 0 };
}

type Options = { limit?: number; windowMs?: number };
const hits = new Map<string, number[]>();
export function rateLimit(key: string, opts: Options = {}) {
  const limit = opts.limit ?? 20, windowMs = opts.windowMs ?? 60_000;
  const now = Date.now(), cutoff = now - windowMs;
  const arr = hits.get(key)?.filter(t => t > cutoff) ?? [];
  if (arr.length >= limit) {
    const resetInMs = Math.max(0, windowMs - (now - arr[0]));
    return { allowed: false, remaining: 0, resetInMs };
  }
  arr.push(now); hits.set(key, arr);
  return { allowed: true, remaining: Math.max(0, limit - arr.length), resetInMs: 0 };
}
