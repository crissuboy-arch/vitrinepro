/**
 * tests/quotes.test.ts — Fase 2 "Pedidos de Orçamento".
 * Validação da submissão, tokens privados, visibilidade pública,
 * filtros e o contrato de privacidade da migration.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateQuoteSubmission,
  isValidTrackingToken,
  trackingPath,
  isQuotePubliclyVisible,
  filterQuotes,
  quoteFacets,
  consumerCanDecideInterest,
  CONSENT_TEXT_VERSION,
  QUOTE_TTL_DAYS,
  type QuoteRequest,
} from "../lib/quotes.ts";
import { generateTrackingToken, hashTrackingToken } from "../lib/quotes-token.ts";
import { isAllowedEvent } from "../lib/analytics-guard.ts";

const VALID = {
  category: "Canalização",
  city: "Aveiro",
  title: "Fuga de água na cozinha",
  description: "Tenho uma fuga por baixo do lava-loiça, preciso de reparação esta semana.",
  name: "Maria Exemplo",
  email: "maria@exemplo.pt",
  phone: "",
  consent: true,
};

describe("validateQuoteSubmission", () => {
  it("aceita uma submissão completa com email", () => {
    const r = validateQuoteSubmission(VALID);
    assert.equal(r.ok, true);
    assert.equal(r.value?.email, "maria@exemplo.pt");
    assert.equal(r.value?.phone, null);
  });

  it("aceita só com telefone (sem email)", () => {
    const r = validateQuoteSubmission({ ...VALID, email: "", phone: "+351 912 345 678" });
    assert.equal(r.ok, true);
    assert.ok(r.value?.phone);
  });

  it("rejeita sem nenhum contacto", () => {
    const r = validateQuoteSubmission({ ...VALID, email: "", phone: "" });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("contacto")));
  });

  it("rejeita sem consentimento RGPD", () => {
    const r = validateQuoteSubmission({ ...VALID, consent: false });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.toLowerCase().includes("aceitar")));
  });

  it("rejeita título curto e descrição curta", () => {
    const r = validateQuoteSubmission({ ...VALID, title: "Oi", description: "curta" });
    assert.equal(r.ok, false);
    assert.ok(r.errors.length >= 2);
  });

  it("rejeita email inválido e telefone inválido", () => {
    const r = validateQuoteSubmission({ ...VALID, email: "nao-e-email", phone: "123" });
    assert.equal(r.ok, false);
  });

  it("trunca campos gigantes em vez de os aceitar", () => {
    const r = validateQuoteSubmission({ ...VALID, title: "x".repeat(500) });
    assert.equal(r.ok, true);
    assert.equal(r.value?.title.length, 120);
  });
});

describe("tokens privados de acompanhamento", () => {
  it("gera tokens de 64 hex e o hash é SHA-256 estável", () => {
    const t1 = generateTrackingToken();
    const t2 = generateTrackingToken();
    assert.equal(isValidTrackingToken(t1), true);
    assert.notEqual(t1, t2);
    assert.equal(hashTrackingToken(t1), hashTrackingToken(t1));
    assert.equal(hashTrackingToken(t1).length, 64);
    assert.notEqual(hashTrackingToken(t1), t1);
  });

  it("rejeita tokens malformados", () => {
    assert.equal(isValidTrackingToken("abc"), false);
    assert.equal(isValidTrackingToken(""), false);
    assert.equal(isValidTrackingToken(null), false);
    assert.equal(isValidTrackingToken("z".repeat(64)), false);
  });

  it("o caminho privado usa o token", () => {
    const t = generateTrackingToken();
    assert.equal(trackingPath(t), `/pedidos/acompanhar/${t}`);
  });
});

const QUOTE = (over: Partial<QuoteRequest> = {}): QuoteRequest => ({
  id: "11111111-1111-1111-1111-111111111111",
  category: "Canalização",
  city: "Aveiro",
  title: "Fuga de água",
  description: "Descrição do pedido",
  status: "approved",
  expires_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  created_at: new Date().toISOString(),
  ...over,
});

describe("visibilidade pública e filtros", () => {
  it("só aprovados e não expirados são visíveis", () => {
    assert.equal(isQuotePubliclyVisible(QUOTE()), true);
    assert.equal(isQuotePubliclyVisible(QUOTE({ status: "pending" })), false);
    assert.equal(isQuotePubliclyVisible(QUOTE({ status: "closed" })), false);
    assert.equal(
      isQuotePubliclyVisible(QUOTE({ expires_at: new Date(Date.now() - 1000).toISOString() })),
      false
    );
  });

  it("filtra por cidade e categoria", () => {
    const list = [
      QUOTE(),
      QUOTE({ id: "2", city: "Porto" }),
      QUOTE({ id: "3", category: "Eletricidade" }),
    ];
    assert.equal(filterQuotes(list, { city: "Porto" }).length, 1);
    assert.equal(filterQuotes(list, { category: "Eletricidade" }).length, 1);
    assert.equal(filterQuotes(list, {}).length, 3);
  });

  it("facets ordenadas e únicas", () => {
    const f = quoteFacets([QUOTE(), QUOTE({ id: "2", city: "Porto" }), QUOTE({ id: "3", city: "Porto" })]);
    assert.deepEqual(f.cities, ["Aveiro", "Porto"]);
    assert.deepEqual(f.categories, ["Canalização"]);
  });

  it("o consumidor só decide interesses ainda 'sent'", () => {
    assert.equal(consumerCanDecideInterest("sent"), true);
    assert.equal(consumerCanDecideInterest("accepted"), false);
    assert.equal(consumerCanDecideInterest("declined"), false);
  });
});

describe("contrato RGPD e métricas", () => {
  it("versão do consentimento e TTL definidos", () => {
    assert.ok(CONSENT_TEXT_VERSION.length > 0);
    assert.equal(QUOTE_TTL_DAYS, 30);
  });

  it("eventos da Fase 2 estão na allowlist de analytics", () => {
    assert.equal(isAllowedEvent("quote_interest"), true);
    assert.equal(isAllowedEvent("quote_contact_revealed"), true);
  });

  it("a migration separa contactos e não põe PII em quote_requests", () => {
    const sql = readFileSync(
      new URL("../supabase/migrations/20261117000025_quote_requests.sql", import.meta.url),
      "utf8"
    );
    assert.ok(sql.includes("create table if not exists public.quote_requests"));
    assert.ok(sql.includes("create table if not exists public.quote_request_contacts"));
    assert.ok(sql.includes("create table if not exists public.quote_interests"));
    // RLS nas três tabelas
    assert.equal((sql.match(/enable row level security/g) || []).length, 3);
    // Leitura pública só de aprovados/não expirados
    assert.ok(sql.includes("quote_requests_public_read"));
    assert.ok(sql.includes("status = 'approved' and expires_at > now()"));
    // A tabela pública não declara colunas de contacto
    const publicTable = sql.split("create table if not exists public.quote_request_contacts")[0];
    assert.ok(!/^\s+(email|phone|name)\s/m.test(publicTable.split("quote_requests (")[1] || ""));
    // Token guardado como hash único
    assert.ok(sql.includes("tracking_token_hash text not null unique"));
  });
});
