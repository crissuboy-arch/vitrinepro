/**
 * tests/gestor-keys.test.ts — Gestor de Montras: chaves e emails.
 *
 * Regras (lib/gestor-keys.ts):
 *   * A chave tem o formato vpg_<64 hex> e o hash guardado é o
 *     SHA-256 da chave — nunca a chave em claro.
 *   * Duas chaves geradas são diferentes; o hash é determinístico.
 *   * Emails: validação simples e normalização para minúsculas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateManagerKey,
  hashManagerKey,
  isManagerKeyFormat,
  isValidManagerEmail,
  normalizeManagerEmail,
} from "../lib/gestor-keys.ts";

describe("gestor keys", () => {
  it("gera chaves com o formato vpg_<64 hex>", () => {
    const { plain } = generateManagerKey();
    assert.equal(isManagerKeyFormat(plain), true);
    assert.equal(plain.length, 4 + 64);
  });

  it("o hash devolvido corresponde à chave gerada", () => {
    const { plain, hash } = generateManagerKey();
    assert.equal(hash, hashManagerKey(plain));
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.notEqual(hash, plain);
  });

  it("duas chaves geradas são diferentes", () => {
    assert.notEqual(generateManagerKey().plain, generateManagerKey().plain);
  });

  it("hash é determinístico e sensível ao conteúdo", () => {
    const k = generateManagerKey().plain;
    assert.equal(hashManagerKey(k), hashManagerKey(k));
    assert.notEqual(hashManagerKey(k), hashManagerKey(k + "x"));
  });

  it("rejeita formatos inválidos", () => {
    assert.equal(isManagerKeyFormat("vpg_123"), false);
    assert.equal(isManagerKeyFormat(""), false);
    assert.equal(isManagerKeyFormat(null), false);
    assert.equal(isManagerKeyFormat("vpg_" + "g".repeat(64)), false);
  });
});

describe("gestor emails", () => {
  it("aceita emails válidos", () => {
    assert.equal(isValidManagerEmail("atenabotpt@gmail.com"), true);
    assert.equal(isValidManagerEmail("  Gestora@Exemplo.PT "), true);
  });

  it("rejeita emails inválidos", () => {
    assert.equal(isValidManagerEmail("sem-arroba"), false);
    assert.equal(isValidManagerEmail("a@b"), false);
    assert.equal(isValidManagerEmail(""), false);
    assert.equal(isValidManagerEmail(42), false);
    assert.equal(isValidManagerEmail(null), false);
  });

  it("normaliza para minúsculas sem espaços", () => {
    assert.equal(normalizeManagerEmail("  ATENABOTPT@Gmail.com "), "atenabotpt@gmail.com");
  });
});
