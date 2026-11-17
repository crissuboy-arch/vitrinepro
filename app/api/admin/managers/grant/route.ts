/**
 * /api/admin/managers/grant — atribuir/retirar montras a uma gestora.
 * SÓ admin. É esta atribuição que define o que a gestora pode gerir.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { isMissingTableError, gestorNotReadyResponse } from "@/lib/gestor-auth";

function parseBody(body: unknown): { managerId: string; businessId: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { managerId?: unknown; businessId?: unknown };
  if (typeof b.managerId !== "string" || !b.managerId) return null;
  if (typeof b.businessId !== "string" || !b.businessId) return null;
  return { managerId: b.managerId, businessId: b.businessId };
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let parsed: { managerId: string; businessId: string } | null = null;
  try {
    parsed = parseBody(await req.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  try {
    const [manager, business] = await Promise.all([
      svc.from("montra_managers").select("id, email, status").eq("id", parsed.managerId).maybeSingle(),
      svc.from("businesses").select("id, name").eq("id", parsed.businessId).maybeSingle(),
    ]);
    if (!manager.data) return NextResponse.json({ error: "Gestora não encontrada." }, { status: 404 });
    if (manager.data.status === "revoked") return NextResponse.json({ error: "Gestora revogada — não pode receber montras." }, { status: 409 });
    if (!business.data) return NextResponse.json({ error: "Montra não encontrada." }, { status: 404 });
    const { error } = await svc
      .from("business_managers")
      .insert({ business_id: parsed.businessId, manager_id: parsed.managerId, granted_by: auth.email });
    if (error && (error as { code?: string }).code !== "23505") throw error;
    adminLog("manager.grant", { by: auth.email, managerEmail: manager.data.email, businessId: parsed.businessId });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível atribuir a montra." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let parsed: { managerId: string; businessId: string } | null = null;
  try {
    parsed = parseBody(await req.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  try {
    const { error } = await svc
      .from("business_managers")
      .delete()
      .eq("manager_id", parsed.managerId)
      .eq("business_id", parsed.businessId);
    if (error) throw error;
    adminLog("manager.ungrant", { by: auth.email, managerId: parsed.managerId, businessId: parsed.businessId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível retirar a montra." }, { status: 500 });
  }
}
