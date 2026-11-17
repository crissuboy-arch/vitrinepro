/**
 * /api/gestor/businesses/[id] — detalhe e edição de uma montra gerida.
 * PATCH aceita os campos comerciais editáveis e o toggle de
 * publicação (com o carimbo de primeira publicação de
 * lib/published-at). Campos fora da lista branca são ignorados —
 * a gestora nunca altera dono, plano nem dados de pagamento.
 */
import { NextResponse } from "next/server";
import { requireGestor, canManageBusiness, gestorAudit } from "@/lib/gestor-auth";
import { togglePublishPatch } from "@/lib/published-at";

const BUSINESS_FIELDS =
  "id, name, slug, description, category, city, country, address, phone, whatsapp, email, website, instagram, facebook, tiktok, youtube, logo_url, cover_url, opening_hours, published, published_at, plan, created_at";

const EDITABLE: Record<string, number> = {
  name: 120,
  description: 2000,
  category: 80,
  city: 80,
  country: 60,
  address: 300,
  phone: 40,
  whatsapp: 40,
  email: 160,
  website: 300,
  instagram: 160,
  facebook: 160,
  tiktok: 160,
  youtube: 160,
  logo_url: 600,
  cover_url: 600,
};

async function loadManaged(req: Request, id: string) {
  const auth = await requireGestor(req);
  if (!auth.ok) return { error: auth.response };
  const { svc, gestor } = auth;
  let allowed = false;
  try {
    allowed = await canManageBusiness(svc!, gestor!.managerId, id);
  } catch {
    return { error: NextResponse.json({ error: "Não foi possível verificar a montra." }, { status: 500 }) };
  }
  if (!allowed) {
    return { error: NextResponse.json({ error: "Esta montra não está atribuída a esta gestora." }, { status: 403 }) };
  }
  const { data, error } = await svc!.from("businesses").select(BUSINESS_FIELDS).eq("id", id).maybeSingle();
  if (error || !data) {
    return { error: NextResponse.json({ error: "Montra não encontrada." }, { status: 404 }) };
  }
  return { svc: svc!, gestor: gestor!, business: data };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadManaged(req, id);
  if ("error" in loaded) return loaded.error;
  return NextResponse.json({ business: loaded.business });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadManaged(req, id);
  if ("error" in loaded) return loaded.error;
  const { svc, gestor, business } = loaded;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const [field, max] of Object.entries(EDITABLE)) {
    if (body[field] === undefined) continue;
    const v = body[field];
    if (v === null) patch[field] = null;
    else if (typeof v === "string") patch[field] = v.trim().slice(0, max) || null;
  }
  if (body.opening_hours && typeof body.opening_hours === "object" && !Array.isArray(body.opening_hours)) {
    patch.opening_hours = body.opening_hours;
  }

  let publishAction: string | null = null;
  if (typeof body.published === "boolean" && body.published !== business.published) {
    const p = togglePublishPatch(
      { published: business.published, published_at: business.published_at },
      body.published,
      new Date().toISOString()
    );
    patch.published = p.published;
    if (p.published_at) patch.published_at = p.published_at;
    publishAction = body.published ? "business.publish" : "business.unpublish";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await svc
    .from("businesses")
    .update(patch)
    .eq("id", id)
    .select(BUSINESS_FIELDS)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Não foi possível guardar as alterações." }, { status: 500 });
  }
  await gestorAudit(svc, {
    managerId: gestor.managerId,
    email: gestor.email,
    action: publishAction ?? "business.update",
    businessId: id,
    details: { fields: Object.keys(patch), via: gestor.via },
  });
  return NextResponse.json({ business: data });
}
