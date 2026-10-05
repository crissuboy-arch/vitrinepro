/**
 * lib/site.ts — A2.9
 *
 * SOURCE OF TRUTH for the canonical domain / site URL.
 *
 * Canonical production domain: https://vitrinepro.digital
 * (owner decision 2026-10-05 — replaces the former vitrinepro.pt
 * assumption; vitrinepro.pt was never registered/connected.)
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL (explicit override — Vercel project setting)
 *   2. VERCEL_URL (preview deployments keep working)
 *   3. https://vitrinepro.digital (canonical fallback)
 *
 * Local dev: set NEXT_PUBLIC_APP_URL=http://localhost:3000 in .env.local.
 */

export const CANONICAL_DOMAIN = "vitrinepro.digital";
export const CANONICAL_URL = `https://${CANONICAL_DOMAIN}`;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Base URL for absolute links (emails, Stripe redirects, sitemap, SEO).
 * Never returns an invalid URL — falls back to the canonical domain.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const clean = stripTrailingSlash(raw.trim());
    if (clean && isValidHttpUrl(clean)) return clean;
  }
  return CANONICAL_URL;
}

/**
 * Request-aware variant for API routes: prefers the incoming Host when it
 * looks legitimate, so Stripe success/cancel URLs match the domain the
 * user is actually on (avoids cross-domain session confusion).
 */
export function getSiteUrlFromRequest(request: Request): string {
  const host = request.headers.get("host")?.trim();
  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host) && !host.includes("..")) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    const candidate = `${proto === "http" ? "http" : "https"}://${host}`;
    if (isValidHttpUrl(candidate)) return stripTrailingSlash(candidate);
  }
  return getSiteUrl();
}
