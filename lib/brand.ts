/**
 * lib/brand.ts — Fonte única da identidade visual VitrinePro.
 *
 * - logo: logo oficial (texto azul-marinho) → fundos CLAROS
 * - logoLight: variante reversa (texto branco) → fundos ESCUROS
 * - symbol: símbolo dourado (pin + loja), fundo transparente
 * - ogInstitutional: imagem institucional 1200x630 (OG da home + fallback social)
 *
 * NÃO usar estes assets para logos de comerciantes/Montras.
 */
export const BRAND = {
  logo: "/logo-vitrinepro.png",
  logoLight: "/brand/logo-vitrinepro-light.png",
  symbol: "/brand/symbol.png",
  ogInstitutional: "/brand/og-institutional.jpg",
  icon192: "/brand/icon-192.png",
  icon512: "/brand/icon-512.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const;

export type BrandAsset = keyof typeof BRAND;
