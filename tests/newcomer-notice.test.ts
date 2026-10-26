/**
 * tests/newcomer-notice.test.ts — Seleção da novidade do /explorar.
 *
 * Regra (lib/newcomer-notice.ts): novidade = published = true E
 * published_at nos últimos 7 dias E ainda não vista; a mais recente
 * primeiro; uma por vez; sem recentes → null (nada renderiza).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NEWCOMER_WINDOW_DAYS,
  NEWCOMER_SEEN_KEY,
  isRecentNewcomer,
  selectNewcomer,
  loadSeenIds,
  addSeenId,
  saveSeenIds,
  type NewcomerBusiness,
} from "../lib/newcomer-notice.ts";

const NOW = Date.parse("2026-10-26T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

const biz = (
  over: Partial<NewcomerBusiness> & { id: string }
): NewcomerBusiness => ({
  name: "Empresa",
  slug: "empresa",
  published: true,
  published_at: iso(NOW - DAY),
  ...over,
});

describe("isRecentNewcomer", () => {
  it("dentro da janela conta", () => {
    assert.equal(isRecentNewcomer(iso(NOW - DAY), NOW), true);
    assert.equal(isRecentNewcomer(iso(NOW - 6 * DAY - 23 * 60 * 60 * 1000), NOW), true);
  });

  it("exatamente no limite conta; além do limite não", () => {
    assert.equal(isRecentNewcomer(iso(NOW - NEWCOMER_WINDOW_DAYS * DAY), NOW), true);
    assert.equal(isRecentNewcomer(iso(NOW - NEWCOMER_WINDOW_DAYS * DAY - 1000), NOW), false);
    assert.equal(isRecentNewcomer(iso(NOW - 30 * DAY), NOW), false);
  });

  it("NULL, inválido e futuro absurdo não contam", () => {
    assert.equal(isRecentNewcomer(null, NOW), false);
    assert.equal(isRecentNewcomer(undefined, NOW), false);
    assert.equal(isRecentNewcomer("não-uma-data", NOW), false);
    assert.equal(isRecentNewcomer(iso(NOW + 60 * 60 * 1000), NOW), false);
  });

  it("futuro dentro da tolerância (relógio) conta", () => {
    assert.equal(isRecentNewcomer(iso(NOW + 60 * 1000), NOW), true);
  });
});

describe("selectNewcomer", () => {
  it("escolhe a mais recente", () => {
    const got = selectNewcomer(
      [
        biz({ id: "a", published_at: iso(NOW - 3 * DAY) }),
        biz({ id: "b", name: "Mais recente", slug: "mais-recente", published_at: iso(NOW - DAY) }),
        biz({ id: "c", published_at: iso(NOW - 2 * DAY) }),
      ],
      [],
      NOW
    );
    assert.equal(got?.id, "b");
    assert.equal(got?.name, "Mais recente");
    assert.equal(got?.slug, "mais-recente");
  });

  it("exclui não publicadas, sem data, antigas e já vistas", () => {
    const got = selectNewcomer(
      [
        biz({ id: "unpub", published: false }),
        biz({ id: "nodate", published_at: null }),
        biz({ id: "old", published_at: iso(NOW - 30 * DAY) }),
        biz({ id: "seen", published_at: iso(NOW - DAY) }),
      ],
      ["seen"],
      NOW
    );
    assert.equal(got, null);
  });

  it("exclui sem nome ou sem slug (nunca inventar link)", () => {
    const got = selectNewcomer(
      [
        biz({ id: "noname", name: "", published_at: iso(NOW - DAY) }),
        biz({ id: "noslug", slug: "", published_at: iso(NOW - DAY) }),
      ],
      [],
      NOW
    );
    assert.equal(got, null);
  });

  it("vazio → null; desempate por id é determinístico", () => {
    assert.equal(selectNewcomer([], [], NOW), null);
    const same = iso(NOW - DAY);
    const got = selectNewcomer(
      [biz({ id: "z", published_at: same }), biz({ id: "a", published_at: same })],
      [],
      NOW
    );
    assert.equal(got?.id, "a");
  });
});

describe("seen ids (localStorage)", () => {
  const mockStorage = () => {
    const store: Record<string, string> = {};
    return {
      store,
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
  };

  it("carrega lista válida; lixo → vazia", () => {
    const s = mockStorage();
    s.store[NEWCOMER_SEEN_KEY] = JSON.stringify(["a", "b"]);
    assert.deepEqual(loadSeenIds(s), ["a", "b"]);
    s.store[NEWCOMER_SEEN_KEY] = "lixo{";
    assert.deepEqual(loadSeenIds(s), []);
    s.store[NEWCOMER_SEEN_KEY] = JSON.stringify({ nao: "array" });
    assert.deepEqual(loadSeenIds(s), []);
    assert.deepEqual(loadSeenIds(null), []);
  });

  it("addSeenId acrescenta sem duplicar; save persiste JSON", () => {
    assert.deepEqual(addSeenId(["a"], "b"), ["a", "b"]);
    assert.deepEqual(addSeenId(["a", "b"], "a"), ["a", "b"]);
    const s = mockStorage();
    saveSeenIds(s, ["x", "y"]);
    assert.equal(s.store[NEWCOMER_SEEN_KEY], JSON.stringify(["x", "y"]));
    saveSeenIds(null, ["x"]); // não quebra sem storage
  });
});
