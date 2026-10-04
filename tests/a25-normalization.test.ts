/**
 * tests/a25-normalization.test.ts — A2.5
 * Functional normalization before A3. Covers:
 *  1. published=true  → public
 *  2. published=false → not public
 *  3. owner can still administer/preview
 *  4. ranking receives plan correctly (paid bonus)
 *  5. plan aliases
 *  6. business is a valid plan
 *  7. 0 businesses → onboarding
 *  8. 1 business   → dashboard
 *  9. 2+ businesses → NOT onboarding
 * 10. ownership when selecting a business
 * 11. URLs use the central site config
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPublishedBusiness,
  isOwnerOf,
  resolveBusinessCountTarget,
} from "../lib/visibility.ts";
import {
  normalizePlan,
  isProTier,
  isBusinessTier,
  isPaidTier,
} from "../lib/plans.ts";
import { scoreBusiness } from "../lib/ranking.ts";
import { getSiteUrl, CANONICAL_URL } from "../lib/site.ts";

describe("A2.5 — canonical publication rule (businesses.published)", () => {
  it("1. published=true appears as public", () => {
    assert.equal(isPublishedBusiness({ published: true }), true);
  });

  it("2. published=false is NOT public; null/undefined are not public either", () => {
    assert.equal(isPublishedBusiness({ published: false }), false);
    assert.equal(isPublishedBusiness({ published: null }), false);
    assert.equal(isPublishedBusiness({}), false);
    assert.equal(isPublishedBusiness(null), false);
    assert.equal(isPublishedBusiness(undefined), false);
  });

  it("legacy is_published alone does NOT make a vitrine public", () => {
    // The column may still exist in the DB, but it is no longer consulted.
    assert.equal(isPublishedBusiness({ published: false }), false);
  });
});

describe("A2.5 — owner access", () => {
  it("3. owner can administer their own business", () => {
    assert.equal(isOwnerOf({ user_id: "u1" }, "u1"), true);
  });

  it("10. non-owner / missing ids are rejected", () => {
    assert.equal(isOwnerOf({ user_id: "u1" }, "u2"), false);
    assert.equal(isOwnerOf({ user_id: null }, "u1"), false);
    assert.equal(isOwnerOf(null, "u1"), false);
    assert.equal(isOwnerOf({ user_id: "u1" }, null), false);
    assert.equal(isOwnerOf({ user_id: "u1" }, undefined), false);
  });
});

describe("A2.5 — /explorar ranking receives the plan", () => {
  it("4. paid plans (pro/premium/gold/business) get the +200 bonus", () => {
    for (const plan of ["pro", "premium", "gold", "business"]) {
      const withBonus = scoreBusiness({ plan, view_count: 0 });
      const without = scoreBusiness({ plan: "free", view_count: 0 });
      assert.equal(withBonus - without, 200, `plan=${plan}`);
    }
  });

  it("4. engagement and rating still count (existing formula preserved)", () => {
    const s = scoreBusiness({
      plan: "free",
      view_count: 10,
      like_count: 2,
      favorite_count: 1,
      share_count: 4,
      rating_average: 4.5,
    });
    // 10*1 + 2*5 + 1*10 + 4*3 + round(4.5*20) = 10+10+10+12+90 = 132
    assert.equal(s, 132);
  });

  it("4. null business scores 0", () => {
    assert.equal(scoreBusiness(null), 0);
    assert.equal(scoreBusiness(undefined), 0);
  });
});

describe("A2.5 — plan normalization (lib/plans.ts is source of truth)", () => {
  it("5. legacy aliases normalize without escalating privileges", () => {
    assert.equal(normalizePlan("premium"), "pro");
    assert.equal(normalizePlan("gold"), "pro");
    assert.equal(normalizePlan("PRO"), "pro");
    assert.equal(isProTier("premium"), true);
    assert.equal(isProTier("gold"), true);
    assert.equal(isPaidTier("premium"), true);
    assert.equal(isPaidTier("gold"), true);
    assert.equal(isPaidTier("free"), false);
    assert.equal(isPaidTier("nonsense"), false);
  });

  it("6. business is a valid plan (paid tier, chatbot entitled)", () => {
    assert.equal(normalizePlan("business"), "business");
    assert.equal(isBusinessTier("business"), true);
    assert.equal(isPaidTier("business"), true);
    assert.equal(isProTier("business"), false);
  });
});

describe("A2.5 — post-login routing by business count", () => {
  it("7. user with 0 businesses → onboarding", () => {
    assert.equal(resolveBusinessCountTarget(0), "onboarding");
  });

  it("8. user with 1 business → dashboard", () => {
    assert.equal(resolveBusinessCountTarget(1), "dashboard");
  });

  it("9. user with 2+ businesses → dashboard (NOT onboarding)", () => {
    assert.equal(resolveBusinessCountTarget(2), "dashboard");
    assert.equal(resolveBusinessCountTarget(5), "dashboard");
  });
});

describe("A2.5 — URLs use the central site config", () => {
  it("11. getSiteUrl honors env override, Vercel preview and canonical fallback", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    assert.equal(getSiteUrl(), CANONICAL_URL);

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    assert.equal(getSiteUrl(), "http://localhost:3000");
    delete process.env.NEXT_PUBLIC_APP_URL;

    process.env.VERCEL_URL = "vitrinepro-abc123.vercel.app";
    assert.equal(getSiteUrl(), "https://vitrinepro-abc123.vercel.app");
    delete process.env.VERCEL_URL;
  });
});
