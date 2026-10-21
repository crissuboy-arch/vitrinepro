/**
 * tests/explore-nav-context.test.ts — Contexto de navegação Explorar → Montra.
 *
 * Cobre o ciclo de vida completo (lib/explore-nav.ts):
 *  - gravar/lê com o estado intacto;
 *  - validação estrita (JSON inválido, versão errada, campos em falta);
 *  - expiração por TTL;
 *  - apresentação única na Montra (claim): slug correspondente, uma vez;
 *  - visita direta posterior no mesmo separador NÃO herda o contexto;
 *  - consumo único pelo Explorar (restauro), mesmo depois da apresentação.
 * Lógica pura com Storage falso em memória. Sem DB, sem browser.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EXPLORE_NAV_TTL_MS,
  saveExploreNavContext,
  readExploreNavContext,
  claimExploreNavPresentation,
  consumeExploreNavContext,
  clearExploreNavContext,
  parseExploreNavContext,
  type ExploreNavState,
  type ExploreNavStorage,
} from "../lib/explore-nav.ts";

class MemoryStorage implements ExploreNavStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const T0 = 1_700_000_000_000;

const STATE: ExploreNavState = {
  searchQuery: "coxinha",
  selectedCategory: "Restaurantes",
  selectedCity: "Águeda",
  selectedCommunity: "brasileira",
  sortMode: "relevance",
  needToday: true,
  maxDistanceKm: null,
  visibleCount: 48,
  scrollY: 1320,
};

describe("explore-nav: gravar e ler", () => {
  it("grava e lê o contexto com o estado intacto", () => {
    const s = new MemoryStorage();
    const saved = saveExploreNavContext("cantinho-da-lu-1780338635504", STATE, s, T0);
    assert.ok(saved);
    assert.equal(saved.targetSlug, "cantinho-da-lu-1780338635504");
    assert.ok(saved.id.length > 0);
    const read = readExploreNavContext(s, T0 + 1000);
    assert.ok(read);
    assert.deepEqual(read.state, STATE);
    assert.equal(read.id, saved.id);
  });

  it("gravar um novo contexto substitui o anterior e volta a poder ser apresentado", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 10), true);
    // Novo clique no Explorar (outra Montra): contexto novo, apresentação nova.
    saveExploreNavContext("cantinho-da-lu-1780338635504", STATE, s, T0 + 20);
    assert.equal(claimExploreNavPresentation("cantinho-da-lu-1780338635504", s, T0 + 30), true);
  });

  it("sem contexto gravado, ler devolve null", () => {
    const s = new MemoryStorage();
    assert.equal(readExploreNavContext(s, T0), null);
    assert.equal(consumeExploreNavContext(s, T0), null);
    assert.equal(claimExploreNavPresentation("qualquer", s, T0), false);
  });
});

describe("explore-nav: validação e expiração", () => {
  it("contexto expirado (além do TTL) é ignorado e apagado", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    const later = T0 + EXPLORE_NAV_TTL_MS + 1;
    assert.equal(readExploreNavContext(s, later), null);
    // Foi apagado: nem com relógio "para trás" volta.
    assert.equal(readExploreNavContext(s, T0), null);
  });

  it("contexto dentro do TTL continua válido", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.ok(readExploreNavContext(s, T0 + EXPLORE_NAV_TTL_MS - 1000));
  });

  it("JSON corrupto → null e limpeza", () => {
    const s = new MemoryStorage();
    s.setItem("vp:explore-nav", "{não é json");
    assert.equal(readExploreNavContext(s, T0), null);
    assert.equal(s.getItem("vp:explore-nav"), null);
  });

  it("versão desconhecida → null", () => {
    const raw = JSON.stringify({ v: 99, id: "x", targetSlug: "a", savedAt: T0, state: STATE });
    assert.equal(parseExploreNavContext(raw, T0), null);
  });

  it("estado com campos inválidos → null", () => {
    const bad = JSON.stringify({
      v: 1,
      id: "x",
      targetSlug: "a",
      savedAt: T0,
      state: { ...STATE, scrollY: -5 },
    });
    assert.equal(parseExploreNavContext(bad, T0), null);
    const bad2 = JSON.stringify({
      v: 1,
      id: "x",
      targetSlug: "a",
      savedAt: T0,
      state: { ...STATE, sortMode: "magia" },
    });
    assert.equal(parseExploreNavContext(bad2, T0), null);
  });
});

describe("explore-nav: apresentação na Montra (claim)", () => {
  it("slug correspondente e fresco → apresenta uma vez", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 500), true);
  });

  it("segunda apresentação do mesmo contexto (visita direta posterior) → false e contexto limpo", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 500), true);
    // Reload / URL digitado / avançar no histórico: nova montagem, mesmo separador.
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 600), false);
    assert.equal(readExploreNavContext(s, T0 + 700), null);
  });

  it("slug diferente → false SEM destruir o contexto", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(claimExploreNavPresentation("cantinho-da-lu-1780338635504", s, T0 + 500), false);
    // O contexto continua válido para o destino certo / restauro no Explorar.
    assert.ok(readExploreNavContext(s, T0 + 600));
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 700), true);
  });

  it("contexto expirado → claim false", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(
      claimExploreNavPresentation("turma-da-monica", s, T0 + EXPLORE_NAV_TTL_MS + 1),
      false
    );
  });
});

describe("explore-nav: consumo pelo Explorar (restauro)", () => {
  it("consome uma única vez e devolve o estado gravado", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("cantinho-da-lu-1780338635504", STATE, s, T0);
    const ctx = consumeExploreNavContext(s, T0 + 1000);
    assert.ok(ctx);
    assert.deepEqual(ctx.state, STATE);
    assert.equal(consumeExploreNavContext(s, T0 + 2000), null);
    assert.equal(readExploreNavContext(s, T0 + 2000), null);
  });

  it("consumo continua possível depois de a Montra ter apresentado o botão", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    assert.equal(claimExploreNavPresentation("turma-da-monica", s, T0 + 100), true);
    // Visitante usa "← Voltar ao Explorar" (ou o botão atrás do browser):
    // o Explorar monta e precisa do estado — a apresentação não o consome.
    const ctx = consumeExploreNavContext(s, T0 + 200);
    assert.ok(ctx);
    assert.equal(ctx.targetSlug, "turma-da-monica");
  });

  it("clear apaga contexto e marca de apresentação", () => {
    const s = new MemoryStorage();
    saveExploreNavContext("turma-da-monica", STATE, s, T0);
    claimExploreNavPresentation("turma-da-monica", s, T0 + 10);
    clearExploreNavContext(s);
    assert.equal(s.getItem("vp:explore-nav"), null);
    assert.equal(s.getItem("vp:explore-nav-presented"), null);
  });
});
