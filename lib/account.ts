/**
 * lib/account.ts — Helpers da área da conta (consumidor/comerciante).
 *
 * Regra de produto: NÃO há "tipo de conta" rígido. Ter uma business é uma
 * capacidade adicional da mesma conta. Consumidor = 0 businesses;
 * comerciante = ≥1 business (mantém tudo do consumidor + gestão).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Nº de businesses do utilizador (query leve, só conta). */
export async function getBusinessCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count ?? 0;
}

/** true quando a conta é de comerciante (≥1 business). */
export function isMerchant(businessCount: number): boolean {
  return businessCount > 0;
}
