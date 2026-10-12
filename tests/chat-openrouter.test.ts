/**
 * tests/chat-openrouter.test.ts — Chatbot das Montras via OpenRouter
 *
 * Testa lib/ai/openrouter-chat.ts com fetch MOCKADO.
 * NENHUM teste aqui consome créditos: nenhuma chamada real é feita.
 *
 * Garante:
 *  - modelo FIXO e económico (sem seleção automática);
 *  - chave apenas no servidor (Authorization Bearer);
 *  - privacidade: provider.data_collection = "deny";
 *  - contrato string | null (a rota decide o fallback);
 *  - erros nunca lançam para o chamador.
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  callOpenRouterChat,
  getOpenRouterKey,
  OPENROUTER_CHAT_MODEL,
  OPENROUTER_API_URL,
} from "../lib/ai/openrouter-chat.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_KEY = process.env.OPENROUTER_API_KEY;

let lastRequest: { url: string; init: RequestInit } | null = null;

function mockFetchJson(ok: boolean, jsonBody: unknown, status = 200) {
  lastRequest = null;
  (globalThis as Record<string, unknown>).fetch = async (
    url: string,
    init: RequestInit
  ) => {
    lastRequest = { url, init };
    return {
      ok,
      status,
      json: async () => jsonBody,
    } as Response;
  };
}

function mockFetchThrow() {
  (globalThis as Record<string, unknown>).fetch = async () => {
    throw new Error("rede em baixo");
  };
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "sk-or-test-key-123";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_KEY === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = ORIGINAL_KEY;
});

describe("openrouter-chat", () => {
  it("usa o modelo fixo económico (sem seleção automática)", async () => {
    mockFetchJson(true, { choices: [{ message: { content: "Olá!" } }] });
    const reply = await callOpenRouterChat(
      "sistema",
      [],
      "olá",
      "https://vitrinepro.digital"
    );
    assert.equal(reply, "Olá!");
    assert.equal(lastRequest!.url, OPENROUTER_API_URL);
    const body = JSON.parse(String(lastRequest!.init.body));
    assert.equal(body.model, "google/gemini-2.5-flash-lite");
    assert.equal(body.model, OPENROUTER_CHAT_MODEL);
  });

  it("exige privacidade: data_collection deny", async () => {
    mockFetchJson(true, { choices: [{ message: { content: "x" } }] });
    await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    const body = JSON.parse(String(lastRequest!.init.body));
    assert.equal(body.provider?.data_collection, "deny");
  });

  it("envia a chave só no servidor via Authorization Bearer", async () => {
    mockFetchJson(true, { choices: [{ message: { content: "x" } }] });
    await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    const headers = lastRequest!.init.headers as Record<string, string>;
    assert.equal(headers["Authorization"], "Bearer sk-or-test-key-123");
    // A chave nunca vai no corpo.
    const body = JSON.parse(String(lastRequest!.init.body));
    assert.ok(!JSON.stringify(body).includes("sk-or-test-key-123"));
  });

  it("identifica a origem com HTTP-Referer e X-Title", async () => {
    mockFetchJson(true, { choices: [{ message: { content: "x" } }] });
    await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    const headers = lastRequest!.init.headers as Record<string, string>;
    assert.equal(headers["HTTP-Referer"], "https://vitrinepro.digital");
    assert.equal(headers["X-Title"], "VitrinePro Chatbot");
  });

  it("monta messages com system primeiro", async () => {
    mockFetchJson(true, { choices: [{ message: { content: "x" } }] });
    await callOpenRouterChat(
      "és o assistente",
      [{ role: "user", content: "oi" }],
      "horário?",
      "https://vitrinepro.digital"
    );
    const body = JSON.parse(String(lastRequest!.init.body));
    assert.deepEqual(body.messages, [
      { role: "system", content: "és o assistente" },
      { role: "user", content: "oi" },
      { role: "user", content: "horário?" },
    ]);
    assert.equal(body.max_tokens, 1024);
  });

  it("sem chave → null e nenhum fetch (fallback determinístico na rota)", async () => {
    delete process.env.OPENROUTER_API_KEY;
    let called = false;
    (globalThis as Record<string, unknown>).fetch = async () => {
      called = true;
      throw new Error("não devia chamar");
    };
    const reply = await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    assert.equal(reply, null);
    assert.equal(called, false);
    assert.equal(getOpenRouterKey(), null);
  });

  it("resposta não-ok → null (sem lançar)", async () => {
    mockFetchJson(false, { error: "ups" }, 502);
    const reply = await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    assert.equal(reply, null);
  });

  it("resposta sem conteúdo válido → null", async () => {
    mockFetchJson(true, { choices: [] });
    assert.equal(
      await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital"),
      null
    );
    mockFetchJson(true, { choices: [{ message: { content: "" } }] });
    assert.equal(
      await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital"),
      null
    );
  });

  it("erro de rede → null (sem lançar)", async () => {
    mockFetchThrow();
    const reply = await callOpenRouterChat("s", [], "m", "https://vitrinepro.digital");
    assert.equal(reply, null);
  });
});
