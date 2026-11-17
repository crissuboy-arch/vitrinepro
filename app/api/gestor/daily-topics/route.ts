/**
 * /api/gestor/daily-topics — ferramenta da Atena para o Assunto do Dia.
 *
 * Autenticação: a MESMA identidade de Gestora de Montras (sessão ou
 * chave API vpg_) — nenhuma credencial nova.
 *
 * POST cria um rascunho em estado 'pending' (created_via='atena'):
 * entra na fila de aprovação do admin e NUNCA é publicado
 * automaticamente. A Atena deve indicar sempre a fonte (nome + URL)
 * de assuntos externos — sem fonte, o rascunho é recusado.
 * GET lista os rascunhos pendentes e os assuntos recentes.
 */
import { NextResponse } from "next/server";
import { requireGestor, gestorAudit } from "@/lib/gestor-auth";
import { TOPIC_FIELDS, parseTopicInput, parseScheduledFor } from "@/lib/daily-topics";
import { isMissingTableError } from "@/lib/gestor-auth";

export async function GET(req: Request) {
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc } = auth;
  try {
    const { data, error } = await svc!
      .from("daily_topics")
      .select(TOPIC_FIELDS)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ topics: data ?? [] });
  } catch (err) {
    if (isMissingTableError(err)) {
      return NextResponse.json(
        { error: "Assunto do Dia ainda não está ativo. Aplica primeiro a migration 20261117000028." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Não foi possível carregar os assuntos." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc, gestor } = auth;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const parsed = parseTopicInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.input.source_url || !parsed.input.source_name) {
    return NextResponse.json(
      { error: "Rascunhos da Atena exigem fonte verificável (source_name e source_url). Sem fonte, não entra na fila." },
      { status: 400 }
    );
  }
  try {
    const { data, error } = await svc!
      .from("daily_topics")
      .insert({
        ...parsed.input,
        status: "pending",
        is_pinned: false,
        scheduled_for: parseScheduledFor(body.scheduled_for),
        created_by: gestor!.email,
        created_via: "atena",
      })
      .select(TOPIC_FIELDS)
      .single();
    if (error) throw error;
    await gestorAudit(svc!, {
      managerId: gestor!.managerId,
      email: gestor!.email,
      action: "topic.draft_create",
      details: { title: parsed.input.title, via: gestor!.via },
    });
    return NextResponse.json({ topic: data, note: "Rascunho criado em 'pending' — aguarda aprovação do admin." }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) {
      return NextResponse.json(
        { error: "Assunto do Dia ainda não está ativo. Aplica primeiro a migration 20261117000028." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Não foi possível criar o rascunho." }, { status: 500 });
  }
}
