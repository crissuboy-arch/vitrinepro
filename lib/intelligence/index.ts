/**
 * lib/intelligence/index.ts — A7
 * Re-export da API interna coerente.
 */
export * from "./types";
export { searchIntelligence } from "./search";
export { filterBusinesses, filterProducts, filterPosts } from "./filters";
export { rankBusinesses, rankProducts, rankPosts, mergeRanked } from "./ranking";
