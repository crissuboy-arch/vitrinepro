/**
 * app/api/admin/portal-montra/route.ts — criar a montra do Portal.
 *
 * POST (admin): cria a empresa "Portal de Ofertas" como montra
 * multiloja/afiliados, SEMPRE em rascunho (published=false). A
 * publicação é decisão separada da proprietária, no painel habitual.
 * Se já existir uma montra multiloja, devolve a existente.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { getPortalBusiness, isPortalTableMissing } from "@/lib/portal-server";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ ready: false, error: "Serviço indisponível." });

  const existing = await getPortalBusiness();
  if (existing) return NextResponse.json({ ready: true, created: false, business: existing });

  const { data: slugTaken } = await svc.from("businesses").select("id").eq("slug", "portal-de-ofertas").maybeSingle();
  const slug = slugTaken ? `portal-de-ofertas-${Date.now().toString(36)}` : "portal-de-ofertas";

  const { data, error } = await svc
    .from("businesses")
    .insert({
      user_id: auth.userId,
      name: "Portal de Ofertas",
      slug,
      description:
        "As melhores ofertas de várias lojas num só lugar: tecnologia, casa, beleza e muito mais, atualizadas todos os dias. Preços e disponibilidade verificados na loja de origem.",
      category: "Compras e ofertas",
      city: "Portugal",
      country: "Portugal",
      website: "https://portal-de-ofertapt.vercel.app",
      business_kind: "multiloja_afiliados",
      published: false,
      is_published: false,
      plan: "premium",
    })
    .select("id, slug, name, published")
    .single();

  if (error) {
    if (isPortalTableMissing(error)) return NextResponse.json({ ready: false, error: "Migration 20261117000029 por aplicar." });
    return NextResponse.json({ ready: false, error: error.message }, { status: 200 });
  }
  adminLog("portal_montra_create", { businessId: data.id, slug: data.slug });
  return NextResponse.json({ ready: true, created: true, business: data });
}
