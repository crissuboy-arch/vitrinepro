/**
 * lib/published-at.ts — Carimbo da PRIMEIRA publicação (notificação /explorar).
 *
 * Regra única, aplicada em todos os caminhos que publicam:
 *   * Criação com published = true  → published_at = agora.
 *   * Transição false → true        → published_at = agora, SÓ se ainda NULL.
 *   * Republicação (já tem published_at) → NUNCA sobrescrever.
 *   * Despublicar (→ false)         → nunca carimbar.
 *
 * Edge honesto e documentado: uma Montra publicada ANTES de a coluna
 * existir tem published_at NULL para sempre — exceto se for despublicada
 * e republicada depois de a coluna existir; nesse caso o carimbo regista
 * a primeira publicação *registada* (o sistema não conhece a anterior).
 * Montras antigas que nunca são tocadas ficam NULL e nunca aparecem
 * como novidade — não se inventa data de chegada.
 *
 * Funções puras — cobertas por tests/published-at.test.ts.
 */

export interface PublishState {
  published?: boolean | null;
  published_at?: string | null;
}

/**
 * Carimbo na criação: um registo novo com published = true nasceu
 * publicado — essa É a sua primeira publicação.
 */
export function creationPublishStamp(
  published: boolean | undefined | null,
  nowIso: string
): string | null {
  return published === true ? nowIso : null;
}

/**
 * Patch do toggle/edição de publicação, dado o estado atual da linha.
 * Devolve sempre `published` com o valor-alvo e `published_at` SÓ quando
 * há carimbo novo — nunca devolve published_at para sobrescrever um
 * valor existente nem para despublicar.
 */
export function togglePublishPatch(
  current: PublishState,
  targetPublished: boolean,
  nowIso: string
): { published: boolean; published_at?: string } {
  if (targetPublished !== true) {
    return { published: false };
  }
  // Publicar: carimba só na transição false → true com campo ainda NULL.
  // Já publicado, ou já carimbado → só o published, sem tocar published_at.
  if (current.published !== true && current.published_at == null) {
    return { published: true, published_at: nowIso };
  }
  return { published: true };
}
