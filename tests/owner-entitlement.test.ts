/**
 * tests/owner-entitlement.test.ts — Entitlement da proprietária
 *
 * Testa lib/owner-entitlement.ts (lógica pura, sem DB/rede).
 *
 * Propriedades garantidas:
 * - Montra da owner → entitlement "business" (sem Stripe, sem gravar plano).
 * - Qualquer outra Montra → plano normalizado do banco (nunca escalado).
 * - Consumidor/merchant nunca recebem privilégios de owner.
 * - Owner é uma allowlist EXPLÍCITA e própria (duas contas autorizadas);
 *   não concede automaticamente a outros administradores.
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

  it("isOwnerEmail: case-insensitive, as duas contas autorizadas", () => {
    assert.equal(isOwnerEmail("cris.suboy@gmail.com"), true);
    assert.equal(isOwnerEmail("geralvitrinepropt@gmail.com"), true);
    assert.equal(isOwnerEmail("GERALVITRINEPROPT@GMAIL.COM"), true);
    assert.equal(isOwnerEmail("outro.admin@gmail.com"), false); // admin não-owner
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

  it("fallback padrão: só as duas contas autorizadas (não outros admins)", () => {
    assert.deepEqual(getOwnerEmails(), [
      "cris.suboy@gmail.com",
      "geralvitrinepropt@gmail.com",
    ]);
  });
});
