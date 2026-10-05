/**
 * tests/a6-fixes.test.ts — A6 correções pós-validação manual
 *
 * Regressões dos 4 problemas reais encontrados em produção:
 *  P1 — produtos sem botão Guardar alcançável;
 *  P2 — picker "Salvar em coleção" fora da viewport;
 *  P3 — "Vitrinas Publicadas (6)" com só 3 cartões;
 *  P4 — React #418 (hydration) por navigator.share condicional.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  splitExploreSlices,
  slicesCoverAll,
} from "../lib/explore-slices.ts";

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

function biz(id: number, premium: boolean) {
  return { id: `b${id}`, premium };
}

describe("P3 — contagem honesta de cartões", () => {
  it("6 premium → 3 em destaque + 3 na secção regular (nenhum descartado)", () => {
    const list = [1, 2, 3, 4, 5, 6].map((i) => biz(i, true));
    const { featured, regular } = splitExploreSlices(list, 3);
    assert.equal(featured.length, 3);
    assert.equal(regular.length, 3);
    assert.equal(featured.length + regular.length, 6);
  });

  it("invariante: cartões renderizados === total filtrado", () => {
    const cases: Array<Array<{ id: string; premium: boolean }>> = [
      [],
      [biz(1, true)],
      [1, 2, 3].map((i) => biz(i, true)),
      [1, 2, 3, 4, 5, 6].map((i) => biz(i, true)),
      [biz(1, true), biz(2, false), biz(3, true), biz(4, false)],
      [1, 2, 3, 4, 5].map((i) => biz(i, false)),
    ];
    for (const list of cases) {
      assert.equal(
        slicesCoverAll(list, 3),
        true,
        `falhou para ${list.length} itens`
      );
    }
  });

  it("/explorar usa splitExploreSlices (sem slice(0,3) que descarta)", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes("splitExploreSlices(filteredBusinesses, 3)"));
    assert.ok(!src.includes("filter((b) => b.premium).slice(0, 3)"));
  });
});

describe("P2 — picker sempre dentro da viewport", () => {
  it("usa diálogo fixed (não dropdown ancorado abaixo do botão)", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(src.includes("fixed inset-0"), "diálogo deve ser fixed");
    assert.ok(src.includes('role="dialog"'), "deve ter role=dialog");
    assert.ok(
      !src.includes("sm:top-full"),
      "não pode ancorar abaixo do botão (causa o bug y=640)"
    );
  });

  it("fecha por Escape e por backdrop", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(src.includes('"Escape"'), "deve fechar com Escape");
    assert.ok(src.includes("aria-modal"), "deve ser modal acessível");
  });

  it("mobile mantém bottom-sheet, desktop centra (compacto)", () => {
    const src = read("app/components/SaveToCollection.tsx");
    assert.ok(src.includes("items-end"), "mobile: bottom-sheet");
    assert.ok(src.includes("sm:items-center"), "desktop: centrado");
    assert.ok(src.includes("sm:max-w-xs"), "compacto, não modal enorme");
  });
});

describe("P4 — sem mismatch de hidratação", () => {
  it("botão de partilha nativa só renderiza após mount", () => {
    const src = read("app/components/SocialBar.tsx");
    // O padrão perigoso era: {typeof navigator !== "undefined" && "share" in navigator && (...)}
    // sem gate de mounted → servidor renderiza vazio, cliente com navigator.share
    // renderiza o botão → React #418.
    const idx = src.indexOf('"share" in navigator');
    assert.ok(idx > 0, "botão de partilha nativa existe");
    const before = src.slice(Math.max(0, idx - 120), idx);
    assert.ok(
      before.includes("mounted"),
      "deve estar gated por mounted para não divergir no SSR"
    );
  });
});

describe("P1 — Guardar produto alcançável", () => {
  it("Montra pública: cartões de produto têm SaveToCollection", () => {
    const src = read("app/vitrine/[slug]/VitrineClient.tsx");
    assert.ok(
      src.includes('itemRef={{ productId: product.id }}'),
      "produto da Montra deve poder ser guardado em coleção"
    );
  });

  it("/explorar: cartões de produto têm SaveToCollection", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(
      src.includes("itemRef={{ productId: hit.id }}"),
      "produto do /explorar deve poder ser guardado em coleção"
    );
  });
});
