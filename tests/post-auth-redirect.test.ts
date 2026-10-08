/**
 * tests/post-auth-redirect.test.ts — correção de redirecionamento pós-login
 *
 * Cobre:
 *  1. isSafeNextPath: só caminhos internos seguros.
 *  2. resolvePostAuthTarget: next validado; admin (server-side) → /admin;
 *     merchant → /dashboard absoluto; consumidor → /explorar.
 *  3. Targets sempre absolutos (nunca "dashboard" relativo).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeNextPath, resolvePostAuthTarget } from "../lib/auth-redirect.ts";

describe("isSafeNextPath", () => {
  it("aceita caminhos internos simples", () => {
    assert.equal(isSafeNextPath("/explorar"), true);
    assert.equal(isSafeNextPath("/dashboard"), true);
    assert.equal(isSafeNextPath("/onboarding"), true);
    assert.equal(isSafeNextPath("/vitrine/cantinho-da-lu"), true);
    assert.equal(isSafeNextPath("/admin"), true);
  });

  it("rejeita URLs externas", () => {
    assert.equal(isSafeNextPath("https://evil.com"), false);
    assert.equal(isSafeNextPath("http://evil.com/x"), false);
    assert.equal(isSafeNextPath("//evil.com/phish"), false);
  });

  it("rejeita esquemas perigosos e truques", () => {
    assert.equal(isSafeNextPath("javascript:alert(1)"), false);
    assert.equal(isSafeNextPath("/\\evil.com"), false);
    assert.equal(isSafeNextPath("/foo bar"), false);
    assert.equal(isSafeNextPath("/foo%0d%0a"), true); // % codificado não é whitespace literal
  });

  it("rejeita valores vazios/inválidos", () => {
    assert.equal(isSafeNextPath(null), false);
    assert.equal(isSafeNextPath(undefined), false);
    assert.equal(isSafeNextPath(""), false);
    assert.equal(isSafeNextPath("/"), false);
    assert.equal(isSafeNextPath("dashboard"), false); // relativo sem /
    assert.equal(isSafeNextPath("   "), false);
  });
});

describe("resolvePostAuthTarget — next validado", () => {
  it("next interno seguro vence", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/vitrine/x", hasBusiness: false }),
      "/vitrine/x"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/onboarding", hasBusiness: false }),
      "/onboarding"
    );
  });

  it("next externo é ignorado (cai no destino do perfil)", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "https://evil.com", hasBusiness: true }),
      "/dashboard"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "//evil.com", hasBusiness: false }),
      "/explorar"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "javascript:alert(1)", hasBusiness: false }),
      "/explorar"
    );
  });

  it("next=/admin só para admin (veredito server-side)", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/admin", hasBusiness: false, isAdmin: true }),
      "/admin"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/admin", hasBusiness: false, isAdmin: false }),
      "/explorar"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: "/admin/users", hasBusiness: true, isAdmin: false }),
      "/dashboard"
    );
  });
});

describe("resolvePostAuthTarget — destinos por perfil", () => {
  it("admin → /admin mesmo sem next", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: null, hasBusiness: false, isAdmin: true }),
      "/admin"
    );
    assert.equal(
      resolvePostAuthTarget({ nextPath: null, hasBusiness: true, isAdmin: true }),
      "/admin"
    );
  });

  it("merchant → /dashboard ABSOLUTO (nunca relativo)", () => {
    const t = resolvePostAuthTarget({ nextPath: null, hasBusiness: true });
    assert.equal(t, "/dashboard");
    assert.ok(t.startsWith("/"), "target absoluto");
  });

  it("consumidor → /explorar, nunca onboarding forçado", () => {
    assert.equal(
      resolvePostAuthTarget({ nextPath: null, hasBusiness: false }),
      "/explorar"
    );
  });

  it("nenhum destino cai na landing comercial", () => {
    const cases = [
      { nextPath: null, hasBusiness: false },
      { nextPath: null, hasBusiness: true },
      { nextPath: null, hasBusiness: false, isAdmin: true },
      { nextPath: "/", hasBusiness: true },
      { nextPath: "", hasBusiness: false },
    ];
    for (const c of cases) {
      const t = resolvePostAuthTarget(c);
      assert.notEqual(t, "/", `caso ${JSON.stringify(c)} não vai para a landing`);
    }
  });
});
