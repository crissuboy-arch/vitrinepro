/**
 * lib/product-framing.ts — Enquadramento manual da imagem do produto.
 *
 * Mesmo conceito do enquadramento da capa (lib/cover-framing.ts), sem
 * duplicar a arquitetura: parâmetros de apresentação puros.
 *
 * A imagem original (products.image_url) é SEMPRE preservada; aqui vivem
 * só os parâmetros: image_position_x/y (0–100, %) e image_zoom (>= 1).
 * NULL no banco = sem ajuste → comportamento legado (center, zoom 1).
 *
 * Renderização em todo o lado via CSS puro (object-position + scale),
 * sem biblioteca de edição e sem gerar ficheiros novos.
 */

export interface ProductFraming {
  x: number; // 0–100 (%)
  y: number; // 0–100 (%)
  zoom: number; // >= 1
}

export const DEFAULT_PRODUCT_FRAMING: ProductFraming = { x: 50, y: 50, zoom: 1 };
export const MIN_PRODUCT_ZOOM = 1;
export const MAX_PRODUCT_ZOOM = 3;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** Normaliza valores vindos do banco (aceita null/undefined). */
export function normalizeProductFraming(raw?: {
  image_position_x?: number | null;
  image_position_y?: number | null;
  image_zoom?: number | null;
} | null): ProductFraming {
  if (!raw) return { ...DEFAULT_PRODUCT_FRAMING };
  return {
    x: raw.image_position_x == null ? 50 : clamp(raw.image_position_x, 0, 100),
    y: raw.image_position_y == null ? 50 : clamp(raw.image_position_y, 0, 100),
    zoom:
      raw.image_zoom == null
        ? 1
        : clamp(raw.image_zoom, MIN_PRODUCT_ZOOM, MAX_PRODUCT_ZOOM),
  };
}

/** Estilo CSS para <img>/<Image> com object-cover. */
export function productImgStyle(f: ProductFraming): {
  objectPosition: string;
  transform: string;
} {
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: `scale(${f.zoom})`,
  };
}

/** true quando há ajuste manual (para decidir se vale persistir). */
export function isDefaultProductFraming(f: ProductFraming): boolean {
  return f.x === 50 && f.y === 50 && f.zoom === 1;
}
