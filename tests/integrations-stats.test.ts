/**
 * tests/integrations-stats.test.ts
 * GET /api/integrations/stats — autenticação máquina-a-máquina (fase 2).
 *
 * Valida a camada de auth sem tocar no Supabase:
 * 401 sem chave / chave errada, 500 sem configuração no servidor.
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/integrations/stats/route.ts";
import { ATHENA_API_KEY_ENV } from "../lib/integrations/athena.ts";

const TEST_KEY = "test-key-fase2-abc123";

function reqWith(key?: string): Request {
  const headers: Record<string, string> = {};
  if (key !== undefined) headers.authorization = `Bearer ${key}`;
  return new Request("https://x/api/integrations/stats", { headers });
}

describe("GET /api/integrations/stats — auth", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [ATHENA_API_KEY_ENV, "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    process.env[ATHENA_API_KEY_ENV] = TEST_KEY;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("401 sem header Authorization", async () => {
    const res = await GET(reqWith());
    assert.equal(res.status, 401);
  });

  it("401 com chave errada", async () => {
    const res = await GET(reqWith("chave-errada"));
    assert.equal(res.status, 401);
  });

  it("401 com esquema diferente de Bearer", async () => {
    const res = await GET(
      new Request("https://x/api/integrations/stats", {
        headers: { authorization: `Basic ${TEST_KEY}` },
      })
    );
    assert.equal(res.status, 401);
  });

  it("500 quando a chave não está configurada no servidor", async () => {
    delete process.env[ATHENA_API_KEY_ENV];
    const res = await GET(reqWith(TEST_KEY));
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.error, "Integração não configurada");
  });

  it("com chave válida mas sem Supabase configurado → 500 sem vazar nada", async () => {
    const res = await GET(reqWith(TEST_KEY));
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.error, "Configuração incompleta");
    assert.ok(!("stores" in body));
    assert.ok(!("products" in body));
  });
});
