/**
 * tests/analytics-guard.test.ts — A2.2
 * Event allowlist, id guard and dedup for /api/analytics.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_EVENTS,
  isAllowedEvent,
  isUuidLike,
  makeDeduper,
} from "../lib/analytics-guard.ts";

describe("analytics event allowlist", () => {
  it("only the public events are accepted (A4 adds discovery clicks)", () => {
    assert.deepEqual([...ALLOWED_EVENTS], [
      "page_view",
      "whatsapp_click",
      "product_view",
      "business_result_click",
      "product_result_click",
    ]);
    assert.equal(isAllowedEvent("page_view"), true);
    assert.equal(isAllowedEvent("whatsapp_click"), true);
    assert.equal(isAllowedEvent("product_view"), true);
    assert.equal(isAllowedEvent("business_result_click"), true);
    assert.equal(isAllowedEvent("product_result_click"), true);
    assert.equal(isAllowedEvent("purchase"), false);
    assert.equal(isAllowedEvent(""), false);
    assert.equal(isAllowedEvent(null), false);
    assert.equal(isAllowedEvent({ event_type: "page_view" }), false);
  });
});

describe("business id guard", () => {
  it("accepts uuid-like ids, rejects arbitrary payloads", () => {
    assert.equal(isUuidLike("b1111111-1111-4111-a111-111111111111"), true);
    assert.equal(isUuidLike("short"), false);
    assert.equal(isUuidLike("x".repeat(65)), false);
    assert.equal(isUuidLike("../../etc/passwd"), false);
    assert.equal(isUuidLike("a".repeat(8) + "; DROP TABLE"), false);
    assert.equal(isUuidLike(null), false);
  });
});

describe("deduper", () => {
  it("drops repeats inside the window, allows after it", () => {
    const d = makeDeduper(5_000);
    const now = 10_000;
    assert.equal(d.isDuplicate("ip:biz:page_view", now), false);
    assert.equal(d.isDuplicate("ip:biz:page_view", now + 1_000), true);
    assert.equal(d.isDuplicate("ip:biz:whatsapp_click", now + 1_000), false);
    assert.equal(d.isDuplicate("ip:biz:page_view", now + 5_001), false);
  });
});
