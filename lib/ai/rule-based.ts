/**
 * lib/ai/rule-based.ts — A8
 *
 * Provider SEM IA (fallback seguro). Extrai intenção por regras simples
 * em pt-PT. Usado quando nenhum provider de IA está configurado ou falha.
 *
 * Extrai:
 * - query: mensagem limpa (sem stopwords de intenção)
 * - maxPrice: "até X euros", "até €X", "X euros"
 * - neededToday: "hoje", "preciso hoje", "para hoje", "ainda hoje"
 * - city: "em <Cidade>" (lista de cidades conhecidas)
 * - nearby: "perto de mim", "próximo", "perto"
 * - category: palavras-chave de categoria
 */
import type { VitrineIntent } from "../intelligence/types";
import type { AIProvider, IntentContext } from "./provider";

const CATEGORY_KEYWORDS: Array<{ words: string[]; category: string }> = [
  { words: ["comer", "comida", "restaurante", "lanche", "coxinha", "bolo", "pastel", "pizza", "hamburguer", "almoço", "jantar", "café", "doce", "salgado"], category: "Alimentação" },
  { words: ["manicure", "pedicure", "cabelo", "cabeleireiro", "barbearia", "estética", "massagem", "unha"], category: "Beleza" },
  { words: ["presente", "prenda", "aniversário"], category: "Presentes" },
  { words: ["decoração", "decoracao", "festa"], category: "Decoração" },
  { words: ["roupa", "vestido", "camisa", "moda"], category: "Moda" },
  { words: ["carro", "mecânico", "oficina"], category: "Automóvel" },
];

const KNOWN_CITIES = [
  "águeda", "agueda", "aveiro", "coimbra", "porto", "lisboa", "braga",
  "viseu", "leiria", "santarém", "santarem", "faro", "setúbal", "setubal",
];

function extractPrice(msg: string): number | null {
  const m = msg.match(/at[ée]?\s*(?:€\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?/i)
    || msg.match(/(?:€\s*)(\d+(?:[.,]\d{1,2})?)/)
    || msg.match(/(\d+(?:[.,]\d{1,2})?)\s*euros?/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return isFinite(v) && v > 0 && v < 100000 ? v : null;
}

function extractCity(msg: string): string | null {
  const low = msg.toLowerCase();
  for (const c of KNOWN_CITIES) {
    if (low.includes(`em ${c}`) || low.includes(`na ${c}`) || low.includes(`no ${c}`)) {
      return c.charAt(0).toUpperCase() + c.slice(1);
    }
  }
  return null;
}

export class RuleBasedProvider implements AIProvider {
  readonly name = "rule-based";
  readonly available = true;

  async interpretIntent(message: string, ctx: IntentContext): Promise<Partial<VitrineIntent>> {
    const low = message.toLowerCase();
    const intent: Partial<VitrineIntent> = {};

    // Query: remove marcadores de intenção, mantém o essencial.
    let query = message
      .replace(/quero|preciso|tem|há|onde encontro|procuro|gostaria/gi, " ")
      .replace(/perto de mim|próximo de mim|aqui perto/gi, " ")
      .replace(/para hoje|hoje|ainda hoje/gi, " ")
      .replace(/at[ée]?\s*€?\s*\d+(?:[.,]\d{1,2})?\s*(?:€|euros?)?/gi, " ")
      .replace(/€\s*\d+(?:[.,]\d{1,2})?/g, " ")
      .replace(/\d+(?:[.,]\d{1,2})?\s*euros?/gi, " ")
      .replace(/em\s+\w+|na\s+\w+|no\s+\w+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    intent.query = query.slice(0, 200);

    const price = extractPrice(message);
    if (price != null) intent.maxPrice = price;

    if (/\bhoje\b|preciso hoje|para hoje|ainda hoje/i.test(message)) {
      intent.neededToday = true;
    }

    if (/perto de mim|pr[óo]ximo|aqui perto/i.test(message)) {
      if (ctx.latitude != null && ctx.longitude != null) {
        intent.latitude = ctx.latitude;
        intent.longitude = ctx.longitude;
        intent.radiusKm = 10;
      }
    }

    const city = extractCity(message) || ctx.city || null;
    if (city) intent.city = city;

    for (const ck of CATEGORY_KEYWORDS) {
      if (ck.words.some((w) => low.includes(w))) {
        intent.category = ck.category;
        break;
      }
    }

    return intent;
  }

  async composeAnswer(
    _message: string,
    intent: VitrineIntent,
    results: import("../intelligence/types").VitrineResult[]
  ): Promise<string> {
    if (results.length === 0) {
      return "Não encontrei isso na Vitrine agora. Tente aumentar a distância ou pesquisar outro termo.";
    }
    const n = results.length;
    return `Encontrei ${n} ${n === 1 ? "opção" : "opções"} na Vitrine para "${intent.query}".`;
  }
}
