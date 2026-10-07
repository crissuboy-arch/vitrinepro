/**
 * lib/admin-auth.ts — ADMIN-1
 *
 * Helper ÚNICO server-side para autorização administrativa.
 *
 * REGRA FUNDAMENTAL: admin da plataforma ≠ comerciante comum.
 * A admin opera N Montras (10, 100, 50.000+) sem que elas lhe pertençam
 * comercialmente. Ownership (businesses.user_id) e permissão administrativa
 * são conceitos separados.
 *
 * Uso em TODA rota /api/admin/*:
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response; // 401 ou 403
 *   const svc = getServiceClient(); // service_role, SÓ no servidor
 *
 * PROIBIDO:
 * - service_role no browser;
 * - confiar em email vindo do frontend;
 * - operação admin sem sessão;
 * - anon key para CRUD administrativo de terceiros.
 *
 * Respostas: 401 = sem sessão · 403 = autenticado mas não admin.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

const DEFAULT_ADMIN_EMAILS = ["cris.suboy@gmail.com", "geralvitrinepropt@gmail.com"];

/** Allowlist server-side: env ADMIN_EMAILS (vírgula) ou fallback. */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return list;
}

/** Cliente service_role — SÓ no servidor, nunca no browser. */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface AdminAuth {
  ok: boolean;
  response?: NextResponse;
  /** Email do admin autenticado (para audit log). */
  email?: string;
  /** user_id do admin (para audit log). */
  userId?: string;
}

/**
 * Verifica sessão + allowlist. Devolve { ok:true, email, userId }
 * ou { ok:false, response } com 401/403.
 */
export async function requireAdmin(): Promise<AdminAuth> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
      };
    }
    const email = user.email.toLowerCase();
    if (!getAdminEmails().includes(email)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
      };
    }
    return { ok: true, email, userId: user.id };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
}

/** Audit log mínimo server-side (sem segredos). */
export function adminLog(action: string, details: Record<string, unknown>) {
  const safe: Record<string, unknown> = { ...details };
  // Nunca registar segredos mesmo que passados por engano.
  for (const k of Object.keys(safe)) {
    if (/token|secret|password|key|credential/i.test(k)) delete safe[k];
  }
  console.log(
    JSON.stringify({
      scope: "admin",
      action,
      ts: new Date().toISOString(),
      ...safe,
    })
  );
}
