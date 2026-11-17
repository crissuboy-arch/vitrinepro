/**
 * /api/gestor/businesses/[id]/products — produtos da montra gerida.
 * GET lista; POST adiciona (nome obrigatório; preço opcional).
 */
import { NextResponse } from "next/server";
import { requireGestor, canManageBusiness, gestorAudit } from "@/lib/gestor-auth";

async function guard(req: Request, id: string) {
  const auth = await requireGestor(req);
  if (!auth.ok) return { error: auth.response };
  const { svc, gestor } = auth;
  const allowed = await canManageBusiness(svc!, gestor!.managerId, id).catch(() => false);
  if (!allowed) {
    return { error: NextResponse.json({ error: "Esta montra não está atribuída a esta gestora." }, { status: 403 }) };
  }
  return { svc: svc!, gestor: gestor! };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(req, id);
  if ("error" in g) return g.error;
  const { data, error } = await g.svc
    .from("products")
    .select("id, business_id, name, description, price, image_url, order_index, created_at")
    .eq("business_id", id)
    .order("order_index", { ascending: true });
  if (error) return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guard(req, id);
  if ("error" in g) return g.error;
  let body: { name?: unknown; description?: unknown; price?: unknown; image_url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
  if (!name) return NextResponse.json({ error: "O nome do produto é obrigatório." }, { status: 400 });
  const price = typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0 ? body.price : null;

  const { count } = await g.svc.from("products").select("id", { count: "exact", head: true }).eq("business_id", id);
  const { data, error } = await g.svc
    .from("products")
    .insert({
      business_id: id,
      name,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) || null : null,
      price,
      image_url: typeof body.image_url === "string" ? body.image_url.trim().slice(0, 600) || null : null,
      order_index: count ?? 0,
    })
    .select("id, business_id, name, description, price, image_url, order_index, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Não foi possível adicionar o produto." }, { status: 500 });
  await gestorAudit(g.svc, {
    managerId: g.gestor.managerId,
    email: g.gestor.email,
    action: "product.create",
    businessId: id,
    details: { name, via: g.gestor.via },
  });
  return NextResponse.json({ product: data }, { status: 201 });
}
