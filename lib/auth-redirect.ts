/**
 * lib/auth-redirect.ts — A6.5 Parte A (redirects por intenção)
 *
 * Destino pós-auth puro e testável. Regras de intenção:
 *
 *   1. `next` explícito (deep link ou "Tenho um negócio" → next=/onboarding)
 *      VENCE SEMPRE — cobre o fluxo 3 sem parâmetro novo de "intent".
 *   2. Merchant (hasBusiness) → ramo merchant de resolveBusinessCountTarget(1)
 *      ("dashboard") — semântica de lib/visibility.ts preservada, não destruída.
 *   3. Consumidor (sem next, sem businesses) → "/explorar".
 *      NUNCA forçado a /onboarding.
 *
 * Cobertura: tests/a65-intent-redirects.test.ts
 */

import { resolveBusinessCountTarget } from "./visibility.ts";

export interface PostAuthTargetInput {
  /** ?next= do URL de login — intenção explícita (ex.: "/vitrine/x", "/onboarding"). */
  nextPath?: string | null;
  /** O utilizador autenticado possui ≥1 negócio? */
  hasBusiness: boolean;
}

/**
 * Resolve para onde enviar o utilizador logo após login/signup.
 * Pura: sem IO, sem router — testável com node:test.
 */
export function resolvePostAuthTarget({ nextPath, hasBusiness }: PostAuthTargetInput): string {
  const next = (nextPath ?? "").trim();
  if (next) return next;
  if (hasBusiness) return resolveBusinessCountTarget(1); // "dashboard"
  return "/explorar";
}
