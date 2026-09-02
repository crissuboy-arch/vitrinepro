// Camada de analytics do módulo "Botões & Links".
//
// Fase 1: os cliques na vitrine pública ainda NÃO estão ligados (a integração
// na /vitrine/[slug] é a Fase 6). Esta camada fica pronta e tipada para esse
// momento — a assinatura já aceita todo o contexto pedido (business_id,
// button_id, tipo, timestamp, referrer, dispositivo), mesmo que o
// armazenamento de hoje seja mínimo.
//
// Armazenamento (sem tabela nova):
//   1. page_buttons.click_count           → total por botão   (RPC increment_button_click)
//   2. business_analytics (button_click)  → agregado no dashboard (via /api/analytics)
//
// FUTURO: se for preciso breakdown por botão × fonte × dispositivo × série
// temporal, criar então public.button_click_events e alimentá-la aqui.

import { supabase } from "@/app/lib/supabase";
import type { ButtonType } from "@/types/buttons";

export type ClickDevice = "mobile" | "tablet" | "desktop" | "unknown";

export interface ButtonClickPayload {
  businessId: string;
  buttonId: string;
  type: ButtonType;
  /** ISO string; default = agora. */
  occurredAt?: string;
  referrer?: string | null;
  device?: ClickDevice;
}

/** Deteta o tipo de dispositivo a partir do viewport (client-side). */
export function detectDevice(): ClickDevice {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function currentReferrer(): string | null {
  if (typeof document === "undefined") return null;
  return document.referrer || null;
}

/**
 * Regista um clique num botão. Nunca lança — analytics não deve quebrar a UX.
 * @param opts.aggregate  também emitir o evento agregado em business_analytics (default true)
 */
export async function recordButtonClick(
  payload: ButtonClickPayload,
  opts: { aggregate?: boolean } = {},
): Promise<void> {
  const { aggregate = true } = opts;

  try {
    await supabase.rpc("increment_button_click", {
      p_button_id: payload.buttonId,
    });
  } catch {
    // silencioso
  }

  if (!aggregate) return;

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: payload.businessId,
        event_type: "button_click",
      }),
      keepalive: true,
    });
  } catch {
    // silencioso
  }
}
