/**
 * tests/landing-sem-repeticoes.test.ts — LIMPEZA DE REPETIÇÕES da landing
 *
 * Auditoria de 21/10/2026 (research_notes/vitrinepro-repeticoes) confirmou
 * 7 repetições na página inicial. Estas guardas afirmam a composição
 * limpa aprovada: categorias apresentadas UMA vez na zona de descoberta
 * (cartões de setor), popup sem a 4.ª lista de categorias nem a proposta
 * repetida, "Criar Montra Grátis" só nos 3 sítios sancionados,
 * "Sem cartão de crédito" num único sítio (Planos) e o globo só na hero.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

const count = (src: string, needle: string) => src.split(needle).length - 1;

// Componentes efetivamente renderizados na home (app/page.tsx).
const RENDERED = [
  "components/landing/NavMockup.tsx",
  "components/landing/HeroMockup.tsx",
  "components/landing/DiscoverMockup.tsx",
  "components/landing/SectorsMockup.tsx",
  "components/landing/InfoMockup.tsx",
  "components/landing/PlansMockup.tsx",
  "components/landing/FaqMockup.tsx",
  "components/landing/FinalCtaMockup.tsx",
  "components/landing/FooterMockup.tsx",
  "app/components/LeadCapturePopup.tsx",
];

const SECTOR_NAMES = [
  "Restaurantes e Cafés",
  "Salões de Beleza",
  "Barbearias",
  "Lojas e Comércio",
  "Ginásios e Fitness",
  "Saúde e Bem-estar",
];

describe("R1 — categorias apresentadas uma vez na zona de descoberta", () => {
  it("a página NÃO compõe a faixa marquee de categorias", () => {
    const page = read("app/page.tsx");
    assert.ok(!page.includes("<MarqueeMockup"), "MarqueeMockup fora da home");
  });

  it("a pesquisa ficou e a linha de chips saiu do DiscoverMockup", () => {
    const src = read("components/landing/DiscoverMockup.tsx");
    assert.ok(src.includes("/explorar?q="), "pesquisa real → /explorar?q= mantida");
    assert.ok(src.includes('id="landing-search"'), "barra de pesquisa presente");
    assert.ok(!src.includes("CHIPS"), "sem lista de chips");
    assert.ok(!src.includes("Mais categorias"), "sem chip 'Mais categorias'");
    for (const name of SECTOR_NAMES) {
      assert.ok(!src.includes(name), `chip removido: ${name}`);
    }
  });

  it("os cartões de setor são a apresentação única das categorias", () => {
    const sectors = read("components/landing/SectorsMockup.tsx");
    for (const name of SECTOR_NAMES) {
      assert.equal(count(sectors, name), 1, `cartão único: ${name}`);
    }
    assert.ok(sectors.includes("Negócios reais."), "título da secção mantido");
    assert.ok(sectors.includes("/mockup-cantinho-da-lu.png"), "telemóvel da Cantinho mantido");
  });
});

describe("R3 — popup sem a 4.ª lista de categorias nem a proposta repetida", () => {
  it("LeadCapturePopup não tem lista de tipos de negócio", () => {
    const src = read("app/components/LeadCapturePopup.tsx");
    assert.ok(!src.includes("businessTypes"), "sem businessTypes");
    assert.ok(!src.includes("Tipo de negócio"), "sem campo 'Tipo de negócio'");
  });

  it("LeadCapturePopup não repete a proposta da página", () => {
    const src = read("app/components/LeadCapturePopup.tsx");
    assert.ok(!src.includes("em 5 minutos"), "sem a alegação dos 5 minutos");
    assert.ok(!src.includes("A sua vitrine digital"), "sem o eco do H1");
    assert.ok(!src.includes("Grátis para começar"), "sem o selo repetido");
    // continua funcional: formulário de lead intacto
    assert.ok(src.includes('from("leads")'), "continua a gravar leads");
    assert.ok(src.includes("DELAY_MS = 7000"), "abertura automática mantida");
  });
});

describe("R4 — 'Criar Montra Grátis' só nos 3 sítios sancionados", () => {
  it("navbar, hero e CTA final mantêm o texto; planos e popup não", () => {
    assert.ok(read("components/landing/NavMockup.tsx").includes("Criar Montra Grátis"));
    assert.ok(read("components/landing/HeroMockup.tsx").includes("Criar Montra Grátis"));
    assert.ok(read("components/landing/FinalCtaMockup.tsx").includes("Criar Montra Grátis"));
    const plans = read("components/landing/PlansMockup.tsx");
    assert.ok(!plans.includes("Criar Montra Grátis"), "planos sem o texto exato");
    assert.ok(plans.includes("Começar grátis"), "cartão Grátis com formulação distinta");
    assert.ok(!read("app/components/LeadCapturePopup.tsx").includes("Criar Montra Grátis"));
  });
});

describe("R5 — 'Sem cartão de crédito' num único sítio: os Planos", () => {
  it("ocorre exatamente 1 vez em todos os componentes renderizados", () => {
    let total = 0;
    let where = "";
    for (const file of RENDERED) {
      const src = read(file).toLowerCase();
      const n = count(src, "sem cartão de crédito");
      if (n > 0) where = file;
      total += n;
    }
    assert.equal(total, 1, "uma única ocorrência na landing inteira");
    assert.equal(where, "components/landing/PlansMockup.tsx", "e vive nos Planos");
  });
});

describe("R6 — o globo só na hero", () => {
  it("FinalCtaMockup não monta GlobeBackground; a hero mantém o seu", () => {
    assert.ok(!read("components/landing/FinalCtaMockup.tsx").includes("GlobeBackground"));
    assert.ok(read("components/landing/HeroMockup.tsx").includes("GlobeBackground"));
    // o fundo/brilho da secção final mantém-se
    assert.ok(read("components/landing/FinalCtaMockup.tsx").includes("radial-gradient(900px 400px"));
  });
});

describe("R7 — título final distinto do H1", () => {
  it("o H final não repete 'montra digital'; o H1 fica intacto", () => {
    assert.ok(!read("components/landing/FinalCtaMockup.tsx").toLowerCase().includes("montra digital"));
    assert.ok(read("components/landing/HeroMockup.tsx").includes("a sua montra digital"));
  });
});
