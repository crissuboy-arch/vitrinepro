/**
 * lib/brand.ts — Fonte única da identidade visual VitrinePro.
 *
 * - logo: logo azul-marinho (versão anterior) → fundos CLAROS (login, páginas legais)
 * - logoHorizontal: nova identidade (V dourado + Vitrine branca + Pro dourado) → fundos ESCUROS
 * - symbol: símbolo V dourado com montra, fundo transparente → favicon/PWA
 * - ogInstitutional: imagem institucional 1200x630 (OG da home + fallback social das Montras)
 *
 * NÃO usar estes assets para logos de comerciantes/Montras.
 */
export const BRAND = {
  logo: "/logo-vitrinepro.png",
  logoHorizontal: "/brand/logo-horizontal-transparent.png",
  symbol: "/brand/brand-symbol-transparent.png",
  ogInstitutional: "/brand/og-institutional.jpg",
  icon192: "/brand/icon-192.png",
  icon512: "/brand/icon-512.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const;

export type BrandAsset = keyof typeof BRAND;
