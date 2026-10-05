/**
 * tests/social-metadata.test.ts — Regra global da imagem social das Montras
 *
 * Prioridade: capa → logo → galeria → produto → padrão VitrinePro.
 * Sem hardcode de Montra específica. URL sempre absoluta.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

const { pickSocialImage: _pick } = await import("../lib/social-metadata.ts");
const SITE = "https://vitrinepro.digital";
const pickSocialImage = (input: object) => (_pick as any)(input, SITE);

const COVER = "https://x.supabase.co/storage/v1/object/public/vitrine-covers/a/cover.jpg";
const LOGO = "https://x.supabase.co/storage/v1/object/public/vitrine-logos/a/logo.jpg";
const GAL = "https://x.supabase.co/storage/v1/object/public/vitrine-gallery/a/g1.jpg";
const PROD = "https://x.supabase.co/storage/v1/object/public/vitrine-products/a/p1.jpg";

describe("pickSocialImage — prioridade", () => {
  it("1. capa quando existe", () => {
    assert.equal(pickSocialImage({ cover_url: COVER, logo_url: LOGO, galleryUrls: [GAL], productUrls: [PROD] }), COVER);
  });

  it("2. logo quando não há capa", () => {
    assert.equal(pickSocialImage({ cover_url: null, logo_url: LOGO, galleryUrls: [GAL] }), LOGO);
  });

  it("3. galeria quando não há capa nem logo", () => {
    assert.equal(pickSocialImage({ galleryUrls: [GAL], productUrls: [PROD] }), GAL);
  });

  it("4. produto quando é a única imagem", () => {
    assert.equal(pickSocialImage({ productUrls: [PROD] }), PROD);
  });

  it("5. padrão VitrinePro quando a Montra não tem nenhuma imagem", () => {
    const img = pickSocialImage({});
    assert.ok(img.startsWith("https://"), "URL absoluta");
    assert.ok(img.endsWith("/og-default.png"), "imagem padrão");
  });

  it("ignora URLs inválidas/relativas e avança na prioridade", () => {
    assert.equal(
      pickSocialImage({ cover_url: "/relativa.png", logo_url: LOGO }),
      LOGO
    );
    assert.equal(pickSocialImage({ cover_url: "", galleryUrls: [null, GAL] }), GAL);
  });

  it("não tem hardcode de Montra específica", () => {
    const src = read("lib/social-metadata.ts");
    assert.ok(!/turma|monica/i.test(src), "sem hardcode");
  });
});

describe("generateMetadata — vitrine", () => {
  it("usa a regra global (não só capa/logo)", () => {
    const src = read("app/vitrine/[slug]/page.tsx");
    assert.ok(src.includes("pickSocialImage"), "usa a regra");
    assert.ok(src.includes('from("gallery_images")'), "busca galeria");
    assert.ok(src.includes('from("products")'), "busca produtos");
  });

  it("tem og:image com dimensões, alt e URL absoluta", () => {
    const src = read("app/vitrine/[slug]/page.tsx");
    assert.ok(src.includes("SOCIAL_IMAGE_WIDTH"), "width");
    assert.ok(src.includes("SOCIAL_IMAGE_HEIGHT"), "height");
    assert.ok(src.includes("alt: name"), "alt com nome");
  });

  it("tem canonical e url do openGraph", () => {
    const src = read("app/vitrine/[slug]/page.tsx");
    assert.ok(src.includes("alternates"), "canonical");
    assert.ok(src.includes("url: pageUrl"), "og:url");
  });

  it("tem revalidate explícito (metadata fresca)", () => {
    const src = read("app/vitrine/[slug]/page.tsx");
    assert.ok(/export const revalidate = \d+/.test(src), "revalidate definido");
  });

  it("não altera o editor de capa", () => {
    const src = read("app/vitrine/[slug]/page.tsx");
    assert.ok(!/cover_position|cover_zoom/i.test(src), "sem enquadramento aqui");
  });
});
