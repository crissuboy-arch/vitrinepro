/**
 * lib/ai/provider.ts — A8 "Pergunte à Vitrine"
 *
 * Abstração de provider de IA. A lógica da A8 NÃO fica acoplada a
 * OpenAI, Anthropic ou outro fornecedor específico.
 *
 * REGRA FUNDAMENTAL: a IA interpreta intenção e compõe texto.
 * A BUSCA é sempre a Intelligence Layer A7 (dados reais).
 * A IA nunca inventa estabelecimento, produto, preço ou disponibilidade.
 */
import type { VitrineIntent, VitrineResult } from "../intelligence/types";

export interface IntentContext {
  /** Cidade explícita (ex.: da sessão ou perfil). */
  city?: string | null;
  /** Localização com consentimento (Perto de Mim). */
  latitude?: number | null;
  longitude?: number | null;
}

export interface AIProvider {
  readonly name: string;
  /** Disponível? (ex.: tem API key configurada) */
  readonly available: boolean;
  /**
   * Interpreta linguagem natural → VitrineIntent parcial.
   * Deve extrair: query, category, maxPrice/minPrice, neededToday, city.
   * NUNCA deve inventar dados — só estruturar o que o usuário disse.
   */
  interpretIntent(message: string, ctx: IntentContext): Promise<Partial<VitrineIntent>>;
  /**
   * Compõe resposta textual a partir de resultados REAIS da A7.
   * O provider recebe SÓ os resultados — não tem acesso ao catálogo.
   * Se results vazio → mensagem honesta de zero results.
   */
  composeAnswer(
    message: string,
    intent: VitrineIntent,
    results: VitrineResult[]
  ): Promise<string>;
}
