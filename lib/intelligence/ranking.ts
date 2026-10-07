/**
 * lib/intelligence/ranking.ts — A7
 *
 * Ranking DETERMINÍSTICO e simples. Mesma entrada + mesmos dados = mesma ordem.
 *
 * SINAIS (documentados, todos derivados de dados reais):
 *   text_match      +10  (query bateu no nome/descrição)
 *   category_match  +6
 *   city_match      +4
 *   nearby          +8, com bónus de proximidade: max(0, 5 - km/5)
 *   available_today +7
 *   within_budget   +5
 *
 * NOTA A10.1: is_featured removido — coluna não existe no schema.
 * Se destaque for reintroduzido no futuro, readicionar aqui.
 *
 * Desempate: score desc → nome asc (locale) → id asc. Totalmente determinístico.
 * SEM IA generativa. SEM sinais inventados.
 */
import type { MatchReason, VitrineIntent, VitrineResult } from "./types";
import type { ScoredBusiness, ScoredProduct, ScoredPost } from "./filters";

const WEIGHTS: Record<MatchReason, number> = {
  text_match: 10,
  category_match: 6,
  city_match: 4,
  nearby: 8,
  available_today: 7,
  within_budget: 5,
};

function baseScore(match: MatchReason[], distanceKm: number | null): number {
  let s = 0;
  for (const m of match) s += WEIGHTS[m] || 0;
  if (match.includes("nearby") && distanceKm != null) {
    s += Math.max(0, 5 - distanceKm / 5); // mais perto = mais pontos
  }
  return Math.round(s * 100) / 100;
}

function tieBreak(a: VitrineResult, b: VitrineResult): number {
  if (b.score !== a.score) return b.score - a.score;
  const n = a.name.localeCompare(b.name, "pt");
  if (n !== 0) return n;
  return a.id.localeCompare(b.id);
}

export function rankBusinesses(items: ScoredBusiness[]): VitrineResult[] {
  const results: VitrineResult[] = items.map((b) => ({
    id: b.id,
    type: "business" as const,
    business_id: b.id,
    name: b.name,
    slug: b.slug,
    image_url: b.logo_url || b.cover_url || null,
    price: null,
    city: b.city,
    category: b.category,
    distanceKm: b.distanceKm,
    match: b.match,
    score: baseScore(b.match, b.distanceKm),
  }));
  return results.sort(tieBreak);
}

export function rankProducts(items: ScoredProduct[]): VitrineResult[] {
  const results: VitrineResult[] = items.map((p) => ({
    id: p.id,
    type: "product" as const,
    business_id: p.business_id,
    name: p.name,
    slug: p.business_slug,
    image_url: p.image_url || null,
    price: p.price ?? null, // null = sem preço (nunca 0)
    city: p.business_city,
    category: p.business_category,
    distanceKm: p.distanceKm,
    match: p.match,
    score: baseScore(p.match, p.distanceKm),
  }));
  return results.sort(tieBreak);
}

export function rankPosts(items: ScoredPost[]): VitrineResult[] {
  const results: VitrineResult[] = items.map((p) => ({
    id: p.id,
    type: "post" as const,
    business_id: p.business_id,
    name: p.title,
    slug: p.business_slug,
    image_url: p.image_url || null,
    price: p.price ?? null,
    city: p.business_city,
    match: p.match,
    score: baseScore(p.match, null),
  }));
  return results.sort(tieBreak);
}

/** Intercala tipos preservando score global (determinístico). */
export function mergeRanked(
  businesses: VitrineResult[],
  products: VitrineResult[],
  posts: VitrineResult[],
  intent: VitrineIntent
): VitrineResult[] {
  const types = intent.resultTypes || ["business", "product", "post"];
  const all: VitrineResult[] = [];
  if (types.includes("business")) all.push(...businesses);
  if (types.includes("product")) all.push(...products);
  if (types.includes("post")) all.push(...posts);
  const limit = Math.min(Math.max(intent.limit || 20, 1), 50);
  return all.sort(tieBreak).slice(0, limit);
}
