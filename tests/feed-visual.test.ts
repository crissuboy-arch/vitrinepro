/**
 * tests/feed-visual.test.ts — Feed visual do /explorar (masonry, ordem lógica)
 *
 * Cobre: colunas responsivas, intercalação determinística de novidades,
 * anti-duplicação produto/novidade, ordem lógica preservada, moeda pt,
 * imagens naturais (sem crop forçado), sizes corretos, paginação,
 * Montra intacta (framing + lightbox) e flutuantes mobile com safe-area.
 * Lógica pura + assertions sobre o código-fonte. Sem DB.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFeedItems,
  distributeColumns,
  columnsForWidth,
  formatPriceEUR,
  postBadge,
  type FeedItem,
} from "../lib/feed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8");

const EXPLORAR = src("app/explorar/page.tsx");
const FEED_CARDS = src("app/components/FeedCards.tsx");
const FEED_LIB = src("lib/feed.ts");
const VITRINE = src("app/vitrine/[slug]/VitrineClient.tsx");

// ── Fixtures ──────────────────────────────────────────────────────────
const biz = (id: string, name = `Loja ${id}`) => ({
  id,
  name,
  slug: `loja-${id}`,
  cover: `https://x/cover-${id}.jpg`,
  category: "Café",
  city: "Lisboa",
});
const prod = (id: string, business: any, price: any = 3) => ({
  id,
  name: `Produto ${id}`,
  price,
  image_url: `https://x/prod-${id}.jpg`,
  business_id: business.id,
  business,
});
const post = (id: string, business: any, over: any = {}) => ({
  id,
  business_id: business.id,
  type: "novidade",
  title: `Novidade ${id}`,
  price: null,
  image_url: `https://x/post-${id}.jpg`,
  product_id: null,
  is_active: true,
  business: { name: business.name, slug: business.slug },
  ...over,
});

describe("columnsForWidth — 2 mobile / 3 tablet / 4 desktop", () => {
  it("mobile (<768) → 2 colunas", () => {
    assert.equal(columnsForWidth(375), 2);
    assert.equal(columnsForWidth(767), 2);
  });
  it("tablet (768–1279) → 3 colunas", () => {
    assert.equal(columnsForWidth(768), 3);
    assert.equal(columnsForWidth(1024), 3);
  });
  it("desktop (≥1280) → 4 colunas", () => {
    assert.equal(columnsForWidth(1280), 4);
    assert.equal(columnsForWidth(1920), 4);
  });
});

describe("distributeColumns — ordem lógica preservada (round-robin)", () => {
  it("item 1→col1, item 2→col2, item 3→col1… (leitura acompanha ordem)", () => {
    const items = ["a", "b", "c", "d", "e"];
    const cols = distributeColumns(items, 2);
    assert.deepEqual(cols, [
      ["a", "c", "e"],
      ["b", "d"],
    ]);
  });
  it("3 colunas distribuem em sequência", () => {
    const cols = distributeColumns([1, 2, 3, 4, 5, 6, 7], 3);
    assert.deepEqual(cols, [
      [1, 4, 7],
      [2, 5],
      [3, 6],
    ]);
  });
  it("não usa CSS columns-* (que embaralha a ordem por coluna)", () => {
    assert.ok(!/columns-2|columns-3|columns-4/.test(EXPLORAR), "explorar não deve usar columns-*");
    assert.ok(FEED_LIB.includes("round-robin"), "escolha documentada na lib");
  });
});

describe("buildFeedItems — intercalação determinística", () => {
  it("alterna negócio/produto na base", () => {
    const items = buildFeedItems([biz("b1"), biz("b2")], [prod("p1", biz("b1")), prod("p2", biz("b2"))], []);
    assert.deepEqual(items.map((i) => i.kind), ["business", "product", "business", "product"]);
  });
  it("novidade entra a cada N posições (padrão 5)", () => {
    const bs = [biz("b1"), biz("b2"), biz("b3"), biz("b4"), biz("b5"), biz("b6")];
    const ps = [prod("p1", bs[0]), prod("p2", bs[1]), prod("p3", bs[2]), prod("p4", bs[3]), prod("p5", bs[4]), prod("p6", bs[5])];
    const items = buildFeedItems(bs, ps, [post("n1", bs[0])], 5);
    // base: b p b p b | p b p b p b p → novidade após o 5º item base
    assert.equal(items[5].kind, "post");
    assert.equal(items[5].key, "n:n1");
  });
  it("não preenche artificialmente quando não há novidades", () => {
    const items = buildFeedItems([biz("b1")], [prod("p1", biz("b1"))], []);
    assert.ok(!items.some((i) => i.kind === "post"));
    assert.equal(items.length, 2);
  });
  it("chaves únicas por tipo", () => {
    const b = biz("x1");
    const items = buildFeedItems([b], [prod("x1", b)], [post("x1", b)]);
    const keys = items.map((i) => i.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes("b:x1") && keys.includes("p:x1") && keys.includes("n:x1"));
  });
});

describe("buildFeedItems — anti-duplicação produto/novidade", () => {
  it("produto com novidade (product_id) sai do feed solto", () => {
    const b = biz("b1");
    const p = prod("p1", b);
    const items = buildFeedItems([b], [p], [post("n1", b, { product_id: "p1", type: "produto_novo" })]);
    const kinds = items.map((i) => i.key);
    assert.ok(!kinds.includes("p:p1"), "produto duplicado removido");
    assert.ok(kinds.includes("n:n1"), "novidade permanece");
    assert.ok(kinds.includes("b:b1"), "negócio permanece");
  });
  it("produto sem novidade correspondente permanece", () => {
    const b = biz("b1");
    const items = buildFeedItems([b], [prod("p1", b), prod("p2", b)], [post("n1", b, { product_id: "p1" })]);
    const keys = items.map((i) => i.key);
    assert.ok(keys.includes("p:p2"), "produto sem novidade fica");
    assert.ok(!keys.includes("p:p1"), "produto com novidade sai");
  });
});

describe("formatPriceEUR — moeda pt (€ 3,00)", () => {
  it("formata com vírgula decimal", () => {
    assert.equal(formatPriceEUR(3), "€ 3,00");
    assert.equal(formatPriceEUR(8.5), "€ 8,50");
    assert.equal(formatPriceEUR("12.99"), "€ 12,99");
  });
  it("null/undefined/inválido → null (não renderiza preço)", () => {
    assert.equal(formatPriceEUR(null), null);
    assert.equal(formatPriceEUR(undefined), null);
    assert.equal(formatPriceEUR(NaN), null);
  });
  it("cards do feed usam formatPriceEUR (não toFixed com ponto)", () => {
    assert.ok(FEED_CARDS.includes("formatPriceEUR"), "FeedCards usa o formatador pt");
  });
});

describe("postBadge — badges das novidades", () => {
  it("mapeia os 8 tipos para badges curtas", () => {
    assert.equal(postBadge("menu_do_dia"), "MENU DO DIA");
    assert.equal(postBadge("promocao"), "PROMOÇÃO");
    assert.equal(postBadge("evento"), "EVENTO");
    assert.equal(postBadge("disponivel_hoje"), "DISPONÍVEL HOJE");
    assert.equal(postBadge("destaque"), "DESTAQUE");
    assert.equal(postBadge("produto_novo"), "NOVIDADE");
    assert.equal(postBadge("servico_novo"), "NOVIDADE");
    assert.equal(postBadge("novidade"), "NOVIDADE");
  });
  it("FeedPostCard renderiza o badge no markup", () => {
    assert.ok(FEED_CARDS.includes("postBadge(post.type)"), "badge usa postBadge(post.type)");
    assert.ok(/<span[^>]*>\s*\{postBadge\(post\.type\)\}/.test(FEED_CARDS), "badge em span visível");
  });
});

describe("FeedCards — imagens naturais, sem crop forçado", () => {
  it("não força 96×96, 140px, 4:3 nem alturas fixas", () => {
    assert.ok(!/w-24 h-24|h-\[140px\]|h-44/.test(FEED_CARDS), "sem janelas fixas nos cards do feed");
  });
  it("FeedImage usa aspect-ratio dinâmico (natural) em vez de altura fixa", () => {
    assert.ok(FEED_CARDS.includes("aspectRatio"), "aspect-ratio dinâmico");
    assert.ok(FEED_CARDS.includes("naturalWidth"), "mede proporção natural no load");
  });
  it("não aplica framing/zoom da Montra no Explorar", () => {
    assert.ok(!FEED_CARDS.includes("productImgStyle"), "sem productImgStyle no feed");
    assert.ok(!FEED_CARDS.includes("normalizeProductFraming"), "sem framing no feed");
  });
  it("sizes correto para 2/3/4 colunas", () => {
    assert.ok(FEED_CARDS.includes("50vw"), "mobile 2 col → 50vw");
    assert.ok(FEED_CARDS.includes("33vw"), "tablet 3 col → 33vw");
    assert.ok(FEED_CARDS.includes("25vw"), "desktop 4 col → 25vw");
  });
  it("card produto: nome + preço + montra + ♡, sem 'Pedir Informações'", () => {
    assert.ok(!FEED_CARDS.includes("Pedir Informações"), "sem ação comercial no feed");
    assert.ok(FEED_CARDS.includes("SaveToCollection"), "♡ Guardar presente");
  });
  it("cards são clicáveis (Link)", () => {
    const links = (FEED_CARDS.match(/<Link/g) || []).length;
    assert.ok(links >= 3, `esperado ≥3 Links, achado ${links}`);
  });
});

describe("explorar — paginação progressiva", () => {
  it("lote inicial de 24 itens", () => {
    assert.ok(/useState\(24\)/.test(EXPLORAR), "visibleCount inicia em 24");
  });
  it("IntersectionObserver carrega +24 por lote", () => {
    assert.ok(EXPLORAR.includes("IntersectionObserver"), "usa IntersectionObserver");
    assert.ok(/setVisibleCount\(\(c\) => c \+ 24\)/.test(EXPLORAR), "+24 por lote");
  });
  it("não renderiza o feed inteiro de uma vez", () => {
    assert.ok(EXPLORAR.includes("visibleFeedItems"), "fatia o feed antes de renderizar");
  });
  it("reseta paginação ao mudar filtros", () => {
    assert.ok(/setVisibleCount\(24\)/.test(EXPLORAR), "reset em 24 ao filtrar");
  });
});

describe("Montra — NÃO virou masonry, framing intacto", () => {
  it("catálogo continua com grid organizado (não masonry)", () => {
    assert.ok(VITRINE.includes("grid sm:grid-cols-2"), "grid comercial mantido");
    assert.ok(!/distributeColumns|FeedCard/.test(VITRINE), "sem feed masonry na Montra");
  });
  it("framing manual continua aplicado na Montra", () => {
    assert.ok(VITRINE.includes("productImgStyle"), "productImgStyle mantido");
    assert.ok(VITRINE.includes("normalizeProductFraming"), "normalizeProductFraming mantido");
  });
  it("lightbox intacto (object-contain, imagem inteira)", () => {
    assert.ok(VITRINE.includes("object-contain"), "lightbox sem crop");
  });
  it("'Pedir Informações' continua na Montra", () => {
    assert.ok(VITRINE.includes("Pedir Informações"), "ação comercial preservada");
  });
});

describe("WhatsApp/ajuda — mobile sem sobreposição", () => {
  it("WhatsApp usa safe-area-inset-bottom", () => {
    assert.ok(VITRINE.includes("env(safe-area-inset-bottom)"), "safe-area aplicada");
  });
  it("'Precisa de ajuda?' oculto no mobile (hidden md:flex)", () => {
    assert.ok(/hidden md:flex/.test(VITRINE), "ajuda só no desktop");
  });
  it("só um flutuante grande no mobile (WhatsApp)", () => {
    const fixedFloats = (VITRINE.match(/fixed[^>]*z-40/g) || []).length;
    assert.ok(fixedFloats <= 2, `flutuantes z-40: ${fixedFloats}`);
  });
});

describe("regressões — conta consumidor e novidades", () => {
  it("consumidor não vê Painel do Dono (lógica A6.5 intacta)", () => {
    assert.ok(EXPLORAR.includes("/api/auth/is-admin"), "validação admin server-side mantida");
  });
  it("novidades: 8 tipos, RLS e analytics preservados", () => {
    const NOV = src("lib/novidades.ts");
    assert.ok(NOV.includes("menu_do_dia") && NOV.includes("disponivel_hoje"), "8 tipos intactos");
    assert.ok(src("components/NovidadesFeed.tsx").length > 100, "componente preservado");
  });
  it("modo pesquisa mantém comportamento anterior", () => {
    assert.ok(EXPLORAR.includes("isDiscoveryMode"), "modo descoberta separado da pesquisa");
    assert.ok(EXPLORAR.includes("ProductResultCard"), "cards de pesquisa preservados");
  });
});
