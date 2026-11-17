/**
 * POST /api/gestor/businesses/[id]/posts — preparar uma publicação
 * (novidade) em RASCUNHO para a montra gerida.
 *
 * Rascunho = business_posts com is_active=false: não aparece em
 * nenhum feed público. A ativação/publicação faz-se depois pela
 * proprietária ou pelo dono da montra no dashboard — a gestora
 * PREPARA, não publica novidades diretamente.
 */
import { NextResponse } from "next/server";
import { requireGestor, canManageBusiness, gestorAudit } from "@/lib/gestor-auth";

const ALLOWED_TYPES = new Set(["novidade", "produto", "evento", "dica"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc, gestor } = auth;
  const allowed = await canManageBusiness(svc!, gestor!.managerId, id).catch(() => false);
  if (!allowed) {
    return NextResponse.json({ error: "Esta montra não está atribuída a esta gestora." }, { status: 403 });
  }
  let body: { type?: unknown; title?: unknown; content?: unknown; image_url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  if (!title) return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });
  const type = typeof body.type === "string" && ALLOWED_TYPES.has(body.type) ? body.type : "novidade";

  const { data, error } = await svc!
    .from("business_posts")
    .insert({
      business_id: id,
      type,
      title,
      content: typeof body.content === "string" ? body.content.trim().slice(0, 2000) || null : null,
      image_url: typeof body.image_url === "string" ? body.image_url.trim().slice(0, 600) || null : null,
      is_active: false,
    })
    .select("id, business_id, type, title, content, image_url, is_active, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Não foi possível guardar o rascunho." }, { status: 500 });
  await gestorAudit(svc!, {
    managerId: gestor!.managerId,
    email: gestor!.email,
    action: "post.create_draft",
    businessId: id,
    details: { title, via: gestor!.via },
  });
  return NextResponse.json({ post: data, draft: true }, { status: 201 });
}
