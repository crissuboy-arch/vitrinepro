/**
 * tests/vitrine-flash.test.ts — FASE 1 "Vitrine Flash"
 *
 * Lógica pura das promoções (lib/promotions.ts), limites por plano
 * (lib/plans.ts), eventos de métricas (lib/analytics-guard.ts) e a
 * degradação graciosa das novidades com/sem a migration do Flash
 * (lib/novidades.ts: loadNovidadesState full/mid/legacy).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  discountPercent,
  promotionCountsTowardLimit,
  countActivePromotions,
  isPromotionVisibleNow,
  filterPromotions,
  promotionFacets,
  type PromotionRow,
} from "../lib/promotions.ts";
import { planMaxActivePromotions, PLANS } from "../lib/plans.ts";
import { isAllowedEvent } from "../lib/analytics-guard.ts";
import { loadNovidadesState } from "../lib/novidades.ts";

const NOW = new Date("2026-11-17T12:00:00.000Z");
const future = "2026-12-01T00:00:00.000Z";
const past = "2026-11-01T00:00:00.000Z";

function promo(partial: Partial<PromotionRow>): PromotionRow {
  return {
    id: "p1",
    business_id: "b1",
    type: "promocao",
    title: "Promoção",
    price: 10,
    original_price: 20,
    is_active: true,
    businesses: { name: "Loja", slug: "loja", city: "Águeda", category: "Beleza", published: true },
    ...partial,
  };
}

describe("discountPercent", () => {
  it("calcula a percentagem arredondada", () => {
    assert.equal(discountPercent(20, 10), 50);
    assert.equal(discountPercent(19.9, 12.9), 35);
    assert.equal(discountPercent(100, 99), 1);
  });
  it("devolve null sem par de preços válido", () => {
    assert.equal(discountPercent(null, 10), null);
    assert.equal(discountPercent(20, null), null);
    assert.equal(discountPercent(10, 10), null);
    assert.equal(discountPercent(10, 12), null);
    assert.equal(discountPercent(0, 0), null);
  });
});

describe("limites por plano (decisão 17/11/2026)", () => {
  it("Free 1 · Pro 5 · Business 20, com legados no Pro", () => {
    assert.equal(planMaxActivePromotions("free"), 1);
    assert.equal(planMaxActivePromotions("pro"), 5);
    assert.equal(planMaxActivePromotions("premium"), 5);
    assert.equal(planMaxActivePromotions("gold"), 5);
    assert.equal(planMaxActivePromotions("business"), 20);
    assert.equal(planMaxActivePromotions(null), 1);
    assert.equal(planMaxActivePromotions("desconhecido"), 1);
  });
  it("preços dos planos não mudaram", () => {
    assert.equal(PLANS.free.priceEur, 0);
    assert.equal(PLANS.pro.priceEur, 12);
    assert.equal(PLANS.business.priceEur, 29.9);
  });
});

describe("promotionCountsTowardLimit (espelho do trigger SQL)", () => {
  it("conta promoções ativas e agendadas; não conta desativadas/expiradas/outros tipos", () => {
    assert.equal(promotionCountsTowardLimit(promo({}), NOW), true);
    assert.equal(promotionCountsTowardLimit(promo({ starts_at: future }), NOW), true);
    assert.equal(promotionCountsTowardLimit(promo({ is_active: false }), NOW), false);
    assert.equal(promotionCountsTowardLimit(promo({ expires_at: past }), NOW), false);
    assert.equal(promotionCountsTowardLimit(promo({ type: "novidade" }), NOW), false);
    assert.equal(
      countActivePromotions(
        [promo({}), promo({ is_active: false }), promo({ expires_at: past }), promo({ type: "evento" })],
        NOW
      ),
      1
    );
  });
});

describe("visibilidade e filtros públicos", () => {
  it("isPromotionVisibleNow respeita janela, estado e Montra publicada", () => {
    assert.equal(isPromotionVisibleNow(promo({}), NOW), true);
    assert.equal(isPromotionVisibleNow(promo({ starts_at: future }), NOW), false);
    assert.equal(isPromotionVisibleNow(promo({ expires_at: past }), NOW), false);
    assert.equal(
      isPromotionVisibleNow(promo({ businesses: { published: false } }), NOW),
      false
    );
    assert.equal(isPromotionVisibleNow(promo({ type: "novidade" }), NOW), false);
  });

  it("filterPromotions filtra cidade/categoria/validade e ordena por fim mais próximo", () => {
    const rows = [
      promo({ id: "a", expires_at: "2026-11-20T00:00:00.000Z" }),
      promo({ id: "b", expires_at: "2026-11-17T18:00:00.000Z" }),
      promo({ id: "c", expires_at: null }),
      promo({
        id: "d",
        expires_at: "2026-11-17T15:00:00.000Z",
        businesses: { name: "Outra", slug: "outra", city: "Porto", category: "Moda", published: true },
      }),
    ];
    assert.deepEqual(
      filterPromotions(rows, {}, NOW).map((p) => p.id),
      ["d", "b", "a", "c"]
    );
    assert.deepEqual(
      filterPromotions(rows, { city: "águeda" }, NOW).map((p) => p.id),
      ["b", "a", "c"]
    );
    assert.deepEqual(
      filterPromotions(rows, { category: "moda" }, NOW).map((p) => p.id),
      ["d"]
    );
    assert.deepEqual(
      filterPromotions(rows, { validity: "hoje" }, NOW).map((p) => p.id),
      ["d", "b"]
    );
    assert.deepEqual(
      filterPromotions(rows, { validity: "48h" }, NOW).map((p) => p.id),
      ["d", "b"]
    );
    assert.deepEqual(
      filterPromotions(rows, { validity: "semana" }, NOW).map((p) => p.id),
      ["d", "b", "a"]
    );
  });

  it("promotionFacets devolve cidades/categorias ordenadas e sem duplicados", () => {
    const facets = promotionFacets([
      promo({}),
      promo({ id: "x", businesses: { city: "Porto", category: "Moda", published: true } }),
      promo({ id: "y", businesses: { city: "águeda", category: "Beleza", published: true } }),
    ]);
    assert.deepEqual(facets.cities, ["Águeda", "Porto"]);
    assert.deepEqual(facets.categories, ["Beleza", "Moda"]);
  });
});

describe("métricas Vitrine Flash", () => {
  it("promotion_view e promotion_click estão na allowlist", () => {
    assert.equal(isAllowedEvent("promotion_view"), true);
    assert.equal(isAllowedEvent("promotion_click"), true);
    assert.equal(isAllowedEvent("promotion_hack"), false);
  });
});

describe("loadNovidadesState — degradação com/sem migration do Flash", () => {
  function fakeClient(failOn: (select: string) => boolean) {
    return {
      from: () => ({
        select: (sel: string) => ({
          eq: () => ({
            order: async () => {
              if (failOn(sel)) {
                return { data: null, error: { message: `column business_posts.original_price does not exist`, code: "42703" } };
              }
              return { data: [{ id: "1" }], error: null };
            },
          }),
        }),
      }),
    };
  }

  it("com Flash aplicado: mode full + flashReady true", async () => {
    const res = await loadNovidadesState(fakeClient(() => false) as never, "b1");
    assert.equal(res.mode, "full");
    assert.equal(res.flashReady, true);
  });

  it("sem Flash mas com novidades: mode full + flashReady false", async () => {
    const res = await loadNovidadesState(
      fakeClient((sel) => sel.includes("original_price")) as never,
      "b1"
    );
    assert.equal(res.mode, "full");
    assert.equal(res.flashReady, false);
    assert.equal(res.rows.length, 1);
  });
});
