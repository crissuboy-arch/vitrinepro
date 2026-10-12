/**
 * lib/owner-entitlement.ts — Entitlement da proprietária da plataforma
 *
 * CONCEITOS SEPARADOS (brief A10.6):
 * - ADMIN  = autorização de sistema (allowlist ADMIN_EMAILS, lib/admin-auth.ts).
 * - OWNER  = proprietária da plataforma (allowlist PLATFORM_OWNER_EMAILS,
 *            MAIS ESTREITA que admin — não transforma todo admin em owner).
 * - BUSINESS = plano comercial (Stripe). A owner NÃO precisa comprar
 *            assinatura da própria plataforma.
 *
 * MECANISMO: entitlement EFETIVO, calculado no servidor, NUNCA gravado.
 * - Não altera business.plan (o trigger anti-escalação continua intacto).
 * - Não depende de email no frontend (verificação sempre server-side).
 * - Não usa localStorage, não expõe service_role ao browser.
 * - Utilizadores comuns nunca obtêm Business por este caminho: a condição
 *   exige (a) email na allowlist de owner E (b) ownership da Montra.
 *
 * Uso:
 * - Rotas autenticadas (dono age na PRÓPRIA Montra):
 *     effectivePlanId(biz.plan, isOwnerEmail(session.user.email))
 * - Rotas anónimas (ex.: /api/chat — o visitante não é o dono):
 *     const ownerIds = await getOwnerUserIds();
 *     effectivePlanId(biz.plan, ownerIds.includes(biz.user_id))
 */

import { normalizePlan, type PlanId } from "./plans.ts";
// admin-auth é importado dinamicamente (só no servidor, só quando preciso)
// para este módulo continuar importável em testes sem o alias @/.

const DEFAULT_OWNER_EMAILS = ["cris.suboy@gmail.com"];

/** Allowlist da proprietária — env PLATFORM_OWNER_EMAILS ou fallback. */
export function getOwnerEmails(): string[] {
  const raw = process.env.PLATFORM_OWNER_EMAILS;
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_OWNER_EMAILS;
  return list.map((e) => e.toLowerCase());
}

/** Email pertence à proprietária? (chamadas autenticadas) */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getOwnerEmails().includes(email.toLowerCase());
}

// Cache em memória (por instância) dos user_ids da owner — evita
// listUsers() a cada pedido. TTL curto: 5 minutos.
let ownerIdsCache: { ids: string[]; at: number } | null = null;
const OWNER_IDS_TTL_MS = 5 * 60_000;

/** user_ids da proprietária (via service_role, SÓ no servidor). */
export async function getOwnerUserIds(): Promise<string[]> {
  const now = Date.now();
  if (ownerIdsCache && now - ownerIdsCache.at < OWNER_IDS_TTL_MS) {
    return ownerIdsCache.ids;
  }
  const { getServiceClient } = await import("./admin-auth.ts");
  const svc = getServiceClient();
  if (!svc) return [];
  const emails = getOwnerEmails();
  const { data } = await svc.auth.admin.listUsers();
  const ids = (data?.users || [])
    .filter((u) => u.email && emails.includes(u.email.toLowerCase()))
    .map((u) => u.id);
  ownerIdsCache = { ids, at: now };
  return ids;
}

/** Limpa o cache (testes). */
export function __resetOwnerIdsCacheForTests(): void {
  ownerIdsCache = null;
}

/**
 * Plano EFETIVO para gates server-side.
 * Montra da proprietária → "business" (sem Stripe, sem alterar o plano
 * gravado). Qualquer outra Montra → plano normalizado do banco.
 */
export function effectivePlanId(
  storedPlan: string | null | undefined,
  isOwnerBusiness: boolean
): PlanId {
  if (isOwnerBusiness) return "business";
  return normalizePlan(storedPlan);
}
