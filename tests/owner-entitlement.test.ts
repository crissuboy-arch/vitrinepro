/**
 * tests/owner-entitlement.test.ts — Entitlement da proprietária
 *
 * Testa lib/owner-entitlement.ts (lógica pura, sem DB/rede).
 *
 * Propriedades garantidas:
 * - Montra da owner → entitlement "business" (sem Stripe, sem gravar plano).
 * - Qualquer outra Montra → plano normalizado do banco (nunca escalado).
 * - Consumidor/merchant nunca recebem privilégios de owner.
 * - Owner é mais estreita que admin (allowlist própria).
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getOwnerEmails,
  isOwnerEmail,
  effectivePlanId,
  __resetOwnerIdsCacheForTests,
} from "../lib/owner-entitlement.ts";

const ORIGINAL_ENV = process.env.PLATFORM_OWNER_EMAILS;

beforeEach(() => {
  delete process.env.PLATFORM_OWNER_EMAILS;
  __resetOwnerIdsCacheForTests();
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.PLATFORM_OWNER_EMAILS;
  else process.env.PLATFORM_OWNER_EMAILS = ORIGINAL_ENV;
});

describe("owner-entitlement", () => {
  it("owner business → entitlement business (mesmo com plano free gravado)", () => {
    assert.equal(effectivePlanId("free", true), "business");
    assert.equal(effectivePlanId("pro", true), "business");
    assert.equal(effectivePlanId(null, true), "business");
  });

  it("não-owner → plano do banco, nunca escalado", () => {
    assert.equal(effectivePlanId("free", false), "free");
    assert.equal(effectivePlanId("pro", false), "pro");
    assert.equal(effectivePlanId("business", false), "business");
    assert.equal(effectivePlanId("premium", false), "pro"); // alias legado
    assert.equal(effectivePlanId("gold", false), "pro"); // alias legado
    assert.equal(effectivePlanId("hacker", false), "free"); // desconhecido → free
    assert.equal(effectivePlanId(null, false), "free");
  });

  it("isOwnerEmail: case-insensitive, allowlist própria", () => {
    assert.equal(isOwnerEmail("cris.suboy@gmail.com"), true);
    assert.equal(isOwnerEmail("CRIS.SUBOY@GMAIL.COM"), true);
    assert.equal(isOwnerEmail("geralvitrinepropt@gmail.com"), false); // admin ≠ owner
    assert.equal(isOwnerEmail("cliente@loja.pt"), false);
    assert.equal(isOwnerEmail(null), false);
    assert.equal(isOwnerEmail(""), false);
  });

  it("PLATFORM_OWNER_EMAILS no env substitui o fallback", () => {
    process.env.PLATFORM_OWNER_EMAILS = "dona@vitrinepro.digital, outra@x.pt";
    assert.deepEqual(getOwnerEmails(), [
      "dona@vitrinepro.digital",
      "outra@x.pt",
    ]);
    assert.equal(isOwnerEmail("dona@vitrinepro.digital"), true);
    assert.equal(isOwnerEmail("cris.suboy@gmail.com"), false);
  });

  it("fallback padrão é só a cris (não todos os admins)", () => {
    assert.deepEqual(getOwnerEmails(), ["cris.suboy@gmail.com"]);
  });
});
