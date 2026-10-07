/**
 * lib/intelligence/search.ts — A7
 *
 * Ponto de entrada principal (puro): intent + dados reais → resultados.
 *
 *    searchIntelligence(intent, data) -> VitrineResult[]
 *
 * Não faz I/O. Quem carrega os dados (server-side, respeitando RLS pública)
 * é a camada de entrada (app/api/intelligence/search).
 */
import type { VitrineIntent, VitrineResult, IntelligenceData } from "./types";
import { filterBusinesses, filterProducts, filterPosts } from "./filters";
import { rankBusinesses, rankProducts, rankPosts, mergeRanked } from "./ranking";

export function searchIntelligence(
  intent: VitrineIntent,
  data: IntelligenceData,
  now: Date = new Date()
): VitrineResult[] {
  const types = intent.resultTypes || ["business", "product", "post"];

  const businesses = types.includes("business")
    ? rankBusinesses(filterBusinesses(data.businesses, intent))
    : [];
  const products = types.includes("product")
    ? rankProducts(filterProducts(data.products, intent))
    : [];
  const posts = types.includes("post")
    ? rankPosts(filterPosts(data.posts, intent, now))
    : [];

  return mergeRanked(businesses, products, posts, intent);
}

export type { VitrineIntent, VitrineResult, IntelligenceData };
