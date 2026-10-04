/**
 * lib/visibility.ts — A2.5
 *
 * CANONICAL PUBLICATION RULE (single source of truth):
 *
 *   businesses.published = true   → publicly visible
 *                                   (may appear in /explorar, /vitrine/[slug] open)
 *   businesses.published = false  → hidden from the public
 *                                   (owner can still manage + preview when authenticated)
 *
 * The legacy `is_published` column is NOT consulted here. A one-way data
 * migration (manual SQL, delivered with A2.5) syncs `is_published = true`
 * into `published = true` before this rule is enforced, so no published
 * vitrine goes dark accidentally.
 *
 * All helpers below are pure functions — covered by tests/a25-normalization.test.ts.
 */

export interface Publishable {
  published?: boolean | null;
}

export interface Ownable {
  user_id?: string | null;
}

/**
 * Canonical public-visibility check. Strict: only `published === true`
 * counts. `false`, `null` and `undefined` all mean "not public".
 */
export function isPublishedBusiness(b: Publishable | null | undefined): boolean {
  return b?.published === true;
}

/**
 * Ownership predicate used when selecting which business to administer.
 * Never grant access on a missing business or a missing user id.
 */
export function isOwnerOf(
  business: Ownable | null | undefined,
  userId: string | null | undefined
): boolean {
  if (!business || !userId) return false;
  if (!business.user_id) return false;
  return business.user_id === userId;
}

export type BusinessCountTarget = "onboarding" | "dashboard";

/**
 * Where to send a user right after login, based on how many businesses
 * they own. Multi-business users (2+) go to /dashboard too — the dashboard
 * itself shows a business selector instead of bouncing to onboarding.
 */
export function resolveBusinessCountTarget(count: number): BusinessCountTarget {
  return count === 0 ? "onboarding" : "dashboard";
}
