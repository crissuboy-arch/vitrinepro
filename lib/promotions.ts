/**
 * lib/promotions.ts — FASE 1 "Vitrine Flash"
 *
 * Promoções = business_posts com type='promocao' (migration
 * 20261006000013) + original_price (migration 20261117000024).
 * price = preço promocional · original_price = preço original.
 *
 * Helpers puros (sem I/O, testáveis) + loader com degradação graciosa:
 * se a migration do Flash ainda não estiver aplicada, a lista pública
 * funciona sem o preço original (retry sem a coluna).
 */

import {
  isMissingColumnError,
  isNovidadeVisibleNow,
  type NovidadeRow,
} from "./novidades.ts";

export interface PromotionBusiness {
  name?: string | null;
  slug?: string | null;
  city?: string | null;
  category?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  published?: boolean | null;
}

export interface PromotionRow extends NovidadeRow {
  businesses?: PromotionBusiness | null;
}

/** Percentagem de desconto (inteiro) ou null quando não é calculável. */
export function discountPercent(
  originalPrice: number | null | undefined,
  price: number | null | undefined
): number | null {
  if (originalPrice == null || price == null) return null;
  const o = Number(originalPrice);
  const p = Number(price);
  if (!Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p < 0 || p >= o) return null;
  return Math.round((1 - p / o) * 100);
}

/**
 * A promoção ocupa um lugar do limite do plano? Espelha o trigger SQL
 * (migration 20261117000024): type='promocao', is_active e não expirada.
 * Promoções agendadas (starts_at futuro) TAMBÉM ocupam lugar.
 */
export function promotionCountsTowardLimit(
  post: Pick<NovidadeRow, "type" | "is_active" | "expires_at">,
  now: Date = new Date()
): boolean {
  if (post.type !== "promocao") return false;
  if (post.is_active === false) return false;
  if (post.expires_at) {
    const end = new Date(post.expires_at);
    if (!Number.isNaN(end.getTime()) && end <= now) return false;
  }
  return true;
}

/** Quantas promoções ativas (para o limite) existem numa lista de posts. */
export function countActivePromotions(
  posts: Pick<NovidadeRow, "type" | "is_active" | "expires_at">[],
  now: Date = new Date()
): number {
  return posts.filter((p) => promotionCountsTowardLimit(p, now)).length;
}

/** Visibilidade pública de uma promoção (janela de validade + Montra publicada). */
export function isPromotionVisibleNow(post: PromotionRow, now: Date = new Date()): boolean {
  if (post.type !== "promocao") return false;
  return isNovidadeVisibleNow(post, now);
}

export type PromotionValidityFilter = "todas" | "hoje" | "48h" | "semana";

export const PROMOTION_VALIDITY_OPTIONS: { value: PromotionValidityFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "hoje", label: "Terminam hoje" },
  { value: "48h", label: "Terminam em 48h" },
  { value: "semana", label: "Terminam esta semana" },
];

export interface PromotionFilters {
  city?: string | null;
  category?: string | null;
  validity?: PromotionValidityFilter | null;
}

/** Fim do dia local (23:59:59.999) de uma data. */
function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

/**
 * Filtra + ordena promoções públicas: só visíveis agora; cidade/categoria
 * por igualdade (case-insensitive); validade por janela de expiração.
 * Ordenação: quem termina primeiro, primeiro (sem prazo no fim), depois
 * as mais recentes.
 */
export function filterPromotions(
  promotions: PromotionRow[],
  filters: PromotionFilters = {},
  now: Date = new Date()
): PromotionRow[] {
  const city = (filters.city ?? "").trim().toLowerCase();
  const category = (filters.category ?? "").trim().toLowerCase();
  const validity = filters.validity ?? "todas";

  const validityLimit: Date | null =
    validity === "hoje"
      ? endOfDay(now)
      : validity === "48h"
        ? new Date(now.getTime() + 48 * 60 * 60 * 1000)
        : validity === "semana"
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null;

  return promotions
    .filter((p) => isPromotionVisibleNow(p, now))
    .filter((p) => !city || (p.businesses?.city ?? "").trim().toLowerCase() === city)
    .filter((p) => !category || (p.businesses?.category ?? "").trim().toLowerCase() === category)
    .filter((p) => {
      if (!validityLimit) return true;
      if (!p.expires_at) return false;
      const end = new Date(p.expires_at);
      return !Number.isNaN(end.getTime()) && end <= validityLimit;
    })
    .sort((a, b) => {
      const ea = a.expires_at ? new Date(a.expires_at).getTime() : Number.POSITIVE_INFINITY;
      const eb = b.expires_at ? new Date(b.expires_at).getTime() : Number.POSITIVE_INFINITY;
      if (ea !== eb) return ea - eb;
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    });
}

/** Cidades e categorias presentes numa lista de promoções (para os filtros). */
export function promotionFacets(promotions: PromotionRow[]): { cities: string[]; categories: string[] } {
  const cities = new Map<string, string>();
  const categories = new Map<string, string>();
  for (const p of promotions) {
    const c = (p.businesses?.city ?? "").trim();
    if (c && !cities.has(c.toLowerCase())) cities.set(c.toLowerCase(), c);
    const cat = (p.businesses?.category ?? "").trim();
    if (cat && !categories.has(cat.toLowerCase())) categories.set(cat.toLowerCase(), cat);
  }
  return {
    cities: [...cities.values()].sort((a, b) => a.localeCompare(b, "pt")),
    categories: [...categories.values()].sort((a, b) => a.localeCompare(b, "pt")),
  };
}

/* ─── Loader (I/O) ─────────────────────────────────────────────────── */

const PROMOTIONS_SELECT_FULL =
  "id,business_id,type,title,content,image_url,price,original_price,starts_at,expires_at,is_active,product_id,cta_type,cta_target,created_at," +
  "businesses(name,slug,city,category,whatsapp,logo_url,cover_url,published)";

const PROMOTIONS_SELECT_BASE =
  "id,business_id,type,title,content,image_url,price,starts_at,expires_at,is_active,product_id,cta_type,cta_target,created_at," +
  "businesses(name,slug,city,category,whatsapp,logo_url,cover_url,published)";

export interface PromotionsDbClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any;
}

/**
 * Carrega as promoções públicas (type='promocao') com os dados da Montra.
 * Degradação graciosa: sem a coluna original_price, repete sem ela.
 * A filtragem final (visibilidade/filtros) é feita por filterPromotions.
 */
export async function loadPromotions(client: PromotionsDbClient): Promise<PromotionRow[]> {
  const run = async (select: string): Promise<PromotionRow[]> => {
    const { data, error } = await client
      .from("business_posts")
      .select(select)
      .eq("type", "promocao")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data as PromotionRow[] | null) ?? [];
  };

  try {
    return await run(PROMOTIONS_SELECT_FULL);
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    return run(PROMOTIONS_SELECT_BASE);
  }
}
