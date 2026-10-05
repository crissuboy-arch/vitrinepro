/**
 * lib/availability.ts — A5 "Preciso Hoje" (camada de domínio PURA)
 *
 * Sem React, sem I/O, sem Supabase. Reutilizável por:
 *   Web · App iOS/Android (via API/Supabase) · Vitrine Intelligence Layer
 *
 * MODELO DE TRÊS ESTADOS (nunca booleano simplista):
 *   AVAILABLE   = o comerciante confirmou SIM   (coluna = TRUE)
 *   UNAVAILABLE = o comerciante confirmou NÃO   (coluna = FALSE)
 *   UNKNOWN     = não informado                 (coluna = NULL)
 *
 * REGRA DE CONSISTÊNCIA (documentada, exigida no gate A5):
 *   pickup_today / delivery_today são capacidades INDEPENDENTES.
 *   pickup_today = true NÃO implica available_today = true, e vice-versa.
 *   Nunca inferir uma a partir da outra: cada badge exibido corresponde
 *   a exatamente um campo confirmado pelo comerciante.
 *
 * "ABERTO AGORA" é derivado de businesses.opening_hours (NÃO é coluna):
 *   OPEN    = há evidência positiva de estar aberto neste momento
 *   CLOSED  = há evidência positiva de estar fechado neste momento
 *   UNKNOWN = sem dados utilizáveis — nunca assumir
 */

export type AvailabilityState = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
export type OpenState = "OPEN" | "CLOSED" | "UNKNOWN";

/** Coluna BOOLEAN nullable → estado honesto de três valores. */
export function toAvailabilityState(
  value: boolean | null | undefined
): AvailabilityState {
  if (value === true) return "AVAILABLE";
  if (value === false) return "UNAVAILABLE";
  return "UNKNOWN";
}

// ─── Produto ────────────────────────────────────────────────────────────────

export interface ProductAvailabilityInput {
  available_today?: boolean | null;
  pickup_today?: boolean | null;
  delivery_today?: boolean | null;
}

/** Estado principal do produto: "disponível hoje". */
export function productAvailabilityState(
  p: ProductAvailabilityInput | null | undefined
): AvailabilityState {
  return toAvailabilityState(p?.available_today);
}

/** Capacidades independentes (nunca inferidas entre si). */
export function productCapabilities(p: ProductAvailabilityInput | null | undefined): {
  pickup: AvailabilityState;
  delivery: AvailabilityState;
} {
  return {
    pickup: toAvailabilityState(p?.pickup_today),
    delivery: toAvailabilityState(p?.delivery_today),
  };
}

/** O produto pode ser afirmado como opção "preciso hoje"? */
export function productQualifiesNeedToday(
  p: ProductAvailabilityInput | null | undefined
): boolean {
  // Só exclui com evidência negativa explícita. UNKNOWN não exclui.
  return toAvailabilityState(p?.available_today) !== "UNAVAILABLE";
}

// ─── Negócio / serviço ──────────────────────────────────────────────────────

export interface BusinessAvailabilityInput {
  service_today?: boolean | null;
  opening_hours?: unknown;
}

/** "Atendo hoje" — afirmação explícita do comerciante (serviços). */
export function businessServiceState(
  b: BusinessAvailabilityInput | null | undefined
): AvailabilityState {
  return toAvailabilityState(b?.service_today);
}

/**
 * O negócio pode aparecer no modo "Preciso Hoje"?
 * Sinais diferentes, avaliados separadamente:
 *  - service_today = FALSE  → excluído (evidência negativa)
 *  - horário = CLOSED       → excluído (evidência negativa)
 *  - UNKNOWN em ambos        → incluído, sem badge (não esconder o útil)
 */
export function businessQualifiesNeedToday(
  b: BusinessAvailabilityInput | null | undefined,
  now: Date = new Date()
): boolean {
  if (toAvailabilityState(b?.service_today) === "UNAVAILABLE") return false;
  if (isOpenNow(b?.opening_hours, now) === "CLOSED") return false;
  return true;
}

// ─── Aberto agora (derivado de opening_hours) ───────────────────────────────

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

const TIMEZONE = "Europe/Lisbon";

/** "segunda-feira" → 1 … "domingo" → 0 (índice JS, Domingo=0). Tolera variações. */
function weekdayIndex(day: unknown): number | null {
  if (typeof day !== "string") return null;
  const d = day
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (d.startsWith("domingo")) return 0;
  if (d.startsWith("segunda")) return 1;
  if (d.startsWith("terca")) return 2;
  if (d.startsWith("quarta")) return 3;
  if (d.startsWith("quinta")) return 4;
  if (d.startsWith("sexta")) return 5;
  if (d.startsWith("sabado")) return 6;
  return null;
}

/** "HH:MM" → minutos desde meia-noite. null se inválido. */
function parseTime(t: unknown): number | null {
  if (typeof t !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function isValidEntry(e: unknown): e is OpeningHour {
  if (typeof e !== "object" || e === null) return false;
  const o = e as Record<string, unknown>;
  return weekdayIndex(o.day) !== null;
}

/** Partes da data em Europe/Lisbon: dia da semana (0=Domingo) + minutos. */
function lisbonParts(now: Date): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const wd: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  // "24:xx" da meia-noite em hour12:false → normalizar para 0:xx
  let h = Number(get("hour"));
  if (h === 24) h = 0;
  return { weekday: wd[get("weekday")] ?? -1, minutes: h * 60 + Number(get("minute")) };
}

/**
 * Está aberto agora? Puro e determinístico.
 *
 * - array ausente/vazio/sem entradas válidas → UNKNOWN
 * - closed=true no dia → CLOSED (salvo spill-over da véspera, ver abaixo)
 * - intervalo normal (open < close): aberto se open <= agora < close
 * - cruza meia-noite (close <= open): aberto se agora >= open OU agora < close;
 *   a madrugada (00:00–close) é coberta pelo intervalo que COMEÇOU na véspera
 * - sem evidência positiva → UNKNOWN (nunca assumir)
 */
export function isOpenNow(hours: unknown, now: Date = new Date()): OpenState {
  if (!Array.isArray(hours)) return "UNKNOWN";
  const entries = hours.filter(isValidEntry);
  if (entries.length === 0) return "UNKNOWN";

  const { weekday, minutes } = lisbonParts(now);
  if (weekday < 0) return "UNKNOWN";

  const byDay = new Map<number, OpeningHour>();
  for (const e of entries) {
    const idx = weekdayIndex(e.day);
    if (idx !== null && !byDay.has(idx)) byDay.set(idx, e);
  }

  // 1) Spill-over: intervalo da véspera que cruza a meia-noite cobre a madrugada.
  const yesterday = byDay.get((weekday + 6) % 7);
  if (yesterday && !yesterday.closed) {
    const o = parseTime(yesterday.open);
    const c = parseTime(yesterday.close);
    if (o !== null && c !== null && c <= o && minutes < c) return "OPEN";
  }

  // 2) Intervalo de hoje.
  const today = byDay.get(weekday);
  if (!today) return "UNKNOWN";
  if (today.closed) return "CLOSED";
  const open = parseTime(today.open);
  const close = parseTime(today.close);
  if (open === null || close === null) return "UNKNOWN";
  if (close > open) {
    return minutes >= open && minutes < close ? "OPEN" : "CLOSED";
  }
  // Cruza a meia-noite.
  return minutes >= open || minutes < close ? "OPEN" : "CLOSED";
}

// ─── Badges (texto honesto, só com confirmação) ─────────────────────────────

/** Rótulos para exibição — UNKNOWN nunca gera badge. */
export function availabilityBadge(state: AvailabilityState): string | null {
  if (state === "AVAILABLE") return "Disponível hoje";
  if (state === "UNAVAILABLE") return "Indisponível hoje";
  return null;
}
