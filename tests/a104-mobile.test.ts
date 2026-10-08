/**
 * tests/a104-mobile.test.ts — A10.4 itens 1 e 2 (mobile, sem dependência de DB)
 *
 * 1. Minhas Coleções no mobile: sem overflow (empilha no mobile).
 * 2. WhatsApp flutuante: compacto no mobile.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("A10.4 item 1 — Minhas Coleções responsivo", () => {
  it("linha de criar empilha no mobile (botão sempre visível)", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(src.includes("flex-col sm:flex-row"), "empilha vertical no mobile");
    assert.ok(src.includes("w-full sm:w-auto"), "botão largura total no mobile");
  });

  it("tabs não estouram a página em 320px", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(src.includes("overflow-x-auto"), "tabs com scroll em vez de overflow da página");
    assert.ok(src.includes("whitespace-nowrap"), "tabs sem quebra estranha");
    assert.ok(src.includes("text-xs sm:text-sm"), "texto menor no mobile");
  });

  it("texto informativo quebra corretamente", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(src.includes("break-words"), "sem ultrapassar a largura");
  });
});

describe("A10.4 item 2 — WhatsApp flutuante compacto no mobile", () => {
  it("botão menor no mobile, tamanho normal no desktop", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(src.includes("w-12 h-12"), "compacto no mobile");
    assert.ok(src.includes("md:w-14 md:h-14"), "tamanho normal no desktop");
    assert.ok(src.includes("right-4") && src.includes("md:right-6"), "margem ajustada");
  });

  it("respeita safe-area e mantém o link", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(src.includes("env(safe-area-inset-bottom)"), "safe-area respeitada");
    assert.ok(src.includes("https://wa.me/"), "link WhatsApp inalterado");
  });
});
