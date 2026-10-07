/**
 * lib/novidades.ts — A6.5 "Novidades na Vitrine"
 *
 * Pure helpers around public.business_posts (extended by migration
 * 20261006000013_business_posts_novidades.sql). No I/O — unit-testable
 * with node:test.
 *
 * GRACEFUL DEGRADATION: a migration ainda pode não estar aplicada em
 * produção. Os chamadores tentam as colunas novas e, em erro de coluna
 * inexistente, recuam para as colunas base (ver isMissingColumnError).
 */

export interface NovidadeTypeOption {
  value: string;
  label: string;
}

/** Os 8 tipos novos da migration (labels amigáveis para o formulário). */
export const NOVIDADE_TYPES: NovidadeTypeOption[] = [
  { value: "menu_do_dia", label: "🍽️ Menu do dia" },
  { value: "promocao", label: "🏷️ Promoção" },
  { value: "novidade", label: "✨ Novidade" },
  { value: "produto_novo", label: "🆕 Produto novo" },
  { value: "servico_novo", label: "💈 Serviço novo" },
  { value: "evento", label: "🎉 Evento" },
  { value: "disponivel_hoje", label: "⚡ Disponível hoje" },
  { value: "destaque", label: "⭐ Destaque" },
];

/** Tipos válidos aceites pelo CHECK business_posts_type_check da migration. */
export const ALL_POST_TYPES: readonly string[] = NOVIDADE_TYPES.map((t) => t.value);

/** Tipos válidos aceites pelo CHECK business_posts_type_check da migration. */
export function isValidPostType(type: unknown): type is string {
  return typeof type === "string" && (ALL_POST_TYPES as readonly string[]).includes(type);
}

/** Badge/label amigável para o tipo (novos); desconhecidos passam como estão. */
export function novidadeTypeLabel(type: string): string {
  return NOVIDADE_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Opções de CTA do formulário de publicação. */
export const NOVIDADE_CTA_OPTIONS: NovidadeTypeOption[] = [
  { value: "none", label: "Sem botão" },
  { value: "ver_montra", label: "Ver Montra" },
  { value: "ver_produto", label: "Ver produto" },
];

export interface NovidadeRow {
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
  product_id?: string | null;
  cta_type?: string | null;
  cta_target?: string | null;
  created_at?: string | null;
  businesses?: { name?: string | null; slug?: string | null; published?: boolean | null } | null;
}

/**
 * Regra de visibilidade do feed público (lógica pura):
 * is_active=true (ou ausente = legado, tratado como ativo)
 * AND (starts_at NULL ou já começou)
 * AND (expires_at NULL ou ainda não expirou)
 * AND Montra publicada.
 */
export function isNovidadeVisibleNow(post: NovidadeRow, now: Date = new Date()): boolean {
  if (post.is_active === false) return false;

  if (post.starts_at) {
    const start = new Date(post.starts_at);
    if (!Number.isNaN(start.getTime()) && start > now) return false;
  }
  if (post.expires_at) {
    const end = new Date(post.expires_at);
    if (!Number.isNaN(end.getTime()) && end <= now) return false;
  }
  if (post.businesses && post.businesses.published === false) return false;

  // A10.1 CRITICAL 7: post ligado a produto oculto não aparece publicamente.
  // Se product_id existe mas o join veio null OU o produto não é visível,
  // o post não deve ser exibido (não aceitar associação quebrada).
  if (post.product_id) {
    const prod = (post as any).products;
    if (!prod) return false; // join null = produto inexistente/inacessível
    if (prod.is_visible === false) return false;
    if (prod.show_in_explore === false) return false;
  }

  return true;
}

/** Filtro + ordenação do feed público (MVP: mais recentes primeiro). */
export function filterNovidadesFeed(posts: NovidadeRow[], now: Date = new Date()): NovidadeRow[] {
  return posts
    .filter((p) => isNovidadeVisibleNow(p, now))
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

/**
 * Destino do CTA de um card. "ver_produto" desce até à Montra (o produto
 * está listado lá); sem CTA configurado devolve null.
 */
export function novidadeCtaHref(post: NovidadeRow, slug: string | null | undefined): string | null {
  if (!slug) return null;
  if (post.cta_type === "ver_produto" && post.product_id) {
    return `/vitrine/${slug}#produto-${post.product_id}`;
  }
  if (post.cta_type === "ver_montra") {
    return `/vitrine/${slug}`;
  }
  return null;
}

export function novidadeCtaLabel(post: NovidadeRow): string {
  return post.cta_type === "ver_produto" ? "Ver produto" : "Ver Montra";
}

/**
 * Deteta erro de "coluna inexistente" (PostgREST/Supabase quando a
 * migration ainda não foi aplicada) para ativar a degradação graciosa.
 */
export function isMissingColumnError(message: unknown): boolean {
  // Supabase devolve objetos de erro { message, code, details } — inspeciona tudo.
  const parts: string[] = [];
  if (typeof message === "object" && message !== null) {
    const e = message as Record<string, unknown>;
    for (const k of ["message", "code", "details", "hint"]) {
      if (typeof e[k] === "string") parts.push(e[k] as string);
    }
  }
  parts.push(String(message ?? ""));
  const m = parts.join(" ");
  return (
    /column .* does not exist/i.test(m) ||
    /42703/.test(m) ||
    /could not find the .* column/i.test(m) ||
    /PGRST204/.test(m)
  );
}

/** Colunas do SELECT completo (migration aplicada). */
export const NOVIDADES_FULL_SELECT =
  "id,business_id,type,title,content,image_url,price,starts_at,expires_at,is_active,product_id,cta_type,cta_target,created_at";

/** Colunas do SELECT legado (migration ainda NÃO aplicada). */
export const NOVIDADES_LEGACY_SELECT =
  "id,business_id,type,title,content,image_url,created_at";
