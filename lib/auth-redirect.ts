/**
 * lib/auth-redirect.ts — A6.5 Parte A (redirects por intenção) + correção pós-login
 *
 * Destino pós-auth puro e testável. Regras de intenção:
 *
 *   1. `next` explícito (deep link ou "Tenho um negócio" → next=/onboarding)
 *      vence — MAS só quando for um caminho interno seguro (isSafeNextPath).
 *      URLs externas, `//`, esquemas e `next=/admin` para não-admin são rejeitados.
 *   2. Admin (veredito server-side via /api/auth/is-admin) → "/admin".
 *   3. Merchant (hasBusiness) → "/dashboard" (ABSOLUTO — antes era "dashboard"
 *      relativo, que quebrava via /auth/callback → /auth/dashboard).
 *   4. Consumidor (sem next válido, sem businesses) → "/explorar".
 *      NUNCA forçado a /onboarding.
 *
 * Cobertura: tests/a65-intent-redirects.test.ts, tests/post-auth-redirect.test.ts
 */

export interface PostAuthTargetInput {
  /** ?next= do URL de login — intenção explícita (ex.: "/vitrine/x", "/onboarding"). */
  nextPath?: string | null;
  /** O utilizador autenticado possui ≥1 negócio? */
  hasBusiness: boolean;
  /**
   * Veredito server-side (GET /api/auth/is-admin). Nunca decidir admin
   * apenas com o email exibido no frontend.
   */
  isAdmin?: boolean;
}

/**
 * Verdadeiro só para caminhos internos seguros:
 * - começa com "/" simples (não "//" = protocol-relative);
 * - sem esquema (http:, javascript:, ...), sem "\" e sem espaços;
 * - mínimo de 2 chars ("/" sozinho não é destino útil).
 */
export function isSafeNextPath(p: string | null | undefined): boolean {
  if (typeof p !== "string") return false;
  const t = p.trim();
  if (t.length < 2) return false;
  if (!t.startsWith("/")) return false;
  if (t.startsWith("//")) return false;
  if (/[\s\\]/.test(t)) return false;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(t)) return false;
  return true;
}

function wantsAdminArea(next: string): boolean {
  return next === "/admin" || next.startsWith("/admin/");
}

/**
 * Resolve para onde enviar o utilizador logo após login/signup.
 * Pura: sem IO, sem router — testável com node:test.
 */
export function resolvePostAuthTarget({
  nextPath,
  hasBusiness,
  isAdmin = false,
}: PostAuthTargetInput): string {
  const next = (nextPath ?? "").trim();

  // next seguro e autorizado vence. /admin só para admin (veredito server-side).
  if (next && isSafeNextPath(next)) {
    if (!wantsAdminArea(next) || isAdmin) return next;
  }

  if (isAdmin) return "/admin";
  if (hasBusiness) return "/dashboard"; // absoluto: router.push relativo quebrava no /auth/callback
  return "/explorar";
}

/**
 * Destino "home" por tipo de conta AUTENTICADA (correção definitiva da
 * navegação — utilizadores autenticados nunca ficam na landing comercial):
 *
 *   admin      → "/admin"
 *   merchant   → "/dashboard"
 *   consumidor → "/explorar"
 *
 * Usado por `/` e `/login` para redirecionar quem já tem sessão.
 * Pura e testável; o veredito admin vem sempre do servidor
 * (GET /api/auth/is-admin), nunca só do email no frontend.
 */
export function resolveHomeTarget({
  hasBusiness,
  isAdmin = false,
}: {
  hasBusiness: boolean;
  isAdmin?: boolean;
}): string {
  return resolvePostAuthTarget({ hasBusiness, isAdmin });
}

/**
 * Veredito admin no cliente via API server-side.
 * Nunca decidir privilégios apenas com o email exibido no frontend.
 */
export async function fetchIsAdminClient(): Promise<boolean> {
  try {
    const r = await fetch("/api/auth/is-admin");
    if (!r.ok) return false;
    const j = await r.json();
    return j?.isAdmin === true;
  } catch {
    return false;
  }
}
