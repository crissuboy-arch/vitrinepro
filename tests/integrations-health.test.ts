/**
 * tests/integrations-health.test.ts
 * GET /api/integrations/health — health check oficial VitrinePro <-> Athena Control.
 *
 * Garante: resposta estática, sem dados de clientes, sem autenticação,
 * e versão sincronizada com package.json.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { GET } from "../app/api/integrations/health/route.ts";
import {
  PLATFORM_NAME,
  PLATFORM_VERSION,
  INTEGRATION_CONTRACT_VERSION,
} from "../lib/integrations/athena.ts";

const require = createRequire(import.meta.url);
const pkgVersion: string = require("../package.json").version;

describe("GET /api/integrations/health", () => {
  it("responde 200 com a identidade da plataforma", async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.platform, PLATFORM_NAME);
    assert.equal(body.platform, "VitrinePro");
    assert.equal(body.status, "operational");
    assert.equal(body.contract, INTEGRATION_CONTRACT_VERSION);
  });

  it("versão sincronizada com package.json", async () => {
    const res = await GET();
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.version, PLATFORM_VERSION);
    assert.equal(body.version, pkgVersion);
  });

  it("não expõe dados de clientes nem campos privados", async () => {
    const res = await GET();
    const body = (await res.json()) as Record<string, unknown>;
    const forbidden = [
      "business",
      "businesses",
      "store",
      "stores",
      "product",
      "products",
      "user",
      "users",
      "email",
      "customer",
      "tenant",
    ];
    for (const key of forbidden) {
      assert.ok(!(key in body), `campo proibido presente: ${key}`);
    }
    // timestamp válido ISO 8601
    assert.ok(!Number.isNaN(Date.parse(body.timestamp as string)));
  });

  it("não usa cache (estado real a cada sonda)", async () => {
    const res = await GET();
    assert.equal(res.headers.get("cache-control"), "no-store");
  });
});
