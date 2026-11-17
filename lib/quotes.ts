/**
 * lib/quotes.ts — Fase 2 "Pedidos de Orçamento".
 *
 * Desenho (plano aprovado a 17/11/2026 + decisões da Cristiane):
 * - Publicação SEM conta: o consumidor submete o pedido e recebe um
 *   LINK PRIVADO com token para acompanhar (guardamos só o hash SHA-256).
 * - PRÉ-MODERAÇÃO: nada aparece publicamente sem aprovação no admin.
 * - Contactos NUNCA vivem em `quote_requests`: ficam em
 *   `quote_request_contacts`, sem leitura pública (RGPD). Uma empresa só
 *   vê o contacto de um pedido DEPOIS de o consumidor aceitar a sua
 *   manifestação de interesse.
 * - Pedidos expiram ao fim de 30 dias (expires_at) e saem das listas.
 *
 * Este módulo é isomórfico (cliente + servidor): tipos, validação pura,
 * etiquetas e loaders por fetch para as rotas /api/quotes*. A lógica
 * sensível (tokens, service role) vive nas rotas API.
 */

export type QuoteStatus = "pending" | "approved" | "rejected" | "closed";
export type QuoteInterestStatus = "sent" | "accepted" | "declined";

/** Campos PÚBLICOS de um pedido — nunca incluir dados de contacto aqui. */
export interface QuoteRequest {
  id: string;
  category: string;
  city: string;
  title: string;
  description: string;
  status: QuoteStatus;
  expires_at: string;
  created_at: string;
}

/** Interesse tal como o consumidor o vê na página de acompanhamento. */
export interface QuoteInterestForConsumer {
  id: string;
  message: string | null;
  status: QuoteInterestStatus;
  created_at: string;
  business: {
    name: string;
    slug: string;
    city: string | null;
    category: string | null;
  };
}

/** Interesse tal como a empresa o vê no seu painel. */
export interface QuoteInterestForBusiness {
  id: string;
  request_id: string;
  message: string | null;
  status: QuoteInterestStatus;
  created_at: string;
  request: Pick<QuoteRequest, "id" | "category" | "city" | "title" | "description" | "status" | "expires_at">;
  /** Só presente quando status = accepted (revelação autorizada). */
  contact: { name: string; email: string | null; phone: string | null } | null;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "A aguardar moderação",
  approved: "Publicado",
  rejected: "Não aprovado",
  closed: "Fechado",
};

export const QUOTE_INTEREST_LABELS: Record<QuoteInterestStatus, string> = {
  sent: "Enviado",
  accepted: "Aceite",
  declined: "Recusado",
};

/** Versão do texto de consentimento RGPD mostrado no formulário. */
export const CONSENT_TEXT_VERSION = "2026-11-17.v1";

/** Validade de um pedido publicado (dias), espelha o default da BD. */
export const QUOTE_TTL_DAYS = 30;

// ─── Validação da submissão (pura — testável) ───────────────────────

export interface QuoteSubmission {
  category: string;
  city: string;
  title: string;
  description: string;
  name: string;
  email: string | null;
  phone: string | null;
  consent: boolean;
}

export interface QuoteValidation {
  ok: boolean;
  errors: string[];
  value: QuoteSubmission | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanText(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Valida e normaliza uma submissão pública. Regras:
 * - categoria/cidade obrigatórias (texto curto);
 * - título 5–120, descrição 20–2000 caracteres;
 * - nome 2–80; pelo menos UM contacto (email válido OU telefone 9–15 dígitos);
 * - consentimento RGPD obrigatório (consent === true).
 */
export function validateQuoteSubmission(input: Record<string, unknown>): QuoteValidation {
  const errors: string[] = [];
  const category = cleanText(input.category, 60);
  const city = cleanText(input.city, 60);
  const title = cleanText(input.title, 120);
  const description = cleanText(input.description, 2000);
  const name = cleanText(input.name, 80);
  const emailRaw = cleanText(input.email, 120).toLowerCase();
  const phoneRaw = cleanText(input.phone, 20).replace(/[\s()-]/g, "");
  const consent = input.consent === true;

  if (!category) errors.push("Escolhe uma categoria.");
  if (!city) errors.push("Escolhe uma cidade.");
  if (title.length < 5) errors.push("O título precisa de pelo menos 5 caracteres.");
  if (description.length < 20) errors.push("Descreve o pedido com pelo menos 20 caracteres.");
  if (name.length < 2) errors.push("Indica o teu nome.");

  const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : null;
  if (emailRaw && !email) errors.push("O email não parece válido.");
  const phoneDigits = phoneRaw.replace(/^\+/, "");
  const phone = /^\d{9,15}$/.test(phoneDigits) ? phoneRaw : null;
  if (phoneRaw && !phone) errors.push("O telefone/WhatsApp deve ter entre 9 e 15 dígitos.");
  if (!email && !phone) errors.push("Indica pelo menos um contacto (email ou telefone/WhatsApp).");
  if (!consent) errors.push("É necessário aceitar o tratamento dos dados para publicar o pedido.");

  if (errors.length > 0) return { ok: false, errors, value: null };
  return {
    ok: true,
    errors: [],
    value: { category, city, title, description, name, email, phone, consent },
  };
}

// ─── Tokens de acompanhamento ───────────────────────────────────────

/** Formato do token privado: 64 caracteres hex (32 bytes aleatórios). */
export function isValidTrackingToken(token: unknown): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}

export function trackingPath(token: string): string {
  return `/pedidos/acompanhar/${token}`;
}

// ─── Visibilidade e filtros (puros — testáveis) ─────────────────────

/** Um pedido é publicamente visível se estiver aprovado e não expirado. */
export function isQuotePubliclyVisible(
  q: Pick<QuoteRequest, "status" | "expires_at">,
  now: Date = new Date()
): boolean {
  return q.status === "approved" && new Date(q.expires_at).getTime() > now.getTime();
}

export interface QuoteFilters {
  city?: string | null;
  category?: string | null;
}

export function filterQuotes(quotes: QuoteRequest[], filters: QuoteFilters): QuoteRequest[] {
  return quotes.filter((q) => {
    if (filters.city && q.city !== filters.city) return false;
    if (filters.category && q.category !== filters.category) return false;
    return true;
  });
}

export function quoteFacets(quotes: QuoteRequest[]): { cities: string[]; categories: string[] } {
  const cities = [...new Set(quotes.map((q) => q.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt")
  );
  const categories = [...new Set(quotes.map((q) => q.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt")
  );
  return { cities, categories };
}

/** Transições de estado permitidas ao consumidor (via link privado). */
export function consumerCanDecideInterest(status: QuoteInterestStatus): boolean {
  return status === "sent";
}

// ─── Loaders (cliente → API) ────────────────────────────────────────

export interface QuoteListResult {
  /** false quando a migration ainda não foi aplicada (degradação graciosa). */
  ready: boolean;
  quotes: QuoteRequest[];
}

export async function loadPublicQuotes(filters: QuoteFilters = {}): Promise<QuoteListResult> {
  try {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.category) params.set("category", filters.category);
    const res = await fetch(`/api/quotes?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return { ready: false, quotes: [] };
    const data = (await res.json()) as QuoteListResult;
    return { ready: data.ready !== false, quotes: data.quotes || [] };
  } catch {
    return { ready: false, quotes: [] };
  }
}
