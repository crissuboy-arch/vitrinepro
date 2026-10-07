/**
 * tests/critical-a10.test.ts — A10.1
 * Testes negativos obrigatórios para os bloqueadores críticos.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

describe("CRITICAL 1 — Plan escalation", () => {
  it("stripe_mock removido do dashboard", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(!src.includes("stripe_mock"), "sem stripe_mock");
  });
  it("migration de proteção preparada (não aplicada)", () => {
    const src = read("supabase/migrations/20261007000016_prevent_plan_escalation.sql");
    assert.ok(src.includes("prevent_plan_escalation"), "trigger preparada");
    assert.ok(src.includes("NÃO APLICAR"), "marcada como proposta");
  });
});

describe("CRITICAL 2 — Stripe schema", () => {
  it("migration de colunas preparada", () => {
    const src = read("supabase/migrations/20261007000017_stripe_columns.sql");
    assert.ok(src.includes("stripe_customer_id"), "coluna customer");
    assert.ok(src.includes("stripe_subscription_id"), "coluna subscription");
    assert.ok(src.includes("subscription_cancel_at"), "coluna cancel_at");
  });
});

describe("CRITICAL 3 — Webhook idempotency", () => {
  it("não registra antes de processar", () => {
    const src = read("app/api/stripe/webhook/route.ts");
    // O insert agora acontece DEPOIS do processamento
    const insertPos = src.indexOf('.from("stripe_events")\n      .insert');
    const checkPos = src.indexOf("alreadyProcessed");
    assert.ok(checkPos < insertPos, "check antes, insert depois");
  });
  it("marca como processado após sucesso", () => {
    const src = read("app/api/stripe/webhook/route.ts");
    assert.ok(src.includes("marca como processado SÓ após sucesso"), "documentado");
  });
});

describe("CRITICAL 4 — Parallel subscriptions", () => {
  it("checkout reutiliza subscription existente", () => {
    const src = read("app/api/stripe/checkout/route.ts");
    assert.ok(src.includes("stripe_subscription_id"), "verifica existente");
    assert.ok(src.includes("billingPortal"), "usa portal para upgrade");
  });
});

describe("CRITICAL 5 — A7/A8 business search", () => {
  it("is_featured removido dos selects", () => {
    for (const p of ["app/api/intelligence/search/route.ts", "app/api/vitrine/ask/route.ts"]) {
      const src = read(p);
      assert.ok(!src.includes("is_featured"), `${p} sem is_featured`);
    }
  });
  it("erro de banco não vira zero results", () => {
    for (const p of ["app/api/intelligence/search/route.ts", "app/api/vitrine/ask/route.ts"]) {
      const src = read(p);
      assert.ok(src.includes("search_error") || src.includes("Database error"), `${p} diferencia erro`);
    }
  });
  it("ranking sem is_featured", () => {
    const src = read("lib/intelligence/ranking.ts");
    assert.ok(!src.includes("isFeatured"), "sem bónus de featured");
  });
});

describe("CRITICAL 6 — JSON-LD XSS", () => {
  it("helper safeJsonLd existe", () => {
    const src = read("lib/jsonld.ts");
    assert.ok(src.includes("\\\\u003c"), "escapa <");
  });
  it("páginas usam safeJsonLd", () => {
    for (const p of ["app/vitrine/[slug]/page.tsx", "app/produto/[slug]/page.tsx"]) {
      const src = read(p);
      assert.ok(src.includes("safeJsonLd"), `${p} usa helper`);
      assert.ok(!src.includes("JSON.stringify(jsonLd)") || src.includes("safeJsonLd"), "sem stringify direto");
    }
  });
  it("payload </script> neutralizado", async () => {
    const { safeJsonLd } = await import("../lib/jsonld.ts");
    const evil = { name: '</script><script>TEST</script>' };
    const out = safeJsonLd(evil);
    assert.ok(!out.includes("</script>"), "sem fechamento de script");
    assert.ok(out.includes("\\u003c"), "escapado");
  });
});

describe("CRITICAL 7 — Posts visibility", () => {
  it("isNovidadeVisibleNow bloqueia produto oculto", () => {
    const src = read("lib/novidades.ts");
    assert.ok(src.includes("produto oculto"), "verificação adicionada");
  });
  it("A7/A8 filtram posts de produtos ocultos", () => {
    for (const p of ["app/api/intelligence/search/route.ts", "app/api/vitrine/ask/route.ts"]) {
      const src = read(p);
      assert.ok(src.includes("products!left"), `${p} join products`);
    }
  });
});
