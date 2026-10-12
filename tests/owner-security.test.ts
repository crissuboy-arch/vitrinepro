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

/** Extrai os emails do DEFAULT_OWNER_EMAILS no código-fonte. */
function getFallbackEmails(src: string): string[] {
  const m = src.match(/DEFAULT_OWNER_EMAILS\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

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
    const m = src.match(/PROTECTED_SLUGS\s*=\s*\[([\s\S]*?)\]/);
    assert.ok(m, "array PROTECTED_SLUGS existe");
    assert.ok(
      !m[1].includes("cantinho-da-lu"),
      "cantinho-da-lu fora da blocklist por autorização explícita (2026-10-12)"
    );
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

describe("entrega de contas: convite seguro", () => {
  const src = read("app/api/admin/invites/route.ts");

  it("exige requireAdmin", () => {
    assert.ok(src.includes("requireAdmin()"), "admin obrigatório");
  });
  it("nunca cria senha padrão partilhada", () => {
    assert.ok(!src.toLowerCase().includes("password"), "sem senha no código");
    assert.ok(
      src.includes("inviteUserByEmail"),
      "convite do Supabase (link único)"
    );
  });
  it("não reenvia convite se a conta já existe", () => {
    assert.ok(src.includes("already_exists"), "devolve conta existente");
  });
  it("valida o formato do email", () => {
    assert.ok(src.includes("Email inválido"), "recusa email inválido");
  });
  it("audita o convite", () => {
    assert.ok(src.includes('adminLog("users.invite"'), "audit log");
  });
});

describe("transfer: identidade do destino confirmada", () => {
  const src = read("app/api/admin/businesses/[id]/transfer/route.ts");
  it("exige email confirmado da conta de destino", () => {
    assert.ok(
      src.includes("email_confirmed_at"),
      "verifica confirmação de email"
    );
    assert.ok(src.includes("409"), "recusa destino não verificado");
  });
});

describe("handover UI: transferência só com confirmação explícita", () => {
  const src = read("app/admin/handover.tsx");

  it("usa os endpoints Super Admin existentes", () => {
    assert.ok(src.includes("/api/admin/businesses?q="), "localiza pelo slug");
    assert.ok(src.includes("/api/admin/invites"), "verifica/convida conta");
    assert.ok(src.includes("/impact"), "inventário read-only");
    assert.ok(src.includes("/transfer"), "transferência");
  });
  it("nunca executa sem confirmação explícita", () => {
    assert.ok(src.includes("confirm: true"), "envia confirm:true");
    assert.ok(src.includes("window.confirm"), "dupla confirmação no browser");
    // O botão só ativa com checkbox + conta verificada + inventário.
    assert.ok(src.includes("dest.email_confirmed"), "bloqueia destino não verificado");
    assert.ok(src.includes("canTransfer"), "gate de ativação do botão");
  });
  it("não pede UUIDs à administradora", () => {
    assert.ok(!src.toLowerCase().includes("cole o uuid"), "sem UUID manual");
    assert.ok(src.includes("IDs resolvidos internamente"), "resolve no servidor");
  });
  it("não toca em Stripe, plano ou RLS", () => {
    assert.ok(!src.toLowerCase().includes("stripe"), "sem Stripe");
    assert.ok(!src.includes("plan:"), "não altera plano");
  });
  it("aba integrada no painel existente", () => {
    const page = read("app/admin/page.tsx");
    assert.ok(page.includes('"handover"'), "tab registada");
    assert.ok(page.includes("HandoverPanel"), "componente integrado");
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
  it("fallback contém exatamente as duas contas autorizadas", () => {
    const src = read("lib/owner-entitlement.ts");
    assert.ok(src.includes("cris.suboy@gmail.com"), "conta Cris");
    assert.ok(src.includes("geralvitrinepropt@gmail.com"), "conta VitrinePro");
    assert.equal(
      getFallbackEmails(src).length,
      2,
      "nenhum outro email no fallback"
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
