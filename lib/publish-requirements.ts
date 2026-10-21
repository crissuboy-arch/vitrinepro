/**
 * lib/publish-requirements.ts — Launch gate (preparação final de lançamento)
 *
 * REQUISITOS MÍNIMOS DE PUBLICAÇÃO de uma Montra.
 *
 * Criar uma Montra exige apenas o nome (único campo NOT NULL em
 * `businesses`; o slug é gerado a partir dele). Tudo o resto pode ser
 * completado depois no painel. Mas uma Montra PÚBLICA precisa do mínimo
 * para não aparecer quebrada nem inútil a quem a encontra:
 *
 *   - nome       — sem nome não há Montra (nem slug).
 *   - categoria  — o /explorar organiza e filtra por categoria.
 *   - cidade     — a descoberta é local (cidade é eixo de pesquisa).
 *   - WhatsApp   — é o canal de contacto/conversão da página pública;
 *                  sem ele o visitante não tem como contactar o negócio.
 *
 * Descrição, fotografias, redes sociais, horários, morada e produtos
 * NÃO são requisitos: têm apresentação graciosa quando vazios e são
 * editáveis no painel.
 *
 * A guarda aplica-se APENAS à ação de publicar. Montras já publicadas
 * nunca são despublicadas por esta regra.
 *
 * Funções puras — cobertas por tests/publish-requirements.test.ts.
 */

export interface PublishCandidate {
  name?: string | null;
  category_id?: string | null;
  category?: string | null;
  city_id?: string | null;
  city?: string | null;
  whatsapp?: string | null;
}

export interface MissingPublishRequirement {
  field: "name" | "category" | "city" | "whatsapp";
  /** Rótulo pt-PT mostrado ao utilizador. */
  label: string;
}

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** Lista os requisitos mínimos em falta para publicar a Montra. */
export function getMissingPublishRequirements(
  b: PublishCandidate | null | undefined
): MissingPublishRequirement[] {
  const missing: MissingPublishRequirement[] = [];
  if (!b || !hasText(b.name)) {
    missing.push({ field: "name", label: "nome do negócio" });
  }
  if (!b || !(hasText(b.category_id) || hasText(b.category))) {
    missing.push({ field: "category", label: "categoria" });
  }
  if (!b || !(hasText(b.city_id) || hasText(b.city))) {
    missing.push({ field: "city", label: "cidade" });
  }
  if (!b || !hasText(b.whatsapp)) {
    missing.push({ field: "whatsapp", label: "WhatsApp" });
  }
  return missing;
}

/** True quando a Montra cumpre os requisitos mínimos de publicação. */
export function canPublishBusiness(
  b: PublishCandidate | null | undefined
): boolean {
  return getMissingPublishRequirements(b).length === 0;
}

/** Mensagem pt-PT, pronta a mostrar, com o que falta para publicar. */
export function missingPublishMessage(
  b: PublishCandidate | null | undefined
): string {
  const labels = getMissingPublishRequirements(b).map((m) => m.label);
  if (labels.length === 0) return "";
  return (
    `Para publicar a sua Montra, complete primeiro: ${labels.join(", ")}. ` +
    "Pode completar estes dados no painel, no separador Informações."
  );
}
