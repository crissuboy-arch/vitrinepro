/**
 * tests/landing-auth.test.ts — UX/AUTH da landing page
 *
 * BUG: a landing não oferecia Entrar/Cadastrar no header — o visitante
 * precisava adivinhar rotas. Correção: header com estados por auth,
 * reutilizando as rotas reais existentes (sem inventar URLs).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("landing navbar — visitante", () => {
  it("tem Entrar a apontar para a rota real /login", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes('href="/login"'), "link para /login");
    assert.ok(src.includes(">Entrar<") || src.includes("Entrar\n"), "rótulo Entrar");
  });

  it("tem Cadastrar meu negócio (fluxo real via onCadastrar)", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes("Cadastrar meu negócio"), "rótulo Cadastrar meu negócio");
    // onCadastrar leva a /login?mode=signup (ver app/page.tsx)
    const page = read("app/page.tsx");
    assert.ok(page.includes('"/login?mode=signup"'), "cadastro usa /login?mode=signup");
  });
});

describe("landing navbar — autenticado", () => {
  it("mostra AccountMenu para o logado e esconde Entrar/Cadastrar", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes("<AccountMenu"), "chip de conta para o logado");
    // Condicional por estado de auth — nunca os dois ao mesmo tempo
    assert.ok(src.includes("isLoggedIn ?"), "render condicional por login");
  });

  it("usa o AuthProvider existente (sem novo sistema de auth)", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes("useAuth"), "usa useAuth existente");
    assert.ok(src.includes("SupabaseAuthContext"), "do contexto existente");
  });
});

describe("landing navbar — mobile", () => {
  it("drawer tem as mesmas ações (Entrar / Cadastrar / Conta)", () => {
    const src = read("components/landing/Navbar.tsx");
    const drawer = src.slice(src.indexOf("Mobile drawer"));
    assert.ok(drawer.includes('href="/login"'), "Entrar no drawer");
    assert.ok(drawer.includes("Cadastrar meu negócio"), "Cadastrar no drawer");
    assert.ok(drawer.includes("<AccountMenu"), "chip de conta no drawer");
  });
});

describe("landing navbar — sem regressão de rotas", () => {
  it("não inventa rotas de auth", () => {
    const src = read("components/landing/Navbar.tsx");
    const hrefs = [...src.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const allowed = ["/", "/login", "/dashboard"];
    const anchors = ["#solucao", "#planos", "#depoimentos", "#faq"];
    for (const h of hrefs) {
      assert.ok(
        allowed.includes(h) || anchors.includes(h),
        `rota inesperada no navbar: ${h}`
      );
    }
  });
});
