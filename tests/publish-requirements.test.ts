/**
 * tests/publish-requirements.test.ts — Launch gate
 *
 * Requisitos mínimos de publicação de uma Montra (lib/publish-requirements):
 *  1. Montra completa (nome + categoria + cidade + WhatsApp) → publica
 *  2. Só com nome (cadastro mínimo) → NÃO publica; faltam categoria/cidade/WhatsApp
 *  3. Sem WhatsApp → bloqueia (é o canal de contacto da página pública)
 *  4. Sem categoria ou sem cidade → bloqueia (descoberta local)
 *  5. Aceita category/city em texto (legado) como alternativa aos ids
 *  6. Strings só com espaços contam como vazio
 *  7. null/undefined → tudo em falta, sem rebentar
 *  8. Mensagem pt-PT lista o que falta; completa → mensagem vazia
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMissingPublishRequirements,
  canPublishBusiness,
  missingPublishMessage,
} from "../lib/publish-requirements.ts";

const COMPLETE = {
  name: "Estúdio Bela",
  category_id: "cat-1",
  city_id: "city-1",
  whatsapp: "+351912345678",
};

describe("publish requirements", () => {
  it("complete Montra can publish", () => {
    assert.deepEqual(getMissingPublishRequirements(COMPLETE), []);
    assert.equal(canPublishBusiness(COMPLETE), true);
  });

  it("name-only signup (cadastro mínimo) cannot publish yet", () => {
    const missing = getMissingPublishRequirements({ name: "Nova Montra" });
    assert.deepEqual(
      missing.map((m) => m.field),
      ["category", "city", "whatsapp"]
    );
    assert.equal(canPublishBusiness({ name: "Nova Montra" }), false);
  });

  it("missing WhatsApp blocks publishing", () => {
    const b = { ...COMPLETE, whatsapp: "" };
    assert.deepEqual(
      getMissingPublishRequirements(b).map((m) => m.field),
      ["whatsapp"]
    );
    assert.equal(canPublishBusiness(b), false);
  });

  it("missing category or city blocks publishing", () => {
    assert.deepEqual(
      getMissingPublishRequirements({ ...COMPLETE, category_id: null }).map((m) => m.field),
      ["category"]
    );
    assert.deepEqual(
      getMissingPublishRequirements({ ...COMPLETE, city_id: null }).map((m) => m.field),
      ["city"]
    );
  });

  it("legacy text category/city also satisfy the requirements", () => {
    const b = { name: "Loja", category: "Moda", city: "Lisboa", whatsapp: "912345678" };
    assert.equal(canPublishBusiness(b), true);
  });

  it("whitespace-only strings count as empty", () => {
    const b = { ...COMPLETE, whatsapp: "   " };
    assert.equal(canPublishBusiness(b), false);
  });

  it("null business reports everything missing without crashing", () => {
    assert.equal(getMissingPublishRequirements(null).length, 4);
    assert.equal(getMissingPublishRequirements(undefined).length, 4);
    assert.equal(canPublishBusiness(null), false);
  });

  it("message lists missing items in pt-PT; empty when complete", () => {
    const msg = missingPublishMessage({ name: "Nova Montra" });
    assert.match(msg, /categoria/);
    assert.match(msg, /cidade/);
    assert.match(msg, /WhatsApp/);
    assert.equal(missingPublishMessage(COMPLETE), "");
  });
});
