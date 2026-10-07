/**
 * tests/visibility-controls.test.ts — Controles de visibilidade
 * (produto/galeria: ocultar ≠ excluir)
 *
 * Cobre: estados válidos do produto, regra de coerência, filtros do
 * Explorar/Montra/galeria, proteção de novidades, RLS e regressões.
 * Lógica pura + assertions sobre código-fonte e migration. Sem DB.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeedItems } from "../lib/feed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8");

const MIGRATION = src("supabase/migrations/20261007000014_product_gallery_visibility.sql");
const EXPLORAR = src("app/explorar/page.tsx");
const VITRINE = src("app/vitrine/[slug]/VitrineClient.tsx");
const DASHBOARD = src("app/dashboard/page.tsx");
const FEED_LIB = src("lib/feed.ts");

const biz = (id: string) => ({ id, name: `Loja ${id}`, slug: `loja-${id}` });
const prod = (id: string, b: any, vis: any = {}) => ({
  id,
  name: `Produto ${id}`,
  price: 10,
  business_id: b.id,
  business: b,
  is_visible: true,
  show_in_explore: true,
  ...vis,
});
const post = (id: string, b: any, productId: string | null = null, prodVis: any = null) => ({
  id,
  type: "novidade",
  title: `Novidade ${id}`,
  product_id: productId,
  is_active: true,
  business: { name: b.name, slug: b.slug },
  ...(prodVis ? { products: prodVis } : {}),
});

describe("migration — colunas aditivas com DEFAULT true", () => {
  it("adiciona as 3 colunas", () => {
    assert.ok(MIGRATION.includes("products") && MIGRATION.includes("is_visible"), "products.is_visible");
    assert.ok(MIGRATION.includes("show_in_explore"), "products.show_in_explore");
    assert.ok(MIGRATION.includes("gallery_images") && MIGRATION.includes("is_visible"), "gallery_images.is_visible");
  });
  it("DEFAULT true preserva comportamento existente", () => {
    const defaults = (MIGRATION.match(/DEFAULT true/g) || []).length;
    assert.ok(defaults >= 3, `esperado ≥3 DEFAULT true, achado ${defaults}`);
  });
  it("NOT NULL nas 3 colunas", () => {
    assert.ok(/is_visible BOOLEAN NOT NULL/.test(MIGRATION), "is_visible NOT NULL");
    assert.ok(/show_in_explore BOOLEAN NOT NULL/.test(MIGRATION), "show_in_explore NOT NULL");
  });
  it("não altera migrations antigas nem remove is_published", () => {
    assert.ok(!/DROP COLUMN.*is_published/.test(MIGRATION), "is_published preservado");
  });
});

describe("migration — RLS mínima e não enfraquecida", () => {
  it("produtos: leitura pública exige is_visible", () => {
    assert.ok(/vp_products_select[\s\S]*?is_visible = true/.test(MIGRATION), "porta is_visible");
  });
  it("dono continua vendo produtos ocultos", () => {
    assert.ok(/vp_products_select[\s\S]*?user_id = auth\.uid\(\)/.test(MIGRATION), "dono bypassa");
  });
  it("galeria: leitura pública exige is_visible", () => {
    assert.ok(/vp_gallery_select[\s\S]*?is_visible = true/.test(MIGRATION), "porta is_visible");
  });
  it("show_in_explore NÃO entra na RLS (só distribuição)", () => {
    const rlsSection = MIGRATION.slice(MIGRATION.indexOf("─── 2."));
    assert.ok(!rlsSection.includes("show_in_explore"), "show_in_explore fora da RLS");
  });
  it("documenta que não enfraquece", () => {
    assert.ok(/NÃO enfraquece/i.test(MIGRATION), "documentado");
  });
});

describe("buildFeedItems — estados do produto no Explorar", () => {
  const b = biz("b1");
  it("A) visible=true/explore=true → aparece", () => {
    const items = buildFeedItems([b], [prod("p1", b)], []);
    assert.ok(items.some((i) => i.key === "p:p1"), "produto A no feed");
  });
  it("B) visible=true/explore=false → NÃO aparece no Explorar", () => {
    const items = buildFeedItems([b], [prod("p1", b, { show_in_explore: false })], []);
    assert.ok(!items.some((i) => i.key === "p:p1"), "produto B fora do feed");
    assert.ok(items.some((i) => i.key === "b:b1"), "negócio permanece");
  });
  it("C) visible=false → NÃO aparece em lado público nenhum", () => {
    const items = buildFeedItems([b], [prod("p1", b, { is_visible: false, show_in_explore: false })], []);
    assert.ok(!items.some((i) => i.key === "p:p1"), "produto C fora do feed");
  });
  it("legado sem colunas (undefined) → aparece (DEFAULT true)", () => {
    const p = prod("p1", b);
    delete (p as any).is_visible;
    delete (p as any).show_in_explore;
    const items = buildFeedItems([b], [p], []);
    assert.ok(items.some((i) => i.key === "p:p1"), "sem colunas = visível");
  });
});

describe("buildFeedItems — novidades e produto oculto", () => {
  const b = biz("b1");
  it("novidade de produto oculto (is_visible=false) NÃO aparece", () => {
    const items = buildFeedItems(
      [b],
      [],
      [post("n1", b, "p1", { is_visible: false, show_in_explore: false })]
    );
    assert.ok(!items.some((i) => i.key === "n:n1"), "novidade bloqueada");
  });
  it("novidade de produto fora do Explorar NÃO contorna a regra", () => {
    const items = buildFeedItems(
      [b],
      [],
      [post("n1", b, "p1", { is_visible: true, show_in_explore: false })]
    );
    assert.ok(!items.some((i) => i.key === "n:n1"), "novidade fora do Explorar");
  });
  it("novidade de produto visível aparece normalmente", () => {
    const items = buildFeedItems(
      [b],
      [],
      [post("n1", b, "p1", { is_visible: true, show_in_explore: true })]
    );
    assert.ok(items.some((i) => i.key === "n:n1"), "novidade visível");
  });
  it("novidade sem product_id não é afetada", () => {
    const items = buildFeedItems([b], [], [post("n1", b)]);
    assert.ok(items.some((i) => i.key === "n:n1"), "novidade sem produto");
  });
});

describe("Explorar — queries filtram visibilidade", () => {
  it("feed de produtos filtra is_visible + show_in_explore", () => {
    assert.ok(/\.eq\("is_visible", true\)/.test(EXPLORAR), "filtro is_visible");
    assert.ok(/\.eq\("show_in_explore", true\)/.test(EXPLORAR), "filtro show_in_explore");
  });
  it("busca de produtos filtra visibilidade", () => {
    const searchSection = EXPLORAR.slice(EXPLORAR.indexOf("runProductSearch"));
    assert.ok(searchSection.includes('"is_visible"'), "busca filtra");
  });
  it("não esconde por CSS (filtro na consulta)", () => {
    assert.ok(!/display:\s*none.*is_visible/.test(EXPLORAR), "sem CSS hack");
  });
});

describe("Montra — só produtos e galeria visíveis", () => {
  it("3 pontos de produtos filtram is_visible", () => {
    const matches = (VITRINE.match(/\.eq\("is_visible", true\)/g) || []).length;
    assert.ok(matches >= 6, `esperado ≥6 filtros, achado ${matches}`);
  });
  it("framing intacto", () => {
    assert.ok(VITRINE.includes("productImgStyle"), "framing preservado");
  });
  it("lightbox intacto", () => {
    assert.ok(VITRINE.includes("object-contain"), "lightbox preservado");
  });
});

describe("Dashboard — controles de visibilidade", () => {
  it("produto: toggles Visível na Montra + Aparecer no Explorar", () => {
    assert.ok(DASHBOARD.includes("Visível na Montra"), "toggle Montra");
    assert.ok(DASHBOARD.includes("Aparecer no Explorar"), "toggle Explorar");
  });
  it("ocultar da Montra força show_in_explore=false", () => {
    assert.ok(/if\s*\(!v\)\s*setEditProdExplore\(false\)/.test(DASHBOARD), "força false");
    assert.ok(/show_in_explore:\s*editProdVisible \? editProdExplore : false/.test(DASHBOARD), "salva coerente");
  });
  it("mostrar novamente NÃO religa Explorar automaticamente", () => {
    // O save usa editProdExplore (decisão do comerciante), sem auto-true.
    assert.ok(!/setEditProdExplore\(true\)/.test(DASHBOARD), "sem auto-religar");
  });
  it("galeria: toggle visibilidade separado de excluir", () => {
    assert.ok(DASHBOARD.includes("handleToggleGalleryVisibility"), "toggle galeria");
    assert.ok(DASHBOARD.includes("handleDeleteGalleryImage"), "excluir separado");
  });
  it("ocultar não exclui (update, não delete)", () => {
    const fn = DASHBOARD.slice(DASHBOARD.indexOf("handleToggleGalleryVisibility"));
    assert.ok(fn.includes(".update({ is_visible:"), "update is_visible");
    assert.ok(!fn.slice(0, 400).includes(".delete()"), "sem delete no toggle");
  });
  it("lista mostra badges Oculto / Só Montra", () => {
    assert.ok(DASHBOARD.includes("Oculto"), "badge Oculto");
    assert.ok(DASHBOARD.includes("Só Montra"), "badge Só Montra");
  });
});

describe("regressões", () => {
  it("masonry intacto", () => {
    assert.ok(EXPLORAR.includes("feedColumns"), "masonry");
  });
  it("consumer auth intacto", () => {
    assert.ok(EXPLORAR.includes("/api/auth/is-admin"), "is-admin");
  });
  it("multi-business: policies usam user_id do dono", () => {
    assert.ok(MIGRATION.includes("user_id = auth.uid()"), "ownership");
  });
});
