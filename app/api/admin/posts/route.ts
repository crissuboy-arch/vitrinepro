/**
 * app/api/admin/posts/route.ts — ADMIN-1 (Novidades = business_posts)
 *
 * GET  ?business_id= → lista novidades de uma Montra
 * POST → cria novidade
 *
 * Preserva os tipos canónicos existentes (type TEXT livre nesta versão).
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
      .from("business_posts")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    adminLog("posts.list", { admin: auth.email, business_id, count: data?.length });
    return NextResponse.json({ posts: data });
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
    if (!body.business_id || !body.type || !body.title) {
      return NextResponse.json({ error: "business_id, type e title obrigatórios" }, { status: 400 });
    }
    const { data, error } = await svc
      .from("business_posts")
      .insert({
        business_id: body.business_id,
        type: body.type,
        title: body.title,
        content: body.content || null,
        image_url: body.image_url || null,
        price: body.price ?? null,
        starts_at: body.starts_at || null,
        expires_at: body.expires_at || null,
        is_active: body.is_active !== false,
        product_id: body.product_id || null,
        cta_type: body.cta_type || null,
        cta_target: body.cta_target || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    adminLog("posts.create", { admin: auth.email, business_id: body.business_id, post_id: data.id });
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
