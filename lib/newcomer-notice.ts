/**
 * lib/newcomer-notice.ts — Seleção da novidade do /explorar (funções puras).
 *
 * Uma Montra é "novidade" se e só se:
 *   * published = true (mesmo filtro de visibilidade do /explorar), E
 *   * published_at existe e está dentro da janela de recência (7 dias), E
 *   * o visitante ainda não a viu/fechou (não está na lista de vistos).
 *
 * Sem recentes, ou com todas já vistas, a seleção é null e a página NÃO
 * renderiza nada — nunca se inventa empresa ou atividade.
 *
 * Funções puras — cobertas por tests/newcomer-notice.test.ts. O componente
 * (app/components/ExploreNewcomerNotice.tsx) é só apresentação + timers.
 */

export interface NewcomerBusiness {
  id: string;
  name: string;
  slug: string;
  published?: boolean | null;
  published_at?: string | null;
}

export interface NewcomerCandidate {
  id: string;
  name: string;
  slug: string;
  published_at: string;
}

/** Janela de recência da novidade (dias), definida no brief. */
export const NEWCOMER_WINDOW_DAYS = 7;

/** Chave localStorage dos ids de Montras já vistas/fechadas. */
export const NEWCOMER_SEEN_KEY = "vitrinepro:novidades-vistas";

/** Tolerância para relógios dessincronizados (5 min no futuro ainda conta). */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/** Verdadeiro se published_at está dentro da janela (e não é futuro absurdo). */
export function isRecentNewcomer(
  published_at: string | null | undefined,
  nowMs: number,
  windowDays: number = NEWCOMER_WINDOW_DAYS
): boolean {
  const ts = parseTimestamp(published_at);
  if (ts === null) return false;
  if (ts > nowMs + FUTURE_TOLERANCE_MS) return false;
  return nowMs - ts <= windowDays * 24 * 60 * 60 * 1000;
}

/**
 * A novidade a mostrar: a mais recente (published_at desc; desempate por
 * id asc, determinístico) entre as publicadas, recentes e ainda não vistas.
 * Uma por vez — nunca uma lista.
 */
export function selectNewcomer(
  businesses: NewcomerBusiness[],
  seenIds: readonly string[],
  nowMs: number,
  windowDays: number = NEWCOMER_WINDOW_DAYS
): NewcomerCandidate | null {
  const seen = new Set(seenIds);
  const candidates = businesses.filter(
    (b) =>
      b.published === true &&
      b.slug &&
      b.name &&
      !seen.has(b.id) &&
      isRecentNewcomer(b.published_at, nowMs, windowDays)
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const ta = parseTimestamp(a.published_at) as number;
    const tb = parseTimestamp(b.published_at) as number;
    if (tb !== ta) return tb - ta;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const first = candidates[0];
  return {
    id: first.id,
    name: first.name,
    slug: first.slug,
    published_at: first.published_at as string,
  };
}

/** Lê os ids vistos do storage (tolerante: lixo → lista vazia). */
export function loadSeenIds(
  storage: Pick<Storage, "getItem"> | null | undefined
): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(NEWCOMER_SEEN_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

/** Devolve a lista com o id acrescentado (sem duplicados). Pura. */
export function addSeenId(seenIds: readonly string[], id: string): string[] {
  if (seenIds.includes(id)) return [...seenIds];
  return [...seenIds, id];
}

/** Persiste a lista (tolerante a storage indisponível). */
export function saveSeenIds(
  storage: Pick<Storage, "setItem"> | null | undefined,
  ids: readonly string[]
): void {
  if (!storage) return;
  try {
    storage.setItem(NEWCOMER_SEEN_KEY, JSON.stringify(ids));
  } catch {
    // Storage indisponível (modo privado etc.): a notificação pode
    // repetir noutra sessão, mas nunca quebra a página.
  }
}
