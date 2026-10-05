/**
 * tests/account-menu.test.ts — Menu de conta/sessão (padrão SaaS)
 *
 * Requisito: identificar a conta autenticada sem expor user_id/UUID,
 * com Sair e Trocar de conta seguros.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("AccountMenu — identificação da sessão", () => {
  it("usa o e-mail REAL da sessão autenticada (user.email)", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("user?.email"), "lê user.email da sessão");
  });

  it("mostra nome quando disponível + e-mail", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("display_name"), "nome do perfil quando houver");
    assert.ok(src.includes("Sessão"), "rótulo de sessão");
  });

  it("NUNCA expõe user_id/UUID", () => {
    const src = read("components/auth/AccountMenu.tsx");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\/\/.*$/gm, "");
    assert.ok(!code.includes("user_id"), "sem user_id no código");
    assert.ok(!code.includes("user.id"), "sem user.id no código");
  });

  it("não tem e-mail hardcoded", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(!src.includes("@gmail.com"), "sem gmail hardcoded");
    assert.ok(!/@[a-z]+\.[a-z]+/.test(src), "sem e-mail literal");
  });
});

describe("AccountMenu — ações", () => {
  it("tem Meu Painel → /dashboard", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("Meu Painel"), "item Meu Painel");
    assert.ok(src.includes('href="/dashboard"'), "aponta para /dashboard");
  });

  it("Trocar de conta faz logout e vai para /login", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("Trocar de conta"), "item Trocar de conta");
    assert.ok(src.includes('doSignOut("/login")'), "logout → /login");
  });

  it("Sair encerra a sessão de verdade (signOut)", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("await signOut()"), "chama signOut do contexto");
    assert.ok(src.includes('doSignOut("/")'), "Sair → /");
    assert.ok(src.includes("window.location.href = target"), "reload real após logout");
  });

  it("usa o signOut do AuthProvider existente (sem novo sistema)", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("SupabaseAuthContext"), "contexto existente");
  });
});

describe("AccountMenu — integração", () => {
  it("dashboard usa AccountMenu nos dois headers (conta + gerenciar)", () => {
    const src = read("app/dashboard/page.tsx");
    const uses = (src.match(/<AccountMenu \/>/g) || []).length;
    assert.equal(uses, 2, `esperava 2 usos, achei ${uses}`);
    assert.ok(!src.includes("handleLogout"), "botão Sair antigo removido");
  });

  it("navbar da landing usa AccountMenu para o logado", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes("<AccountMenu"), "AccountMenu no navbar");
    // Logado agora vê o chip de conta (com Minhas Montras dentro), não o botão antigo
    assert.ok(!src.includes(">Meu Painel<"), "botão antigo removido");
  });

  it("menu fecha com Escape e clique fora", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes('"Escape"'), "fecha com Escape");
    assert.ok(src.includes("mousedown"), "fecha ao clicar fora");
  });
});

describe("AccountMenu — logout robusto (sessão nunca presa)", () => {
  it("doSignOut usa reload real (window.location.href), não router.push+refresh", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("window.location.href = target"), "reload real");
    assert.ok(!src.includes("router.push(target)"), "sem router.push no logout");
    assert.ok(!src.includes("router.refresh()"), "sem refresh após push");
  });

  it("tem variante compacta (avatar discreto, sem nome/e-mail no header)", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("compact"), "prop compact");
    assert.ok(src.includes("!compact"), "texto só quando não-compacto");
  });

  it("menu do avatar tem Meu Painel / Gestão da conta / Trocar de conta / Sair", () => {
    const src = read("components/auth/AccountMenu.tsx");
    for (const item of ["Meu Painel", "Gestão da conta", "Trocar de conta", "Sair"]) {
      assert.ok(src.includes(item), item);
    }
  });

  it("signOut do contexto limpa estado local mesmo se a rede falhar (finally)", () => {
    const src = read("app/context/SupabaseAuthContext.tsx");
    const fn = src.slice(src.indexOf("const signOut"));
    assert.ok(fn.includes("finally"), "finally presente");
    assert.ok(fn.includes("setUser(null)"), "limpa user");
    assert.ok(fn.includes("setSession(null)"), "limpa session");
    assert.ok(fn.includes("setProfile(null)"), "limpa profile");
  });

  it("página /conta também usa reload real no logout", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("window.location.href = target"), "reload real");
  });
});

describe("Landing — header institucional", () => {
  it("usa AccountMenu compacto (sem e-mail protagonista)", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(src.includes("<AccountMenu compact"), "compacto na landing");
  });
});
