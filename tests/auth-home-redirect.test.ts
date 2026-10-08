/**
 * tests/auth-home-redirect.test.ts — correção definitiva da navegação.
 *
 * Utilizadores autenticados nunca ficam na landing (`/`) nem no
 * formulário (`/login`): são redirecionados para a home por tipo de conta.
 *
 * Cobre (puro, sem IO):
 *  1. resolveHomeTarget: admin → /admin; merchant → /dashboard;
 *     consumidor → /explorar.
 *  2. Com next explícito: next seguro vence; /admin só para admin.
 *  3. Targets sempre absolutos (nunca relativos).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveHomeTarget, resolvePostAuthTarget } from "../lib/auth-redirect.ts";

describe("resolveHomeTarget — home por tipo de conta autenticada", () => {
  it("admin → /admin (mesmo com negócio)", () => {
    assert.equal(resolveHomeTarget({ hasBusiness: true, isAdmin: true }), "/admin");
    assert.equal(resolveHomeTarget({ hasBusiness: false, isAdmin: true }), "/admin");
  });

  it("comerciante (com negócio) → /dashboard", () => {
    assert.equal(resolveHomeTarget({ hasBusiness: true, isAdmin: false }), "/dashboard");
  });

  it("consumidor (sem negócio) → /explorar", () => {
    assert.equal(resolveHomeTarget({ hasBusiness: false, isAdmin: false }), "/explorar");
    assert.equal(resolveHomeTarget({ hasBusiness: false }), "/explorar");
  });

  it("targets são sempre absolutos", () => {
    for (const t of [
      resolveHomeTarget({ hasBusiness: true, isAdmin: true }),
      resolveHomeTarget({ hasBusiness: true }),
      resolveHomeTarget({ hasBusiness: false }),
    ]) {
      assert.ok(t.startsWith("/"), `${t} é absoluto`);
    }
  });
});

describe("redirect de já-autenticado em /login — next explícito", () => {
  it("next seguro vence para consumidor", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/vitrine/cantinho-da-lu", hasBusiness: false }),
      "/vitrine/cantinho-da-lu"
    );
  });

  it("next=/admin para não-admin é ignorado → home por tipo", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/admin", hasBusiness: true, isAdmin: false }),
      "/dashboard"
    );
  });

  it("next=/admin para admin é honrado", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/admin", hasBusiness: false, isAdmin: true }),
      "/admin"
    );
  });

  it("next malicioso é ignorado → home por tipo", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "https://evil.com", hasBusiness: true }),
      "/dashboard"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "//evil.com/x", hasBusiness: false }),
      "/explorar"
    );
  });
});
