/**
 * tests/ask-vitrine.test.ts — A8
 *
 * Testes de segurança e contrato do "Pergunte à Vitrine".
 * Análise estática + testes do provider rule-based.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dirname, "..", p), "utf8");

describe("AUDITORIA IA EXISTENTE", () => {
  it("/api/chat do comerciante preservado", () => {
    const src = read("app/api/chat/route.ts");
    assert.ok(src.includes("planHasChatbot"), "chat do comerciante intacto");
  });
  it("A8 usa rota separada /api/vitrine/ask", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("searchIntelligence"), "integra A7");
  });
});

describe("PROVIDER", () => {
  it("abstração AIProvider existe", () => {
    const src = read("lib/ai/provider.ts");
    assert.ok(src.includes("interface AIProvider"), "interface definida");
    assert.ok(src.includes("interpretIntent"), "interpretIntent");
    assert.ok(src.includes("composeAnswer"), "composeAnswer");
  });
  it("Anthropic usa ANTHROPIC_API_KEY server-side", () => {
    const src = read("lib/ai/anthropic.ts");
    assert.ok(src.includes("process.env.ANTHROPIC_API_KEY"), "env server-side");
    assert.ok(!src.includes("NEXT_PUBLIC"), "sem chave pública");
  });
  it("getProvider tem fallback sem IA", () => {
    const src = read("lib/ai/index.ts");
    assert.ok(src.includes("RuleBasedProvider"), "fallback rule-based");
  });
});

describe("INTERPRETAÇÃO DE INTENT", () => {
  it("rule-based extrai maxPrice", async () => {
    const { RuleBasedProvider } = await import("../lib/ai/rule-based.ts");
    const p = new RuleBasedProvider();
    const intent = await p.interpretIntent("coxinha até 5 euros", {});
    assert.strictEqual(intent.maxPrice, 5, "preço extraído");
  });
  it("rule-based detecta neededToday", async () => {
    const { RuleBasedProvider } = await import("../lib/ai/rule-based.ts");
    const p = new RuleBasedProvider();
    const intent = await p.interpretIntent("preciso de almoço hoje", {});
    assert.strictEqual(intent.neededToday, true);
  });
  it("rule-based detecta cidade", async () => {
    const { RuleBasedProvider } = await import("../lib/ai/rule-based.ts");
    const p = new RuleBasedProvider();
    const intent = await p.interpretIntent("bolo em Águeda", {});
    assert.ok(intent.city?.toLowerCase().includes("gueda"), "cidade extraída");
  });
});

describe("A7 INTEGRATION", () => {
  it("endpoint chama searchIntelligence", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("searchIntelligence(intent, data"), "A7 como fonte de verdade");
  });
  it("resultados vêm com IDs reais (cards, não texto)", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("business_id"), "IDs preservados");
  });
});

describe("ZERO RESULTS", () => {
  it("composeAnswer honesto quando vazio", async () => {
    const { RuleBasedProvider } = await import("../lib/ai/rule-based.ts");
    const p = new RuleBasedProvider();
    const answer = await p.composeAnswer("xyz", { query: "xyz" } as any, []);
    assert.ok(answer.includes("Não encontrei"), "mensagem honesta");
  });
});

describe("ANTI-HALLUCINATION", () => {
  it("system prompt proíbe inventar", () => {
    const src = read("lib/ai/anthropic.ts");
    assert.ok(src.includes("NUNCA inventes") || src.includes("NUNCA invente"), "proibição explícita");
  });
  it("modelo recebe só resultados, não catálogo", () => {
    const src = read("lib/ai/anthropic.ts");
    assert.ok(src.includes("slice(0, 8)"), "só top resultados");
  });
});

describe("SEGURANÇA", () => {
  it("rate limit no endpoint", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("rateLimit"), "rate limit aplicado");
    assert.ok(src.includes("429"), "responde 429");
  });
  it("mensagem limitada a 500 chars", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("MAX_MESSAGE = 500"), "limite definido");
  });
  it("sem service_role no endpoint público", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(!src.includes("SERVICE_ROLE"), "sem service_role");
    assert.ok(src.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "só anon key");
  });
  it("sem API key no browser", () => {
    const src = read("components/vitrine/AskVitrine.tsx");
    assert.ok(!src.includes("API_KEY"), "UI sem chaves");
    assert.ok(!src.toLowerCase().includes("anthropic"), "UI sem provider");
  });
});

describe("UI PERGUNTE À VITRINE", () => {
  it("componente existe e integra /explorar", () => {
    const src = read("app/explorar/page.tsx");
    assert.ok(src.includes("AskVitrine"), "integrado ao explorar");
  });
  it("usa SaveToCollection existente (não duplica)", () => {
    const src = read("components/vitrine/AskVitrine.tsx");
    assert.ok(src.includes("SaveToCollection"), "reutiliza Guardar");
    assert.ok(src.includes("itemRef"), "usa ItemRef correto");
  });
  it("tem sugestões rápidas", () => {
    const src = read("components/vitrine/AskVitrine.tsx");
    assert.ok(src.includes("SUGGESTIONS"), "sugestões presentes");
  });
  it("pode fechar", () => {
    const src = read("components/vitrine/AskVitrine.tsx");
    assert.ok(src.includes("Fechar"), "botão fechar");
  });
});

describe("FALLBACK", () => {
  it("provider indisponível → rule-based → busca tradicional", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    assert.ok(src.includes("RuleBasedProvider"), "fallback no catch");
    assert.ok(src.includes("busca tradicional"), "mensagem preserva busca");
  });
});

describe("PRIVACIDADE", () => {
  it("resposta não inclui dados privados", () => {
    const src = read("app/api/vitrine/ask/route.ts");
    const out = src.split("return NextResponse.json({")[1] || "";
    assert.ok(!out.includes("email"), "sem email na resposta");
    assert.ok(!out.includes("user_id"), "sem user_id na resposta");
  });
});
