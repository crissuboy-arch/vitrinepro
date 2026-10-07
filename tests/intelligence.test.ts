/**
 * tests/intelligence.test.ts — A7
 *
 * Testes da Intelligence Layer com fixtures controladas.
 * REGRA ABSOLUTA: nunca inventar dados — sem dado real, resultado vazio.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchIntelligence } from "../lib/intelligence/search";
import type { VitrineIntent, IntelligenceData } from "../lib/intelligence/types";

const biz1 = {
  id: "b1", name: "Cantinho da Lu", slug: "cantinho-da-lu",
  description: "Salgados e doces", category: "Alimentação", city: "Águeda",
  latitude: 40.5761, longitude: -8.4436,
  logo_url: null, cover_url: null, is_featured: false,
  opening_hours: null, service_today: null,
};
const biz2 = {
  id: "b2", name: "Oficina Secreta", slug: "oficina-secreta",
  description: "Negócio não publicado", category: "Serviços", city: "Águeda",
  latitude: null, longitude: null,
  logo_url: null, cover_url: null, is_featured: false,
  opening_hours: null, service_today: null,
};

function baseData(): IntelligenceData {
  return {
    // NOTA: biz2 NÃO entra aqui — simula RLS (só published chega à camada).
    businesses: [biz1],
    products: [
      {
        id: "p1", business_id: "b1", name: "Coxinha no Cone", description: "Coxinha crocante",
        price: 2.5, image_url: "https://x/coxinha.jpg",
        available_today: true, pickup_today: true, delivery_today: null,
        business_name: "Cantinho da Lu", business_slug: "cantinho-da-lu",
        business_city: "Águeda", business_category: "Alimentação",
        business_lat: 40.5761, business_lng: -8.4436,
      },
      {
        id: "p2", business_id: "b1", name: "Bolo de Chocolate", description: "Fatia",
        price: null, // sem preço
        image_url: null,
        available_today: null, pickup_today: null, delivery_today: null,
        business_name: "Cantinho da Lu", business_slug: "cantinho-da-lu",
        business_city: "Águeda", business_category: "Alimentação",
        business_lat: 40.5761, business_lng: -8.4436,
      },
    ],
    posts: [
      {
        id: "n1", business_id: "b1", type: "promotion", title: "Promo de sábado",
        content: "Desconto", image_url: null, price: null,
        starts_at: null, expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_active: true,
        business_name: "Cantinho da Lu", business_slug: "cantinho-da-lu", business_city: "Águeda",
        business_lat: 40.5761, business_lng: -8.4436,
      },
      {
        id: "n2", business_id: "b1", type: "news", title: "Novidade antiga",
        content: "Expirada", image_url: null, price: null,
        starts_at: null, expires_at: new Date(Date.now() - 86400000).toISOString(),
        is_active: true,
        business_name: "Cantinho da Lu", business_slug: "cantinho-da-lu", business_city: "Águeda",
        business_lat: 40.5761, business_lng: -8.4436,
      },
    ],
  };
}

const intent = (over: Partial<VitrineIntent> = {}): VitrineIntent => ({
  query: "", ...over,
});

describe("CENÁRIO A — 'coxinha' retorna produto real", () => {
  it("encontra a Coxinha no Cone", () => {
    const r = searchIntelligence(intent({ query: "coxinha", resultTypes: ["product"] }), baseData());
    assert.ok(r.some((x) => x.id === "p1"), "produto real encontrado");
    assert.strictEqual(r.find((x) => x.id === "p1")!.price, 2.5, "preço real preservado");
  });
});

describe("CENÁRIO B — query inexistente → zero resultados, sem invenção", () => {
  it("não inventa nada", () => {
    const r = searchIntelligence(intent({ query: "zxqwkj asdfgh" }), baseData());
    assert.strictEqual(r.length, 0, "resultado vazio honesto");
  });
});

describe("CENÁRIO C/D — visibilidade", () => {
  it("produto oculto (is_visible=false) não chega à camada — simulado via dados", () => {
    // A camada recebe só dados públicos; aqui provamos que o filtro honra o input.
    const data = baseData();
    data.products = [];
    const r = searchIntelligence(intent({ query: "coxinha", resultTypes: ["product"] }), data);
    assert.strictEqual(r.length, 0);
  });
});

describe("CENÁRIO E — business unpublished não retorna", () => {
  it("Oficina Secreta (não publicada) ausente", () => {
    const r = searchIntelligence(intent({ query: "oficina" }), baseData());
    assert.ok(!r.some((x) => x.id === "b2"), "unpublished excluído");
  });
});

describe("CENÁRIO F — maxPrice respeita preço", () => {
  it("coxinha a €2.50 passa em maxPrice=3, falha em maxPrice=2", () => {
    const ok = searchIntelligence(intent({ query: "coxinha", resultTypes: ["product"], maxPrice: 3 }), baseData());
    assert.ok(ok.some((x) => x.id === "p1"));
    const fail = searchIntelligence(intent({ query: "coxinha", resultTypes: ["product"], maxPrice: 2 }), baseData());
    assert.ok(!fail.some((x) => x.id === "p1"), "fora do orçamento excluído");
  });
});

describe("CENÁRIO G — produto sem preço não vira €0", () => {
  it("price null preservado; excluído do filtro de preço", () => {
    const r = searchIntelligence(intent({ query: "bolo", resultTypes: ["product"] }), baseData());
    const bolo = r.find((x) => x.id === "p2");
    assert.ok(bolo, "encontrado sem filtro de preço");
    assert.strictEqual(bolo!.price, null, "nunca €0 inventado");
    const filtered = searchIntelligence(intent({ query: "bolo", resultTypes: ["product"], maxPrice: 100 }), baseData());
    assert.ok(!filtered.some((x) => x.id === "p2"), "sem preço não participa do filtro");
  });
});

describe("CENÁRIO H — neededToday respeita semântica real", () => {
  it("só available_today=TRUE passa", () => {
    const r = searchIntelligence(
      intent({ query: "", resultTypes: ["product"], neededToday: true }), baseData()
    );
    assert.ok(r.some((x) => x.id === "p1"), "coxinha confirmada passa");
    assert.ok(!r.some((x) => x.id === "p2"), "sem confirmação não passa");
    assert.ok(r.find((x) => x.id === "p1")!.match.includes("available_today"));
  });
});

describe("CENÁRIO I — localização + raio", () => {
  it("dentro do raio passa, fora não", () => {
    const near = searchIntelligence(
      intent({ query: "", latitude: 40.5761, longitude: -8.4436, radiusKm: 5 }), baseData()
    );
    assert.ok(near.length > 0, "perto encontra");
    const far = searchIntelligence(
      intent({ query: "", latitude: 38.7223, longitude: -9.1393, radiusKm: 5 }), baseData() // Lisboa
    );
    assert.strictEqual(far.length, 0, "longe não encontra");
  });
});

describe("CENÁRIO J — post expirado não retorna", () => {
  it("só novidade válida aparece", () => {
    const r = searchIntelligence(intent({ query: "", resultTypes: ["post"] }), baseData());
    assert.ok(r.some((x) => x.id === "n1"), "válida aparece");
    assert.ok(!r.some((x) => x.id === "n2"), "expirada excluída");
  });
});

describe("CENÁRIO K — nenhum dado privado no resultado", () => {
  it("resultado só tem campos públicos", () => {
    const r = searchIntelligence(intent({ query: "coxinha" }), baseData());
    const forbidden = ["email", "user_id", "customer", "subscription", "token"];
    for (const item of r) {
      for (const k of Object.keys(item)) {
        assert.ok(!forbidden.some((f) => k.toLowerCase().includes(f)), `campo privado: ${k}`);
      }
    }
  });
});

describe("CENÁRIO L — ranking determinístico", () => {
  it("mesma entrada + mesmos dados = mesma ordem", () => {
    const q = intent({ query: "a" }); // "a" bate em vários
    const r1 = searchIntelligence(q, baseData()).map((x) => x.id);
    const r2 = searchIntelligence(q, baseData()).map((x) => x.id);
    assert.deepStrictEqual(r1, r2, "ordem idêntica");
  });
});

describe("Match metadata", () => {
  it("retorna motivos do match", () => {
    const r = searchIntelligence(intent({ query: "coxinha", resultTypes: ["product"] }), baseData());
    const p1 = r.find((x) => x.id === "p1")!;
    assert.ok(p1.match.includes("text_match"), "text_match presente");
    assert.ok(typeof p1.score === "number", "score numérico");
  });
});
