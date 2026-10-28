/**
 * lib/admin-pro.ts — Pro ADMINISTRATIVO (cortesia, sem Stripe).
 *
 * Distinção que faltava (correção Cantinho da Lu, 2026-10-28):
 *   * Pro PAGO        → regido pelo Stripe (assinatura ativa). As rotinas
 *     de sincronização (webhook, cancel) podem rebaixar para free quando
 *     a subscrição termina.
 *   * Pro ADMINISTRATIVO → concedido pela admin, cortesia permanente, sem
 *     cobrança e sem assinatura Stripe. NENHUMA rotina Stripe pode
 *     rebaixá-lo enquanto a flag `admin_pro_grant` estiver ativa.
 *
 * O plano continua materializado em `businesses.plan` (todos os leitores
 * existentes continuam a funcionar sem alterações): conceder o Pro
 * administrativo grava plan='pro'; a proteção é NÃO rebaixar.
 *
 * Funções puras — cobertas por tests/admin-pro-grant.test.ts.
 */

import { normalizePlan } from "./plans.ts";

export interface AdminProRow {
  plan?: string | null;
  admin_pro_grant?: boolean | null;
}

/** True quando a Montra tem Pro administrativo ativo. */
export function hasAdminProGrant(b: AdminProRow | null | undefined): boolean {
  return b?.admin_pro_grant === true;
}

/**
 * Uma rotina Stripe (webhook customer.subscription.deleted, cancel) deve
 * SALTAR o rebaixamento para free quando há Pro administrativo.
 * O chamador continua a atualizar os campos Stripe (status, ids) — só o
 * plano é preservado.
 */
export function shouldSkipStripeDowngrade(b: AdminProRow | null | undefined): boolean {
  return hasAdminProGrant(b);
}

export interface AdminProPatchInput {
  /** Valor de admin_pro_grant pedido no PATCH (ausente = não mexer). */
  admin_pro_grant?: boolean;
  /** Valor de plan pedido no PATCH (ausente = não mexer). */
  plan?: string;
}

export interface AdminProPatchResult {
  /** Campos a aplicar na linha (só os que mudam por esta regra). */
  apply: { admin_pro_grant?: boolean; plan?: string; admin_pro_granted_at?: string | null };
  /** Erro de validação (ex.: rebaixar sem revogar a concessão). */
  error?: string;
}

/**
 * Semântica do PATCH admin para a concessão (aplicada no handler ANTES do
 * update, com a linha atual lida da base):
 *   * Conceder (admin_pro_grant=true) sem plan explícito → plan='pro'.
 *   * Conceder com plan explícito → respeita o plan explícito (ex.: business).
 *   * Revogar (admin_pro_grant=false) → só limpa a flag e o carimbo; o
 *     plano fica como está (a admin gere o plano explicitamente).
 *   * Concessão ativa + plan='free' sem revogar → REJEITADO (rebaixamento
 *     silencioso quebraria a promessa da concessão).
 *   * Concessão ativa + plan='pro'/'business' → permitido, flag mantém-se.
 */
export function resolveAdminProPatch(
  current: AdminProRow | null | undefined,
  input: AdminProPatchInput,
  nowIso: string
): AdminProPatchResult {
  const grantActive = hasAdminProGrant(current);
  const wantsGrant = input.admin_pro_grant === true;
  const wantsRevoke = input.admin_pro_grant === false;
  const hasPlan = typeof input.plan === "string";

  if (grantActive && hasPlan && !wantsRevoke && normalizePlan(input.plan) === "free") {
    return {
      apply: {},
      error:
        "Pro administrativo ativo: para rebaixar para free, revogue primeiro a concessão (admin_pro_grant=false) no mesmo pedido.",
    };
  }

  const apply: AdminProPatchResult["apply"] = {};
  if (wantsGrant) {
    apply.admin_pro_grant = true;
    apply.admin_pro_granted_at = nowIso;
    if (!hasPlan) apply.plan = "pro";
  } else if (wantsRevoke) {
    apply.admin_pro_grant = false;
    apply.admin_pro_granted_at = null;
  }
  return { apply };
}
