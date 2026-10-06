/**
 * tests/novidades.test.ts — A6.5 "Novidades na Vitrine"
 *
 * Regras de visibilidade do feed público, tipos válidos e degradação
 * graciosa (migration ainda não aplicada). Lógica pura, sem DB.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOVIDADE_TYPES,
  ALL_POST_TYPES,
  isValidPostType,
  novidadeTypeLabel,
  isNovidadeVisibleNow,
  filterNovidadesFeed,
  novidadeCtaHref,
  novidadeCtaLabel,
  isMissingColumnError,
  type NovidadeRow,
} from "../lib/novidades.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION = readFileSync(
  join(__dirname, "../supabase/migrations/20261006000013_business_posts_novidades.sql"),
  "utf8"
);

const NOW = new Date("2026-10-06T12:00:00Z");
const hour = 3_600_000;
const iso = (d: Date) => d.toISOString();

const base = (over: Partial<NovidadeRow> = {}): NovidadeRow => ({
  id: "post-1",
  business_id: "biz-1",
  type: "novidade",
  title: "Título",
  is_active: true,
  businesses: { name: "Montra X", slug: "montra-x", published: true },
  created_at: iso(NOW),
  ...over,
});

describe("isNovidadeVisibleNow — filtro do feed público", () => {
  it("ativa sem validade aparece", () => {
    assert.equal(isNovidadeVisibleNow(base(), NOW), true);
  });

  it("desativada (is_active=false) NÃO aparece", () => {
    assert.equal(isNovidadeVisibleNow(base({ is_active: false }), NOW), false);
  });

  it("expirada (expires_at <= now) NÃO aparece", () => {
    assert.equal(
      isNovidadeVisibleNow(base({ expires_at: iso(new Date(NOW.getTime() - hour)) }), NOW),
      false
    );
  });

  it("expirada exatamente agora NÃO aparece (regra: expires_at > now)", () => {
    assert.equal(isNovidadeVisibleNow(base({ expires_at: iso(NOW) }), NOW), false);
  });

  it("futura (starts_at > now) NÃO aparece", () => {
    assert.equal(
      isNovidadeVisibleNow(base({ starts_at: iso(new Date(NOW.getTime() + hour)) }), NOW),
      false
    );
  });

  it("janela válida (starts_at passado, expires_at futuro) aparece", () => {
    assert.equal(
      isNovidadeVisibleNow(
        base({
          starts_at: iso(new Date(NOW.getTime() - hour)),
          expires_at: iso(new Date(NOW.getTime() + hour)),
        }),
        NOW
      ),
      true
    );
  });

  it("só de businesses published=true", () => {
    assert.equal(
      isNovidadeVisibleNow(base({ businesses: { name: "Y", slug: "y", published: false } }), NOW),
      false
    );
    assert.equal(
      isNovidadeVisibleNow(base({ businesses: { name: "Y", slug: "y", published: true } }), NOW),
      true
    );
  });

  it("colunas novas ausentes (modo legado) = visível (default ativo)", () => {
    const legacy: NovidadeRow = {
      id: "p",
      business_id: "b",
      type: "news",
      title: "Antiga",
      businesses: { published: true },
    };
    assert.equal(isNovidadeVisibleNow(legacy, NOW), true);
  });

  it("datas malformadas não escondem a novidade", () => {
    assert.equal(
      isNovidadeVisibleNow(base({ starts_at: "não-é-data", expires_at: "idem" }), NOW),
      true
    );
  });
});

describe("filterNovidadesFeed — filtro + ordenação", () => {
  it("filtra e ordena as mais recentes primeiro", () => {
    const posts = [
      base({ id: "old", created_at: iso(new Date(NOW.getTime() - 2 * hour)) }),
      base({ id: "expired", expires_at: iso(new Date(NOW.getTime() - hour)) }),
      base({ id: "new", created_at: iso(NOW) }),
      base({ id: "future", starts_at: iso(new Date(NOW.getTime() + hour)) }),
      base({ id: "inactive", is_active: false }),
      base({ id: "mid", created_at: iso(new Date(NOW.getTime() - hour)) }),
    ];
    const out = filterNovidadesFeed(posts, NOW).map((p) => p.id);
    assert.deepEqual(out, ["new", "mid", "old"]);
  });

  it("sem hardcode de negócios: só dados de entrada decidem", () => {
    assert.deepEqual(filterNovidadesFeed([], NOW), []);
  });
});

describe("tipos válidos (CHECK da migration)", () => {
  it("os 8 novos tipos são aceites", () => {
    assert.equal(NOVIDADE_TYPES.length, 8);
    for (const t of NOVIDADE_TYPES) {
      assert.equal(isValidPostType(t.value), true, t.value);
      assert.ok(novidadeTypeLabel(t.value).length > 0);
    }
  });

  it("os 4 tipos antigos continuam válidos", () => {
    for (const t of ["promotion", "event", "news", "offer"]) {
      assert.equal(isValidPostType(t), true, t);
    }
  });

  it("tipos desconhecidos são rejeitados", () => {
    assert.equal(isValidPostType("spam"), false);
    assert.equal(isValidPostType(""), false);
    assert.equal(isValidPostType(null), false);
    assert.equal(isValidPostType(42), false);
  });

  it("a migration aceita os 12 tipos no CHECK e cria as colunas novas", () => {
    for (const t of ALL_POST_TYPES) {
      assert.ok(MIGRATION.includes(`'${t}'`), `migration deve aceitar o tipo '${t}'`);
    }
    for (const col of ["price", "starts_at", "expires_at", "is_active", "product_id", "cta_type", "cta_target", "updated_at"]) {
      assert.ok(MIGRATION.includes(col), `migration deve criar a coluna '${col}'`);
    }
    // Aditiva: não toca em RLS.
    assert.ok(!/CREATE POLICY|DROP POLICY/i.test(MIGRATION), "migration não altera RLS");
  });
});

describe("CTA do card", () => {
  it("ver_montra → /vitrine/[slug]; ver_produto → âncora do produto", () => {
    assert.equal(
      novidadeCtaHref(base({ cta_type: "ver_montra" }), "montra-x"),
      "/vitrine/montra-x"
    );
    assert.equal(
      novidadeCtaHref(base({ cta_type: "ver_produto", product_id: "prod-9" }), "montra-x"),
      "/vitrine/montra-x#produto-prod-9"
    );
    assert.equal(novidadeCtaHref(base({ cta_type: null }), "montra-x"), null);
    assert.equal(novidadeCtaHref(base({ cta_type: "ver_montra" }), null), null);
  });

  it("labels do CTA", () => {
    assert.equal(novidadeCtaLabel(base({ cta_type: "ver_produto" })), "Ver produto");
    assert.equal(novidadeCtaLabel(base({ cta_type: "ver_montra" })), "Ver Montra");
  });
});

describe("isMissingColumnError — degradação graciosa", () => {
  it("deteta coluna inexistente (Postgres 42703 / PostgREST PGRST204)", () => {
    assert.equal(
      isMissingColumnError('column "price" does not exist'),
      true
    );
    assert.equal(
      isMissingColumnError('Could not find the \'starts_at\' column of \'business_posts\' in the schema cache'),
      true
    );
    assert.equal(isMissingColumnError({ code: "42703" }), true);
    assert.equal(isMissingColumnError("PGRST204"), true);
  });

  it("não confunde outros erros com coluna em falta", () => {
    assert.equal(isMissingColumnError("new row violates row-level security policy"), false);
    assert.equal(isMissingColumnError("JWT expired"), false);
    assert.equal(isMissingColumnError(null), false);
    assert.equal(isMissingColumnError(""), false);
  });
});
