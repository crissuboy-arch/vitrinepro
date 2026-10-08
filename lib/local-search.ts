/**
 * lib/local-search.ts — A4.8
 *
 * Reusable local search layer for VitrinePro discovery.
 *
 * Searches REAL data only — businesses and products — with no AI involved.
 * Pure functions (no I/O): the page/component fetches rows, this module
 * matches + ranks them. Designed to be consumed later by the Vitrine
 * Intelligence Layer.
 *
 * Matching is diacritic-insensitive ("coxinha" matches "Coxinha",
 * "Águeda" matches "agueda").
 */

export interface SearchableBusiness {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  /** Owner origin / community (owner_origin_country). */
  community?: string | null;
}

export interface SearchableProduct {
  id: string;
  name: string;
  description?: string | null;
  business_id: string;
}

/** Lowercase, trim, strip diacritics. "  Águeda " → "agueda". */
export function normalizeQuery(raw: string): string {
  return (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits a normalized query into tokens, dropping empties. */
export function queryTokens(raw: string): string[] {
  return normalizeQuery(raw).split(" ").filter(Boolean);
}

/**
 * A8.1: stopwords conversacionais — palavras de intenção que NUNCA
 * servem como critério de relevância no fallback ANY-token.
 * (Mesma lista usada na limpeza do rule-based; mantida aqui como Set
 * para o matching não depender do provider.)
 */
export const QUERY_STOPWORDS = new Set([
  "onde", "aonde", "posso", "quero", "preciso", "tem", "ha", "procuro",
  "procurando", "gostaria", "gostava", "mostre", "mostra", "me",
  "encontrar", "encontro", "encontra", "comer", "comprar", "para", "pra",
  "de", "da", "do", "das", "dos", "dum", "duma", "num", "numa",
  "uma", "um", "umas", "uns", "o", "a", "os", "as", "e",
  "que", "qual", "quais", "algum", "alguma", "bom", "boa", "melhor", "ainda",
]);

/**
 * A8.1: tokens comercialmente significativos — normalizados, sem
 * stopwords, com pelo menos 2 caracteres. Usados no fallback ANY-token.
 */
export function significantTokens(raw: string): string[] {
  return queryTokens(raw).filter((t) => t.length >= 2 && !QUERY_STOPWORDS.has(t));
}

function haystack(...parts: Array<string | null | undefined>): string {
  return normalizeQuery(parts.filter(Boolean).join(" "));
}

/**
 * True when EVERY token appears somewhere in the business's searchable
 * fields (name, description, category, city, community).
 */
export function businessMatchesQuery(
  b: SearchableBusiness,
  rawQuery: string
): boolean {
  const tokens = queryTokens(rawQuery);
  if (tokens.length === 0) return true;
  const hay = haystack(b.name, b.description, b.category, b.city, b.community);
  return tokens.every((t) => hay.includes(t));
}

/**
 * True when EVERY token appears in the product's name or description.
 * (products have no category column — name + description is the real data.)
 */
export function productMatchesQuery(
  p: SearchableProduct,
  rawQuery: string
): boolean {
  const tokens = queryTokens(rawQuery);
  if (tokens.length === 0) return true;
  const hay = haystack(p.name, p.description);
  return tokens.every((t) => hay.includes(t));
}

/**
 * A8.1: fallback de relevância — true quando tokens significativos
 * suficientes aparecem no nome/descrição. Só usado quando o matching
 * estrito (EVERY) retorna zero. Tokens significativos excluem stopwords
 * conversacionais, então "onde posso comer" sozinho nunca gera match.
 * Se não houver token significativo, retorna false (nunca vira match-all).
 * Proteção de precisão: com 1 token significativo basta 1 match; com 2+
 * exige pelo menos 2 matches (evita que um token genérico como
 * "restaurante" devolva qualquer restaurante).
 */
export function productMatchesQueryAny(
  p: SearchableProduct,
  rawQuery: string
): boolean {
  const toks = significantTokens(rawQuery);
  if (toks.length === 0) return false;
  const hay = haystack(p.name, p.description);
  const hits = toks.filter((t) => hay.includes(t)).length;
  return hits >= Math.min(2, toks.length);
}

/**
 * A8.1: idem para negócios (nome, descrição, categoria, cidade, comunidade).
 */
export function businessMatchesQueryAny(
  b: SearchableBusiness,
  rawQuery: string
): boolean {
  const toks = significantTokens(rawQuery);
  if (toks.length === 0) return false;
  const hay = haystack(b.name, b.description, b.category, b.city, b.community);
  const hits = toks.filter((t) => hay.includes(t)).length;
  return hits >= Math.min(2, toks.length);
}

export interface BusinessHit<T extends SearchableBusiness> {
  business: T;
  /** Higher = more relevant. Name match beats description match. */
  score: number;
}

function fieldScore(value: string | null | undefined, token: string): number {
  const v = normalizeQuery(value || "");
  if (!v) return 0;
  if (v === token) return 10;
  if (v.startsWith(token)) return 6;
  if (v.includes(token)) return 3;
  return 0;
}

/**
 * Filters + ranks businesses for a query. Keeps the existing explorar
 * semantics (name/description/category/city/community) while returning a
 * relevance score the caller can combine with the existing scoreBusiness
 * ranking — this module never replaces it.
 */
export function searchBusinesses<T extends SearchableBusiness>(
  businesses: T[],
  rawQuery: string
): Array<BusinessHit<T>> {
  const tokens = queryTokens(rawQuery);
  if (tokens.length === 0) {
    return businesses.map((business) => ({ business, score: 0 }));
  }
  const hits: Array<BusinessHit<T>> = [];
  for (const business of businesses) {
    if (!businessMatchesQuery(business, rawQuery)) continue;
    let score = 0;
    for (const token of tokens) {
      score += fieldScore(business.name, token) * 3;
      score += fieldScore(business.category, token) * 2;
      score += fieldScore(business.city, token) * 2;
      score += fieldScore(business.description, token);
      score += fieldScore(business.community, token);
    }
    hits.push({ business, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits;
}

export interface ProductHit<T extends SearchableProduct> {
  product: T;
  score: number;
}

/** Filters + ranks products for a query (name match beats description). */
export function searchProducts<T extends SearchableProduct>(
  products: T[],
  rawQuery: string
): Array<ProductHit<T>> {
  const tokens = queryTokens(rawQuery);
  if (tokens.length === 0) {
    return products.map((product) => ({ product, score: 0 }));
  }
  const hits: Array<ProductHit<T>> = [];
  for (const product of products) {
    if (!productMatchesQuery(product, rawQuery)) continue;
    let score = 0;
    for (const token of tokens) {
      score += fieldScore(product.name, token) * 3;
      score += fieldScore(product.description, token);
    }
    hits.push({ product, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits;
}
