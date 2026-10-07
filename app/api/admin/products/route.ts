/**
 * app/api/admin/products/route.ts — ADMIN-1
 *
 * GET  ?business_id= → lista produtos de uma Montra (todos, inclusive ocultos)
 * POST → cria produto numa Montra
 *
 * Auth: requireAdmin() (401/403). Service_role SÓ no servidor.
 * Preserva: is_visible, show_in_explore, business_id.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");
  if (!business_id) return NextResponse.json({ error: "business_id obrigatório" }, { status: 400 });

  try {
    const { data, error } = await svc
      .from("products")
      .select("*")
      .eq("business_id", business_id)
      .order("order_index", { ascending: true });
    if (error) throw error;
    adminLog("products.list", { admin: auth.email, business_id, count: data?.length });
    return NextResponse.json({ products: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  try {
    const body = await request.json();
    if (!body.business_id || !body.name) {
      return NextResponse.json({ error: "business_id e name obrigatórios" }, { status: 400 });
    }
    const { data, error } = await svc
      .from("products")
      .insert({
        business_id: body.business_id,
        name: body.name,
        description: body.description || null,
        price: body.price ?? null,
        image_url: body.image_url || null,
        is_visible: body.is_visible !== false,
        show_in_explore: body.show_in_explore !== false,
        order_index: body.order_index ?? 0,
      })
      .select("id")
      .single();
    if (error) throw error;
    adminLog("products.create", { admin: auth.email, business_id: body.business_id, product_id: data.id });
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
