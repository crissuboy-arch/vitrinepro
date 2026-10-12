/**
 * lib/ai/openrouter-chat.ts — Chatbot das Montras via OpenRouter
 *
 * Substitui a chamada direta à Anthropic em app/api/chat/route.ts.
 *
 * REGRAS:
 *  - Modelo FIXO em código (OPENROUTER_CHAT_MODEL). Nenhuma seleção
 *    automática de modelo — nunca escolhe um modelo caro sozinho.
 *  - Chave lida SOMENTE do servidor (process.env.OPENROUTER_API_KEY).
 *    Nunca exposta ao cliente.
 *  - Privacidade: `provider.data_collection = "deny"` — a OpenRouter só
 *    encaminha para fornecedores que não recolhem dados do utilizador
 *    (ver docs de provider routing da OpenRouter).
 *  - Sem SDK: fetch direto para /api/v1/chat/completions (formato OpenAI).
 *  - Contrato igual ao anterior: devolve string | null; nunca lança para
 *    o chamador (a rota decide o fallback determinístico).
 */

export const OPENROUTER_CHAT_MODEL = "google/gemini-2.5-flash-lite";
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_TIMEOUT_MS = 30_000;
export const OPENROUTER_MAX_TOKENS = 1024;

export interface OpenRouterChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Chave apenas no servidor. Null quando não configurada. */
export function getOpenRouterKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY;
  return key && key.trim() ? key.trim() : null;
}

export async function callOpenRouterChat(
  system: string,
  history: OpenRouterChatMessage[],
  message: string,
  referer: string
): Promise<string | null> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "VitrinePro Chatbot",
      },
      body: JSON.stringify({
        // Modelo fixo — sem seleção automática.
        model: OPENROUTER_CHAT_MODEL,
        max_tokens: OPENROUTER_MAX_TOKENS,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: message },
        ],
        provider: {
          // Só fornecedores que NÃO recolhem dados do utilizador.
          data_collection: "deny",
        },
      }),
    });

    if (!response.ok) {
      // Log só do status — nunca do corpo (pode conter detalhe sensível).
      console.error(`[CHAT API] OpenRouter respondeu com status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.length > 0 ? text : null;
  } catch (err) {
    console.error(
      "[CHAT API] Falha ao contactar OpenRouter:",
      err instanceof Error ? err.message : "desconhecido"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
