/**
 * /api/admin/daily-topics — gestão editorial do Assunto do Dia.
 * SÓ admin. Criar, editar, agendar, fixar, APROVAR (incl. rascunhos
 * 'pending' da Atena), rejeitar (volta a draft) e arquivar.
 * Publicar carimba published_at; nada publica sozinho.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { TOPIC_FIELDS, TOPIC_STATUSES, parseTopicInput, parseScheduledFor, type TopicStatus } from "@/lib/daily-topics";
import { isMissingTableError } from "@/lib/gestor-auth";

function notReady() {
  return NextResponse.json(
    { error: "Assunto do Dia ainda não está ativo. Aplica primeiro a migration 20261117000028." },
    { status: 503 }
  );
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return notReady();
  try {
    const { data, error } = await svc
      .from("daily_topics")
      .select(TOPIC_FIELDS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ topics: data ?? [] });
  } catch (err) {
    if (isMissingTableError(err)) return notReady();
    return NextResponse.json({ error: "Não foi possível carregar os assuntos." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return notReady();
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const parsed = parseTopicInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const publishNow = body.publish === true;
  try {
    const { data, error } = await svc
      .from("daily_topics")
      .insert({
        ...parsed.input,
        status: publishNow ? "published" : "draft",
        is_pinned: body.is_pinned === true,
        scheduled_for: parseScheduledFor(body.scheduled_for),
        created_by: auth.email,
        created_via: "admin",
        published_at: publishNow ? new Date().toISOString() : null,
      })
      .select(TOPIC_FIELDS)
      .single();
    if (error) throw error;
    adminLog("topic.create", { by: auth.email, title: parsed.input.title, published: publishNow });
    return NextResponse.json({ topic: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return notReady();
    return NextResponse.json({ error: "Não foi possível criar o assunto." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return notReady();
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Assunto em falta." }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined || body.summary !== undefined || body.source_url !== undefined) {
    const parsed = parseTopicInput({
      title: body.title ?? "—",
      summary: body.summary,
      source_name: body.source_name,
      source_url: body.source_url,
      city: body.city,
      category: body.category,
    });
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (body.title !== undefined) patch.title = parsed.input.title;
    if (body.summary !== undefined) patch.summary = parsed.input.summary;
    if (body.source_name !== undefined) patch.source_name = parsed.input.source_name;
    if (body.source_url !== undefined) patch.source_url = parsed.input.source_url;
    if (body.city !== undefined) patch.city = parsed.input.city;
    if (body.category !== undefined) patch.category = parsed.input.category;
  }
  if (typeof body.is_pinned === "boolean") patch.is_pinned = body.is_pinned;
  if (body.scheduled_for !== undefined) patch.scheduled_for = parseScheduledFor(body.scheduled_for);
  if (typeof body.status === "string" && (TOPIC_STATUSES as readonly string[]).includes(body.status)) {
    const status = body.status as TopicStatus;
    patch.status = status;
    if (status === "published") patch.published_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  try {
    const { data, error } = await svc
      .from("daily_topics")
      .update(patch)
      .eq("id", body.id)
      .select(TOPIC_FIELDS)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Assunto não encontrado." }, { status: 404 });
    adminLog("topic.update", { by: auth.email, topicId: body.id, fields: Object.keys(patch) });
    return NextResponse.json({ topic: data });
  } catch (err) {
    if (isMissingTableError(err)) return notReady();
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }
}
