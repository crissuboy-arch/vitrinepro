/**
 * tests/admin-pro-grant.test.ts — Pro ADMINISTRATIVO (cortesia, sem Stripe).
 *
 * Correção Cantinho da Lu (2026-10-28):
 *   * Um Pro concedido pela admin (sem subscrição Stripe) era apagável por
 *     rotinas Stripe: webhook customer.subscription.deleted fazia plan='free'
 *     e o cancel, sem subscription id, comentava "plan was set manually,
 *     downgrade immediately" e fazia plan='free'.
 *   * A distinção nova é a flag `businesses.admin_pro_grant`
 *     (migration 20261028000022): enquanto ativa, NENHUMA rotina Stripe
 *     pode rebaixar o plano; só a admin concede/revoga.
 *
 * Regras protegidas:
 *   1. Webhook deleted e cancel saltam o rebaixamento com concessão ativa
 *      (mas continuam a limpar os campos Stripe obsoletos).
 *   2. PATCH admin: conceder sem plan → pro; revogar não muda o plano;
 *      rebaixar para free com concessão ativa sem revogar → rejeitado.
 *   3. "Ocultar do Explorar" continua independente de publicado e de plano.
 *   4. Descoberta pública: só `show_in_explore === false` oculta;
 *      ausente (pré-migration) conta como visível.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  hasAdminProGrant,
  shouldSkipStripeDowngrade,
  resolveAdminProPatch,
} from "../lib/admin-pro.ts";
import { isDiscoverableBusiness } from "../lib/visibility.ts";

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const NOW = "2026-10-28T12:00:00.000Z";

const MIGRATION = "supabase/migrations/20261028000022_businesses_admin_pro_grant.sql";

describe("Admin Pro grant — migration", () => {
  it("migration exists, adds the flag additively, default false", () => {
    assert.ok(existsSync(join(root, MIGRATION)), "migration file must exist");
    const sql = read(MIGRATION);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS admin_pro_grant BOOLEAN NOT NULL DEFAULT false/);
  });

  it("migration never grants anyone by default (no executable backfill to true)", () => {
    const sql = read(MIGRATION);
    const executable = sql
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("--"))
      .join("\n");
    assert.doesNotMatch(executable, /SET admin_pro_grant\s*=\s*true/i);
    assert.doesNotMatch(executable, /UPDATE\s+public\.businesses/i);
  });
});

describe("hasAdminProGrant / shouldSkipStripeDowngrade", () => {
  it("true só com flag true explícita", () => {
    assert.equal(hasAdminProGrant({ admin_pro_grant: true }), true);
    assert.equal(hasAdminProGrant({ admin_pro_grant: false }), false);
    assert.equal(hasAdminProGrant({ admin_pro_grant: null }), false);
    assert.equal(hasAdminProGrant({}), false);
    assert.equal(hasAdminProGrant(null), false);
    assert.equal(hasAdminProGrant(undefined), false);
  });

  it("rotina Stripe salta o rebaixamento só com concessão ativa", () => {
    assert.equal(shouldSkipStripeDowngrade({ plan: "pro", admin_pro_grant: true }), true);
    assert.equal(shouldSkipStripeDowngrade({ plan: "pro", admin_pro_grant: false }), false);
    assert.equal(shouldSkipStripeDowngrade({ plan: "pro" }), false);
    // Sem concessão, um Pro pago continua a poder ser rebaixado.
    assert.equal(shouldSkipStripeDowngrade({ plan: "business", admin_pro_grant: false }), false);
  });
});

describe("resolveAdminProPatch — semântica do PATCH admin", () => {
  it("conceder sem plan → plan='pro' + carimbo", () => {
    assert.deepEqual(resolveAdminProPatch({ plan: "free" }, { admin_pro_grant: true }, NOW), {
      apply: { admin_pro_grant: true, admin_pro_granted_at: NOW, plan: "pro" },
    });
  });

  it("conceder com plan explícito respeita o plan", () => {
    assert.deepEqual(
      resolveAdminProPatch({ plan: "free" }, { admin_pro_grant: true, plan: "business" }, NOW),
      { apply: { admin_pro_grant: true, admin_pro_granted_at: NOW } }
    );
  });

  it("revogar limpa flag e carimbo, NÃO toca no plano", () => {
    assert.deepEqual(resolveAdminProPatch({ plan: "pro", admin_pro_grant: true }, { admin_pro_grant: false }, NOW), {
      apply: { admin_pro_grant: false, admin_pro_granted_at: null },
    });
  });

  it("concessão ativa + plan='free' sem revogar → REJEITADO", () => {
    const r = resolveAdminProPatch({ plan: "pro", admin_pro_grant: true }, { plan: "free" }, NOW);
    assert.ok(r.error, "deve rejeitar o rebaixamento silencioso");
    assert.deepEqual(r.apply, {});
  });

  it("concessão ativa + plan='free' COM revogar → permitido", () => {
    const r = resolveAdminProPatch(
      { plan: "pro", admin_pro_grant: true },
      { plan: "free", admin_pro_grant: false },
      NOW
    );
    assert.equal(r.error, undefined);
    assert.deepEqual(r.apply, { admin_pro_grant: false, admin_pro_granted_at: null });
  });

  it("concessão ativa + plan='pro' → permitido, flag mantém-se", () => {
    const r = resolveAdminProPatch({ plan: "pro", admin_pro_grant: true }, { plan: "pro" }, NOW);
    assert.equal(r.error, undefined);
    assert.deepEqual(r.apply, {});
  });
});

describe("isDiscoverableBusiness — ocultar ≠ despublicar", () => {
  it("publicada + visível → descoberta", () => {
    assert.equal(isDiscoverableBusiness({ published: true, show_in_explore: true }), true);
  });

  it("publicada + oculta → fora da descoberta (mas continua publicada)", () => {
    assert.equal(isDiscoverableBusiness({ published: true, show_in_explore: false }), false);
  });

  it("publicada + coluna ausente (pré-migration) → descoberta", () => {
    assert.equal(isDiscoverableBusiness({ published: true }), true);
    assert.equal(isDiscoverableBusiness({ published: true, show_in_explore: null }), true);
  });

  it("não publicada nunca está na descoberta, mesmo visível", () => {
    assert.equal(isDiscoverableBusiness({ published: false, show_in_explore: true }), false);
    assert.equal(isDiscoverableBusiness({ published: null, show_in_explore: true }), false);
    assert.equal(isDiscoverableBusiness(null), false);
  });
});

describe("Admin Pro grant — rotas Stripe respeitam a concessão", () => {
  it("webhook deleted: lê a flag e preserva o plano com concessão", () => {
    const src = read("app/api/stripe/webhook/route.ts");
    assert.match(src, /shouldSkipStripeDowngrade/);
    assert.match(src, /Pro administrativo PRESERVADO/);
    // O ramo com concessão atualiza só campos Stripe, sem plan='free'.
    const deletedBlock = src.split('event.type === "customer.subscription.deleted"')[1];
    assert.ok(deletedBlock.includes("stripe_subscription_status: \"canceled\""));
  });

  it("cancel: lê a flag, preserva com concessão, mantém o rebaixamento sem ela", () => {
    const src = read("app/api/stripe/cancel/route.ts");
    assert.match(src, /shouldSkipStripeDowngrade/);
    assert.match(src, /admin_grant_preserved/);
    // Sem concessão, o comportamento antigo (rebaixar) mantém-se.
    assert.match(src, /plan: "free", subscription_cancel_at: null/);
  });

  it("dashboard: com concessão preservada, nunca mostra 'Grátis'", () => {
    const src = read("app/dashboard/page.tsx");
    assert.match(src, /data\.admin_grant_preserved/);
    assert.match(src, /não depende de uma assinatura/);
  });
});

describe("Admin Pro grant — API admin + UI", () => {
  it("PATCH whitelist aceita admin_pro_grant", () => {
    const route = read("app/api/admin/businesses/[id]/route.ts");
    assert.match(route, /"admin_pro_grant"/);
    assert.match(route, /resolveAdminProPatch/);
  });

  it("lista admin devolve admin_pro_grant com fallback pré-migration", () => {
    const route = read("app/api/admin/businesses/route.ts");
    assert.match(route, /admin_pro_grant/);
    assert.match(route, /admin_pro_grant: false/);
  });

  it("UI admin tem o controlo 'Pro admin' com concessão/revogação", () => {
    const page = read("app/admin/page.tsx");
    assert.match(page, /toggleAdminPro/);
    assert.match(page, /Pro admin/);
    assert.match(page, /admin_pro_grant: next/);
  });

  it("despublicar no admin e no dashboard exige confirmação", () => {
    const admin = read("app/admin/page.tsx");
    assert.match(admin, /Despublicar "\$\{biz\.name\}"/);
    const dash = read("app/dashboard/page.tsx");
    assert.match(dash, /Despublicar "\$\{business\.name\}"/);
  });
});
