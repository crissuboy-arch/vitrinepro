/**
 * tests/a4-discovery.test.ts — A4
 * Descoberta local + Perto de Mim.
 *
 * Covers A4.21:
 *  - distanceKm (Haversine) + coordenadas válidas/inválidas
 *  - filtros de distância 500m/1km/5km/10km/20km
 *  - ordenação por distância + fallback sem localização
 *  - busca por negócio / busca por produto (camada reutilizável)
 *  - produto ligado ao business correto
 *  - published=false não aparece publicamente
 *  - ranking existente preservado (scoreBusiness)
 *  - .pt canónico / ausência de .com operacional (regressão A3)
 *  - ownership da edição de localização (payload)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  distanceKm,
  isValidCoordinates,
  businessCoords,
  formatDistance,
  DISTANCE_FILTERS,
} from "../lib/geo.ts";
import {
  normalizeQuery,
  businessMatchesQuery,
  productMatchesQuery,
  searchBusinesses,
  searchProducts,
} from "../lib/local-search.ts";
import { scoreBusiness } from "../lib/ranking.ts";
import { isPublishedBusiness } from "../lib/visibility.ts";
import { CANONICAL_URL, getSiteUrl } from "../lib/site.ts";
import { buildBusinessUpdatePayload } from "../lib/business-profile.ts";

// Águeda ≈ 40.5769, -8.4456 · Lisboa ≈ 38.7223, -9.1393 · Porto ≈ 41.1579, -8.6291
const AGUEDA = { lat: 40.5769, lng: -8.4456 };
const LISBOA = { lat: 38.7223, lng: -9.1393 };
const PORTO = { lat: 41.1579, lng: -8.6291 };

describe("A4 — distanceKm (Haversine)", () => {
  it("mesmo ponto → 0 km", () => {
    assert.equal(distanceKm(AGUEDA.lat, AGUEDA.lng, AGUEDA.lat, AGUEDA.lng), 0);
  });

  it("Lisboa ↔ Porto ≈ 274 km (±5)", () => {
    const d = distanceKm(LISBOA.lat, LISBOA.lng, PORTO.lat, PORTO.lng)!;
    assert.ok(d > 269 && d < 279, `esperado ~274, obtido ${d}`);
  });

  it("Águeda ↔ Porto ≈ 62 km (±5)", () => {
    const d = distanceKm(AGUEDA.lat, AGUEDA.lng, PORTO.lat, PORTO.lng)!;
    assert.ok(d > 57 && d < 67, `esperado ~62, obtido ${d}`);
  });

  it("é simétrica", () => {
    const a = distanceKm(AGUEDA.lat, AGUEDA.lng, LISBOA.lat, LISBOA.lng)!;
    const b = distanceKm(LISBOA.lat, LISBOA.lng, AGUEDA.lat, AGUEDA.lng)!;
    assert.equal(a, b);
  });

  it("coordenadas inválidas → null (nunca número falso)", () => {
    assert.equal(distanceKm(NaN, 0, 0, 0), null);
    assert.equal(distanceKm(0, 0, 999, 0), null);
    assert.equal(distanceKm(0, 0, 0, 200), null);
    assert.equal(distanceKm(null as unknown as number, 0, 0, 0), null);
    assert.equal(distanceKm(undefined as unknown as number, 0, 0, 0), null);
  });
});

describe("A4 — coordenadas válidas/inválidas", () => {
  it("aceita WGS84 válido", () => {
    assert.equal(isValidCoordinates(40.5, -8.4), true);
    assert.equal(isValidCoordinates(-90, -180), true);
    assert.equal(isValidCoordinates(90, 180), true);
  });

  it("rejeita fora de intervalo / não-números", () => {
    assert.equal(isValidCoordinates(91, 0), false);
    assert.equal(isValidCoordinates(0, 181), false);
    assert.equal(isValidCoordinates(NaN, 0), false);
    assert.equal(isValidCoordinates("40", "-8"), false);
    assert.equal(isValidCoordinates(null, null), false);
    assert.equal(isValidCoordinates(undefined, undefined), false);
  });

  it("businessCoords extrai ou devolve null", () => {
    assert.deepEqual(businessCoords({ latitude: 40.5, longitude: -8.4 }), {
      lat: 40.5,
      lng: -8.4,
    });
    assert.equal(businessCoords({ latitude: null, longitude: null }), null);
    assert.equal(businessCoords({ latitude: 40.5, longitude: null }), null);
    assert.equal(businessCoords({}), null);
  });
});

describe("A4 — formatDistance (pt-PT)", () => {
  it("350 m", () => assert.equal(formatDistance(0.35), "350 m"));
  it("1,2 km", () => assert.equal(formatDistance(1.24), "1,2 km"));
  it("4,8 km", () => assert.equal(formatDistance(4.83), "4,8 km"));
  it("null/negativo → null (nunca distância falsa)", () => {
    assert.equal(formatDistance(null), null);
    assert.equal(formatDistance(undefined), null);
    assert.equal(formatDistance(-1), null);
    assert.equal(formatDistance(NaN), null);
  });
});

describe("A4 — filtros de distância", () => {
  it("500m, 1km, 5km, 10km, 20km", () => {
    assert.deepEqual(
      DISTANCE_FILTERS.map((f) => f.km),
      [0.5, 1, 5, 10, 20]
    );
  });

  it("filtra por raio: só negócios com coords válidas dentro do raio", () => {
    const user = AGUEDA;
    const biz = [
      { id: "a", latitude: 40.577, longitude: -8.446 }, // ~100 m
      { id: "b", latitude: 40.6, longitude: -8.45 }, // ~2.6 km
      { id: "c", latitude: null, longitude: null }, // sem coords
      { id: "d", latitude: 999, longitude: 0 }, // inválidas
    ];
    const within = (km: number) =>
      biz.filter((b) => {
        const c = businessCoords(b);
        if (!c) return false;
        const d = distanceKm(user.lat, user.lng, c.lat, c.lng);
        return d !== null && d <= km;
      });
    assert.deepEqual(within(0.5).map((b) => b.id), ["a"]);
    assert.deepEqual(within(5).map((b) => b.id), ["a", "b"]);
    assert.deepEqual(within(20).map((b) => b.id), ["a", "b"]);
  });
});

describe("A4 — ordenação por distância + fallback", () => {
  it("mais perto primeiro; sem distância por último", () => {
    const user = AGUEDA;
    const rows = [
      { id: "longe", latitude: PORTO.lat, longitude: PORTO.lng },
      { id: "perto", latitude: 40.577, longitude: -8.446 },
      { id: "sem-coords", latitude: null, longitude: null },
    ].map((b) => {
      const c = businessCoords(b);
      return {
        ...b,
        _d: c ? distanceKm(user.lat, user.lng, c.lat, c.lng) : null,
      };
    });
    rows.sort((a, b) => {
      if (a._d === null && b._d === null) return 0;
      if (a._d === null) return 1;
      if (b._d === null) return -1;
      return a._d - b._d;
    });
    assert.deepEqual(rows.map((r) => r.id), ["perto", "longe", "sem-coords"]);
  });

  it("fallback sem localização: distância sempre null", () => {
    const c = businessCoords({ latitude: 40.5, longitude: -8.4 });
    assert.ok(c);
    // sem userLoc o caller não calcula → null
    const d = null;
    assert.equal(formatDistance(d), null);
  });
});

describe("A4 — busca por negócio (camada reutilizável)", () => {
  const biz = {
    id: "1",
    name: "Cantinho da Lu",
    description: "Salgados e doces caseiros",
    category: "Restaurantes",
    city: "Águeda",
    community: "Brasil",
  };

  it("encontra por nome (insensível a acentos/maiúsculas)", () => {
    assert.equal(businessMatchesQuery(biz, "cantinho"), true);
    assert.equal(businessMatchesQuery(biz, "CANTINHO DA LU"), true);
  });

  it("encontra por descrição/categoria/cidade/comunidade", () => {
    assert.equal(businessMatchesQuery(biz, "salgados"), true);
    assert.equal(businessMatchesQuery(biz, "restaurantes"), true);
    assert.equal(businessMatchesQuery(biz, "agueda"), true); // sem acento
    assert.equal(businessMatchesQuery(biz, "Águeda"), true); // com acento
    assert.equal(businessMatchesQuery(biz, "brasil"), true);
  });

  it("todos os tokens têm de aparecer", () => {
    assert.equal(businessMatchesQuery(biz, "cantinho lisboa"), false);
    assert.equal(businessMatchesQuery(biz, "cantinho agueda"), true);
  });

  it("query vazia não filtra", () => {
    assert.equal(businessMatchesQuery(biz, ""), true);
    assert.equal(businessMatchesQuery(biz, "   "), true);
  });

  it("normalizeQuery tira acentos", () => {
    assert.equal(normalizeQuery("  Águeda "), "agueda");
    assert.equal(normalizeQuery("COXINHA"), "coxinha");
  });

  it("searchBusinesses ordena por relevância (nome > descrição)", () => {
    const rows = [
      { ...biz, id: "desc", name: "Outro Nome", description: "vende coxinha" },
      { ...biz, id: "nome", name: "Coxinha Dourada", description: "outra coisa" },
    ];
    const hits = searchBusinesses(rows, "coxinha");
    assert.equal(hits.length, 2);
    assert.equal(hits[0].business.id, "nome");
  });
});

describe("A4 — busca por produto", () => {
  const prod = {
    id: "p1",
    name: "Coxinha",
    description: "Coxinha de frango cremosa",
    business_id: "b1",
  };

  it("encontra por nome/descrição", () => {
    assert.equal(productMatchesQuery(prod, "coxinha"), true);
    assert.equal(productMatchesQuery(prod, "frango"), true);
    assert.equal(productMatchesQuery(prod, "pastel"), false);
  });

  it("searchProducts mantém business_id (relação real)", () => {
    const hits = searchProducts([prod], "coxinha");
    assert.equal(hits.length, 1);
    assert.equal(hits[0].product.business_id, "b1");
  });

  it("query vazia não filtra", () => {
    assert.equal(productMatchesQuery(prod, ""), true);
  });
});

describe("A4 — visibilidade pública", () => {
  it("published=false não aparece publicamente", () => {
    assert.equal(isPublishedBusiness({ published: false }), false);
    assert.equal(isPublishedBusiness({ published: true }), true);
    assert.equal(isPublishedBusiness({ published: null }), false);
  });
});

describe("A4 — ranking existente preservado", () => {
  it("scoreBusiness continua a ordenar por plano + engagement", () => {
    const free = { plan: "free", view_count: 0, like_count: 0, favorite_count: 0, share_count: 0, rating_average: 0 };
    const pro = { plan: "pro", view_count: 0, like_count: 0, favorite_count: 0, share_count: 0, rating_average: 0 };
    assert.ok(scoreBusiness(pro) > scoreBusiness(free));
    assert.equal(scoreBusiness(pro) - scoreBusiness(free), 200);
  });
});

describe("A4 — .pt canónico (regressão vitrinepro.com)", () => {
  it("CANONICAL_URL é https://vitrinepro.pt, sem .com", () => {
    assert.equal(CANONICAL_URL, "https://vitrinepro.pt");
    assert.ok(!CANONICAL_URL.includes("vitrinepro.com"));
  });

  it("getSiteUrl() nunca devolve .com nos cenários padrão", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    assert.ok(!getSiteUrl().includes("vitrinepro.com"));
    process.env.VERCEL_URL = "vitrinepro-abc123.vercel.app";
    assert.ok(!getSiteUrl().includes("vitrinepro.com"));
    delete process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "not a url";
    assert.equal(getSiteUrl(), "https://vitrinepro.pt");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("nenhum literal vitrinepro.com no código operacional", () => {
    const roots = ["app", "lib", "components"];
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          walk(full);
        } else if (/\.(ts|tsx|js|jsx|css|json)$/.test(entry.name)) {
          const content = fs.readFileSync(full, "utf8");
          if (content.includes("vitrinepro.com")) hits.push(full);
        }
      }
    };
    for (const r of roots) walk(r);
    assert.deepEqual(hits, [], `vitrinepro.com encontrado em: ${hits.join(", ")}`);
  });
});

describe("A4 — payload de localização (ownership)", () => {
  const base = {
    name: "N",
    description: "D",
    categoryId: "",
    cityId: "",
    country: "Portugal",
    ownerOriginCountry: "Brasil",
    address: "Rua X",
    whatsapp: "",
    phone: "",
    email: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    website: "",
    hours: {},
  };

  it("inclui postal_code/latitude/longitude quando há valores reais", () => {
    const p = buildBusinessUpdatePayload({
      ...base,
      postalCode: "3750-123",
      latitude: 40.5769,
      longitude: -8.4456,
    });
    assert.equal(p.postal_code, "3750-123");
    assert.equal(p.latitude, 40.5769);
    assert.equal(p.longitude, -8.4456);
  });

  it("não envia as colunas quando vazias (sem wipe acidental)", () => {
    const p = buildBusinessUpdatePayload({
      ...base,
      postalCode: "",
      latitude: null,
      longitude: null,
    });
    assert.ok(!("postal_code" in p));
    assert.ok(!("latitude" in p));
    assert.ok(!("longitude" in p));
  });

  it("mantém a separação country vs owner_origin_country", () => {
    const p = buildBusinessUpdatePayload({ ...base, postalCode: "", latitude: null, longitude: null });
    assert.equal(p.country, "Portugal");
    assert.equal(p.owner_origin_country, "Brasil");
  });
});
