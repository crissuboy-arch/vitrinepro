/**
 * lib/intelligence/types.ts — A7 Vitrine Intelligence Layer (Fase 1)
 *
 * Camada PURA: sem React, sem I/O, sem Supabase, sem fornecedor de IA.
 * Transforma intenções do consumidor em consultas estruturadas a DADOS REAIS.
 *
 * REGRA ABSOLUTA: nunca inventar negócio, produto, preço, disponibilidade,
 * localização ou horário. Sem dado real → resultado vazio.
 */

/** Intenção do consumidor — adaptada aos dados REAIS do schema. */
export interface VitrineIntent {
  /** Texto livre (máx. 200 chars, validado na entrada server-side). */
  query: string;
  /** Localização do consumidor (WGS84). */
  latitude?: number | null;
  longitude?: number | null;
  /** Raio em km (só aplicado se lat/lng válidos). */
  radiusKm?: number | null;
  /** Filtro por cidade (nome exato, case-insensitive). */
  city?: string | null;
  /** Filtro por categoria (nome exato, case-insensitive). */
  category?: string | null;
  /** Preço máximo em EUR (só produtos COM preço real). */
  maxPrice?: number | null;
  /** Preço mínimo em EUR (só produtos COM preço real). */
  minPrice?: number | null;
  /** Preciso Hoje — semântica de lib/availability.ts. */
  neededToday?: boolean;
  /** Tipos a incluir (default: todos). */
  resultTypes?: Array<"business" | "product" | "post">;
  /** Limite de resultados (default 20, máx 50). */
  limit?: number;
}

export type MatchReason =
  | "text_match"
  | "category_match"
  | "city_match"
  | "nearby"
  | "available_today"
  | "within_budget";

/** Resultado normalizado — sempre referencia dado REAL. */
export interface VitrineResult {
  id: string;
  type: "business" | "product" | "post";
  /** Business dono (para produto/post = business_id; para business = id). */
  business_id: string;
  /** Nome do negócio | nome do produto | título da novidade. */
  name: string;
  /** Slug para URL pública (quando aplicável). */
  slug?: string | null;
  /** Imagem REAL quando existir (nunca placeholder inventado). */
  image_url?: string | null;
  /** Preço REAL em EUR. null = sem preço (NUNCA 0 inventado). */
  price?: number | null;
  city?: string | null;
  category?: string | null;
  /** Distância calculada (null = desconhecida). */
  distanceKm?: number | null;
  /** Por que este item apareceu (metadata interna, útil na A8). */
  match: MatchReason[];
  /** Score determinístico (mesma entrada + mesmos dados = mesmo ranking). */
  score: number;
}

/** Dados de entrada — linhas REAIS já filtradas por visibilidade pública. */
export interface IntelligenceData {
  businesses: IntelligenceBusiness[];
  products: IntelligenceProduct[];
  posts: IntelligencePost[];
}

export interface IntelligenceBusiness {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  cover_url?: string | null;
  is_featured?: boolean | null;
  opening_hours?: unknown;
  service_today?: boolean | null;
}

export interface IntelligenceProduct {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  available_today?: boolean | null;
  pickup_today?: boolean | null;
  delivery_today?: boolean | null;
  // Para joins: dados do business (já validado como publicado).
  business_name?: string;
  business_slug?: string;
  business_city?: string | null;
  business_category?: string | null;
  business_lat?: number | null;
  business_lng?: number | null;
}

export interface IntelligencePost {
  id: string;
  business_id: string;
  type: string;
  title: string;
  content?: string | null;
  image_url?: string | null;
  price?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  business_name?: string;
  business_slug?: string;
  business_city?: string | null;
  business_lat?: number | null;
  business_lng?: number | null;
}
