/**
 * lib/quotes-token.ts — Fase 2 (só servidor, só node:crypto).
 * Separado de lib/quotes.ts (isomórfico) porque node:crypto não pode
 * entrar em bundles de browser.
 */
import { createHash, randomBytes } from "node:crypto";

/** Token privado: 32 bytes aleatórios em hex (64 caracteres). */
export function generateTrackingToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash guardado na BD — o token em claro nunca é persistido. */
export function hashTrackingToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
