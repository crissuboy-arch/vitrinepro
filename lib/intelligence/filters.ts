/**
 * lib/intelligence/filters.ts — A7
 *
 * Filtros puros que aplicam as REGRAS PÚBLICAS existentes.
 * Reutiliza: lib/availability.ts (Preciso Hoje), lib/geo.ts (distância).
 *
 * NOTA: estes filtros assumem que os dados de entrada já passaram pela
 * visibilidade pública (businesses.published, products.is_visible,
 * products.show_in_explore). A entrada server-side garante isso via RLS.
 */
import {
  businessMatchesQuery,
  businessMatchesQueryAny,
  normalizeQuery,
  queryTokens,
  productMatchesQuery,
  productMatchesQueryAny,
  significantTokens,
} from "../local-search";
import { distanceKm } from "../geo";
import { productAvailabilityState, isOpenNow, businessServiceState } from "../availability";
import type {
  VitrineIntent,
  IntelligenceBusiness,
  IntelligenceProduct,
  IntelligencePost,
  MatchReason,
} from "./types";

/** Tokens da query (normalizados, sem acentos). */
export function intentTokens(intent: VitrineIntent): string[] {
  return queryTokens(intent.query || "");
}

export interface ScoredBusiness extends IntelligenceBusiness {
  match: MatchReason[];
  distanceKm: number | null;
}

export interface ScoredProduct extends IntelligenceProduct {
  match: MatchReason[];
  distanceKm: number | null;
}

export interface ScoredPost extends IntelligencePost {
  match: MatchReason[];
}

/** Filtro + match metadata para businesses. */
export function filterBusinesses(
  businesses: IntelligenceBusiness[],
  intent: VitrineIntent,
  /** A8.1: true = fallback ANY-token (só quando o estrito dá zero). */
  anyMode = false
): ScoredBusiness[] {
  const tokens = intentTokens(intent);
  const hasLoc =
    typeof intent.latitude === "number" &&
    typeof intent.longitude === "number" &&
    isFinite(intent.latitude) &&
    isFinite(intent.longitude);
  const radiusKm = typeof intent.radiusKm === "number" && intent.radiusKm > 0 ? intent.radiusKm : null;

  const out: ScoredBusiness[] = [];
  for (const b of businesses) {
    const match: MatchReason[] = [];

    // Texto (reutiliza lib/local-search).
    if (tokens.length > 0) {
      const biz = {
        id: b.id,
        name: b.name,
        description: b.description,
        category: b.category,
        city: b.city,
      };
      const ok = anyMode
        ? businessMatchesQueryAny(biz, intent.query)
        : businessMatchesQuery(biz, intent.query);
      if (!ok) continue;
      match.push("text_match");
    }

    // Categoria.
    if (intent.category) {
      if (normalizeQuery(b.category || "") !== normalizeQuery(intent.category)) continue;
      match.push("category_match");
    }

    // Cidade.
    if (intent.city) {
      // A8.1: normaliza acentos — "Águeda" ≡ "Agueda". O valor original
      // de b.city é preservado para exibição; só o matching normaliza.
      if (normalizeQuery(b.city || "") !== normalizeQuery(intent.city)) continue;
      match.push("city_match");
    }

    // Distância (reutiliza lib/geo — Haversine único do projeto).
    let d: number | null = null;
    if (hasLoc && b.latitude != null && b.longitude != null) {
      d = distanceKm(intent.latitude!, intent.longitude!, b.latitude, b.longitude);
    }
    if (radiusKm != null) {
      if (d == null) continue; // sem coordenadas → não passa no filtro de raio
      if (d > radiusKm) continue;
      match.push("nearby");
    } else if (d != null && d <= 25) {
      match.push("nearby"); // metadata informativa
    }

    // Preciso Hoje — semântica REAL de lib/availability.ts.
    // service_today=TRUE explícito vence; caso contrário, exclui se houver
    // evidência positiva de fechado (CLOSED). UNKNOWN nunca é assumido.
    if (intent.neededToday) {
      const svc = businessServiceState({ service_today: b.service_today });
      const open = isOpenNow(b.opening_hours);
      if (open === "CLOSED" && svc !== "AVAILABLE") continue;
      if (svc === "AVAILABLE" || open === "OPEN") match.push("available_today");
    }

    out.push({ ...b, match, distanceKm: d });
  }
  return out;
}

/** Filtro + match metadata para produtos. */
export function filterProducts(
  products: IntelligenceProduct[],
  intent: VitrineIntent,
  /** A8.1: true = fallback ANY-token (só quando o estrito dá zero). */
  anyMode = false
): ScoredProduct[] {
  const tokens = intentTokens(intent);
  const hasLoc =
    typeof intent.latitude === "number" &&
    typeof intent.longitude === "number" &&
    isFinite(intent.latitude) &&
    isFinite(intent.longitude);
  const radiusKm = typeof intent.radiusKm === "number" && intent.radiusKm > 0 ? intent.radiusKm : null;

  const out: ScoredProduct[] = [];
  for (const p of products) {
    const match: MatchReason[] = [];

    if (tokens.length > 0) {
      const prod = { id: p.id, name: p.name, description: p.description, business_id: p.business_id };
      const ok = anyMode
        ? productMatchesQueryAny(prod, intent.query)
        : productMatchesQuery(prod, intent.query);
      if (!ok) continue;
      match.push("text_match");
    }

    if (intent.category) {
      if (normalizeQuery(p.business_category || "") !== normalizeQuery(intent.category)) continue;
      match.push("category_match");
    }

    if (intent.city) {
      // A8.1: normaliza acentos — "Águeda" ≡ "Agueda".
      if (normalizeQuery(p.business_city || "") !== normalizeQuery(intent.city)) continue;
      match.push("city_match");
    }

    // Preço: só produtos COM preço real participam do filtro.
    // Produto sem preço NUNCA vira €0 — é excluído do filtro de preço.
    if (intent.maxPrice != null || intent.minPrice != null) {
      if (p.price == null) continue;
      if (intent.maxPrice != null && p.price > intent.maxPrice) continue;
      if (intent.minPrice != null && p.price < intent.minPrice) continue;
      match.push("within_budget");
    }

    let d: number | null = null;
    if (hasLoc && p.business_lat != null && p.business_lng != null) {
      d = distanceKm(intent.latitude!, intent.longitude!, p.business_lat, p.business_lng);
    }
    if (radiusKm != null) {
      if (d == null) continue;
      if (d > radiusKm) continue;
      match.push("nearby");
    } else if (d != null && d <= 25) {
      match.push("nearby");
    }

    // Preciso Hoje: available_today=TRUE explícito (três estados — nunca inferir).
    if (intent.neededToday) {
      if (productAvailabilityState(p) !== "AVAILABLE") continue;
      match.push("available_today");
    }

    out.push({ ...p, match, distanceKm: d });
  }
  return out;
}

/** Filtro + match metadata para novidades (ativas e dentro da janela). */
export function filterPosts(
  posts: IntelligencePost[],
  intent: VitrineIntent,
  now: Date = new Date(),
  /** A8.1: true = fallback ANY-token (só quando o estrito dá zero). */
  anyMode = false
): ScoredPost[] {
  const tokens = intentTokens(intent);
  const out: ScoredPost[] = [];

  for (const p of posts) {
    // Regras públicas existentes: ativo e dentro da janela temporal.
    if (p.is_active === false) continue;
    if (p.starts_at && new Date(p.starts_at) > now) continue;
    if (p.expires_at && new Date(p.expires_at) < now) continue;

    const match: MatchReason[] = [];
    if (tokens.length > 0) {
      const hay = normalizeQuery([p.title, p.content, p.type].filter(Boolean).join(" "));
      let ok: boolean;
      if (anyMode) {
        const toks = significantTokens(intent.query);
        const hits = toks.filter((t) => hay.includes(t)).length;
        ok = toks.length > 0 && hits >= Math.min(2, toks.length);
      } else {
        const toks = queryTokens(intent.query);
        ok = toks.every((t) => hay.includes(t));
      }
      if (!ok) continue;
      match.push("text_match");
    }
    if (intent.city) {
      // A8.1: normaliza acentos — "Águeda" ≡ "Agueda".
      if (normalizeQuery(p.business_city || "") !== normalizeQuery(intent.city)) continue;
      match.push("city_match");
    }

    // Localização: mesmo comportamento de businesses/products.
    const hasLoc =
      typeof intent.latitude === "number" &&
      typeof intent.longitude === "number" &&
      isFinite(intent.latitude) &&
      isFinite(intent.longitude);
    const radiusKm = typeof intent.radiusKm === "number" && intent.radiusKm > 0 ? intent.radiusKm : null;
    let d: number | null = null;
    if (hasLoc && p.business_lat != null && p.business_lng != null) {
      d = distanceKm(intent.latitude!, intent.longitude!, p.business_lat, p.business_lng);
    }
    if (radiusKm != null) {
      if (d == null) continue;
      if (d > radiusKm) continue;
      match.push("nearby");
    }

    out.push({ ...p, match });
  }
  return out;
}
