/**
 * tests/account-area.test.ts — Área da conta do consumidor (Minha Conta)
 *
 * Cobre: regra de produto (sem tipo rígido), menu autenticado por contexto,
 * /conta como hub do consumidor, semântica de "Meu Painel", exclusão segura
 * server-side e não-regressões (Quero descobrir, 0 businesses → /explorar,
 * Painel do Dono, Novidades, RLS, masonry, framing).
 * Lógica pura + assertions sobre o código-fonte. Sem DB.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isMerchant } from "../lib/account.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8");

const ACCOUNT_MENU = src("components/auth/AccountMenu.tsx");
const CONTA = src("app/conta/page.tsx");
const DASHBOARD = src("app/dashboard/page.tsx");
const DELETE_ROUTE = src("app/api/account/delete/route.ts");
const EXPLORAR = src("app/explorar/page.tsx");

describe("regra de produto — sem tipo de conta rígido", () => {
  it("0 businesses = consumidor; ≥1 = comerciante (mesma conta)", () => {
    assert.equal(isMerchant(0), false);
    assert.equal(isMerchant(1), true);
    assert.equal(isMerchant(3), true);
  });
  it("lib/account documenta a regra", () => {
    assert.ok(src("lib/account.ts").includes("NÃO há"), "regra documentada");
  });
});

describe("AccountMenu — navegação coerente por contexto", () => {
  it("tem 'Minha Conta' → /conta (não 'Gestão da conta')", () => {
    assert.ok(ACCOUNT_MENU.includes("Minha Conta"), "rótulo Minha Conta");
    assert.ok(ACCOUNT_MENU.includes('href="/conta"'), "link /conta");
  });
  it("NÃO tem mais 'Meu Painel' incondicional", () => {
    assert.ok(!ACCOUNT_MENU.includes("Meu Painel"), "sem Meu Painel");
  });
  it("tem Favoritos → /favoritos", () => {
    assert.ok(ACCOUNT_MENU.includes('href="/favoritos"'), "link /favoritos");
  });
  it("tem Explorar → /explorar", () => {
    assert.ok(ACCOUNT_MENU.includes('href="/explorar"'), "link /explorar");
  });
  it("consumidor vê 'Criar minha Montra' → /onboarding", () => {
    assert.ok(ACCOUNT_MENU.includes("Criar minha Montra"), "CTA consumidor");
    assert.ok(ACCOUNT_MENU.includes('href="/onboarding"'), "link /onboarding");
  });
  it("comerciante vê 'Gerir minhas Montras' → /dashboard", () => {
    assert.ok(ACCOUNT_MENU.includes("Gerir minhas Montras"), "ação comerciante");
    assert.ok(ACCOUNT_MENU.includes('href="/dashboard"'), "link /dashboard");
  });
  it("conta businesses para decidir o contexto", () => {
    assert.ok(ACCOUNT_MENU.includes("getBusinessCount"), "usa getBusinessCount");
  });
  it("mantém Sair e Trocar de conta", () => {
    assert.ok(ACCOUNT_MENU.includes("Sair"), "Sair presente");
    assert.ok(ACCOUNT_MENU.includes("Trocar de conta"), "Trocar de conta presente");
  });
});

describe("/conta — hub 'Minha Conta' do consumidor", () => {
  it("título é 'Minha Conta'", () => {
    assert.ok(CONTA.includes("Minha Conta"), "título Minha Conta");
  });
  it("links: Favoritos, Explorar", () => {
    assert.ok(CONTA.includes('href="/favoritos"'), "Favoritos");
    assert.ok(CONTA.includes('href="/explorar"'), "Explorar");
  });
  it("consumidor vê CTA 'Criar minha Montra' → /onboarding", () => {
    assert.ok(CONTA.includes("Criar minha Montra"), "CTA presente");
    assert.ok(CONTA.includes('href="/onboarding"'), "vai ao onboarding");
  });
  it("comerciante vê 'Gerir minhas Montras' → /dashboard", () => {
    assert.ok(CONTA.includes("Gerir minhas Montras"), "gestão comercial");
  });
  it("tem zona de perigo com exclusão de conta", () => {
    assert.ok(CONTA.includes("Excluir minha conta"), "botão excluir");
    assert.ok(CONTA.includes("/api/account/delete"), "chama API server-side");
  });
  it("exclusão exige confirmação forte (e-mail exato)", () => {
    assert.ok(CONTA.includes("deleteConfirm"), "estado de confirmação");
    assert.ok(/Escreve o teu e-mail/.test(CONTA), "pede e-mail exato");
  });
  it("comerciante NÃO pode excluir sem resolver Montras", () => {
    assert.ok(/têm? .*Montra/.test(CONTA) || CONTA.includes("Montras ativas"), "bloqueio comerciante");
  });
});

describe("API /api/account/delete — exclusão segura server-side", () => {
  it("só POST, runtime nodejs", () => {
    assert.ok(DELETE_ROUTE.includes("export async function POST"), "só POST");
    assert.ok(DELETE_ROUTE.includes('runtime = "nodejs"'), "nodejs");
  });
  it("valida JWT no servidor (nunca confia no browser)", () => {
    assert.ok(DELETE_ROUTE.includes("auth.getUser()"), "getUser server-side");
  });
  it("exige confirmação forte (e-mail exato)", () => {
    assert.ok(DELETE_ROUTE.includes("confirmEmail"), "confirmação por e-mail");
    assert.ok(DELETE_ROUTE.includes("400"), "rejeita confirmação inválida");
  });
  it("bloqueia comerciante com 403 (sem destruição automática)", () => {
    assert.ok(DELETE_ROUTE.includes("403"), "403 para comerciante");
    assert.ok(DELETE_ROUTE.includes("Montras"), "mensagem orienta");
  });
  it("service_role só no servidor (nunca no browser)", () => {
    assert.ok(DELETE_ROUTE.includes("SUPABASE_SERVICE_ROLE_KEY"), "service_role server-side");
    assert.ok(!DELETE_ROUTE.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "não usa anon key pública");
    assert.ok(!/process\.env\.NEXT_PUBLIC_[A-Z_]*KEY/.test(DELETE_ROUTE), "nenhuma chave pública");
  });
  it("usa admin.deleteUser (CASCADE limpa dependentes)", () => {
    assert.ok(DELETE_ROUTE.includes("admin.deleteUser"), "deleteUser via admin");
    assert.ok(DELETE_ROUTE.includes("CASCADE"), "documenta CASCADE");
  });
  it("não permite excluir conta de outro utilizador", () => {
    // O alvo é sempre user.id do JWT — nenhum id vem do corpo.
    assert.ok(!/body\.(userId|id|target)/.test(DELETE_ROUTE), "sem id no corpo");
  });
});

describe("/dashboard — não finge painel comercial para consumidor", () => {
  it("vista 0 businesses aponta para Minha Conta", () => {
    assert.ok(DASHBOARD.includes('href="/conta"'), "link /conta");
    assert.ok(DASHBOARD.includes("Minha Conta"), "menciona Minha Conta");
  });
  it("mantém CTA Criar Montra para quem quer virar comerciante", () => {
    assert.ok(DASHBOARD.includes("/onboarding"), "onboarding acessível");
  });
});

describe("não-regressões", () => {
  it("Quero descobrir → cadastro direto (?mode=signup)", () => {
    assert.ok(src("app/login/page.tsx").includes("mode"), "login lê mode");
  });
  it("explorar mantém validação admin server-side (Painel do Dono)", () => {
    assert.ok(EXPLORAR.includes("/api/auth/is-admin"), "is-admin intacto");
  });
  it("feed masonry intacto", () => {
    assert.ok(EXPLORAR.includes("feedColumns"), "masonry intacto");
    assert.ok(EXPLORAR.includes("buildFeedItems"), "feed unificado intacto");
  });
  it("framing da Montra intacto", () => {
    assert.ok(src("app/vitrine/[slug]/VitrineClient.tsx").includes("productImgStyle"), "framing intacto");
  });
  it("nenhuma migration nova", () => {
    const files = readdirSync(join(__dirname, "../supabase/migrations"));
    const newOnes = files.filter((f: string) => /account|delete/i.test(f));
    assert.equal(newOnes.length, 0, "sem migration de conta");
  });
});
