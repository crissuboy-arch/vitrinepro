/**
 * lib/promo-video.ts — Vídeo promocional da Montra
 *
 * Regras da funcionalidade (brief da dona):
 *   - A secção de vídeo só aparece na Montra pública quando um vídeo
 *     válido está configurado. Sem vídeo = secção invisível, sem erros,
 *     sem buracos na página.
 *   - O vídeo NUNCA arranca sozinho e nunca com som automático: só toca
 *     depois de a visitante clicar no Play. O elemento <video> só é
 *     montado depois do clique, por isso nada pesado carrega com a página.
 *   - O botão abaixo do vídeo só aparece quando o seu destino é um URL
 *     https válido. O texto pré-preenchido é o do brief; o destino
 *     pré-preenchido é a loja da marca — ambos editáveis no painel e só
 *     guardados quando a proprietária clica em "Guardar vídeo promocional".
 *
 * Puro quanto a React (testável com node:test). Tolerante a linhas
 * pré-migration: colunas em falta chegam como undefined e normalizam
 * para null → secção escondida, sem crash.
 */

/** Destino pré-preenchido do botão (brief) — editável no painel. */
export const PROMO_VIDEO_BUTTON_DEFAULT_URL =
  "https://pequeno-mundo-magico.vercel.app/loja";

/** Texto pré-preenchido do botão (brief) — editável no painel. */
export const PROMO_VIDEO_BUTTON_DEFAULT_TEXT = "📚 Conhecer os nossos livros";

export interface PromoVideoConfig {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
}

export const EMPTY_PROMO_VIDEO_CONFIG: PromoVideoConfig = {
  videoUrl: null,
  thumbnailUrl: null,
  buttonText: null,
  buttonUrl: null,
};

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Normaliza uma linha de `businesses` (select "*") para a config do vídeo.
 * Acesso defensivo: antes da migration 20261028000023 as colunas não
 * existem e chegam como undefined → null (secção escondida).
 */
export function normalizePromoVideoConfig(
  row: Record<string, unknown> | null | undefined
): PromoVideoConfig {
  if (!row) return { ...EMPTY_PROMO_VIDEO_CONFIG };
  return {
    videoUrl: asTrimmedString(row.promo_video_url),
    thumbnailUrl: asTrimmedString(row.promo_video_thumbnail_url),
    buttonText: asTrimmedString(row.promo_video_button_text),
    buttonUrl: asTrimmedString(row.promo_video_button_url),
  };
}

/** URL https válida cuja extensão (sem query/hash) é de vídeo. */
export function isValidPromoVideoUrl(raw: string | null | undefined): boolean {
  const url = asTrimmedString(raw);
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const path = parsed.pathname.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** URL https válida qualquer (destino do botão). */
export function isValidPromoButtonUrl(raw: string | null | undefined): boolean {
  const url = asTrimmedString(raw);
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** A secção só existe quando há um vídeo válido. */
export function shouldShowPromoVideo(config: PromoVideoConfig | null | undefined): boolean {
  if (!config) return false;
  return isValidPromoVideoUrl(config.videoUrl);
}

/** O botão só existe quando o seu destino é um URL https válido. */
export function shouldShowPromoButton(config: PromoVideoConfig | null | undefined): boolean {
  if (!config) return false;
  return isValidPromoButtonUrl(config.buttonUrl);
}

/** Texto do botão: o guardado, ou o pré-preenchido do brief quando vazio. */
export function promoButtonText(config: PromoVideoConfig | null | undefined): string {
  const saved = config ? asTrimmedString(config.buttonText) : null;
  return saved ?? PROMO_VIDEO_BUTTON_DEFAULT_TEXT;
}
