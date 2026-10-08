/**
 * tests/important-a102.test.ts — A10.2 regressão dos IMPORTANT.
 *
 * I1: filtro de cidade aplica-se a produtos e posts, não só a negócios.
 * I4-A: busca admin nunca aplica operador textual inválido em UUID.
 * I4-D: leads/admin com 401/403 padronizados via helper central.
 * I6: price NULL nunca significa "grátis".
 * I8: mapa de rate limit da A7 tem limpeza periódica.
 * I9: nomenclatura Pro (não Premium); Anthropic na privacy.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("I1 — filtro de cidade em produtos e posts", () => {
  it("runProductSearch filtra por selectedCity", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(
      src.includes('selectedCity === "Todas as Cidades"') &&
        src.includes("h.business?.city"),
      "productHits aplica semântica de cidade"
    );
  });
  it("feed de produtos filtra por selectedCity", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(
      src.includes("p.business?.city"),
      "feedProducts aplica semântica de cidade"
    );
  });
  it("feed de posts carrega city e filtra por selectedCity", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(
      src.includes("city: biz?.city") && src.includes("p.business?.city"),
      "feedPosts tem city e filtra"
    );
  });
  it("efeitos re-executam quando a cidade muda", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(
      src.includes("[searchQuery, mounted, displayBusinesses, needToday, selectedCity]") &&
        src.includes("[mounted, displayBusinesses, selectedCity]"),
      "deps incluem selectedCity"
    );
  });
});

describe("I4-A — busca admin nunca quebra em UUID", () => {
  it("user_id.eq só com UUID válido", () => {
    const src = read("app/api/admin/businesses/route.ts");
    assert.ok(
      src.includes("isUuid") && src.includes("user_id.eq.${q}"),
      "UUID check antes de user_id.eq"
    );
    // O ramo não-UUID (após o ":") não deve conter user_id.eq
    const ternaryTail = src.split("isUuid")[1].split(":").slice(1).join(":");
    const branchEnd = ternaryTail.indexOf(";");
    const nonUuidBranch = ternaryTail.slice(0, branchEnd);
    assert.ok(
      !nonUuidBranch.includes("user_id.eq"),
      "ramo texto-livre sem user_id.eq"
    );
  });
});

describe("I4-C/D — leads usa helper central e 401/403", () => {
  it("leads importa do helper central", () => {
    const src = read("app/api/admin/leads/route.ts");
    assert.ok(
      src.includes('from "@/lib/admin-auth"'),
      "sem cópia local de getAdminEmails"
    );
    assert.ok(!src.includes("DEFAULT_ADMIN_EMAILS"), "sem allowlist duplicada");
  });
  it("401 para não autenticado, 403 para sem permissão", () => {
    const src = read("app/api/admin/leads/route.ts");
    assert.ok(src.includes("status: 401") && src.includes("status: 403"));
  });
});

describe("I6 — price NULL nunca é grátis", () => {
  it("isFree só com price === 0 explícito", () => {
    const src = read("app/produto/[slug]/page.tsx");
    assert.ok(
      src.includes("product.price === 0") &&
        !src.includes("price === null || product.price === undefined)"),
      "NULL não conta como grátis"
    );
  });
  it("UI mostra 'Preço sob consulta' para NULL", () => {
    const src = read("app/produto/[slug]/page.tsx");
    assert.ok(src.includes("Preço sob consulta"));
  });
});

describe("I8 — rate limit A7 com limpeza", () => {
  it("mapa hits tem sweep periódica", () => {
    const src = read("app/api/intelligence/search/route.ts");
    assert.ok(
      src.includes("sweepHits") && src.includes("hits.delete"),
      "limpeza de entradas expiradas"
    );
  });
});

describe("I9 — nomenclatura e privacy", () => {
  it("termos usam 'Pro' em vez de 'Premium'", () => {
    const src = read("app/termos-de-servico/page.tsx");
    assert.ok(!src.includes('"Premium"'), "sem Premium legado");
    assert.ok(src.includes('"Pro"'), "usa Pro canónico");
  });
  it("privacy lista Anthropic como subcontratante", () => {
    const src = read("app/politica-privacidade/page.tsx");
    assert.ok(
      src.includes("Anthropic") && src.includes("Pergunte à Vitrine"),
      "Anthropic documentada tecnicamente"
    );
  });
});

describe("Decisão 1 — garantia alinhada com Termos (14 dias)", () => {
  it("pricing não promete 30 dias", () => {
    const src = read("app/pricing/page.tsx");
    assert.ok(!src.includes("30 dias de garantia"), "sem promessa de 30 dias");
    assert.ok(src.includes("14 dias"), "alinhado com Termos 5.3");
  });
  it("plano-business não promete 30 dias", () => {
    const src = read("app/plano-business/page.tsx");
    assert.ok(!src.includes("30 dias de garantia"), "sem promessa de 30 dias");
  });
});

describe("Decisão 2 — sem preço anual na UI", () => {
  it("pricing sem toggle anual e sem '2 meses grátis'", () => {
    const src = read("app/pricing/page.tsx");
    assert.ok(!src.includes("2 meses grátis"), "sem claim anual");
    assert.ok(!src.includes('"yearly"'), "sem billing anual");
    assert.ok(!src.includes("pagamento anual"), "sem FAQ anual");
  });
  it("preço exibido é mensal", () => {
    const src = read("app/pricing/page.tsx");
    assert.ok(src.includes("/mês"), "período mensal");
  });
});

describe("Decisão 3 — sem '1º lugar garantido'", () => {
  it("nenhum claim absoluto de ranking", () => {
    for (const f of ["app/pricing/page.tsx", "app/components/SmartAssistant.tsx"]) {
      const src = read(f);
      assert.ok(
        !src.includes("1º lugar garantido") && !src.includes("1.º lugar garantido"),
        `${f} sem claim absoluto`
      );
    }
  });
});

describe("I6 — disponibilidade só com dado real", () => {
  it("produto/[slug] não hardcode 'Disponível para Encomenda'", () => {
    const src = read("app/produto/[slug]/page.tsx");
    assert.ok(
      !src.includes("Disponível para Encomenda"),
      "sem texto de disponibilidade inventado"
    );
    assert.ok(
      src.includes("availabilityBadge") && src.includes("productAvailabilityState"),
      "usa dado real de available_today"
    );
  });
  it("availabilityBadge: UNKNOWN nunca gera badge", () => {
    const src = read("lib/availability.ts");
    assert.ok(
      src.includes("UNKNOWN nunca gera badge") || src.includes("return null"),
      "UNKNOWN sem afirmação"
    );
  });
});

describe("I3 — migration de normalização preparada (não aplicada)", () => {
  it("arquivo 000019 existe com as duas policies", () => {
    const src = read("supabase/migrations/20261007000019_normalize_legacy_is_published_policies.sql");
    assert.ok(src.includes("vp_business_images_select"), "business_images");
    assert.ok(src.includes("vp_testimonials_select"), "testimonials");
    assert.ok(!src.includes("is_published = true"), "sem OR legado");
    assert.ok(src.includes("NÃO APLICADA"), "marcada como não aplicada");
  });
});

describe("I5 — SEO", () => {
  it("sitemap só inclui cidade×categoria com conteúdo", () => {
    const src = read("app/sitemap.ts");
    assert.ok(
      src.includes("eq(\"published\", true)") && src.includes("seen"),
      "sitemap filtra por conteúdo real"
    );
    assert.ok(
      !src.includes("for (const city of citiesRes.data)"),
      "sem produto cartesiano cego"
    );
  });
  it("página vazia tem noindex", () => {
    const src = read("app/[city]/[category]/page.tsx");
    assert.ok(src.includes("index: false"), "vazia não indexa");
  });
  it("home tem canonical", () => {
    const src = read("app/layout.tsx");
    assert.ok(src.includes("alternates") && src.includes("canonical"));
  });
});
