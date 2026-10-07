/**
 * lib/feed.ts — Feed unificado do /explorar (descoberta visual)
 *
 * Camada de APRESENTAÇÃO (pura, sem IO): combina negócios, produtos e
 * novidades (business_posts) numa lista ordenada de itens discriminados,
 * com intercalação determinística e anti-duplicação simples.
 *
 * NÃO toca no banco. NÃO duplica tabelas. NÃO usa biblioteca de masonry.
 *
 * Ordem lógica é preservada: a distribuição em colunas é round-robin
 * (item 1 → col 1, item 2 → col 2, ...), de modo que a leitura
 * esquerda→direita, topo→base acompanha a ordem lógica do feed.
 * (CSS `columns-*` foi descartado: ele ordena por coluna e embaralha
 * a sequência intencional novidade/produto/negócio.)
 */

export type FeedItemKind = "business" | "product" | "post";

export interface FeedItem {
  kind: FeedItemKind;
  /** Chave única: `b:<id>`, `p:<id>`, `n:<id>` */
  key: string;
  /** business | product | novidade (row) */
  data: any;
  /** Negócio resolvido (para product/post; igual a data para business) */
  business: any;
}

/** Badge curta para o card de novidade (dos 8 tipos do sistema). */
export function postBadge(type: string): string {
  switch (type) {
    case "menu_do_dia":
      return "MENU DO DIA";
    case "promocao":
      return "PROMOÇÃO";
    case "evento":
      return "EVENTO";
    case "disponivel_hoje":
      return "DISPONÍVEL HOJE";
    case "destaque":
      return "DESTAQUE";
    case "produto_novo":
    case "servico_novo":
      return "NOVIDADE";
    case "novidade":
    default:
      return "NOVIDADE";
  }
}

/**
 * Formatação monetária pt: `€ 3,00`. Só apresentação —
 * nunca altera valores no banco.
 */
export function formatPriceEUR(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return null;
  return `€ ${n.toFixed(2).replace(".", ",")}`;
}

/**
 * Constrói a lista unificada do feed.
 *
 * FILTROS DE VISIBILIDADE (defesa em profundidade — a RLS e as queries
 * já filtram, mas o feed nunca exibe o que não deve):
 *  - Produto entra no Explorar somente se is_visible=true E
 *    show_in_explore=true. (show_in_explore NÃO é segredo: dentro da
 *    Montra o produto continua legível; aqui controla distribuição.)
 *  - Novidade com product_id cujo produto está oculto (is_visible=false)
 *    NÃO aparece; se o produto está fora do Explorar (show_in_explore=false),
 *    a novidade também não entra no feed (não contorna a decisão do dono).
 *
 * Regra de intercalação (simples e determinística):
 *  1. Base: alterna negócio/produto (b, p, b, p…); sobras vão ao fim.
 *  2. Novidades entram a cada `postEvery` posições (padrão 5 → posições
 *     4, 9, 14…), sem preencher artificialmente quando não há novidades.
 *
 * Anti-duplicação: se uma novidade tem `product_id` e esse produto está
 * no feed, o card solto do produto é removido (a novidade já o apresenta
 * com CTA). Regra simples de diversidade, sem algoritmo complexo.
 */
export function buildFeedItems(
  businesses: any[],
  products: any[],
  posts: any[],
  postEvery = 5
): FeedItem[] {
  const items: FeedItem[] = [];

  // Só produtos visíveis E distribuídos no Explorar.
  const visibleProducts = (products || []).filter(
    (p: any) => p.is_visible !== false && p.show_in_explore !== false
  );

  // Base alternada negócio/produto
  const bi = [...businesses];
  const pi = [...visibleProducts];
  while (bi.length > 0 || pi.length > 0) {
    const b = bi.shift();
    if (b) items.push({ kind: "business", key: `b:${b.id}`, data: b, business: b });
    const p = pi.shift();
    if (p) {
      const biz = p.business || null;
      items.push({ kind: "product", key: `p:${p.id}`, data: p, business: biz });
    }
  }

  // Novidades: exclui as ligadas a produto oculto ou fora do Explorar.
  // (post.products vem do join products!left(is_visible,show_in_explore)
  //  quando disponível; sem join, a novidade passa — a query já filtra.)
  const postItems: FeedItem[] = (posts || [])
    .filter((post: any) => {
      const pv = post.products;
      if (!pv) return true;
      if (pv.is_visible === false) return false;
      if (pv.show_in_explore === false) return false;
      return true;
    })
    .map((post: any) => ({
      kind: "post" as const,
      key: `n:${post.id}`,
      data: post,
      business: post.business || null,
    }));

  // Anti-duplicação: produto com novidade sai do feed solto
  const postedProductIds = new Set(
    postItems.map((it) => it.data?.product_id).filter(Boolean)
  );
  const deduped =
    postedProductIds.size > 0
      ? items.filter(
          (it) => !(it.kind === "product" && postedProductIds.has(it.data?.id))
        )
      : items;

  // Intercalação determinística
  if (postItems.length === 0) return deduped;
  const out: FeedItem[] = [];
  let postIdx = 0;
  for (let i = 0; i < deduped.length; i++) {
    out.push(deduped[i]);
    // A cada `postEvery` itens base, insere 1 novidade (se houver)
    if ((i + 1) % postEvery === 0 && postIdx < postItems.length) {
      out.push(postItems[postIdx++]);
    }
  }
  // Novidades restantes vão ao fim (sem preencher artificialmente no meio)
  while (postIdx < postItems.length) out.push(postItems[postIdx++]);
  return out;
}

/**
 * Distribui itens em N colunas preservando a ordem lógica de leitura
 * (round-robin). Cada coluna vira uma flex-column; alturas naturais das
 * imagens criam o efeito masonry sem biblioteca e sem embaralhar a ordem.
 */
export function distributeColumns<T>(items: T[], nCols: number): T[][] {
  const cols: T[][] = Array.from({ length: Math.max(1, nCols) }, () => []);
  items.forEach((item, i) => {
    cols[i % cols.length].push(item);
  });
  return cols;
}

/** Nº de colunas por largura (mobile 2, tablet 3, desktop 3–4). */
export function columnsForWidth(width: number): number {
  if (width < 768) return 2;
  if (width < 1280) return 3;
  return 4;
}
