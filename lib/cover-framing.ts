/**
 * lib/cover-framing.ts — Enquadramento manual da capa da Montra.
 *
 * A imagem original (businesses.cover_url) é SEMPRE preservada; aqui vivem
 * só os parâmetros de apresentação: cover_position_x/y (0–100, %) e
 * cover_zoom (>= 1). NULL no banco = sem ajuste → comportamento atual.
 *
 * Renderização em todo o lado via CSS puro (object-position + scale),
 * sem biblioteca de edição e sem gerar ficheiros novos.
 */

export interface CoverFraming {
  x: number; // 0–100 (%)
  y: number; // 0–100 (%)
  zoom: number; // >= 1
}

export const DEFAULT_COVER_FRAMING: CoverFraming = { x: 50, y: 50, zoom: 1 };
export const MIN_COVER_ZOOM = 1;
export const MAX_COVER_ZOOM = 3;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** Normaliza valores vindos do banco (aceita null/undefined). */
export function normalizeCoverFraming(raw?: {
  cover_position_x?: number | null;
  cover_position_y?: number | null;
  cover_zoom?: number | null;
} | null): CoverFraming {
  if (!raw) return { ...DEFAULT_COVER_FRAMING };
  return {
    x: raw.cover_position_x == null ? 50 : clamp(raw.cover_position_x, 0, 100),
    y: raw.cover_position_y == null ? 50 : clamp(raw.cover_position_y, 0, 100),
    zoom:
      raw.cover_zoom == null
        ? 1
        : clamp(raw.cover_zoom, MIN_COVER_ZOOM, MAX_COVER_ZOOM),
  };
}

/** Estilo CSS para <img>/<Image> com object-cover. */
export function coverImgStyle(f: CoverFraming): {
  objectPosition: string;
  transform: string;
} {
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: `scale(${f.zoom})`,
  };
}

/** true quando há ajuste manual (para decidir se vale persistir). */
export function isDefaultFraming(f: CoverFraming): boolean {
  return f.x === 50 && f.y === 50 && f.zoom === 1;
}
