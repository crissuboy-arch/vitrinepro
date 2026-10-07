/**
 * app/api/admin/products/[id]/route.ts — ADMIN-1
 * PATCH → edita produto (inclui is_visible, show_in_explore)
 * DELETE → remove produto (comportamento seguro: só o registo do produto)
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

const EDITABLE = [
  "name", "description", "price", "image_url",
  "is_visible", "show_in_explore", "order_index",
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

    const { data, error } = await svc.from("products").update(patch).eq("id", id).select("id").single();
    if (error) throw error;
    adminLog("products.patch", { admin: auth.email, product_id: id, fields: Object.keys(patch) });
    return NextResponse.json({ product: data });
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
    const { error } = await svc.from("products").delete().eq("id", id);
    if (error) throw error;
    adminLog("products.delete", { admin: auth.email, product_id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
