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
  const strict = runSearch(intent, data, now, false);
  if (strict.length > 0) return strict;
  // A8.1: fallback ANY-token — SÓ quando o matching estrito (EVERY)
  // retorna zero. Cidade, preço, neededToday e demais filtros
  // estruturados continuam obrigatórios; só o matching textual relaxa,
  // e apenas sobre tokens comercialmente significativos (sem stopwords).
  return runSearch(intent, data, now, true);
}

function runSearch(
  intent: VitrineIntent,
  data: IntelligenceData,
  now: Date,
  anyMode: boolean
): VitrineResult[] {
  const types = intent.resultTypes || ["business", "product", "post"];

  const businesses = types.includes("business")
    ? rankBusinesses(filterBusinesses(data.businesses, intent, anyMode))
    : [];
  const products = types.includes("product")
    ? rankProducts(filterProducts(data.products, intent, anyMode))
    : [];
  const posts = types.includes("post")
    ? rankPosts(filterPosts(data.posts, intent, now, anyMode))
    : [];

  return mergeRanked(businesses, products, posts, intent);
}

export type { VitrineIntent, VitrineResult, IntelligenceData };
