/**
 * tests/a65-intent-redirects.test.ts — A6.5 Parte A (redirects por intenção) + Parte B (modal Guardar)
 *
 * Parte A — os 7 fluxos de intenção:
 *   1. "Quero descobrir" (signup sem next) → /explorar (ou next se existir).
 *   2. Tentou Guardar numa Montra/produto → login com next → volta ao next.
 *   3. "Tenho um negócio" → /login?next=/onboarding → /onboarding mesmo com 0 businesses.
 *   4. Consumidor autenticado com 0 businesses → NUNCA forçado a /onboarding.
 *   5. Consumidor clica "Tenho um negócio" depois → /onboarding.
 *   6-7. Merchant com 1 ou múltiplos businesses → comportamento existente preservado.
 *
 * Parte B — modal Guardar para visitante: modal amigável em vez de redirect seco,
 * com intenção pendente concluída após login (quando seguro).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePostAuthTarget } from "../lib/auth-redirect.ts";
import { resolveBusinessCountTarget } from "../lib/visibility.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

// ---------------------------------------------------------------- Parte A: função pura

describe("A6.5 Parte A — resolvePostAuthTarget (pura)", () => {
  it("fluxo 1: consumidor sem next vai para /explorar", () => {
    assert.equal(resolvePostAuthTarget({ nextPath: null, hasBusiness: false }), "/explorar");
    assert.equal(resolvePostAuthTarget({ nextPath: "", hasBusiness: false }), "/explorar");
    assert.equal(resolvePostAuthTarget({ nextPath: "   ", hasBusiness: false }), "/explorar");
    assert.equal(resolvePostAuthTarget({ hasBusiness: false }), "/explorar");
  });

  it("fluxo 2: next explícito vence sempre (volta ao contexto)", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/vitrine/cantinho-da-lu", hasBusiness: false }),
      "/vitrine/cantinho-da-lu"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/explorar", hasBusiness: true }),
      "/explorar"
    );
  });

  it("fluxo 3+5: next=/onboarding leva ao onboarding mesmo com 0 businesses", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/onboarding", hasBusiness: false }),
      "/onboarding"
    );
  });

  it("fluxos 6-7: merchant (1 ou 2+ businesses) sem next vai para /dashboard (absoluto)", () => {
    assert.equal(resolvePostAuthTarget({ nextPath: null, hasBusiness: true }), "/dashboard");
  });

  it("não destrói a semântica de resolveBusinessCountTarget (ramo merchant reutilizado)", () => {
    assert.equal(resolveBusinessCountTarget(0), "onboarding");
    assert.equal(resolveBusinessCountTarget(1), "dashboard");
    assert.equal(resolveBusinessCountTarget(2), "dashboard");
    assert.equal(resolveBusinessCountTarget(10), "dashboard");
  });
});

// ------------------------------------------------- Parte A: página /login

describe("A6.5 Parte A — /login usa destino por intenção", () => {
  it("signup e login resolvem o destino via resolvePostAuthTarget (com veredito admin)", () => {
    const src = read("app/login/page.tsx");
    const uses = src.match(/resolvePostAuthTarget\(\{ nextPath, hasBusiness, isAdmin \}\)/g) ?? [];
    assert.ok(uses.length >= 2, `esperado nos 2 ramos (signup+login), achado ${uses.length}`);
    // A10.6: veredito admin centralizado em fetchIsAdminClient (lib/auth-redirect),
    // que consulta GET /api/auth/is-admin no servidor — nunca só email do frontend.
    const lib = read("lib/auth-redirect.ts");
    assert.ok(lib.includes('fetch("/api/auth/is-admin")'),
      "veredito admin server-side (nunca só email do frontend)");
    assert.ok(src.includes("fetchIsAdminClient"),
      "/login usa o veredito admin centralizado");
    assert.ok(!src.includes("resolveBusinessCountTarget(hasBusiness ? 1 : 0)"),
      "lógica antiga (0 businesses → onboarding) removida");
  });

  it("preserva next e plan no redirect", () => {
    const src = read("app/login/page.tsx");
    assert.ok(src.includes('params.set("plan", plan)'), "plan preservado");
    assert.ok(src.includes("const nextPath = searchParams.get(\"next\")"), "next lido do URL");
  });

  it("dois cards de intenção na própria página /login (navbar intocada)", () => {
    const src = read("app/login/page.tsx");
    assert.ok(src.includes("Quero descobrir"), "card descobrir");
    assert.ok(src.includes("Tenho um negócio"), "card negócio");
    assert.ok(src.includes('href="/login?mode=signup"'), "descobrir → /login?mode=signup");
    assert.ok(src.includes('href="/login?mode=signup&next=/onboarding"'), "negócio → /login?mode=signup&next=/onboarding");
    assert.ok(src.includes("CRIAR CONTA GRÁTIS"), "CTA descobrir");
    assert.ok(src.includes("CADASTRAR MEU NEGÓCIO"), "CTA negócio");
  });

  it("usa o AuthProvider existente (sem novo sistema de auth)", () => {
    const src = read("app/login/page.tsx");
    assert.ok(src.includes("useAuth"), "usa useAuth existente");
    assert.ok(src.includes("SupabaseAuthContext"), "do contexto existente");
  });
});

describe("A6.5 Parte A — /auth/callback usa a mesma intenção", () => {
  it("callback pós-auth resolve via resolvePostAuthTarget (com veredito admin)", () => {
    const src = read("app/auth/callback/page.tsx");
    assert.ok(src.includes("resolvePostAuthTarget({ nextPath, hasBusiness, isAdmin })"),
      "callback usa a função de intenção com admin server-side");
    assert.ok(!src.includes("resolveBusinessCountTarget(hasBusiness ? 1 : 0)"),
      "lógica antiga removida do callback");
  });

  it("callback não decide destino com sessão antiga quando há ?code=", () => {
    const src = read("app/auth/callback/page.tsx");
    assert.ok(src.includes("exchangeCodeForSession"),
      "aguarda a conclusão real do code exchange (PKCE)");
    assert.ok(src.includes("isFreshSignIn"),
      "sessão antiga nunca decide o destino no retorno OAuth");
  });

  it("callback trata erro do provider sem usar sessão antiga", () => {
    const src = read("app/auth/callback/page.tsx");
    assert.ok(src.includes('urlParams.get("error")'), "erro do OAuth tratado");
  });
});

// ------------------------------------------------- Parte A: dashboard

describe("A6.5 Parte A — dashboard: consumidor 0 businesses NÃO forçado ao onboarding", () => {
  it("não faz redirect forçado para /onboarding quando 0 businesses", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(!src.includes("resolveBusinessCountTarget(all.length)"),
      "verificação antiga que forçava /onboarding removida");
    assert.ok(!src.match(/router\.push\(`\/onboarding/),
      "nenhum router.push para /onboarding no dashboard");
  });

  it("renderiza estado vazio com CTA Criar Montra (preserva search/plan)", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("Ainda não tem uma Montra"), "estado vazio");
    assert.ok(src.includes("Criar Montra"), "CTA Criar Montra");
    assert.ok(src.includes("href={`/onboarding${dashSearch}`}"),
      "CTA preserva params do URL (ex.: ?plan=premium)");
  });

  it("fluxos 6-7 preservados: seleção de montra e gestão inalteradas", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("selectBusiness"), "seletor de montra existe");
    assert.ok(src.includes("?montra="), "gestão por ?montra= preservada");
  });
});

// ------------------------------------------------- Parte B: modal Guardar

describe("A6.5 Parte B — SavePromptModal", () => {
  it("copy amigável pedida", () => {
    const src = read("app/components/SavePromptModal.tsx");
    assert.ok(src.includes("Guarde o que encontrar na Vitrine"), "título");
    assert.ok(src.includes("Crie uma conta gratuita para guardar negócios, produtos e novidades."),
      "subtítulo");
  });

  it("duas portas de entrada, ambas com next de volta ao contexto", () => {
    const src = read("app/components/SavePromptModal.tsx");
    assert.ok(src.includes("CRIAR CONTA GRÁTIS"), "CTA signup");
    assert.ok(src.includes("JÁ TENHO CONTA"), "CTA login");
    assert.ok(src.includes("/login?mode=signup&next="), "signup leva next");
    assert.ok(src.includes("/login?next="), "login leva next");
  });
});

describe("A6.5 Parte B — SaveToCollection usa o modal (sem redirect seco)", () => {
  it("visitante vê o modal em vez de window.location para /login", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(!src.includes('window.location.href = "/login'),
      "redirect seco removido");
    assert.ok(src.includes("<SavePromptModal"), "modal renderizado");
    assert.ok(src.includes("setShowPrompt(true)"), "modal aberto para visitante");
  });

  it("guarda a intenção pendente para concluir após login (quando seguro)", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(src.includes("vp_pending_save"), "chave de intenção pendente");
    assert.ok(src.includes("ensureDefaultCollection"), "conclui na coleção padrão");
    assert.ok(src.includes("sessionStorage.removeItem(PENDING_SAVE_KEY)"),
      "intenção consumida após concluir");
  });

  it("modal volta ao contexto (loginNext ou pathname atual)", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(src.includes("loginNext"), "loginNext ainda suportado como next");
    assert.ok(src.includes("window.location.pathname"), "fallback para o contexto atual");
  });
});
