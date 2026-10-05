/**
 * lib/geocode.ts — A4.4
 *
 * Forward-geocoding integration point for VitrinePro.
 *
 * SINGLE integration point: every address → coordinates lookup in the app
 * goes through `forwardGeocode()`. Today it uses Nominatim (OpenStreetMap):
 * free, no API key, no new dependency — the same service the existing
 * `app/components/LocationInput.tsx` already relies on.
 *
 * If a paid/faster provider is ever needed, swap the implementation inside
 * this file only. Callers must keep treating a null result as
 * "coordinates unknown" — never invent coordinates.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  /** Human-readable label returned by the provider (for confirmation UI). */
  displayName?: string;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  display_name?: string;
}

/**
 * Resolves "morada + cidade + código postal" to WGS84 coordinates.
 * Returns null when the provider finds nothing or the request fails —
 * callers keep the business without coordinates (null columns allowed).
 */
export async function forwardGeocode(
  address: string,
  city?: string,
  postalCode?: string,
  country: string = "Portugal"
): Promise<GeocodeResult | null> {
  const query = [address, postalCode, city, country]
    .filter((p) => p && p.trim())
    .join(", ");
  if (query.trim().length < 4) return null;

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
      `&countrycodes=pt&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const places = (await res.json()) as NominatimPlace[];
    const first = places?.[0];
    if (!first) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng, displayName: first.display_name };
  } catch {
    return null;
  }
}
