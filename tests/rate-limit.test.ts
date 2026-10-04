/**
 * tests/rate-limit.test.ts — A2.1/A2.2
 * Run: npm test   (node --test, zero dependencies)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, getClientIp, __resetRateLimitsForTests } from "../lib/rate-limit.ts";

describe("rateLimit — sliding window", () => {
  it("allows up to maxHits inside the window, then blocks", () => {
    __resetRateLimitsForTests();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit("k1", 5, 60_000, now + i);
      assert.equal(r.allowed, true);
    }
    const blocked = rateLimit("k1", 5, 60_000, now + 5);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs > 0);
  });

  it("slides: old hits expire and allow again", () => {
    __resetRateLimitsForTests();
    const now = 2_000_000;
    rateLimit("k2", 1, 1_000, now);
    assert.equal(rateLimit("k2", 1, 1_000, now + 500).allowed, false);
    assert.equal(rateLimit("k2", 1, 1_000, now + 1_001).allowed, true);
  });

  it("isolates different keys", () => {
    __resetRateLimitsForTests();
    const now = 3_000_000;
    rateLimit("a", 1, 60_000, now);
    assert.equal(rateLimit("b", 1, 60_000, now).allowed, true);
  });
});

describe("getClientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const req = new Request("https://x/", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.equal(getClientIp(req), "1.2.3.4");
  });

  it("falls back to x-real-ip and then 'unknown'", () => {
    const r1 = new Request("https://x/", { headers: { "x-real-ip": "9.9.9.9" } });
    assert.equal(getClientIp(r1), "9.9.9.9");
    assert.equal(getClientIp(new Request("https://x/")), "unknown");
  });
});
