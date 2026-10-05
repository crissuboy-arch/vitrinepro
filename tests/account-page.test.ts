/**
 * tests/account-page.test.ts — /conta (Gestão da conta)
 *
 * Separa CONTA (pessoa) de MONTRA (negócio). Só usa campos que existem
 * no modelo — sem inventar telefone/país nem criar campos no banco.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("/conta — estrutura", () => {
  it("tem as secções A tua conta, Gestão e Sessão", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("A tua conta"), "secção A tua conta");
    assert.ok(src.includes(">Gestão<"), "secção Gestão");
    assert.ok(src.includes(">Sessão<"), "secção Sessão");
  });

  it("não mistura dados da Montra (sem business/slug/loja)", () => {
    const src = read("app/conta/page.tsx");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\/\/.*$/gm, "")
      .replace(/plano-business/g, "");
    assert.ok(!/businesses|business_id/i.test(code), "sem dados de negócio");
    assert.ok(!code.includes("slug"), "sem slug");
    assert.ok(!code.includes("vitrine/"), "sem rota de montra");
  });
});

describe("/conta — só campos reais do modelo", () => {
  it("usa display_name, email, email_confirmed_at e plan", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("display_name"), "nome editável");
    assert.ok(src.includes("user.email"), "e-mail da sessão");
    assert.ok(src.includes("email_confirmed_at"), "estado real do e-mail");
    assert.ok(src.includes("profile?.plan"), "plano real");
  });

  it("NÃO inventa telefone nem país (não existem na conta)", () => {
    const src = read("app/conta/page.tsx");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\/\/.*$/gm, "");
    assert.ok(!/phone|telefone/i.test(code), "sem telefone");
    assert.ok(!/country|país|pais/i.test(code), "sem país");
  });

  it("e-mail marcado como privado", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("privado"), "badge privado");
  });
});

describe("/conta — fluxos reais", () => {
  it("alterar palavra-passe usa supabase.auth.updateUser", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("supabase.auth.updateUser({ password:"), "fluxo real do Auth");
    assert.ok(src.includes("pw1 !== pw2"), "confirmação");
  });

  it("Plano/Faturação aponta para o fluxo real /plano-business", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes('href="/plano-business"'), "checkout Stripe real");
  });

  it("Minhas Montras → /dashboard", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes('href="/dashboard"'), "link Minhas Montras");
  });

  it("Trocar de conta e Sair fazem signOut real", () => {
    const src = read("app/conta/page.tsx");
    assert.ok(src.includes("await signOut()"), "signOut real");
    assert.ok(src.includes('doSignOut("/login")'), "trocar → /login");
    assert.ok(src.includes('doSignOut("/")'), "sair → /");
  });
});

describe("/conta — proteção e menu", () => {
  it("proxy protege /conta (sem sessão → /login)", () => {
    const src = read("proxy.ts");
    assert.ok(src.includes('"/conta"'), "rota protegida");
    assert.ok(src.includes('"/conta/:path*"'), "matcher");
  });

  it("AccountMenu tem Gestão da conta → /conta", () => {
    const src = read("components/auth/AccountMenu.tsx");
    assert.ok(src.includes("Gestão da conta"), "item no menu");
    assert.ok(src.includes('href="/conta"'), "aponta para /conta");
  });
});
