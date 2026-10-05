/**
 * lib/vitrine-share.ts — QR / partilha da Montra
 *
 * Fonte central para a URL pública da vitrine e para o QR Code.
 *
 * REGRA DE OURO (bug de produção 2026-10-05): o QR Code tem de codificar
 * EXATAMENTE a mesma string do botão "Copiar Link". Ambos derivam de
 * buildVitrineUrl() — nunca construir a URL do QR por outro caminho.
 *
 * O QR usa api.qrserver.com com qzone=4 (quiet zone padrão de 4 módulos):
 * sem quiet zone, os módulos tocam a borda da imagem e qualquer
 * `rounded-* overflow-hidden` no container corta os padrões de
 * localização dos cantos → o QR deixa de ser legível no telemóvel.
 */
import { getSiteUrl } from "./site.ts";

/** URL pública canónica da Montra: https://vitrinepro.digital/vitrine/[slug] */
export function buildVitrineUrl(slug: string): string {
  return `${getSiteUrl()}/vitrine/${slug}`;
}

/**
 * URL da imagem do QR Code (api.qrserver.com).
 * - `data` = EXATAMENTE buildVitrineUrl(slug)
 * - `qzone=4` = quiet zone obrigatória (nunca remover)
 * - cores da marca: módulos #0F172A sobre fundo #C8A96B
 */
export function buildVitrineQrSrc(slug: string, size = 200): string {
  const url = buildVitrineUrl(slug);
  return (
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=${size}x${size}&qzone=4&bgcolor=0F172A&color=C8A96B` +
    `&data=${encodeURIComponent(url)}`
  );
}

/** Extrai a URL codificada no `data` de um qrSrc (para testes). */
export function qrSrcDataUrl(qrSrc: string): string | null {
  try {
    return new URL(qrSrc).searchParams.get("data");
  } catch {
    return null;
  }
}
