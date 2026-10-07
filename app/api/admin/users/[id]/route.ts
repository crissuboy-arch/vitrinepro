/**
 * app/api/admin/users/[id]/route.ts — detalhe de uma conta
 *
 * GET → email, id, created_at, last_sign_in_at (REAL), tipo, status,
 *       + lista de Montras do user (nome, slug, cidade, published, plano).
 *
 * NUNCA expõe senha. Auth: requireAdmin() — 401/403.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog, getAdminEmails } from "@/lib/admin-auth";

export const runtime = "nodejs";

const ACTIVE_WINDOW_DAYS = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  const { id } = await params;
  try {
    const { data: u, error: uErr } = await svc.auth.admin.getUserById(id);
    if (uErr || !u?.user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    const user = u.user;
    const lastSignIn = (user as { last_sign_in_at?: string | null }).last_sign_in_at ?? null;

    const { data: bizs } = await svc
      .from("businesses")
      .select("id, name, slug, city, published, plan, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    const adminEmails = getAdminEmails();
    const isAdminUser = !!user.email && adminEmails.includes(user.email.toLowerCase());
    const nBiz = bizs?.length || 0;
    const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86400000).toISOString();

    adminLog("users.get", { admin: auth.email, user_id: id });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: lastSignIn,
        tipo: isAdminUser ? "admin" : nBiz > 0 ? "comerciante" : "consumidor",
        status: !lastSignIn ? "nunca_entrou" : lastSignIn >= activeCutoff ? "ativo" : "inativo",
        businessCount: nBiz,
      },
      businesses: bizs || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
