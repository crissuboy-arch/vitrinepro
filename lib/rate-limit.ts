/**
 * lib/rate-limit.ts — A2.1/A2.2
 *
 * Minimal server-side rate limiter (sliding window, in-memory).
 *
 * Scope: single Node instance. On Vercel serverless each instance keeps its
 * own counters, so this is a *best-effort* abuse brake, not a distributed
 * quota. For multi-instance enforcement use a shared store (e.g. Upstash
 * Redis) — documented as a production pendency in DEPLOY.md.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map cannot grow unboundedly.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const fresh = bucket.timestamps.filter((t) => now - t < 3_600_000);
    if (fresh.length === 0) buckets.delete(key);
    else bucket.timestamps = fresh;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** ms until the oldest hit leaves the window (0 when allowed) */
  retryAfterMs: number;
}

/**
 * Returns whether `key` may perform an action limited to `maxHits`
 * per `windowMs` (sliding window).
 */
export function rateLimit(
  key: string,
  maxHits: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  sweep(now);
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
  if (bucket.timestamps.length >= maxHits) {
    const oldest = bucket.timestamps[0];
    return { allowed: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }
  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Best-effort client IP extraction behind proxies/CDN.
 * Never trusted for authorization — only for rate limiting.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Test-only hook: clears all in-memory counters. */
export function __resetRateLimitsForTests() {
  buckets.clear();
  lastSweep = Date.now();
}
