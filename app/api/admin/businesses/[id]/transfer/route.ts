/**
 * app/api/admin/businesses/[id]/transfer/route.ts — Owner transfer
 *
 * POST — transfere a PROPRIEDADE de uma Montra para outra conta.
 *
 * PROTEÇÕES:
 * - requireAdmin() (401/403). Service_role SÓ no servidor.
 * - Exige { target_email | target_user_id } + { confirm: true }.
 * - O destino tem de ser um utilizador EXISTENTE (nunca inventado).
 * - Slugs protegidos (clientes / casos sensíveis) NUNCA transferidos.
 * - Auditoria completa via adminLog (antes/depois).
 * - Preserva tudo: só muda businesses.user_id (produtos, fotos,
 *   Novidades, slug/QR/links ficam intactos).
 *
 * NÃO é executada automaticamente — é uma ferramenta para a
 * administradora usar com confirmação explícita.
 */

import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Montras cuja propriedade NUNCA pode ser transferida por esta rota.
const PROTECTED_SLUGS = [
  "turma-da-monica",
  "objetiva-metal",
  "cantinho-da-lu-1780338635504",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Confirmação explícita obrigatória.
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Confirmação explícita necessária (confirm: true)" },
      { status: 400 }
    );
  }

  const targetEmail =
    typeof body.target_email === "string" ? body.target_email.trim() : "";
  const targetUserId =
    typeof body.target_user_id === "string" ? body.target_user_id.trim() : "";
  if (!targetEmail && !UUID_RE.test(targetUserId)) {
    return NextResponse.json(
      { error: "Destino inválido: informe target_email ou target_user_id" },
      { status: 400 }
    );
  }

  // Montra atual (só leitura primeiro).
  const { data: biz, error: bizError } = await svc
    .from("businesses")
    .select("id, user_id, name, slug, published, plan")
    .eq("id", id)
    .maybeSingle();
  if (bizError || !biz) {
    return NextResponse.json({ error: "Montra não encontrada" }, { status: 404 });
  }
  if (PROTECTED_SLUGS.includes(biz.slug)) {
    return NextResponse.json(
      { error: `Montra protegida (${biz.slug}): transferência bloqueada` },
      { status: 403 }
    );
  }

  // Resolve o destino — tem de existir (nunca inventar utilizador).
  let destId = targetUserId;
  let destEmail: string | null = null;
  if (!destId && targetEmail) {
    const { data: users } = await svc.auth.admin.listUsers();
    const found = (users?.users || []).find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    if (!found) {
      return NextResponse.json(
        { error: "Utilizador de destino não encontrado" },
        { status: 404 }
      );
    }
    destId = found.id;
    destEmail = found.email ?? null;
  }
  if (destId === biz.user_id) {
    return NextResponse.json(
      { error: "A Montra já pertence a esta conta" },
      { status: 400 }
    );
  }

  const { error: updError } = await svc
    .from("businesses")
    .update({ user_id: destId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  adminLog("businesses.transfer", {
    admin: auth.email,
    business_id: id,
    slug: biz.slug,
    name: biz.name,
    from_user_id: biz.user_id,
    to_user_id: destId,
    to_email: destEmail,
    reason:
      typeof body.reason === "string" ? body.reason.slice(0, 200) : null,
  });

  return NextResponse.json({
    ok: true,
    business_id: id,
    slug: biz.slug,
    from_user_id: biz.user_id,
    to_user_id: destId,
  });
}
