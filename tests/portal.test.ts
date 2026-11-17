/**
 * tests/portal.test.ts — Integração Portal de Ofertas.
 * Normalização multiloja do feed, IDs estáveis sem duplicados, lojas e
 * tracking por loja (nunca cruzado), preço só do feed, interleave justo
 * e o contrato da migration 029.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizePortalFeed,
  normalizePortalItem,
  storeKeyFor,
  portalCategories,
  interleaveFair,
} from "../lib/portal.ts";

const FEED = [
  { id: "B0CZV1KPXL", titulo: "Produto Amazon", categoria: "Tecnologia", imagem: "https://m.media-amazon.com/x.jpg", link: "https://www.amazon.es/dp/B0CZV1KPXL?tag=portaldeofert-21", loja: "Amazon", destaque: true },
  { id: "B0CZV1KPXL", titulo: "Duplicado", categoria: "Tecnologia", link: "https://www.amazon.es/dp/B0CZV1KPXL?tag=portaldeofert-21", loja: "Amazon" },
  { id: "T123", titulo: "Produto Temu", categoria: "Casa e cozinha", link: "https://www.temu.com/pt/item.html?referral=abc", loja: "Temu", dia: true },
  { id: "P1", titulo: "Produto próprio", categoria: "Beleza", link: "https://portal-de-ofertapt.vercel.app/loja/p1", loja: "Loja própria", preco: 9.9, preco_promo: 7.5 },
  { id: "", titulo: "Sem id", link: "https://example.com", loja: "Amazon" },
  { id: "OFF1", titulo: "Inativo", link: "https://example.com/x", loja: "Amazon", ativo: false },
];

describe("portal: normalização do feed", () => {
  it("filtra inválidos/inativos e remove duplicados por ID estável", () => {
    const out = normalizePortalFeed(FEED);
    assert.equal(out.length, 3);
    assert.deepEqual(out.map((p) => p.externalId), ["amazon:B0CZV1KPXL", "temu:T123", "propria:P1"]);
  });

  it("preserva o link VERBATIM (tracking da Amazon intacto) e não aplica tag a outras lojas", () => {
    const out = normalizePortalFeed(FEED);
    const amz = out.find((p) => p.store.key === "amazon")!;
    assert.equal(amz.buyUrl, "https://www.amazon.es/dp/B0CZV1KPXL?tag=portaldeofert-21");
    const temu = out.find((p) => p.store.key === "temu")!;
    assert.ok(!temu.buyUrl.includes("portaldeofert-21"));
    assert.equal(temu.buyUrl, "https://www.temu.com/pt/item.html?referral=abc");
    assert.equal(temu.kind, "afiliado");
    assert.equal(temu.dealOfDay, true);
  });

  it("preço só existe quando o feed o fornece", () => {
    const out = normalizePortalFeed(FEED);
    assert.equal(out.find((p) => p.store.key === "amazon")!.price, null);
    const own = out.find((p) => p.store.key === "propria")!;
    assert.equal(own.kind, "proprio");
    assert.equal(own.price, 9.9);
    assert.equal(own.promoPrice, 7.5);
    assert.equal(own.store.affiliate, false);
  });

  it("lojas desconhecidas caem em 'outra' (afiliado) sem rebentar", () => {
    assert.equal(storeKeyFor("AliExpress"), "outra");
    assert.equal(storeKeyFor(undefined), "outra");
    assert.equal(storeKeyFor("amazon.es"), "amazon");
  });

  it("categorias únicas ordenadas pt", () => {
    assert.deepEqual(portalCategories(normalizePortalFeed(FEED)), ["Beleza", "Casa e cozinha", "Tecnologia"]);
  });

  it("item sem link/nome é rejeitado", () => {
    assert.equal(normalizePortalItem({ id: "X", titulo: "Y" }), null);
    assert.equal(normalizePortalItem({ id: "X", link: "https://e.com" }), null);
  });
});

describe("portal: interleave justo", () => {
  it("alterna fontes e respeita o teto", () => {
    const out = interleaveFair(["a1", "a2", "a3"], ["b1", "b2"], 4);
    assert.deepEqual(out, ["a1", "b1", "a2", "b2"]);
    assert.deepEqual(interleaveFair([], ["b1"], 5), ["b1"]);
    assert.deepEqual(interleaveFair(["a1"], [], 5), ["a1"]);
  });
});

describe("portal: migration 029", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261117000029_portal_ofertas.sql", import.meta.url), "utf8");
  it("adiciona business_kind com default seguro e os 4 tipos", () => {
    assert.match(sql, /business_kind text not null default 'servicos'/);
    for (const k of ["servicos", "produtos_digitais", "produtos_proprios", "multiloja_afiliados"]) assert.ok(sql.includes(k), k);
  });
  it("cria settings (desligada) e sync_runs com RLS ativa", () => {
    assert.match(sql, /create table if not exists public\.portal_settings/);
    assert.match(sql, /enabled boolean not null default false/);
    assert.match(sql, /create table if not exists public\.portal_sync_runs/);
    assert.match(sql, /portal_settings enable row level security/);
    assert.match(sql, /portal_sync_runs enable row level security/);
  });
});
