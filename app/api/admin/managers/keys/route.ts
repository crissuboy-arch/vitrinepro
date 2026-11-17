/**
 * /api/admin/managers/keys — chaves de API da gestora (identidade de
 * agente, ex.: Atena). SÓ admin. A chave em claro é devolvida UMA vez
 * na criação; na BD vive apenas o hash SHA-256.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { generateManagerKey, isMissingTableError, gestorNotReadyResponse } from "@/lib/gestor-auth";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let body: { managerId?: unknown; label?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.managerId !== "string" || !body.managerId) {
    return NextResponse.json({ error: "Gestora em falta." }, { status: 400 });
  }
  const label = typeof body.label === "string" ? body.label.slice(0, 80) : null;
  try {
    const { data: manager } = await svc
      .from("montra_managers")
      .select("id, email, status")
      .eq("id", body.managerId)
      .maybeSingle();
    if (!manager) return NextResponse.json({ error: "Gestora não encontrada." }, { status: 404 });
    if (manager.status !== "active") {
      return NextResponse.json(
        { error: "A gestora ainda não está ativa — a chave só pode ser criada depois do aceite do convite." },
        { status: 409 }
      );
    }
    const { plain, hash } = generateManagerKey();
    const { data, error } = await svc
      .from("manager_api_keys")
      .insert({ manager_id: manager.id, key_hash: hash, label })
      .select("id, label, created_at")
      .single();
    if (error) throw error;
    adminLog("manager.key.create", { by: auth.email, managerEmail: manager.email, keyId: data.id });
    // `key` em claro — mostrar UMA vez à proprietária, nunca guardar.
    return NextResponse.json({ key: plain, keyMeta: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível criar a chave." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let body: { keyId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.keyId !== "string" || !body.keyId) {
    return NextResponse.json({ error: "Chave em falta." }, { status: 400 });
  }
  try {
    const { data, error } = await svc
      .from("manager_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", body.keyId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Chave não encontrada ou já revogada." }, { status: 404 });
    adminLog("manager.key.revoke", { by: auth.email, keyId: body.keyId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível revogar a chave." }, { status: 500 });
  }
}
