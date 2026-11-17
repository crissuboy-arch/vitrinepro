/**
 * lib/gestor-auth.ts — GESTOR DE MONTRAS
 *
 * Identidade e autorização da gestora de montras (ex.: Atena).
 * Dois caminhos de identidade, ambos resolvidos para a mesma linha em
 * `montra_managers` (convidada por email pela proprietária):
 *
 *   1. Sessão web: utilizador autenticado cujo email tem convite
 *      'active' (aceite via /api/gestor/accept).
 *   2. Chave de API: `Authorization: Bearer vpg_<64 hex>` — para a
 *      gestora operar como agente. Só o hash SHA-256 vive na BD.
 *
 * O gestor só gere as montras atribuídas em `business_managers`
 * (ou criadas por si). NÃO acede a pagamentos, administradores nem
 * configurações críticas — essas rotas continuam requireAdmin().
 *
 * Todas as leituras/escritas usam o service client (tabelas com RLS
 * ativa e zero policies). Se as tabelas ainda não existirem
 * (migration por aplicar), as rotas respondem 503 "a ser ativado".
 */
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/admin-auth";
import {
  MANAGER_KEY_PREFIX,
  hashManagerKey,
  generateManagerKey,
  isValidManagerEmail,
  normalizeManagerEmail,
} from "@/lib/gestor-keys";

export { MANAGER_KEY_PREFIX, hashManagerKey, generateManagerKey, isValidManagerEmail, normalizeManagerEmail };

export interface GestorIdentity {
  managerId: string;
  email: string;
  userId: string | null;
  via: "session" | "api_key";
}

/** Erro típico de tabela inexistente (migration por aplicar). */
export function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === "PGRST205" ||
    e.code === "42P01" ||
    /relation .* does not exist/i.test(e.message ?? "") ||
    /Could not find the table/i.test(e.message ?? "")
  );
}

export function gestorNotReadyResponse() {
  return NextResponse.json(
    { error: "Gestor de Montras ainda não está ativo. Aplica primeiro a migration 20261117000026." },
    { status: 503 }
  );
}

type Svc = NonNullable<ReturnType<typeof getServiceClient>>;

/**
 * Resolve a identidade de gestora a partir do pedido (chave API ou
 * sessão). Devolve null quando não há identidade de gestora válida.
 * Lança/propaga erros de BD para as rotas distinguirem 503.
 */
export async function resolveGestor(req: Request): Promise<GestorIdentity | null> {
  const svc = getServiceClient();
  if (!svc) return null;

  // 1) Chave de API (agente)
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (bearer.startsWith(MANAGER_KEY_PREFIX)) {
    const { data: keyRow, error } = await svc
      .from("manager_api_keys")
      .select("id, manager_id, revoked_at")
      .eq("key_hash", hashManagerKey(bearer))
      .maybeSingle();
    if (error) throw error;
    if (!keyRow || keyRow.revoked_at) return null;
    const { data: manager, error: mErr } = await svc
      .from("montra_managers")
      .select("id, email, user_id, status")
      .eq("id", keyRow.manager_id)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!manager || manager.status !== "active") return null;
    // last_used_at é best-effort (não bloqueia o pedido).
    void svc
      .from("manager_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id)
      .then(() => undefined, () => undefined);
    return { managerId: manager.id, email: manager.email, userId: manager.user_id, via: "api_key" };
  }

  // 2) Sessão web
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    const email = normalizeManagerEmail(user.email);
    const { data: manager, error } = await svc
      .from("montra_managers")
      .select("id, email, user_id, status")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    if (!manager || manager.status !== "active") return null;
    return { managerId: manager.id, email: manager.email, userId: manager.user_id, via: "session" };
  } catch (err) {
    if (isMissingTableError(err)) throw err;
    return null;
  }
}

export interface GestorAuth {
  ok: boolean;
  gestor?: GestorIdentity;
  svc?: Svc;
  response?: NextResponse;
}

/** Como requireAdmin, mas para a gestora: 401 sem identidade, 403 sem convite ativo, 503 sem migration. */
export async function requireGestor(req: Request): Promise<GestorAuth> {
  const svc = getServiceClient();
  if (!svc) return { ok: false, response: gestorNotReadyResponse() };
  try {
    const gestor = await resolveGestor(req);
    if (!gestor) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Acesso de Gestor de Montras necessário (convite ativo ou chave de API)." },
          { status: 403 }
        ),
      };
    }
    return { ok: true, gestor, svc };
  } catch (err) {
    if (isMissingTableError(err)) return { ok: false, response: gestorNotReadyResponse() };
    return {
      ok: false,
      response: NextResponse.json({ error: "Não foi possível verificar o acesso." }, { status: 500 }),
    };
  }
}

/** A gestora pode gerir esta montra? (atribuição explícita em business_managers) */
export async function canManageBusiness(svc: Svc, managerId: string, businessId: string): Promise<boolean> {
  const { data, error } = await svc
    .from("business_managers")
    .select("business_id")
    .eq("manager_id", managerId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Registo de ações da gestora (sem segredos — mesma higiene do adminLog). */
export async function gestorAudit(
  svc: Svc,
  entry: { managerId: string | null; email: string | null; action: string; businessId?: string | null; details?: Record<string, unknown> }
): Promise<void> {
  const safe: Record<string, unknown> = { ...(entry.details ?? {}) };
  for (const k of Object.keys(safe)) {
    if (/token|secret|password|key|credential/i.test(k)) delete safe[k];
  }
  try {
    await svc.from("manager_audit_log").insert({
      manager_id: entry.managerId,
      manager_email: entry.email,
      action: entry.action,
      business_id: entry.businessId ?? null,
      details: safe,
    });
  } catch {
    // Auditoria nunca bloqueia a operação principal.
  }
}

/**
 * user_id da conta proprietária (primeiro email da allowlist de admin),
 * usado como dono técnico das montras criadas por uma gestora sem
 * conta própria vinculada. A gestão fica delegada via business_managers
 * e a transferência para o cliente faz-se pelo handover existente.
 */
export async function getPlatformOwnerUserId(svc: Svc, ownerEmail: string): Promise<string | null> {
  try {
    const { data, error } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return null;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === ownerEmail.toLowerCase());
    return found?.id ?? null;
  } catch {
    return null;
  }
}
