/**
 * lib/portal.ts — Integração Portal de Ofertas ↔ VitrinePro.
 *
 * O Portal é a FONTE PRINCIPAL: a VitrinePro consulta o feed público
 * que o próprio Portal publica (produtos.json), sem copiar produtos
 * para a base de dados e sem scraping de terceiros.
 *
 * Regras de afiliados (inegociáveis):
 *  - O link de cada produto é usado VERBATIM — nunca reescrito.
 *  - O Tracking ID da Amazon (portaldeofert-21) vive dentro dos links
 *    Amazon do feed; NUNCA é aplicado a outras lojas.
 *  - Cada loja usa os seus próprios links/identificadores.
 *  - Preço só é apresentado se o feed o fornecer (hoje não fornece).
 *
 * IDs estáveis: `${lojaKey}:${id}` (ex.: amazon:B0CZV1KPXL) — sem
 * duplicados mesmo que o feed repita um item.
 */

export type PortalStoreKey = "amazon" | "temu" | "propria" | "outra";

export interface PortalStore {
  key: PortalStoreKey;
  /** Nome apresentado ao visitante. */
  label: string;
  /** true quando os links são de afiliado (exige divulgação + rel=sponsored). */
  affiliate: boolean;
}

const STORES: Record<PortalStoreKey, PortalStore> = {
  amazon: { key: "amazon", label: "Amazon", affiliate: true },
  temu: { key: "temu", label: "Temu", affiliate: true },
  propria: { key: "propria", label: "Loja Portal de Ofertas", affiliate: false },
  outra: { key: "outra", label: "Loja parceira", affiliate: true },
};

/** Mapeia o campo `loja` do feed para a loja interna. Extensível. */
export function storeKeyFor(lojaRaw: unknown): PortalStoreKey {
  const s = String(lojaRaw ?? "").trim().toLowerCase();
  if (s.includes("amazon")) return "amazon";
  if (s.includes("temu")) return "temu";
  if (s.includes("própria") || s.includes("propria") || s.includes("portal")) return "propria";
  return "outra";
}

export function portalStore(key: PortalStoreKey): PortalStore {
  return STORES[key];
}

export interface PortalProduct {
  /** ID estável com loja: ex. "amazon:B0CZV1KPXL". */
  externalId: string;
  /** ID original no feed. */
  sourceId: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  store: PortalStore;
  /** "afiliado" (loja externa) ou "proprio" (loja da proprietária). */
  kind: "afiliado" | "proprio";
  /** Só presente se o feed fornecer — nunca inventado. */
  price: number | null;
  promoPrice: number | null;
  currency: string;
  /** Link de compra VERBATIM do feed (preserva tracking da loja). */
  buyUrl: string;
  featured: boolean;
  /** Oferta do dia/relâmpago no feed. */
  dealOfDay: boolean;
  active: boolean;
  updatedAt: string | null;
}

interface RawFeedItem {
  id?: unknown;
  titulo?: unknown;
  nome?: unknown;
  descricao?: unknown;
  categoria?: unknown;
  imagem?: unknown;
  link?: unknown;
  loja?: unknown;
  destaque?: unknown;
  dia?: unknown;
  preco?: unknown;
  preco_promo?: unknown;
  moeda?: unknown;
  ativo?: unknown;
  atualizado_em?: unknown;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Normaliza UM item do feed. Devolve null se não tiver o mínimo (id+nome+link). */
export function normalizePortalItem(raw: RawFeedItem): PortalProduct | null {
  const sourceId = str(raw.id);
  const name = str(raw.titulo) || str(raw.nome);
  const buyUrl = str(raw.link);
  if (!sourceId || !name || !buyUrl) return null;
  const storeKey = storeKeyFor(raw.loja);
  const store = STORES[storeKey];
  return {
    externalId: `${storeKey}:${sourceId}`,
    sourceId,
    name,
    description: str(raw.descricao) || null,
    category: str(raw.categoria) || "Promoções especiais",
    imageUrl: str(raw.imagem) || null,
    store,
    kind: storeKey === "propria" ? "proprio" : "afiliado",
    price: num(raw.preco),
    promoPrice: num(raw.preco_promo),
    currency: str(raw.moeda) || "EUR",
    buyUrl,
    featured: raw.destaque === true,
    dealOfDay: raw.dia === true,
    active: raw.ativo !== false,
    updatedAt: str(raw.atualizado_em) || null,
  };
}

/** Normaliza o feed inteiro: filtra inválidos/inativos e remove duplicados por ID estável. */
export function normalizePortalFeed(raw: unknown): PortalProduct[] {
  const items: RawFeedItem[] = Array.isArray(raw)
    ? (raw as RawFeedItem[])
    : Array.isArray((raw as { produtos?: unknown })?.produtos)
      ? ((raw as { produtos: RawFeedItem[] }).produtos)
      : [];
  const seen = new Set<string>();
  const out: PortalProduct[] = [];
  for (const item of items) {
    const p = normalizePortalItem(item);
    if (!p || !p.active) continue;
    if (seen.has(p.externalId)) continue;
    seen.add(p.externalId);
    out.push(p);
  }
  return out;
}

export function portalCategories(products: PortalProduct[]): string[] {
  return [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "pt"));
}

/**
 * Intercala fontes para o carrossel da homepage: nenhuma fonte ocupa
 * todos os destaques. `cap` limita o total; alterna A,B,A,B…
 */
export function interleaveFair<T>(a: T[], b: T[], cap: number): T[] {
  const out: T[] = [];
  let i = 0;
  let j = 0;
  while (out.length < cap && (i < a.length || j < b.length)) {
    if (i < a.length) out.push(a[i++]);
    if (out.length >= cap) break;
    if (j < b.length) out.push(b[j++]);
  }
  return out;
}

export const PORTAL_FEED_URL =
  process.env.PORTAL_FEED_URL || "https://portal-de-ofertapt.vercel.app/produtos.json";

export const PORTAL_SITE_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal-de-ofertapt.vercel.app";

export interface PortalFeedResult {
  products: PortalProduct[];
  fetchedAt: string;
  error: string | null;
}

/** Lê o feed do Portal (server-side, cache de 15 min). Nunca lança: devolve erro. */
export async function fetchPortalFeed(): Promise<PortalFeedResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(PORTAL_FEED_URL, {
      next: { revalidate: 900 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      return { products: [], fetchedAt, error: `Feed respondeu ${res.status}.` };
    }
    const json = (await res.json()) as unknown;
    return { products: normalizePortalFeed(json), fetchedAt, error: null };
  } catch (e) {
    return {
      products: [],
      fetchedAt,
      error: e instanceof Error ? e.message : "Falha ao ler o feed do Portal.",
    };
  }
}
