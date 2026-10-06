/**
 * tests/product-framing.test.ts — Enquadramento da imagem do produto
 *
 * Mesmo conceito da capa: a original é sempre preservada; só
 * image_position_x/y e image_zoom são persistidos (NULL = legado).
 * O enquadramento é aplicado em todos os lugares onde o produto aparece.
 * Nenhum selo de plano (Premium/Destaque) em superfícies públicas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

// Importa os helpers puros (sem JSX) para teste funcional real.
const helpers = await import("../lib/product-framing.ts");
const { normalizeProductFraming, productImgStyle, isDefaultProductFraming } = helpers;

describe("product-framing — normalização", () => {
  it("null/undefined → padrão (center, zoom 1, comportamento legado)", () => {
    assert.deepEqual(normalizeProductFraming(null), { x: 50, y: 50, zoom: 1 });
    assert.deepEqual(normalizeProductFraming(undefined), { x: 50, y: 50, zoom: 1 });
    assert.deepEqual(normalizeProductFraming({}), { x: 50, y: 50, zoom: 1 });
  });

  it("preserva valores válidos", () => {
    const f = normalizeProductFraming({ image_position_x: 20, image_position_y: 80, image_zoom: 1.5 });
    assert.deepEqual(f, { x: 20, y: 80, zoom: 1.5 });
  });

  it("limita valores fora do intervalo", () => {
    const f = normalizeProductFraming({ image_position_x: 150, image_position_y: -10, image_zoom: 9 });
    assert.deepEqual(f, { x: 100, y: 0, zoom: 3 });
  });

  it("gera estilo CSS correto", () => {
    assert.deepEqual(productImgStyle({ x: 30, y: 70, zoom: 2 }), {
      objectPosition: "30% 70%",
      transform: "scale(2)",
    });
  });

  it("detecta enquadramento padrão", () => {
    assert.ok(isDefaultProductFraming({ x: 50, y: 50, zoom: 1 }));
    assert.ok(!isDefaultProductFraming({ x: 30, y: 50, zoom: 1 }));
  });
});

describe("product-framing — consistência nas superfícies", () => {
  it("montra pública aplica enquadramento no card do produto", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(src.includes("productImgStyle(normalizeProductFraming(product))"), "card montra");
  });

  it("/explorar aplica enquadramento e seleciona as colunas", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes("productImgStyle(normalizeProductFraming(hit))"), "card explorar");
    assert.ok(src.includes("image_position_x"), "coluna no select");
  });

  it("/produto/[slug] aplica enquadramento", () => {
    const src = read("app/produto/[slug]/page.tsx");
    assert.ok(src.includes("productImgStyle(normalizeProductFraming(product))"), "página produto");
  });

  it("favoritos aplica enquadramento em itens de produto", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(src.includes("normalizeProductFraming"), "favoritos");
  });

  it("dashboard aplica enquadramento no preview", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("productImgStyle(normalizeProductFraming(p))"), "preview dashboard");
  });
});

describe("product-framing — recomendação 4:5", () => {
  it("modais de produto mostram o formato oficial recomendado", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("1080 × 1350 px (4:5)"), "hint 4:5");
  });

  it("editor de produto tem botão de enquadramento", () => {
    const src = read("app/dashboard/page.tsx");
    assert.ok(src.includes("Editar enquadramento"), "botão editor");
    assert.ok(src.includes("ProductFramingEditor"), "componente");
  });
});

describe("plano — sem exibição pública", () => {
  it("montra pública não exibe selo de plano", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(!src.includes("{business.premium &&"), "sem selo Premium");
  });

  it("/explorar não exibe selo derivado do plano", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(!src.includes("✦ Destaque"), "sem selo Destaque");
  });

  it("lógica interna de plano preservada (ranking/entitlement)", () => {
    const exp = read("app/explorar/page.tsx");
    assert.ok(exp.includes("isPaidTier(b.plan)"), "ranking intacto");
    const vc = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(vc.includes("isPaidTier(data.plan)"), "entitlement intacto");
  });
});
