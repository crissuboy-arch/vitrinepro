/**
 * lib/ranking.ts — A2.5
 *
 * /explorar ranking algorithm (extracted as a pure, testable function).
 * Formula is UNCHANGED from the pre-A2.5 design — it just never worked
 * correctly because displayBusinesses dropped `plan` (and the engagement
 * counters) before the score ran:
 *
 *   score = (paid tier ? 200 : 0)
 *         + view_count * 1
 *         + like_count * 5
 *         + favorite_count * 10
 *         + share_count * 3
 *         + round(rating_average * 20)
 *
 * Do not invent a new algorithm here — that is A3 territory.
 */
import { isPaidTier } from "./plans.ts";

export interface RankableBusiness {
  plan?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  favorite_count?: number | null;
  share_count?: number | null;
  rating_average?: number | null;
}

export function scoreBusiness(b: RankableBusiness | null | undefined): number {
  if (!b) return 0;
  return (
    (isPaidTier(b.plan) ? 200 : 0) +
    (b.view_count ?? 0) * 1 +
    (b.like_count ?? 0) * 5 +
    (b.favorite_count ?? 0) * 10 +
    (b.share_count ?? 0) * 3 +
    Math.round((b.rating_average ?? 0) * 20)
  );
}
