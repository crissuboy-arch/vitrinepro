/**
 * lib/gestor-keys.ts — funções puras do Gestor de Montras.
 * Sem dependências de Next/Supabase para serem testáveis diretamente
 * (tests/gestor-keys.test.ts). A lógica de sessão/BD vive em
 * lib/gestor-auth.ts.
 */
import { createHash, randomBytes } from "node:crypto";

export const MANAGER_KEY_PREFIX = "vpg_";

/** SHA-256 hex — é isto que vive na BD (manager_api_keys.key_hash). */
export function hashManagerKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** Gera uma chave nova: valor em claro (mostrar UMA vez) + hash. */
export function generateManagerKey(): { plain: string; hash: string } {
  const plain = MANAGER_KEY_PREFIX + randomBytes(32).toString("hex");
  return { plain, hash: hashManagerKey(plain) };
}

export function isManagerKeyFormat(value: unknown): value is string {
  return typeof value === "string" && /^vpg_[0-9a-f]{64}$/.test(value);
}

export function isValidManagerEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) &&
    email.trim().length <= 254
  );
}

export function normalizeManagerEmail(email: string): string {
  return email.trim().toLowerCase();
}
