/**
 * app/api/admin/stats/route.ts — Visão Geral da proprietária
 *
 * Retorna métricas REAIS (nada inventado):
 * - CONTAS: total, novas hoje/7d/30d, ativas (last_sign_in_at), consumidores vs comerciantes
 * - MONTRAS: total, publicadas, não publicadas
 * - PLANOS: free/pro/business (campo businesses.plan)
 * - CONTEÚDO: produtos, novidades, galeria
 *
 * Definição de "ativa": last_sign_in_at >= now() - 30 dias (Supabase Auth).
 * Mostrado na UI como "Ativas nos últimos 30 dias" para não enganar.
 *
 * Auth: requireAdmin() (401/403). Service_role SÓ no servidor.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog, getAdminEmails } from "@/lib/admin-auth";

export const runtime = "nodejs";

const ACTIVE_WINDOW_DAYS = 30;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  try {
    // ── CONTAS (Supabase Auth, via service_role) ──
    const allUsers: Array<{
      id: string; email?: string; created_at: string; last_sign_in_at?: string | null;
    }> = [];
    let page = 1;
    const perPage = 1000;
    for (;;) {
      const { data, error } = await svc.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users || [];
      for (const u of users) {
        allUsers.push({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: (u as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
        });
      }
      if (users.length < perPage) break;
      page++;
      if (page > 60) break; // segurança: 60k contas
    }

    const now = Date.now();
    const day = 86400000;
    const activeCutoff = new Date(now - ACTIVE_WINDOW_DAYS * day).toISOString();

    const totalAccounts = allUsers.length;
    const newToday = allUsers.filter((u) => now - new Date(u.created_at).getTime() < day).length;
    const new7d = allUsers.filter((u) => now - new Date(u.created_at).getTime() < 7 * day).length;
    const new30d = allUsers.filter((u) => now - new Date(u.created_at).getTime() < 30 * day).length;
    const active30d = allUsers.filter(
      (u) => u.last_sign_in_at && u.last_sign_in_at >= activeCutoff
    ).length;
    const neverLoggedIn = allUsers.filter((u) => !u.last_sign_in_at).length;

    const adminEmails = getAdminEmails();
    const adminCount = allUsers.filter((u) => u.email && adminEmails.includes(u.email.toLowerCase())).length;

    // ── MONTRAS por owner (para consumidores vs comerciantes) ──
    const { data: bizOwners, error: bizErr } = await svc
      .from("businesses")
      .select("id, user_id, published, plan");
    if (bizErr) throw bizErr;
    const bizs = bizOwners || [];

    const ownersWithBiz = new Set(bizs.map((b) => b.user_id));
    const consumers = allUsers.filter(
      (u) => !ownersWithBiz.has(u.id) && !(u.email && adminEmails.includes(u.email.toLowerCase()))
    ).length;
    const merchants = ownersWithBiz.size;

    const totalBiz = bizs.length;
    const published = bizs.filter((b) => b.published).length;
    const unpublished = totalBiz - published;

    const plans: Record<string, number> = { free: 0, pro: 0, business: 0, other: 0 };
    for (const b of bizs) {
      const p = String(b.plan || "free").toLowerCase();
      if (p in plans) plans[p]++;
      else plans.other++;
    }

    // ── CONTEÚDO (contagens exatas) ──
    const [prodRes, postRes, galRes] = await Promise.all([
      svc.from("products").select("id", { count: "exact", head: true }),
      svc.from("business_posts").select("id", { count: "exact", head: true }),
      svc.from("gallery_images").select("id", { count: "exact", head: true }),
    ]);

    adminLog("stats.overview", { admin: auth.email, totalAccounts, totalBiz });

    return NextResponse.json({
      activeWindowDays: ACTIVE_WINDOW_DAYS,
      accounts: {
        total: totalAccounts,
        newToday,
        new7d,
        new30d,
        active30d,
        neverLoggedIn,
        consumers,
        merchants,
        admins: adminCount,
      },
      businesses: {
        total: totalBiz,
        published,
        unpublished,
        plans: { free: plans.free, pro: plans.pro, business: plans.business, other: plans.other },
      },
      content: {
        products: prodRes.count ?? 0,
        posts: postRes.count ?? 0,
        gallery: galRes.count ?? 0,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
