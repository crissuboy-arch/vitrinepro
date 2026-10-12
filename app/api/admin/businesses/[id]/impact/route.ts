/**
 * app/api/admin/businesses/[id]/impact/route.ts — Impact preview
 *
 * GET — mostra o impacto de uma eventual exclusão da Montra,
 * SEM excluir nada (somente leitura).
 *
 * Conta: produtos, imagens de galeria, publicações/Novidades,
 * favoritos, links curtos. A decisão de excluir (ou preferir
 * despublicar) é sempre da administradora, noutro fluxo.
 */

import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient } from "@/lib/admin-auth";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function count(
  svc: NonNullable<ReturnType<typeof getServiceClient>>,
  table: string,
  column: string,
  value: string
): Promise<number | null> {
  const { count, error } = await svc
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  return error ? null : (count ?? 0);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc)
    return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "business_id inválido" }, { status: 400 });
  }

  const { data: biz, error: bizError } = await svc
    .from("businesses")
    .select("id, user_id, name, slug, published, plan, created_at")
    .eq("id", id)
    .maybeSingle();
  if (bizError || !biz) {
    return NextResponse.json({ error: "Montra não encontrada" }, { status: 404 });
  }

  const [products, gallery, posts, favorites, shortLinks] = await Promise.all([
    count(svc, "products", "business_id", id),
    count(svc, "gallery_images", "business_id", id),
    count(svc, "business_posts", "business_id", id),
    count(svc, "favorites", "business_id", id),
    count(svc, "short_links", "business_id", id),
  ]);

  return NextResponse.json({
    business: biz,
    impact: { products, gallery, posts, favorites, shortLinks },
    note: "Somente leitura — nada foi excluído. Considere despublicar antes de excluir.",
  });
}
