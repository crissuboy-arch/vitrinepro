/**
 * POST /api/gestor/businesses/[id]/promotions — criar uma promoção
 * Vitrine Flash para a montra gerida, respeitando o limite do plano
 * da montra (lib/promotions + lib/plans + owner-entitlement, as
 * mesmas regras da Fase 1). A promoção nasce ATIVA como no dashboard
 * do dono — criar promoção é uma das permissões explícitas da
 * gestora ("Preparar publicações e promoções").
 */
import { NextResponse } from "next/server";
import { requireGestor, canManageBusiness, gestorAudit } from "@/lib/gestor-auth";
import { countActivePromotions, type PromotionRow } from "@/lib/promotions";
import { planMaxActivePromotions } from "@/lib/plans";
import { effectivePlanId, isOwnerEmail } from "@/lib/owner-entitlement";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireGestor(req);
  if (!auth.ok) return auth.response;
  const { svc, gestor } = auth;
  const allowed = await canManageBusiness(svc!, gestor!.managerId, id).catch(() => false);
  if (!allowed) {
    return NextResponse.json({ error: "Esta montra não está atribuída a esta gestora." }, { status: 403 });
  }
  let body: { title?: unknown; content?: unknown; price?: unknown; original_price?: unknown; image_url?: unknown; expires_at?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  if (!title) return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });
  const price = typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0 ? body.price : null;
  const originalPrice =
    typeof body.original_price === "number" && Number.isFinite(body.original_price) && body.original_price >= 0
      ? body.original_price
      : null;
  if (price !== null && originalPrice !== null && originalPrice < price) {
    return NextResponse.json({ error: "O preço original tem de ser maior ou igual ao preço promocional." }, { status: 400 });
  }
  const expiresAt = typeof body.expires_at === "string" && body.expires_at ? new Date(body.expires_at) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Data de fim inválida." }, { status: 400 });
  }

  // Plano efetivo da montra (com entitlement da proprietária).
  const { data: business } = await svc!
    .from("businesses")
    .select("id, plan, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Montra não encontrada." }, { status: 404 });
  let ownerEmail: string | null = null;
  try {
    const { data: owner } = await svc!.auth.admin.getUserById(business.user_id);
    ownerEmail = owner?.user?.email ?? null;
  } catch {
    ownerEmail = null;
  }
  const plan = effectivePlanId(business.plan || "free", isOwnerEmail(ownerEmail));
  const limit = planMaxActivePromotions(plan);

  const { data: rows } = await svc!
    .from("business_posts")
    .select("id, business_id, type, title, content, image_url, price, original_price, starts_at, expires_at, is_active, created_at")
    .eq("business_id", id)
    .eq("type", "promocao");
  const active = countActivePromotions((rows ?? []) as unknown as PromotionRow[]);
  if (active >= limit) {
    return NextResponse.json(
      { error: `Limite de promoções ativas atingido para o plano desta montra (${active}/${limit}).` },
      { status: 409 }
    );
  }

  const { data, error } = await svc!
    .from("business_posts")
    .insert({
      business_id: id,
      type: "promocao",
      title,
      content: typeof body.content === "string" ? body.content.trim().slice(0, 2000) || null : null,
      price,
      original_price: originalPrice,
      image_url: typeof body.image_url === "string" ? body.image_url.trim().slice(0, 600) || null : null,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      is_active: true,
    })
    .select("id, business_id, type, title, price, original_price, expires_at, is_active, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "Não foi possível criar a promoção." }, { status: 500 });
  await gestorAudit(svc!, {
    managerId: gestor!.managerId,
    email: gestor!.email,
    action: "promotion.create",
    businessId: id,
    details: { title, plan, activeBefore: active, limit, via: gestor!.via },
  });
  return NextResponse.json({ promotion: data }, { status: 201 });
}
