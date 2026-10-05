/**
 * lib/social-metadata.ts — Regra global da imagem social das Montras.
 *
 * Prioridade (para TODAS as Montras, atuais e futuras — sem hardcode):
 *   1. cover_url da Montra
 *   2. logo_url da Montra
 *   3. primeira imagem válida da galeria
 *   4. primeira imagem válida de produto
 *   5. imagem social padrão da VitrinePro (só se a Montra não tiver nenhuma)
 *
 * Retorna sempre URL ABSOLUTA (crawlers como o do WhatsApp exigem).
 */
export const DEFAULT_SOCIAL_IMAGE_PATH = "/brand/og-institutional.jpg";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

const isHttpUrl = (u?: string | null): u is string =>
  !!u && (u.startsWith("http://") || u.startsWith("https://"));

export interface SocialImageInput {
  cover_url?: string | null;
  logo_url?: string | null;
  galleryUrls?: (string | null | undefined)[];
  productUrls?: (string | null | undefined)[];
}

export function pickSocialImage(input: SocialImageInput, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const first = (arr?: (string | null | undefined)[]) =>
    arr?.find(isHttpUrl);

  const picked =
    (isHttpUrl(input.cover_url) && input.cover_url) ||
    (isHttpUrl(input.logo_url) && input.logo_url) ||
    first(input.galleryUrls) ||
    first(input.productUrls) ||
    `${base}${DEFAULT_SOCIAL_IMAGE_PATH}`;

  return picked;
}
