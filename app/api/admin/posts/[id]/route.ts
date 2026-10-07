/**
 * app/api/admin/posts/[id]/route.ts — ADMIN-1
 * PATCH → edita (inclui is_active) · DELETE → remove
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

const EDITABLE = [
  "type", "title", "content", "image_url", "price",
  "starts_at", "expires_at", "is_active", "product_id",
  "cta_type", "cta_target",
] as const;

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
    for (const k of EDITABLE) if (k in body) patch[k] = body[k];
    if (!Object.keys(patch).length)
      return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });

    const { data, error } = await svc
      .from("business_posts")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
    adminLog("posts.patch", { admin: auth.email, post_id: id, fields: Object.keys(patch) });
    return NextResponse.json({ post: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const { error } = await svc.from("business_posts").delete().eq("id", id);
    if (error) throw error;
    adminLog("posts.delete", { admin: auth.email, post_id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
