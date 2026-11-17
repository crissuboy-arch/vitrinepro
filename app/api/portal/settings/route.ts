/**
 * app/api/portal/settings/route.ts — definições da integração Portal.
 *
 * GET  — estado atual (admin ou proprietária da montra Portal).
 * PUT  — guardar: enabled, categories[], featuredIds[], portalUrl.
 * Controlo administrativo total: sem integração ativa ou sem montra
 * publicada, nada do Portal aparece publicamente.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { getAuthenticatedUserId } from "@/lib/quotes-server";
import { getPortalBusiness, getPortalSettings, isPortalTableMissing } from "@/lib/portal-server";
import { fetchPortalFeed, portalCategories } from "@/lib/portal";

export const runtime = "nodejs";

async function canManage(request: Request): Promise<{ ok: boolean; userId: string | null }> {
  const admin = await requireAdmin();
  if (admin.ok) return { ok: true, userId: admin.userId ?? null };
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return { ok: false, userId: null };
  const business = await getPortalBusiness();
  if (business && business.userId === userId) return { ok: true, userId };
  return { ok: false, userId: null };
}

export async function GET(request: Request) {
  const auth = await canManage(request);
  if (!auth.ok) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { ready, settings } = await getPortalSettings();
  const business = await getPortalBusiness();
  const feed = await fetchPortalFeed();
  return NextResponse.json({
    ready,
    settings,
    business,
    feed: {
      ok: !feed.error,
      error: feed.error,
      categories: feed.error ? [] : portalCategories(feed.products),
      products: feed.error
        ? []
        : feed.products.map((p) => ({ externalId: p.externalId, name: p.name, category: p.category, store: p.store.label, featured: p.featured })),
    },
  });
}

export async function PUT(request: Request) {
  const auth = await canManage(request);
  if (!auth.ok) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ ready: false, error: "Serviço indisponível." }, { status: 200 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const cleanList = (v: unknown, max: number) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)))].slice(0, max) : [];
  const portalUrl = typeof body.portalUrl === "string" && /^https:\/\//.test(body.portalUrl) ? body.portalUrl.slice(0, 300) : undefined;

  const { error } = await svc
    .from("portal_settings")
    .update({
      enabled: body.enabled === true,
      categories: cleanList(body.categories, 50),
      featured_ids: cleanList(body.featuredIds, 100),
      ...(portalUrl ? { portal_url: portalUrl } : {}),
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) {
    if (isPortalTableMissing(error)) return NextResponse.json({ ready: false, error: "Migration por aplicar." });
    return NextResponse.json({ error: "Não foi possível guardar." }, { status: 500 });
  }
  adminLog("portal_settings_update", { enabled: body.enabled === true });
  const { settings } = await getPortalSettings();
  return NextResponse.json({ ready: true, settings });
}
