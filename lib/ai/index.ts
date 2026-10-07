/**
 * lib/ai/index.ts — A8
 * Re-export + seleção de provider.
 */
export type { AIProvider, IntentContext } from "./provider";
export { RuleBasedProvider } from "./rule-based";
export { AnthropicProvider } from "./anthropic";
import { RuleBasedProvider } from "./rule-based";
import { AnthropicProvider } from "./anthropic";
import type { AIProvider } from "./provider";

/**
 * Provider ativo: Anthropic se configurado, senão rule-based (sempre seguro).
 * A experiência NUNCA quebra por falta de IA.
 */
export function getProvider(): AIProvider {
  const anthropic = new AnthropicProvider();
  if (anthropic.available) return anthropic;
  return new RuleBasedProvider();
}
