/**
 * tests/site.test.ts — A2.9
 * Central domain configuration.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_URL, CANONICAL_DOMAIN, getSiteUrl, getSiteUrlFromRequest } from "../lib/site.ts";

describe("site — canonical domain", () => {
  it("canonical domain is vitrinepro.pt", () => {
    assert.equal(CANONICAL_DOMAIN, "vitrinepro.pt");
    assert.equal(CANONICAL_URL, "https://vitrinepro.pt");
  });

  it("falls back to canonical when nothing is configured", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    assert.equal(getSiteUrl(), "https://vitrinepro.pt");
  });

  it("prefers NEXT_PUBLIC_APP_URL and strips trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.example.com/";
    delete process.env.VERCEL_URL;
    assert.equal(getSiteUrl(), "https://preview.example.com");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("supports Vercel previews via VERCEL_URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = "vitrinepro-git-x.vercel.app";
    assert.equal(getSiteUrl(), "https://vitrinepro-git-x.vercel.app");
    delete process.env.VERCEL_URL;
  });

  it("rejects invalid env URLs and falls back to canonical", () => {
    process.env.NEXT_PUBLIC_APP_URL = "not a url";
    delete process.env.VERCEL_URL;
    assert.equal(getSiteUrl(), "https://vitrinepro.pt");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("request-aware variant trusts a sane Host header", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    const req = new Request("https://x/", {
      headers: { host: "vitrinepro.pt", "x-forwarded-proto": "https" },
    });
    assert.equal(getSiteUrlFromRequest(req), "https://vitrinepro.pt");
  });

  it("request-aware variant rejects hostile Host headers", () => {
    const req = new Request("https://x/", {
      headers: { host: "evil.com/../x", "x-forwarded-proto": "https" },
    });
    assert.equal(getSiteUrlFromRequest(req), "https://vitrinepro.pt");
  });
});
