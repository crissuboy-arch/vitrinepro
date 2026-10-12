/**
 * tests/owner-security.test.ts — Segurança das rotas Owner/transfer
 *
 * Análise estática (mesmo padrão de tests/admin-security.test.ts):
 * - transfer/impact/entitlement usam requireAdmin / verificação server-side;
 * - transferência exige confirmação explícita e nunca toca em slugs protegidos;
 * - nenhum caminho altera business.plan para contornar o Stripe;
 * - service_role nunca no browser; sem localStorage para privilégios.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

describe("transfer: autorização e confirmação", () => {
  const src = read("app/api/admin/businesses/[id]/transfer/route.ts");

  it("exige requireAdmin", () => {
    assert.ok(src.includes("requireAdmin()"), "admin obrigatório");
  });
  it("exige confirmação explícita", () => {
    assert.ok(src.includes("confirm !== true"), "confirm:true obrigatório");
  });
  it("destino tem de existir (nunca inventa utilizador)", () => {
    assert.ok(
      src.includes("Utilizador de destino não encontrado"),
      "recusa destino inexistente"
    );
  });
  it("slugs protegidos nunca transferidos", () => {
    assert.ok(src.includes("turma-da-monica"), "protege turma-da-monica");
    assert.ok(src.includes("objetiva-metal"), "protege objetiva-metal");
    assert.ok(src.includes("cantinho-da-lu"), "protege cantinho-da-lu");
  });
  it("audita a transferência", () => {
    assert.ok(src.includes('adminLog("businesses.transfer"'), "audit log");
    assert.ok(src.includes("from_user_id"), "regista origem");
    assert.ok(src.includes("to_user_id"), "regista destino");
  });
  it("não altera plan (trigger anti-escalação intacto)", () => {
    assert.ok(!src.includes("plan:"), "nenhuma escrita em plan");
    assert.ok(src.includes("user_id: destId"), "só muda user_id");
  });
});

describe("impact: somente leitura", () => {
  const src = read("app/api/admin/businesses/[id]/impact/route.ts");
  it("exige requireAdmin", () => {
    assert.ok(src.includes("requireAdmin()"), "admin obrigatório");
  });
  it("não exclui nada", () => {
    assert.ok(!src.includes(".delete("), "sem delete");
    assert.ok(src.includes("Somente leitura"), "declara read-only");
  });
});

describe("entitlement: verificação server-side", () => {
  const lib = read("lib/owner-entitlement.ts");
  const route = read("app/api/auth/entitlement/route.ts");

  it("allowlist de owner separada da de admin", () => {
    assert.ok(lib.includes("PLATFORM_OWNER_EMAILS"), "env própria");
    assert.ok(
      !lib.includes("process.env.ADMIN_EMAILS"),
      "não lê a allowlist de admin"
    );
  });
  it("fallback não inclui o segundo admin", () => {
    assert.ok(
      !lib.includes("geralvitrinepropt@gmail.com"),
      "owner mais estreita que admin"
    );
  });
  it("rota entitlement verifica no servidor", () => {
    assert.ok(route.includes("supabase.auth.getUser()"), "sessão no servidor");
    assert.ok(route.includes("isOwnerEmail"), "usa o helper server-side");
  });
  it("sem service_role no browser / sem localStorage", () => {
    assert.ok(!lib.includes("window.localStorage"), "sem localStorage");
    assert.ok(!lib.includes("NEXT_PUBLIC"), "sem expor nada ao browser");
    const dash = read("app/dashboard/page.tsx");
    assert.ok(
      dash.includes("/api/auth/entitlement"),
      "dashboard consome o veredito do servidor"
    );
  });
});

describe("gates de API usam entitlement efetivo", () => {
  it("chat: gate com plano efetivo", () => {
    const src = read("app/api/chat/route.ts");
    assert.ok(src.includes("effectivePlanId"), "usa effectivePlanId");
    assert.ok(src.includes("getOwnerUserIds"), "resolve owners no servidor");
  });
  it("short-links: gate com plano efetivo", () => {
    const src = read("app/api/short-links/route.ts");
    assert.ok(src.includes("effectivePlanId"), "usa effectivePlanId");
  });
  it("generate-catalog: gate com plano efetivo", () => {
    const src = read("app/api/generate-catalog/route.ts");
    assert.ok(src.includes("effectivePlanId"), "usa effectivePlanId");
  });
  it("nenhum gate grava plan no banco", () => {
    for (const p of [
      "app/api/chat/route.ts",
      "app/api/short-links/route.ts",
      "app/api/generate-catalog/route.ts",
    ]) {
      const src = read(p);
      assert.ok(!src.includes("plan:"), `${p} não escreve plan`);
    }
  });
});
