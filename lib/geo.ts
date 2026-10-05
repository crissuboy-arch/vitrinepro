/**
 * lib/geo.ts — A4.6
 *
 * Geographic helpers for local discovery ("Perto de Mim").
 *
 * Single home for ALL distance math in the codebase — do not re-implement
 * Haversine (or any other formula) inside components.
 *
 * Notes:
 *  - Coordinates are always WGS84 decimal degrees.
 *  - Everything accepts null/undefined and degrades gracefully: no
 *    coordinates → no distance, never a crash, never a fake number.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance between two points (Haversine).
 * Returns null when any coordinate is invalid — callers must treat null as
 * "unknown distance" (hide the badge, exclude from distance filters).
 */
export function distanceKm(
  userLat: number,
  userLng: number,
  businessLat: number,
  businessLng: number
): number | null {
  if (
    !isValidCoordinates(userLat, userLng) ||
    !isValidCoordinates(businessLat, businessLng)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(businessLat - userLat);
  const dLng = toRad(businessLng - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) *
      Math.cos(toRad(businessLat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** True when lat/lng are real numbers inside valid WGS84 ranges. */
export function isValidCoordinates(
  lat: unknown,
  lng: unknown
): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Extracts a valid GeoPoint from a business-like row, or null. */
export function businessCoords(b: {
  latitude?: unknown;
  longitude?: unknown;
}): GeoPoint | null {
  const { latitude: lat, longitude: lng } = b;
  if (typeof lat === "number" && typeof lng === "number" && isValidCoordinates(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

/**
 * Human distance label (pt-PT formatting):
 *  0.35 km → "350 m" · 1.24 km → "1,2 km" · 4.83 km → "4,8 km"
 * Returns null for null/negative input — never show a fake distance.
 */
export function formatDistance(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !Number.isFinite(km) || km < 0) {
    return null;
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  const rounded = Math.round(km * 10) / 10;
  return `${rounded.toLocaleString("pt-PT", { maximumFractionDigits: 1 })} km`;
}

/** Distance filter options for "Perto de Mim" (A4.5). km values in km. */
export const DISTANCE_FILTERS = [
  { label: "500 m", km: 0.5 },
  { label: "1 km", km: 1 },
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "20 km", km: 20 },
] as const;

export type DistanceFilterKm = (typeof DISTANCE_FILTERS)[number]["km"];
