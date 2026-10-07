/**
 * app/api/admin/users/route.ts — ADMIN (reescrito)
 *
 * Tabela REAL de contas a partir do Supabase Auth (service_role, server-side).
 *
 * GET ?page=1&q=&filter=todos|ativos|inativos|consumidores|comerciantes|admins&plan=free|pro|business
 *
 * Cada utilizador: id, email, created_at, last_sign_in_at (REAL),
 * businessCount, tipo operacional (consumidor/comerciante/admin — DERIVADO),
 * status (ativo/inativo/nunca entrou — DERIVADO de last_sign_in_at).
 *
 * Definição: ATIVO = last_sign_in_at nos últimos 30 dias.
 *
 * Auth: requireAdmin() — 401 sem sessão, 403 não-admin.
 * Paginação: 50 por página (server-side).
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog, getAdminEmails } from "@/lib/admin-auth";

export const runtime = "nodejs";

const PAGE_SIZE = 50;
const ACTIVE_WINDOW_DAYS = 30;

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const filter = searchParams.get("filter") || "todos";

    // ── 1. Todos os users do Auth (paginado no servidor) ──
    const allUsers: Array<{ id: string; email?: string; created_at: string; last_sign_in_at?: string | null }> = [];
    let ap = 1;
    for (;;) {
      const { data, error } = await svc.auth.admin.listUsers({ page: ap, perPage: 1000 });
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
      if (users.length < 1000) break;
      ap++;
      if (ap > 60) break;
    }

    // ── 2. Contagem de Montras por user ──
    const { data: bizs, error: bizErr } = await svc.from("businesses").select("user_id, plan");
    if (bizErr) throw bizErr;
    const bizCount = new Map<string, number>();
    const planByUser = new Map<string, string>();
    for (const b of bizs || []) {
      bizCount.set(b.user_id, (bizCount.get(b.user_id) || 0) + 1);
      // Plano "principal": o mais alto entre as Montras do user
      const rank: Record<string, number> = { free: 0, pro: 1, business: 2 };
      const cur = planByUser.get(b.user_id) || "free";
      const cand = String(b.plan || "free").toLowerCase();
      if ((rank[cand] ?? 0) > (rank[cur] ?? 0)) planByUser.set(b.user_id, cand);
    }

    const adminEmails = getAdminEmails();
    const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86400000).toISOString();

    // ── 3. Enriquecer + classificar ──
    let rows = allUsers.map((u) => {
      const isAdminUser = !!u.email && adminEmails.includes(u.email.toLowerCase());
      const nBiz = bizCount.get(u.id) || 0;
      const tipo = isAdminUser ? "admin" : nBiz > 0 ? "comerciante" : "consumidor";
      const status = !u.last_sign_in_at
        ? "nunca_entrou"
        : u.last_sign_in_at >= activeCutoff
          ? "ativo"
          : "inativo";
      return {
        id: u.id,
        email: u.email || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        businessCount: nBiz,
        tipo,
        status,
        plan: nBiz > 0 ? planByUser.get(u.id) || "free" : null,
      };
    });

    // ── 4. Busca (email, user_id) ──
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.email || "").toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    // ── 5. Filtros ──
    if (filter === "ativos") rows = rows.filter((r) => r.status === "ativo");
    else if (filter === "inativos") rows = rows.filter((r) => r.status === "inativo" || r.status === "nunca_entrou");
    else if (filter === "consumidores") rows = rows.filter((r) => r.tipo === "consumidor");
    else if (filter === "comerciantes") rows = rows.filter((r) => r.tipo === "comerciante");
    else if (filter === "admins") rows = rows.filter((r) => r.tipo === "admin");

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    adminLog("users.list", { admin: auth.email, page: safePage, total, filter, q: q || null });
    return NextResponse.json({
      users: paged,
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      activeWindowDays: ACTIVE_WINDOW_DAYS,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
