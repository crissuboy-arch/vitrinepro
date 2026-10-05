/**
 * lib/analytics-guard.ts — A2.2/A2.17
 *
 * Pure validation + dedup helpers for /api/analytics. No I/O —
 * unit-testable with node:test.
 */

/** Events the public POST endpoint accepts. Nothing else is ever stored. */
export const ALLOWED_EVENTS = [
  "page_view",
  "whatsapp_click",
  "product_view",
  // A4 — discovery clicks (per-business, no coordinates in the payload).
  "business_result_click",
  "product_result_click",
  // A5 — "Preciso Hoje" result clicks (per-business, no coordinates).
  // NOTE: there is intentionally NO "need_today_toggle" server event:
  // the toggle has no business to attribute to, and sending it with a
  // fabricated business_id would weaken the A2 per-business validation.
  // Mode usage is measured honestly via need_today_result_click volume.
  "need_today_result_click",
] as const;
export type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

export function isAllowedEvent(value: unknown): value is AllowedEvent {
  return typeof value === "string" && (ALLOWED_EVENTS as readonly string[]).includes(value);
}

/** UUID-ish guard: rejects arbitrary payloads before they reach the DB. */
export function isUuidLike(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 64 &&
    /^[a-zA-Z0-9-]+$/.test(value)
  );
}

export interface Deduper {
  /** true when this (key) was already seen inside the window → drop it */
  isDuplicate(key: string, now?: number): boolean;
}

/** Short-window dedup brake against naive event floods. */
export function makeDeduper(windowMs: number, maxKeys = 20_000): Deduper {
  const seen = new Map<string, number>();
  return {
    isDuplicate(key: string, now: number = Date.now()): boolean {
      const last = seen.get(key);
      if (last !== undefined && now - last < windowMs) return true;
      seen.set(key, now);
      if (seen.size > maxKeys) {
        const cutoff = now - windowMs;
        for (const [k, t] of seen) {
          if (t < cutoff) seen.delete(k);
          if (seen.size <= maxKeys - 5_000) break;
        }
      }
      return false;
    },
  };
}
