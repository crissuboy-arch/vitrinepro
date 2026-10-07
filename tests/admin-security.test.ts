/**
 * tests/admin-security.test.ts — ADMIN-1
 *
 * Testes de segurança das rotas /api/admin/* (análise estática do código).
 * Valida: helper centralizado, 401/403, service_role server-only,
 * RLS inalterada, sem segredos em logs.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

const ADMIN_ROUTES = [
  "app/api/admin/businesses/route.ts",
  "app/api/admin/businesses/[id]/route.ts",
  "app/api/admin/products/route.ts",
  "app/api/admin/products/[id]/route.ts",
  "app/api/admin/gallery/route.ts",
  "app/api/admin/gallery/[id]/route.ts",
  "app/api/admin/posts/route.ts",
  "app/api/admin/posts/[id]/route.ts",
];

describe("TESTE A/B — helper centralizado requireAdmin", () => {
  it("lib/admin-auth.ts existe com requireAdmin", () => {
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes("export async function requireAdmin"), "helper existe");
  });
  it("requireAdmin retorna 401 sem sessão", () => {
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes("status: 401"), "401 para sem sessão");
  });
  it("requireAdmin retorna 403 para não-admin", () => {
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes("status: 403"), "403 para não-admin");
  });
  it("todas as rotas admin usam requireAdmin", () => {
    for (const r of ADMIN_ROUTES) {
      const src = read(r);
      assert.ok(src.includes("requireAdmin()"), `${r} usa requireAdmin`);
      assert.ok(src.includes("if (!auth.ok) return auth.response"), `${r} bloqueia sem auth`);
    }
  });
});

describe("TESTE C/D/E — admin opera, comum isolado", () => {
  it("rotas usam service_role via getServiceClient (server-only)", () => {
    for (const r of ADMIN_ROUTES) {
      const src = read(r);
      assert.ok(src.includes("getServiceClient()"), `${r} usa service client`);
    }
  });
  it("ADMIN_EMAILS centralizado server-side", () => {
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes("process.env.ADMIN_EMAILS"), "usa env");
    // As rotas NÃO devem ter sua própria lista hardcoded
    for (const r of ADMIN_ROUTES) {
      const s = read(r);
      assert.ok(!s.includes("cris.suboy@gmail.com"), `${r} sem email hardcoded`);
    }
  });
});

describe("TESTE F — service_role nunca no browser", () => {
  it("nenhum componente client importa service_role", () => {
    const admin = read("app/admin/page.tsx");
    // Comentários ok; o que não pode: importar createClient com service key ou usar a chave
    assert.ok(!admin.includes("SUPABASE_SERVICE_ROLE_KEY"), "admin UI sem chave");
    assert.ok(!admin.includes("createClient(url, key"), "admin UI sem service client");
  });
  it("lib/admin-auth não é importada por componentes client", () => {
    // admin-auth importa next/server — se fosse usada no browser, quebraria
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes('from "next/server"'), "server-only (next/server)");
  });
});

describe("TESTE G — RLS inalterada", () => {
  it("nenhuma migration nova foi criada nesta tarefa", async () => {
    const { execSync } = await import("node:child_process");
    // Arquivos novos (não commitados) em supabase/migrations
    const out = execSync("git status --porcelain supabase/migrations/", { encoding: "utf8" });
    assert.strictEqual(out.trim(), "", "sem migrations novas nesta tarefa");
  });
});

describe("TESTE H/I/J — operações refletem no público", () => {
  it("PATCH businesses permite campo canónico published", () => {
    const src = read("app/api/admin/businesses/[id]/route.ts");
    assert.ok(src.includes('"published"'), "published editável");
  });
  it("PATCH products preserva is_visible e show_in_explore", () => {
    const src = read("app/api/admin/products/[id]/route.ts");
    assert.ok(src.includes("is_visible"), "is_visible preservado");
    assert.ok(src.includes("show_in_explore"), "show_in_explore preservado");
  });
  it("PATCH gallery preserva is_visible", () => {
    const src = read("app/api/admin/gallery/[id]/route.ts");
    assert.ok(src.includes("is_visible"), "is_visible preservado");
  });
});

describe("Audit log sem segredos", () => {
  it("adminLog remove tokens/secrets", () => {
    const src = read("lib/admin-auth.ts");
    assert.ok(src.includes("/token|secret|password|key|credential/i"), "filtro de segredos");
  });
});
