/**
 * lib/image-framing.ts — Lógica pura partilhada pelos editores de
 * enquadramento (capa e produto).
 *
 * A imagem original NUNCA é alterada; aqui vivem só operações sobre os
 * parâmetros de apresentação { x, y, zoom }:
 *
 * - centralizar:  x=50, y=50, preserva o zoom atual
 * - ajustar à área: x=50, y=50, zoom de volta ao padrão (1)
 * - repor:        volta aos valores iniciais (os que estavam guardados
 *                 quando o editor abriu) — descarta edições não guardadas
 * - arrastar:     matemática pura do Pointer Events (mouse + touch)
 * - zoom:         incremento/decremento com limites
 *
 * As libs específicas (cover-framing, product-framing) continuam a fazer
 * o mapeamento das colunas do banco; este módulo é o comportamento.
 */

export interface ImageFraming {
  x: number; // 0–100 (%)
  y: number; // 0–100 (%)
  zoom: number; // >= 1
}

export const DEFAULT_IMAGE_FRAMING: ImageFraming = { x: 50, y: 50, zoom: 1 };
export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 3;

const clampPct = (v: number) => Math.min(100, Math.max(0, v));
const clampZoom = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** "Centralizar imagem": x=50, y=50, mantém o zoom atual. */
export function centerFraming(f: ImageFraming): ImageFraming {
  return { ...f, x: 50, y: 50 };
}

/** "Ajustar à área": ponto inicial correto — centro + zoom padrão. */
export function fitAreaFraming(): ImageFraming {
  return { ...DEFAULT_IMAGE_FRAMING };
}

/** "Repor": volta aos valores iniciais (guardados ao abrir o editor). */
export function restoreFraming(initial: ImageFraming): ImageFraming {
  return { ...initial };
}

/**
 * Matemática do arrastar (Pointer Events — mouse e touch usam o mesmo
 * caminho). dxPct/dyPct: deslocamento do ponteiro em % da área.
 * Arrastar para a direita revela a parte esquerda → x diminui.
 */
export function dragFraming(
  f: ImageFraming,
  dxPct: number,
  dyPct: number
): ImageFraming {
  return {
    ...f,
    x: clampPct(f.x - dxPct),
    y: clampPct(f.y - dyPct),
  };
}

/** Zoom com limites. */
export function zoomFraming(
  f: ImageFraming,
  delta: number,
  min: number = MIN_IMAGE_ZOOM,
  max: number = MAX_IMAGE_ZOOM
): ImageFraming {
  return {
    ...f,
    zoom: +clampZoom(f.zoom + delta, min, max).toFixed(2),
  };
}
