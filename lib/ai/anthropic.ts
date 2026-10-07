/**
 * lib/ai/anthropic.ts — A8
 *
 * Provider Anthropic (reutiliza ANTHROPIC_API_KEY existente, server-side).
 *
 * ANTI-HALLUCINATION por arquitetura:
 * 1. interpretIntent: o modelo recebe SÓ a mensagem + contexto. Retorna JSON
 *    com VitrineIntent parcial. System prompt proíbe inventar dados.
 * 2. composeAnswer: o modelo recebe SÓ os resultados da A7 (id, nome, preço,
 *    negócio). System prompt: responder APENAS com base nesses resultados;
 *    se vazio, mensagem honesta. O texto final NUNCA vira fonte de verdade —
 *    os cards vêm dos IDs da A7, não do texto do modelo.
 */
import type { VitrineIntent, VitrineResult } from "../intelligence/types";
import type { AIProvider, IntentContext } from "./provider";

const MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 15000;

const INTENT_SYSTEM = `És um extrator de intenção para a VitrinePro, diretório de negócios locais em Portugal.
Recebes uma mensagem do consumidor e devolves APENAS JSON válido, sem markdown:
{"query": string, "maxPrice": number|null, "minPrice": number|null, "neededToday": boolean, "city": string|null, "nearby": boolean}
Regras:
- query: o que a pessoa procura, sem "quero", "preciso", "perto de mim", preços ou cidades.
- category: NUNCA extrair (deixa null) — a busca textual já encontra a categoria real.
- maxPrice: número em euros se mencionar "até X euros/€X"; senão null.
- neededToday: true se mencionar hoje/para hoje/ainda hoje.
- city: cidade mencionada ("em Águeda"); senão null.
- nearby: true se disser "perto de mim/próximo".
NUNCA inventes valores. Se não houver informação, usa null/false.`;

const ANSWER_SYSTEM = `És a assistente "Pergunte à Vitrine" da VitrinePro.
Recebes resultados REAIS da plataforma (nome, preço, negócio). Regras absolutas:
- Fala APENAS dos resultados fornecidos. NUNCA inventes negócios, produtos, preços, endereços ou horários.
- Se a lista estiver vazia, diz honestamente que não encontraste e sugere tentar outro termo ou aumentar a distância.
- Resposta curta (1-2 frases) em pt-PT. Os detalhes (imagem, preço, botões) vêm dos cards, não do teu texto.`;

async function callAnthropic(system: string, userMsg: string, apiKey: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system,
        messages: [{ role: "user", content: userMsg.slice(0, 1000) }],
      }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}`);
    const j = await r.json();
    const text = j?.content?.map((b: any) => b.text || "").join("") || "";
    return text;
  } finally {
    clearTimeout(t);
  }
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  get available(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  private key(): string {
    const k = process.env.ANTHROPIC_API_KEY;
    if (!k) throw new Error("ANTHROPIC_API_KEY ausente");
    return k;
  }

  async interpretIntent(message: string, ctx: IntentContext): Promise<Partial<VitrineIntent>> {
    const raw = await callAnthropic(INTENT_SYSTEM, message, this.key());
    let parsed: Record<string, unknown> = {};
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      }
    } catch {
      // fallback: devolve parcial vazio, a camada usa a query bruta
    }
    const intent: Partial<VitrineIntent> = {
      query: String(parsed.query || message).slice(0, 200),
    };
    // A9: category NUNCA extraída pela IA — nomes reais variam ("Restaurantes" vs
    // "Alimentação"). A busca textual da A7 já encontra pela categoria real.
    if (typeof parsed.maxPrice === "number" && isFinite(parsed.maxPrice)) intent.maxPrice = parsed.maxPrice;
    if (typeof parsed.minPrice === "number" && isFinite(parsed.minPrice)) intent.minPrice = parsed.minPrice;
    if (parsed.neededToday === true) intent.neededToday = true;
    const city = (parsed.city as string) || ctx.city || null;
    if (city) intent.city = city;
    if (parsed.nearby === true && ctx.latitude != null && ctx.longitude != null) {
      intent.latitude = ctx.latitude;
      intent.longitude = ctx.longitude;
      intent.radiusKm = 10;
    }
    return intent;
  }

  async composeAnswer(
    _message: string,
    intent: VitrineIntent,
    results: VitrineResult[]
  ): Promise<string> {
    if (results.length === 0) {
      return "Não encontrei isso na Vitrine agora. Tente aumentar a distância ou pesquisar outro termo.";
    }
    // O modelo recebe SÓ os resultados reais (sem catálogo, sem segredos).
    const summary = results.slice(0, 8).map((r) => ({
      nome: r.name,
      tipo: r.type,
      preco: r.price,
      negocio: r.type === "business" ? r.name : undefined,
      cidade: r.city,
    }));
    try {
      const text = await callAnthropic(
        ANSWER_SYSTEM,
        `Pedido: "${intent.query}". Resultados reais: ${JSON.stringify(summary)}`,
        this.key()
      );
      return text.trim().slice(0, 500) || `${results.length} opções encontradas na Vitrine.`;
    } catch {
      return `Encontrei ${results.length} ${results.length === 1 ? "opção" : "opções"} na Vitrine.`;
    }
  }
}
