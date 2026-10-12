/**
 * app/api/admin/invites/route.ts — Convite seguro de cliente
 *
 * POST { email } — entrega de conta a cliente (ENTREGA DE CONTAS).
 *
 * FLUXO:
 * 1. Admin informa o email da cliente (requireAdmin).
 * 2. Se a conta JÁ existe → devolve { already_exists, user_id } SEM
 *    reenviar convite e SEM criar senha (nunca senha padrão partilhada).
 * 3. Se NÃO existe → Supabase envia inviteUserByEmail: link de uso único
 *    com expiração para a cliente definir A PRÓPRIA senha.
 * 4. A transferência da Montra usa o endpoint /transfer SÓ DEPOIS de a
 *    conta existir E ter o email confirmado (identidade verificada).
 *
 * A administradora mantém acesso pelo painel admin após a transferência
 * (o painel lista todas as Montras — nada muda nisso).
 */

import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc)
    return NextResponse.json({ error: "Configuração incompleta" }, { status: 500 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  // Conta já existe? Não reenvia convite, não cria senha.
  const { data: users } = await svc.auth.admin.listUsers();
  const existing = (users?.users || []).find(
    (u) => u.email?.toLowerCase() === email
  );
  if (existing) {
    adminLog("users.invite.skipped", {
      admin: auth.email,
      email,
      user_id: existing.id,
      reason: "conta já existe",
    });
    return NextResponse.json({
      ok: true,
      already_exists: true,
      user_id: existing.id,
      email_confirmed: !!existing.email_confirmed_at,
    });
  }

  // Convite: link de uso único com expiração; a cliente define a senha.
  const { data, error } = await svc.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getSiteUrl()}/conta`,
  });
  if (error || !data?.user) {
    return NextResponse.json(
      { error: error?.message || "Falha ao enviar o convite" },
      { status: 500 }
    );
  }

  adminLog("users.invite", {
    admin: auth.email,
    email,
    user_id: data.user.id,
  });

  return NextResponse.json({
    ok: true,
    already_exists: false,
    user_id: data.user.id,
    note: "Convite enviado. A cliente define a própria senha pelo link (uso único, com expiração).",
  });
}
