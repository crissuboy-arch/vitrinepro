/**
 * tests/plans.test.ts — A2.8/A2.10
 * Central source of truth for prices and entitlements.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLANS,
  CHECKOUT_PLANS,
  BUSINESS_CHECKOUT_ENABLED,
  normalizePlan,
  planHasChatbot,
  getStripePriceId,
} from "../lib/plans.ts";

describe("PLANS — source of truth", () => {
  it("temporary commercial reference: €0 / €12 / €29,90", () => {
    assert.equal(PLANS.free.priceEur, 0);
    assert.equal(PLANS.pro.priceEur, 12);
    assert.equal(PLANS.business.priceEur, 29.9);
    assert.equal(PLANS.business.priceLabel, "€29,90");
  });

  it("normalizes legacy aliases without escalating privileges", () => {
    assert.equal(normalizePlan("pro"), "pro");
    assert.equal(normalizePlan("premium"), "pro");
    assert.equal(normalizePlan("gold"), "pro");
    assert.equal(normalizePlan("business"), "business");
    assert.equal(normalizePlan("free"), "free");
    assert.equal(normalizePlan("hacker"), "free");
    assert.equal(normalizePlan(null), "free");
    assert.equal(normalizePlan(undefined), "free");
  });

  it("chatbot entitlement is server-side: only pro/business", () => {
    assert.equal(planHasChatbot("free"), false);
    assert.equal(planHasChatbot("pro"), true);
    assert.equal(planHasChatbot("premium"), true);
    assert.equal(planHasChatbot("business"), true);
    assert.equal(planHasChatbot("anything-else"), false);
  });

  it("checkout allowlist contains only plans on sale now (Business reserved for phase 2)", () => {
    // Launch decision 21/10/2026: only Free + Pro are sold; Business
    // entitlements/prices above stay untouched for existing subscribers.
    assert.equal(BUSINESS_CHECKOUT_ENABLED, false);
    assert.deepEqual([...CHECKOUT_PLANS].sort(), ["pro"]);
  });

  it("Stripe price IDs come from env only — never hard-coded", () => {
    delete process.env.STRIPE_PRICE_PREMIUM;
    delete process.env.STRIPE_PRICE_BUSINESS;
    assert.equal(getStripePriceId("pro"), null);
    assert.equal(getStripePriceId("business"), null);
    assert.equal(getStripePriceId("free"), null);
    process.env.STRIPE_PRICE_PREMIUM = "price_test_pro";
    assert.equal(getStripePriceId("pro"), "price_test_pro");
    delete process.env.STRIPE_PRICE_PREMIUM;
  });
});
