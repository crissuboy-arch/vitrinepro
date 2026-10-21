/**
 * lib/explore-nav.ts — Contexto de navegação Explorar → Montra.
 *
 * Problema: quem entra numa Montra a partir de /explorar não tinha forma
 * clara de voltar a descobrir outros negócios; quem chega por QR/WhatsApp/
 * link direto tem de manter a experiência ISOLADA da Montra (sem botão,
 * sem navbar global — desenho intencional da rota pública).
 *
 * Solução: contexto EXPLÍCITO e efémero em sessionStorage (por separador),
 * gravado pelo /explorar no momento do clique num cartão de negócio.
 * NUNCA se usa document.referrer como prova de origem: sem contexto
 * válido, recente e correspondente ao slug, a Montra não mostra nada.
 *
 * Ciclo de vida:
 *  1. Explorar grava o contexto (slug de destino + estado do Explorar:
 *     pesquisa, categoria, cidade, comunidade, ordenação, "Preciso Hoje",
 *     filtro de distância, paginação e posição de scroll).
 *  2. A Montra "reclama a apresentação" (claim): só a PRIMEIRA montagem
 *     depois da gravação pode mostrar "← Voltar ao Explorar". A reclamação
 *     marca o contexto como apresentado; uma visita direta posterior no
 *     mesmo separador (reload, URL digitado, avançar no histórico) encontra
 *     o contexto já apresentado → é limpo e NÃO mostra o botão.
 *  3. O /explorar, ao montar, CONSOME o contexto (ler + apagar) e restaura
 *     o estado uma única vez — quer o visitante tenha usado o botão
 *     "Voltar", o botão "atrás" do browser ou navegado manualmente.
 *
 * Frescura: TTL de 30 minutos. Contexto expirado é apagado e ignorado.
 * URLs das Montras ficam limpos — nenhum parâmetro é adicionado.
 *
 * Privacidade: as coordenadas do visitante (A4.13) NUNCA são gravadas;
 * vivem só em memória na página do Explorar. Sem elas, a ordenação
 * "nearest" degrada com segurança para "relevância" (guarda existente
 * em filteredBusinesses) e o filtro de distância fica inerte.
 */

export interface ExploreNavState {
  searchQuery: string;
  selectedCategory: string;
  selectedCity: string;
  selectedCommunity: string;
  sortMode: "relevance" | "nearest";
  needToday: boolean;
  maxDistanceKm: number | null;
  visibleCount: number;
  scrollY: number;
}

export interface ExploreNavContext {
  v: 1;
  id: string;
  targetSlug: string;
  savedAt: number;
  state: ExploreNavState;
}

export const EXPLORE_NAV_TTL_MS = 30 * 60 * 1000;

const CONTEXT_KEY = "vp:explore-nav";
const PRESENTED_KEY = "vp:explore-nav-presented";

/** Subconjunto de Storage usado — injetável para testes. */
export interface ExploreNavStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): ExploreNavStorage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function resolveStorage(storage?: ExploreNavStorage | null): ExploreNavStorage | null {
  if (storage !== undefined) return storage;
  return defaultStorage();
}

function makeId(now: number): string {
  return `${now.toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseState(raw: unknown): ExploreNavState | null {
  if (!isRecord(raw)) return null;
  const {
    searchQuery,
    selectedCategory,
    selectedCity,
    selectedCommunity,
    sortMode,
    needToday,
    maxDistanceKm,
    visibleCount,
    scrollY,
  } = raw;
  if (
    typeof searchQuery !== "string" ||
    typeof selectedCategory !== "string" ||
    typeof selectedCity !== "string" ||
    typeof selectedCommunity !== "string" ||
    (sortMode !== "relevance" && sortMode !== "nearest") ||
    typeof needToday !== "boolean" ||
    (maxDistanceKm !== null && (typeof maxDistanceKm !== "number" || !Number.isFinite(maxDistanceKm))) ||
    typeof visibleCount !== "number" ||
    !Number.isFinite(visibleCount) ||
    visibleCount < 1 ||
    typeof scrollY !== "number" ||
    !Number.isFinite(scrollY) ||
    scrollY < 0
  ) {
    return null;
  }
  return {
    searchQuery,
    selectedCategory,
    selectedCity,
    selectedCommunity,
    sortMode,
    needToday,
    maxDistanceKm,
    visibleCount: Math.floor(visibleCount),
    scrollY,
  };
}

/** Valida a forma e a frescura de um contexto serializado. Puro. */
export function parseExploreNavContext(raw: string | null, now: number): ExploreNavContext | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;
  if (data.v !== 1) return null;
  if (typeof data.id !== "string" || data.id.length === 0) return null;
  if (typeof data.targetSlug !== "string" || data.targetSlug.length === 0) return null;
  if (typeof data.savedAt !== "number" || !Number.isFinite(data.savedAt)) return null;
  // Frescura: nem expirado nem "do futuro" (relógio ajustado a meio).
  if (now - data.savedAt > EXPLORE_NAV_TTL_MS) return null;
  if (data.savedAt - now > 60_000) return null;
  const state = parseState(data.state);
  if (!state) return null;
  return { v: 1, id: data.id, targetSlug: data.targetSlug, savedAt: data.savedAt, state };
}

/** Apaga contexto e marca de apresentação. Nunca lança. */
export function clearExploreNavContext(storage?: ExploreNavStorage | null): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(CONTEXT_KEY);
    store.removeItem(PRESENTED_KEY);
  } catch {
    // sessionStorage indisponível (modo privado antigo, etc.) — ignora.
  }
}

/**
 * Grava um contexto novo para `targetSlug` (Explorar, no clique).
 * Um contexto novo volta a poder ser apresentado uma vez.
 */
export function saveExploreNavContext(
  targetSlug: string,
  state: ExploreNavState,
  storage?: ExploreNavStorage | null,
  now: number = Date.now()
): ExploreNavContext | null {
  const store = resolveStorage(storage);
  if (!store || !targetSlug) return null;
  const ctx: ExploreNavContext = { v: 1, id: makeId(now), targetSlug, savedAt: now, state };
  try {
    store.setItem(CONTEXT_KEY, JSON.stringify(ctx));
    store.removeItem(PRESENTED_KEY);
  } catch {
    return null;
  }
  return ctx;
}

/**
 * Lê o contexto atual SEM o consumir. Contexto inválido/expirado é
 * apagado (higiene) e devolve null.
 */
export function readExploreNavContext(
  storage?: ExploreNavStorage | null,
  now: number = Date.now()
): ExploreNavContext | null {
  const store = resolveStorage(storage);
  if (!store) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(CONTEXT_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  const ctx = parseExploreNavContext(raw, now);
  if (!ctx) {
    clearExploreNavContext(store);
    return null;
  }
  return ctx;
}

/**
 * Montra: reclama o direito de mostrar "← Voltar ao Explorar" para `slug`.
 * Devolve true UMA vez por contexto — na primeira montagem que corresponde
 * ao slug. Se o contexto já foi apresentado (visita direta posterior no
 * mesmo separador), é limpo e devolve false. Slug diferente → false sem
 * tocar no contexto (o visitante pode ainda regressar ao Explorar e o
 * restauro continua válido).
 */
export function claimExploreNavPresentation(
  slug: string,
  storage?: ExploreNavStorage | null,
  now: number = Date.now()
): boolean {
  const store = resolveStorage(storage);
  if (!store) return false;
  const ctx = readExploreNavContext(store, now);
  if (!ctx) return false;
  if (ctx.targetSlug !== slug) return false;
  let presented: string | null = null;
  try {
    presented = store.getItem(PRESENTED_KEY);
  } catch {
    return false;
  }
  if (presented === ctx.id) {
    // Já apresentado numa vista anterior desta Montra: contexto velho.
    clearExploreNavContext(store);
    return false;
  }
  try {
    store.setItem(PRESENTED_KEY, ctx.id);
  } catch {
    return false;
  }
  return true;
}

/**
 * Explorar: consome o contexto (ler + apagar) para restaurar o estado
 * exatamente uma vez. Devolve null se não houver contexto válido.
 */
export function consumeExploreNavContext(
  storage?: ExploreNavStorage | null,
  now: number = Date.now()
): ExploreNavContext | null {
  const store = resolveStorage(storage);
  if (!store) return null;
  const ctx = readExploreNavContext(store, now);
  if (ctx) clearExploreNavContext(store);
  return ctx;
}
