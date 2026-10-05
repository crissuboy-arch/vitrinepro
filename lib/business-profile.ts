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
    description: f.description,
    category_id: f.categoryId || undefined,
    city_id: f.cityId || undefined,
    // A3.6: location stays location…
    country: f.country,
    // …and community goes to its own column, never into `country`.
    owner_origin_country: f.ownerOriginCountry || undefined,
    address: f.address,
    whatsapp: f.whatsapp,
    phone: f.phone || undefined,
    email: f.email || undefined,
    instagram: f.instagram || undefined,
    facebook: f.facebook || undefined,
    tiktok: f.tiktok || undefined,
    youtube: f.youtube || undefined,
    linkedin: f.linkedin || undefined,
    website: f.website || undefined,
    opening_hours: f.hours,
  };
  // A4: localização fina — as chaves SÓ entram no payload quando há valor
  // real. (latitude/longitude vêm da geocodificação, nunca inventadas.)
  // Chaves ausentes = coluna intocada (sem wipe acidental de coordenadas).
  const postal = f.postalCode?.trim();
  if (postal) payload.postal_code = postal;
  if (f.latitude !== null && f.latitude !== undefined)
    payload.latitude = f.latitude;
  if (f.longitude !== null && f.longitude !== undefined)
    payload.longitude = f.longitude;
  return payload;
}
