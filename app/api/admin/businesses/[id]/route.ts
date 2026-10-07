/**
 * app/api/admin/businesses/[id]/route.ts — ADMIN-1
 *
 * GET   → detalhes de uma Montra (inclui owner email quando possível)
 * PATCH → edita campos permitidos (inclui `published` canónico)
 *
 * Auth: requireAdmin() (401/403). Service_role SÓ no servidor.
 * DELETE: fora do MVP (sem fluxo seguro documentado).
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Campos editáveis via admin (whitelist — nunca user_id por aqui).
const EDITABLE = [
  "name",
  "slug",
  "description",
  "city",
  "category",
  "category_id",
  "city_id",
  "address",
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "website",
  "published",
  "is_featured",
  "plan",
  "logo_url",
  "cover_url",
  "opening_hours",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const { data: biz, error } = await svc.from("businesses").select("*").eq("id", id).single();
    if (error) throw error;
    if (!biz) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    // Owner email (server-side, nunca exposto publicamente).
    let owner_email: string | null = null;
    try {
      const { data: u } = await svc.auth.admin.getUserById(biz.user_id);
      owner_email = u?.user?.email ?? null;
    } catch {
      /* ignora */
    }

    adminLog("businesses.get", { admin: auth.email, business_id: id });
    return NextResponse.json({ business: biz, owner_email });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    for (const k of EDITABLE) {
      if (k in body) patch[k] = body[k];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
    }
    // Nunca permitir troca de slug para vazio.
    if ("slug" in patch && !String(patch.slug).trim()) {
      return NextResponse.json({ error: "Slug não pode ser vazio" }, { status: 400 });
    }

    const { data, error } = await svc
      .from("businesses")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, slug, published")
      .single();
    if (error) throw error;

    adminLog("businesses.patch", {
      admin: auth.email,
      business_id: id,
      fields: Object.keys(patch),
    });
    return NextResponse.json({ business: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
