/**
 * tests/published-at.test.ts — Carimbo da PRIMEIRA publicação.
 *
 * Regra (lib/published-at.ts):
 *   * Criação com published = true  → carimba agora.
 *   * Transição false → true       → carimba agora, SÓ se ainda NULL.
 *   * Republicação (já tem valor)  → NUNCA sobrescrever.
 *   * Despublicar (→ false)        → nunca carimbar.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  creationPublishStamp,
  togglePublishPatch,
} from "../lib/published-at.ts";

const NOW = "2026-10-26T12:00:00.000Z";
const OLD = "2026-10-01T09:00:00.000Z";

describe("creationPublishStamp", () => {
  it("criação publicada carimba agora", () => {
    assert.equal(creationPublishStamp(true, NOW), NOW);
  });

  it("criação em rascunho não carimba", () => {
    assert.equal(creationPublishStamp(false, NOW), null);
    assert.equal(creationPublishStamp(undefined, NOW), null);
    assert.equal(creationPublishStamp(null, NOW), null);
  });
});

describe("togglePublishPatch", () => {
  it("false → true com NULL carimba agora", () => {
    assert.deepEqual(
      togglePublishPatch({ published: false, published_at: null }, true, NOW),
      { published: true, published_at: NOW }
    );
  });

  it("false → true com valor existente NÃO sobrescreve", () => {
    assert.deepEqual(
      togglePublishPatch({ published: false, published_at: OLD }, true, NOW),
      { published: true }
    );
  });

  it("publicar quando já está publicado NÃO carimba", () => {
    assert.deepEqual(
      togglePublishPatch({ published: true, published_at: null }, true, NOW),
      { published: true }
    );
    assert.deepEqual(
      togglePublishPatch({ published: true, published_at: OLD }, true, NOW),
      { published: true }
    );
  });

  it("despublicar nunca carimba", () => {
    assert.deepEqual(
      togglePublishPatch({ published: true, published_at: OLD }, false, NOW),
      { published: false }
    );
    assert.deepEqual(
      togglePublishPatch({ published: true, published_at: null }, false, NOW),
      { published: false }
    );
  });

  it("manter despublicado nunca carimba", () => {
    assert.deepEqual(
      togglePublishPatch({ published: false, published_at: null }, false, NOW),
      { published: false }
    );
  });
});
