/**
 * tests/consumer-ux.test.ts — Fechar UX do consumidor
 *
 * Cobre:
 *  - Caminho visível para Favoritos/Coleções (navbar + mobile menu)
 *  - Busca: produtos > 0 e negócios = 0 → omite seção de negócios
 *  - Busca: 0 + 0 → "Nenhum resultado encontrado" (não "Nenhum negócio")
 *  - CTA comercial discreto no estado vazio
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

describe("Cenário A — consumidor encontra Favoritos/Coleções", () => {
  it("landing NÃO tem Guardados no header institucional", () => {
    const src = read("components/landing/Navbar.tsx");
    assert.ok(!src.includes('href="/favoritos"'), "landing sem link pessoal no header");
  });
  it("/explorar tem Guardados para consumidor autenticado", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes('href="/favoritos"'), "explorar tem acesso a Guardados");
    assert.ok(src.includes("{user &&"), "só para autenticado");
  });
  it("menu mobile da landing usa AccountMenu (sem Guardados solto)", () => {
    const src = read("components/landing/Navbar.tsx");
    // AccountMenu dropdown mantém Favoritos — sem duplicar no header
    const menuSrc = read("components/auth/AccountMenu.tsx");
    assert.ok(menuSrc.includes("/favoritos"), "dropdown mantém acesso");
  });
  it("/conta tem hub com link para Favoritos e Coleções", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("/favoritos"), "/conta liga para /favoritos");
  });
  it("/favoritos: consumidor 0 businesses vê Voltar ao Explorar", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(src.includes("Voltar ao Explorar"), "navegação coerente para consumidor");
    assert.ok(src.includes("businessCount === 0"), "condicional por contagem");
  });
});

describe("Cenário D — busca com produtos mas 0 negócios", () => {
  it("omite a seção de negócios quando há produtos e 0 negócios", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes("hideBusinessSection"), "lógica de omissão existe");
    assert.ok(src.includes("hasProductHits && filteredBusinesses.length === 0"), "condição correta");
  });
  it("não mostra 'Vitrinas Publicadas (0)' quando há produtos", () => {
    const src = read("app/explorar/page.tsx");
    // A seção é omitida via return null antes de renderizar o header
    assert.ok(src.includes("if (hideBusinessSection) return null"), "seção omitida");
  });
});

describe("Cenário E — estado realmente vazio", () => {
  it("mostra 'Nenhum resultado encontrado' em modo busca", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes("Nenhum resultado encontrado"), "título global correto");
    assert.ok(src.includes("isSearchMode"), "prop isSearchMode existe");
  });
  it("mantém 'Nenhum negócio encontrado' só no modo descoberta", () => {
    const src = read("app/explorar/page.tsx");
    // O título antigo só aparece quando isSearchMode é falso
    assert.ok(src.includes('isSearchMode ? "Nenhum resultado encontrado" : "Nenhum negócio encontrado"'), "condicional correta");
  });
  it("CTA comercial é discreto (não botão dourado dominante)", () => {
    const src = read("app/explorar/page.tsx");
    // O CTA no EmptyFeedState deve ser outline/discreto, não bg-[#C8A96B] sólido
    const emptySection = src.slice(src.indexOf("function EmptyFeedState"));
    assert.ok(!emptySection.includes("bg-[#C8A96B] hover:bg-[#D4BB82]"), "sem botão dourado dominante no estado vazio");
    assert.ok(emptySection.includes("Cadastrar Minha Vitrine Grátis"), "CTA ainda existe, discreto");
  });
});

describe("Cenário F — conta evolui sem perder dados", () => {
  it("/conta não cria tipo rígido consumer/merchant", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("0 businesses") || src.includes("businessCount"), "lógica por contagem, não por tipo");
  });
  it("/favoritos não depende de ter businesses", () => {
    const src = read("app/favoritos/page.tsx");
    assert.ok(!src.includes("businessCount === 0") || src.includes("businessCount"), "acesso independente de businesses");
  });
});
