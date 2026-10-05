/**
 * tests/a5-need-today.test.ts — A5 "⚡ Preciso Hoje" (integração)
 *
 * Compõe as camadas puras como o /explorar faz:
 *   busca (local-search) + disponibilidade (availability) + distância (geo)
 *   + publicação (visibility) + ranking (ranking) + domínio (site)
 *
 * Regras verificadas:
 *  - Preciso Hoje + busca / + distância / fallback sem geolocalização
 *  - UNKNOWN nunca vira "Disponível hoje"; FALSE é excluído
 *  - multi-business com estados mistos
 *  - negócio não publicado excluído (mesmo com disponibilidade TRUE)
 *  - A4 preservada (ranking, busca, domínio vitrinepro.digital)
 *  - owner isolation: colunas novas herdam RLS da tabela (policies a nível
 *    de tabela cobrem todas as colunas — verificação na migration canónica)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  businessMatchesQuery,
  productMatchesQuery,
} from "../lib/local-search.ts";
import {
  businessQualifiesNeedToday,
  productQualifiesNeedToday,
  productAvailabilityState,
  productCapabilities,
  businessServiceState,
  isOpenNow,
} from "../lib/availability.ts";
import { distanceKm } from "../lib/geo.ts";
import { isPublishedBusiness } from "../lib/visibility.ts";
import { scoreBusiness } from "../lib/ranking.ts";
import { CANONICAL_URL, getSiteUrl } from "../lib/site.ts";

const MON_10H = new Date("2026-10-05T10:00:00+01:00"); // seg 10:00 Lisboa

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const repoFile = (...segs: string[]) => fs.readFileSync(path.join(TEST_DIR, "..", ...segs), "utf8");

function stdWeek() {
  return [
    { day: "Segunda-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Terça-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Quarta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Quinta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Sexta-feira", open: "09:00", close: "18:00", closed: false },
    { day: "Sábado", open: "09:00", close: "13:00", closed: false },
    { day: "Domingo", open: "09:00", close: "13:00", closed: true },
  ];
}

// Replica a composição do /explorar em modo "Preciso Hoje".
interface TestBusiness {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  city?: string;
  published?: boolean | null;
  service_today?: boolean | null;
  opening_hours?: unknown;
  latitude?: number | null;
  longitude?: number | null;
}

interface TestProduct {
  id: string;
  name: string;
  business_id: string;
  available_today?: boolean | null;
  pickup_today?: boolean | null;
  delivery_today?: boolean | null;
}

function needTodayBusinesses(businesses: TestBusiness[], now: Date) {
  return businesses
    .filter((b) => isPublishedBusiness(b))
    .filter((b) =>
      businessQualifiesNeedToday(
        { service_today: b.service_today, opening_hours: b.opening_hours },
        now
      )
    );
}

function needTodayProducts(products: TestProduct[], bizById: Map<string, TestBusiness>, now: Date) {
  return products
    .map((p) => ({ ...p, business: bizById.get(p.business_id) || null }))
    .filter((h): h is TestProduct & { business: TestBusiness } => h.business !== null && isPublishedBusiness(h.business))
    .filter((h) => productQualifiesNeedToday(h))
    .filter((h) => {
      if (isOpenNow(h.business.opening_hours, now) === "CLOSED") {
        const caps = productCapabilities(h);
        return (
          productAvailabilityState(h) === "AVAILABLE" ||
          caps.pickup === "AVAILABLE" ||
          caps.delivery === "AVAILABLE"
        );
      }
      return true;
    });
}

describe("A5 — Preciso Hoje + busca", () => {
  const businesses = [
    { id: "b1", name: "Cantinho da Lu", description: "coxinhas e salgados", category: "Restaurante", city: "Águeda", published: true, service_today: true, opening_hours: stdWeek() },
    { id: "b2", name: "Salão Beleza Pura", description: "cabeleireira", category: "Beleza", city: "Águeda", published: true, service_today: null, opening_hours: stdWeek() },
    { id: "b3", name: "Oficina Fechada", description: "reparações", category: "Serviços", city: "Aveiro", published: true, service_today: false, opening_hours: stdWeek() },
    { id: "b4", name: "Rascunho Secreto", description: "coxinha", category: "Restaurante", city: "Águeda", published: false, service_today: true, opening_hours: stdWeek() },
  ];

  it("busca 'coxinha' em modo Preciso Hoje: só b1 (b4 é rascunho)", () => {
    const matched = businesses.filter((b) =>
      businessMatchesQuery(
        { id: b.id, name: b.name, description: b.description, category: b.category, city: b.city },
        "coxinha"
      )
    );
    assert.deepEqual(matched.map((b) => b.id), ["b1", "b4"]);
    const qualified = needTodayBusinesses(matched, MON_10H);
    assert.deepEqual(qualified.map((b) => b.id), ["b1"]);
  });

  it("service_today=false é excluído mesmo com busca a condizer", () => {
    const matched = businesses.filter((b) =>
      businessMatchesQuery(
        { id: b.id, name: b.name, description: b.description, category: b.category, city: b.city },
        "reparações"
      )
    );
    assert.deepEqual(needTodayBusinesses(matched, MON_10H).map((b) => b.id), []);
  });

  it("UNKNOWN passa sem badge (não se esconde o útil)", () => {
    const qualified = needTodayBusinesses([businesses[1]], MON_10H);
    assert.equal(qualified.length, 1);
    assert.equal(businessServiceState({ service_today: null }), "UNKNOWN");
  });
});

describe("A5 — Preciso Hoje + distância + fallback sem geo", () => {
  // b1 em Águeda (40.5769,-8.4456), b2 no Porto (41.1579,-8.6291)
  const businesses = [
    { id: "b1", name: "Perto", published: true, service_today: null, opening_hours: stdWeek(), latitude: 40.5769, longitude: -8.4456 },
    { id: "b2", name: "Longe", published: true, service_today: true, opening_hours: stdWeek(), latitude: 41.1579, longitude: -8.6291 },
  ];
  const userLoc = { lat: 40.5769, lng: -8.4456 }; // Águeda

  it("combina disponibilidade + distância: b2 confirmado mas longe", () => {
    const qualified = needTodayBusinesses(businesses, MON_10H);
    assert.equal(qualified.length, 2);
    const withDist = qualified.map((b) => ({
      ...b,
      d: b.latitude != null && b.longitude != null ? distanceKm(userLoc.lat, userLoc.lng, b.latitude, b.longitude) : null,
    }));
    // b1: perto + UNKNOWN; b2: longe + AVAILABLE → b2 tem boost de ranking
    const b1 = withDist.find((b) => b.id === "b1")!;
    const b2 = withDist.find((b) => b.id === "b2")!;
    assert.ok(b1.d! < 1);
    assert.ok(b2.d! > 50); // Águeda→Porto ≈ 66 km
    assert.equal(businessServiceState({ service_today: b2.service_today }), "AVAILABLE");
  });

  it("fallback sem geolocalização: Preciso Hoje funciona sem distância", () => {
    const qualified = needTodayBusinesses(businesses, MON_10H);
    // sem userLoc, distância é null — o modo não quebra nem exclui
    assert.equal(qualified.length, 2);
  });
});

describe("A5 — produtos em modo Preciso Hoje", () => {
  const businesses = [
    { id: "b1", name: "Cantinho da Lu", published: true, opening_hours: stdWeek() },
    { id: "b2", name: "Fechado Agora", published: true, opening_hours: [{ day: "Segunda-feira", open: "09:00", close: "18:00", closed: true }] },
  ];
  const bizById = new Map(businesses.map((b) => [b.id, b]));
  const products = [
    { id: "p1", name: "Coxinha", business_id: "b1", available_today: true, pickup_today: null, delivery_today: null },
    { id: "p2", name: "Coxinha Vegana", business_id: "b1", available_today: false, pickup_today: null, delivery_today: null },
    { id: "p3", name: "Bolo", business_id: "b1", available_today: null, pickup_today: true, delivery_today: null },
    { id: "p4", name: "Tarte", business_id: "b1", available_today: null, pickup_today: null, delivery_today: null },
    { id: "p5", name: "Pão", business_id: "b2", available_today: null, pickup_today: null, delivery_today: null },
    { id: "p6", name: "Focaccia", business_id: "b2", available_today: null, pickup_today: null, delivery_today: true },
  ];

  it("FALSE excluído; TRUE e UNKNOWN passam", () => {
    const q = needTodayProducts(products, bizById, MON_10H).map((p) => p.id);
    assert.ok(q.includes("p1")); // TRUE
    assert.ok(!q.includes("p2")); // FALSE
    assert.ok(q.includes("p3")); // UNKNOWN + pickup TRUE
    assert.ok(q.includes("p4")); // UNKNOWN puro passa (sem badge)
  });

  it("negócio CLOSED: só passa produto com capacidade confirmada", () => {
    const q = needTodayProducts(products, bizById, MON_10H).map((p) => p.id);
    assert.ok(!q.includes("p5")); // UNKNOWN num negócio fechado → fora
    assert.ok(q.includes("p6")); // delivery TRUE → dentro
  });

  it("badges só com confirmação (nunca de UNKNOWN)", () => {
    const p4 = products.find((p) => p.id === "p4")!;
    assert.equal(productAvailabilityState(p4), "UNKNOWN");
    assert.equal(productCapabilities(p4).pickup, "UNKNOWN");
    assert.equal(productCapabilities(p4).delivery, "UNKNOWN");
  });

  it("busca de produto continua A4 (insensível a acentos) + qualificação", () => {
    const matched = products.filter((p) =>
      productMatchesQuery({ id: p.id, name: p.name, business_id: p.business_id }, "coxinha")
    );
    assert.deepEqual(matched.map((p) => p.id).sort(), ["p1", "p2"]);
    const qualified = needTodayProducts(matched, bizById, MON_10H).map((p) => p.id);
    assert.deepEqual(qualified, ["p1"]); // p2 é FALSE
  });
});

describe("A5 — CASO REAL Cantinho da Lu (regressão do bug de produção)", () => {
  // Dados reais do Supabase em 2026-10-05 (segunda-feira):
  //  - business.service_today = NULL, opening_hours com Segunda closed=true
  //  - produto com available_today = TRUE
  // Regra: service_today NULL NÃO invalida produto com available_today TRUE;
  // e disponibilidade confirmada do produto passa mesmo com negócio CLOSED.
  const MONDAY = new Date("2026-10-05T10:00:00+01:00");
  const closedMonday = [
    { day: "Segunda-feira", open: "09:00", close: "18:00", closed: true },
    { day: "Terça-feira", open: "09:30", close: "20:00", closed: false },
  ];
  const business = {
    id: "b-lu",
    name: "Cantinho da Lu",
    published: true,
    service_today: null,
    opening_hours: closedMonday,
  };
  const bizById = new Map([[business.id, business]]);

  it("produto available_today=TRUE aparece com Preciso Hoje (service_today NULL não invalida)", () => {
    const products = [
      { id: "p-cone", name: "Coxinha no Cone", business_id: "b-lu", available_today: true, pickup_today: true, delivery_today: false },
    ];
    const matched = products.filter((p) =>
      productMatchesQuery({ id: p.id, name: p.name, business_id: p.business_id }, "coxinha")
    );
    assert.equal(matched.length, 1);
    const qualified = needTodayProducts(matched, bizById, MONDAY).map((p) => p.id);
    assert.deepEqual(qualified, ["p-cone"], "produto com available_today=TRUE DEVE aparecer");
  });

  it("badges corretos: Disponível + Retirada hoje; sem Entrega hoje", () => {
    const p = { available_today: true, pickup_today: true, delivery_today: false };
    assert.equal(productAvailabilityState(p), "AVAILABLE");
    assert.equal(productCapabilities(p).pickup, "AVAILABLE");
    assert.equal(productCapabilities(p).delivery, "UNAVAILABLE");
  });

  it("negócio CLOSED continua excluído das vitrines sem sinal explícito", () => {
    assert.equal(isOpenNow(closedMonday, MONDAY), "CLOSED");
    assert.deepEqual(needTodayBusinesses([business], MONDAY), []);
  });

  it("service_today=TRUE explícito vence horário CLOSED (sinal do comerciante)", () => {
    const b = { ...business, service_today: true };
    assert.deepEqual(needTodayBusinesses([b], MONDAY).map((x) => x.id), ["b-lu"]);
  });

  it("service_today=FALSE explícito exclui mesmo com horário OPEN", () => {
    const openDay = new Date("2026-10-06T10:00:00+01:00"); // terça
    const b = { ...business, service_today: false };
    assert.equal(isOpenNow(closedMonday, openDay), "OPEN");
    assert.deepEqual(needTodayBusinesses([b], openDay), []);
  });
});

describe("A5 — guards estruturais", () => {
  it("negócio não publicado nunca aparece (mesmo com service_today=TRUE)", () => {
    const b = { published: false, service_today: true, opening_hours: stdWeek() };
    assert.equal(isPublishedBusiness(b), false);
    assert.equal(needTodayBusinesses([b], MON_10H).length, 0);
  });

  it("owner isolation: colunas A5 herdam RLS da tabela (policies a nível de tabela)", () => {
    const rls = repoFile("supabase", "migrations", "20261004000003_canonical_rls_normalization.sql");
    // policies FOR ALL / SELECT na tabela inteira cobrem as novas colunas automaticamente
    assert.ok(rls.includes('CREATE POLICY "vp_products_write" ON public.products'));
    assert.ok(rls.includes("FOR ALL USING"));
    assert.ok(rls.includes("user_id = auth.uid()"));
  });

  it("migration A5 existe, é aditiva e sem DEFAULT/backfill", () => {
    const sql = repoFile("supabase", "migrations", "20261005000007_a5_availability.sql");
    assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS available_today BOOLEAN"));
    assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS pickup_today BOOLEAN"));
    assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS delivery_today BOOLEAN"));
    assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS service_today BOOLEAN"));
    assert.ok(!/DEFAULT\s+(true|false)/i.test(sql), "sem DEFAULT true/false");
    assert.ok(!/^UPDATE\s/m.test(sql), "sem backfill");
  });

  it("A4 preservada: ranking e domínio intactos", () => {

    const a = { plan: "free", view_count: 0, like_count: 0, favorite_count: 0, share_count: 0, rating_average: 0 };
    const b = { plan: "business", view_count: 100, like_count: 50, favorite_count: 20, share_count: 10, rating_average: 4.8 };
    assert.ok(scoreBusiness(b as Parameters<typeof scoreBusiness>[0]) > scoreBusiness(a as Parameters<typeof scoreBusiness>[0]));
    assert.equal(CANONICAL_URL, "https://vitrinepro.digital");
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    assert.ok(getSiteUrl().startsWith("https://vitrinepro.digital"));
  });

  it("analytics: need_today_result_click na allowlist; sem coordenadas no payload", () => {
    const guard = repoFile("lib", "analytics-guard.ts");
    assert.ok(guard.includes('"need_today_result_click"'));
    const explorar = repoFile("app", "explorar", "page.tsx");
    // payload do clique: só business_id + event_type (padrão A4)
    assert.ok(explorar.includes("body: JSON.stringify({ business_id: businessId, event_type: eventType })"));
  });

  it("A5-UX: pesquisa tem form + botão Buscar + Enter executa a mesma pesquisa", () => {
    const explorar = repoFile("app", "explorar", "page.tsx");
    // form com submit (Enter funciona)
    assert.ok(explorar.includes("<form onSubmit={handleSearchSubmit}"));
    // botão visível de submit
    assert.ok(explorar.includes("🔎 Buscar"));
    assert.ok(/<button[^>]*type="submit"/.test(explorar));
    // handler de submit executa a MESMA função do debounce automático
    assert.ok(explorar.includes("void runProductSearch(searchQuery)"));
    assert.ok(explorar.includes("void runProductSearch(q)"));
    // sem segundo motor de busca: uma única função de pesquisa de produtos
    const defs = explorar.match(/const runProductSearch = async/g) || [];
    assert.equal(defs.length, 1);
  });
});
