/**
 * lib/daily-topics.ts — Assunto do Dia: campos e validação partilhados.
 *
 * Regra editorial: NADA é publicado sem aprovação humana. A Atena só
 * cria rascunhos 'pending'; o admin aprova no painel. Fontes têm de
 * ser indicadas (nome + URL http/https) — nunca inventadas.
 */
export const TOPIC_STATUSES = ["draft", "pending", "published", "archived"] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const TOPIC_FIELDS =
  "id, title, summary, source_name, source_url, city, category, status, is_pinned, scheduled_for, created_by, created_via, created_at, published_at";

export interface TopicInput {
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  city: string | null;
  category: string | null;
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export function parseTopicInput(body: Record<string, unknown>): { input: TopicInput } | { error: string } {
  const title = str(body.title, 160);
  if (!title) return { error: "O título é obrigatório." };
  const sourceUrl = str(body.source_url, 600);
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    return { error: "A fonte tem de ser um URL http(s) válido." };
  }
  return {
    input: {
      title,
      summary: str(body.summary, 1200),
      source_name: str(body.source_name, 120),
      source_url: sourceUrl,
      city: str(body.city, 80),
      category: str(body.category, 80),
    },
  };
}

export function parseScheduledFor(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}
