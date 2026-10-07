/**
 * app/api/admin/gallery/route.ts — ADMIN-1
 *
 * GET  ?business_id= → lista imagens da galeria (todas, inclusive ocultas)
 * POST → adiciona imagem (image_url já deve existir no Storage)
 *
 * NOTA Storage: o upload em si continua pelo fluxo existente do
 * comerciante (Storage RLS intacta). O admin aqui regista/gere
 * metadados; upload direto com service_role fica para fase posterior
 * se necessário.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const business_id = new URL(request.url).searchParams.get("business_id");
  if (!business_id) return NextResponse.json({ error: "business_id obrigatório" }, { status: 400 });

  try {
    const { data, error } = await svc
      .from("gallery_images")
      .select("*")
      .eq("business_id", business_id)
      .order("order_index", { ascending: true });
    if (error) throw error;
    adminLog("gallery.list", { admin: auth.email, business_id, count: data?.length });
    return NextResponse.json({ images: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  try {
    const body = await request.json();
    if (!body.business_id || !body.image_url) {
      return NextResponse.json({ error: "business_id e image_url obrigatórios" }, { status: 400 });
    }
    const { data, error } = await svc
      .from("gallery_images")
      .insert({
        business_id: body.business_id,
        image_url: body.image_url,
        caption: body.caption || null,
        is_visible: body.is_visible !== false,
        order_index: body.order_index ?? 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    adminLog("gallery.create", { admin: auth.email, business_id: body.business_id, image_id: data.id });
    return NextResponse.json({ image: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
