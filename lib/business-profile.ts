/**
 * lib/business-profile.ts — A3.6
 *
 * Builds the DB payload for business profile updates.
 *
 * THE RULE (never mix these two):
 *   - `country`              = business location (país da Montra)
 *   - `owner_origin_country`  = owner's origin / community (origem do dono)
 *
 * A2.5-era bug: the "País de Origem do Dono (Comunidade)" select was written
 * into `country`, silently overwriting the business location, while every
 * reader (/explorar, /comunidade, /vitrine) consults `owner_origin_country`.
 * This builder is the single place that maps form fields to columns, so the
 * separation is enforced and unit-testable.
 */
export interface BusinessEditInput {
  name: string;
  description: string;
  categoryId: string;
  cityId: string;
  /** Business location country (Portugal | Brasil …). Never the community. */
  country: string;
  /** Owner origin / community (Brasil, Angola, …). Never the location. */
  ownerOriginCountry: string;
  address: string;
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  website: string;
  hours: unknown;
  /**
   * A5 — "Atendo hoje" (serviços). Tri-state intencional:
   *   true  = comerciante confirmou SIM
   *   false = comerciante confirmou NÃO
   *   null  = não informado (UNKNOWN)
   *   undefined = campo não gerido por este formulário → coluna intocada.
   * Nunca converter null em false automaticamente.
   */
  serviceToday?: boolean | null;
  /** Código postal da Montra (A4). Opcional — ausente = coluna intocada. */
  postalCode?: string;
  /** WGS84 — null/ausente quando desconhecidas. O comerciante nunca é obrigado a saber. */
  latitude?: number | null;
  longitude?: number | null;
}

export function buildBusinessUpdatePayload(
  f: BusinessEditInput
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: f.name,
    // BUGFIX (produção): campos opcionais — string vazia/branco significa
    // "o proprietário APAGOU o valor" e é normalizada para NULL, de forma
    // que o UPDATE realmente limpa a coluna. O padrão antigo
    // (`f.email || undefined`) transformava "" em `undefined`, que o
    // postgrest-js remove da serialização — a coluna era omitida do UPDATE
    // e o valor antigo persistia silenciosamente no banco.
    description: nullIfBlank(f.description),
    category_id: f.categoryId || undefined,
    city_id: f.cityId || undefined,
    // A3.6: location stays location…
    country: f.country,
    // …and community goes to its own column, never into `country`.
    owner_origin_country: nullIfBlank(f.ownerOriginCountry),
    address: nullIfBlank(f.address),
    whatsapp: nullIfBlank(f.whatsapp),
    phone: nullIfBlank(f.phone),
    email: nullIfBlank(f.email),
    instagram: nullIfBlank(f.instagram),
    facebook: nullIfBlank(f.facebook),
    tiktok: nullIfBlank(f.tiktok),
    youtube: nullIfBlank(f.youtube),
    linkedin: nullIfBlank(f.linkedin),
    website: nullIfBlank(f.website),
    opening_hours: f.hours,
  };
  // A5: tri-state passa exatamente como está (null = não informado, nunca
  // convertido). undefined = formulário não gere o campo → coluna intocada.
  if (f.serviceToday !== undefined) payload.service_today = f.serviceToday;
  // A4: localização fina — as chaves SÓ entram no payload quando há valor
  // real. (latitude/longitude vêm da geocodificação, nunca inventadas.)
  // Chaves ausentes = coluna intocada (sem wipe acidental de coordenadas).
  const postal = f.postalCode?.trim();
  if (postal) payload.postal_code = postal;
  else if (f.postalCode !== undefined) payload.postal_code = null;
  if (f.latitude !== null && f.latitude !== undefined)
    payload.latitude = f.latitude;
  if (f.longitude !== null && f.longitude !== undefined)
    payload.longitude = f.longitude;
  return payload;
}

/**
 * Normalizes an optional text field: blank/whitespace-only → NULL
 * (explicit removal). Non-blank values pass through untouched.
 */
function nullIfBlank(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return value.trim() === "" ? null : value;
}

/**
 * Public vitrine rule (A4 bugfix): render a contact/social channel ONLY
 * when it holds a real value. null, undefined, "" and whitespace-only
 * never render — no stale/empty channel cards.
 */
export function shouldRenderChannel(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
