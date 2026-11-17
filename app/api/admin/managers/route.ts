/**
 * /api/admin/managers — convites e estado das Gestoras de Montras.
 * SÓ admin (requireAdmin). A proprietária convida por email; ninguém
 * inventa emails nem cria contas. Revogar corta sessão E chaves API.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { isValidManagerEmail, normalizeManagerEmail, isMissingTableError, gestorNotReadyResponse } from "@/lib/gestor-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  try {
    const [managers, grants, keys, businesses] = await Promise.all([
      svc.from("montra_managers").select("id, email, user_id, status, invited_by, created_at, accepted_at").order("created_at", { ascending: true }),
      svc.from("business_managers").select("business_id, manager_id, granted_by, created_at"),
      svc.from("manager_api_keys").select("id, manager_id, label, created_at, last_used_at, revoked_at").order("created_at", { ascending: false }),
      svc.from("businesses").select("id, name, city, category, published").order("name", { ascending: true }).limit(500),
    ]);
    if (managers.error) throw managers.error;
    return NextResponse.json({
      managers: managers.data ?? [],
      grants: grants.data ?? [],
      keys: keys.data ?? [],
      businesses: businesses.data ?? [],
    });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar as gestoras." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!isValidManagerEmail(body.email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  const email = normalizeManagerEmail(body.email);
  try {
    // Se já existir uma conta VitrinePro com este email, vincula já o
    // user_id (a ativação continua a exigir o aceite da gestora).
    let userId: string | null = null;
    const { data: users } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = users?.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (found) userId = found.id;

    const { data, error } = await svc
      .from("montra_managers")
      .insert({ email, user_id: userId, status: "invited", invited_by: auth.email })
      .select("id, email, user_id, status, created_at")
      .single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Já existe um convite para este email." }, { status: 409 });
      }
      throw error;
    }
    adminLog("manager.invite", { by: auth.email, managerEmail: email, bound: !!userId });
    return NextResponse.json({ manager: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível criar o convite." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Identificador em falta." }, { status: 400 });
  }
  try {
    const { data, error } = await svc
      .from("montra_managers")
      .update({ status: "revoked" })
      .eq("id", body.id)
      .select("id, email, status")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Gestora não encontrada." }, { status: 404 });
    // Revogar também corta todas as chaves de API da gestora.
    await svc.from("manager_api_keys").update({ revoked_at: new Date().toISOString() }).eq("manager_id", body.id).is("revoked_at", null);
    adminLog("manager.revoke", { by: auth.email, managerEmail: data.email });
    return NextResponse.json({ manager: data });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível revogar." }, { status: 500 });
  }
}
