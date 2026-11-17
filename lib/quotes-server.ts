/**
 * lib/quotes-server.ts — Fase 2 "Pedidos de Orçamento" (só servidor).
 *
 * Centraliza o que NUNCA pode ir para o browser:
 * - geração e hash (SHA-256) dos tokens privados de acompanhamento;
 * - deteção de "tabelas ainda não existem" (migration por aplicar) para
 *   degradação graciosa das páginas;
 * - autenticação de utilizadores nas rotas de interesses (sessão cookie
 *   ou Bearer), espelhando o padrão de app/api/analytics.
 */
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/admin-auth";

export { getServiceClient };
export { generateTrackingToken, hashTrackingToken } from "@/lib/quotes-token";

/** A migration 20261117000025 ainda não foi aplicada a esta BD? */
export function isQuotesTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("quote_requests") ||
    msg.includes("quote_interests") ||
    msg.includes("quote_request_contacts")
  ) && (msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("not found"));
}

/** Utilizador autenticado (cookie ou Bearer) — padrão de /api/analytics. */
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user.id;
  } catch {
    // segue para Bearer
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const svc = getServiceClient();
    if (svc) {
      const { data } = await svc.auth.getUser(token);
      if (data?.user) return data.user.id;
    }
  }
  return null;
}
