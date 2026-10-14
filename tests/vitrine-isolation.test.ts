/**
 * tests/vitrine-isolation.test.ts — Isolamento da experiência pública das Montras.
 *
 * A rota /vitrine/[slug] (destino dos QR Codes) não deve expor a navegação
 * global da plataforma; as funcionalidades próprias da Montra ficam intactas
 * e os sistemas globais (Explorar, Favoritos) continuam nas suas rotas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

const client = () => read("app/vitrine/[slug]/VitrineClient.tsx");

describe("Isolamento /vitrine/[slug] — sem navegação global", () => {
  it("não tem navbar global (Início/Explorar/Dashboard)", () => {
    const src = client();
    assert.ok(!src.includes("Top Navbar"), "bloco da navbar removido");
    assert.ok(!src.includes('href="/explorar"'), "sem link para Explorar");
    assert.ok(!src.includes("Voltar ao Dashboard"), "sem botão de Dashboard");
  });

  it("não promove outras Montras", () => {
    const src = client();
    assert.ok(!src.includes("Pessoas também visitaram"), "secção removida");
    assert.ok(!src.includes("similarBusinesses"), "sem estado/fetch de similares");
    assert.ok(!src.includes("fetchSimilar"), "sem fetch de similares");
  });

  it("rodapé sem links para a plataforma", () => {
    const src = client();
    const footer = src.slice(src.indexOf("<footer"));
    assert.ok(!footer.includes('href="/"'), "logo do rodapé sem link");
    assert.ok(!footer.includes("?ref="), "sem link de atribuição com ref");
    assert.ok(footer.includes("VitrinePro"), "atribuição discreta mantida");
  });

  it("banner de rascunho do dono continua (não é navegação pública)", () => {
    const src = client();
    assert.ok(src.includes("Rascunho Privado"), "aviso ao dono preservado");
  });
});

describe("Isolamento /vitrine/[slug] — funcionalidades da Montra intactas", () => {
  it("mantém WhatsApp, partilha, avaliações Google e favorito próprio", () => {
    const src = client();
    assert.ok(src.includes("wa.me"), "WhatsApp presente");
    assert.ok(src.includes("SocialBar"), "barra social (partilhar) presente");
    assert.ok(src.includes("googleReviewUrl") || src.includes("GoogleReview") || src.includes("isValidGoogleReviewUrl"), "avaliações Google presentes");
    assert.ok(src.includes("SaveToCollection"), "guardar na coleção (da Montra) presente");
    assert.ok(src.includes("toggleFavorite"), "favorito da Montra funcional");
  });

  it("mantém produtos, horários, contactos e mapa", () => {
    const src = client();
    assert.ok(src.includes("products"), "produtos presentes");
    assert.ok(src.includes("opening_hours") || src.includes("openingHours"), "horários presentes");
    assert.ok(src.includes("Maps") || src.includes("maps") || src.includes("address"), "localização presente");
  });

  it("URL pública inalterada", () => {
    const page = read("app/vitrine/[slug]/page.tsx");
    assert.ok(page.includes("VitrineClient"), "page continua a renderizar VitrineClient");
    const short = read("app/v/[code]/route.ts");
    assert.ok(short.includes("redirect(`/vitrine/${slug}`)"), "QR/short-link continua a apontar para /vitrine/[slug]");
  });
});

describe("Sistemas globais continuam nas suas rotas", () => {
  it("Explorar e Favoritos existem e estão intocados", () => {
    const explorar = read("app/explorar/page.tsx");
    assert.ok(explorar.length > 1000, "página Explorar existe");
    const favoritos = read("app/favoritos/page.tsx");
    assert.ok(favoritos.length > 1000, "página Favoritos existe");
  });

  it("sistema de favoritos (tabela + toggle) não foi removido", () => {
    const src = client();
    assert.ok(src.includes('.from("favorites")'), "queries à tabela favorites intactas");
  });
});
