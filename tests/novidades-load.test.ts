/**
 * tests/novidades-load.test.ts — A10.5 "Novidades travadas"
 *
 * Testa loadNovidadesState (lib/novidades.ts) com cliente mockado:
 * - negócio sem novidades → full, lista vazia
 * - negócio com novidades → full, lista populada
 * - coluna inexistente → recuo para legacy
 * - legacy também falha → unavailable + erro legível
 * - fetch que nunca resolve → timeout → unavailable (o bug: loading eterno)
 * - 401/403 → unavailable + erro legível (NÃO tenta legacy)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loadNovidadesState,
  NOVIDADES_FULL_SELECT,
  NOVIDADES_LEGACY_SELECT,
  type NovidadesDbClient,
} from "../lib/novidades.ts";

type QueryResult = { data: unknown; error: { message?: string; code?: string } | null };

function mockClient(behavior: (columns: string) => PromiseLike<QueryResult> | QueryResult): NovidadesDbClient {
  return {
    from(table: string) {
      assert.equal(table, "business_posts");
      return {
        select(columns: string) {
          return {
            eq(column: string, value: string) {
              assert.equal(column, "business_id");
              assert.ok(value);
              return {
                order(c: string) {
                  assert.equal(c, "created_at");
                  return behavior(columns);
                },
              };
            },
          };
        },
      };
    },
  };
}

const ok = (data: unknown): QueryResult => ({ data, error: null });
const err = (message: string, code?: string): QueryResult => ({ data: null, error: { message, code } });
const never: PromiseLike<QueryResult> = new Promise(() => {});

describe("A10.5 — loadNovidadesState", () => {
  it("negócio sem novidades → full, lista vazia, sem erro", async () => {
    const client = mockClient(() => ok([]));
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 1000 });
    assert.equal(r.mode, "full");
    assert.deepEqual(r.rows, []);
    assert.equal(r.error, null);
  });

  it("negócio com novidades → full, lista populada", async () => {
    const rows = [
      { id: "n1", title: "Promo", is_active: true },
      { id: "n2", title: "Evento", is_active: false },
    ];
    const client = mockClient(() => ok(rows));
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 1000 });
    assert.equal(r.mode, "full");
    assert.equal(r.rows.length, 2);
    assert.equal(r.error, null);
  });

  it("coluna inexistente no full → recua para legacy", async () => {
    const seen: string[] = [];
    const client = mockClient((columns: string) => {
      seen.push(columns);
      if (columns === NOVIDADES_FULL_SELECT) {
        return err("column business_posts.price does not exist", "42703");
      }
      return ok([{ id: "n1", title: "Antiga" }]);
    });
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 1000 });
    assert.equal(r.mode, "legacy");
    assert.ok(seen.includes(NOVIDADES_LEGACY_SELECT), "tentou o select legado");
    assert.equal(r.rows.length, 1);
  });

  it("legacy também falha → unavailable + erro legível", async () => {
    const client = mockClient(() => err("relation \"business_posts\" does not exist", "42P01"));
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 1000 });
    assert.equal(r.mode, "unavailable");
    assert.deepEqual(r.rows, []);
    assert.ok(r.error && r.error.length > 0, "erro legível presente");
  });

  it("fetch que nunca resolve → timeout → unavailable (nunca 'loading' eterno)", async () => {
    const client = mockClient(() => never);
    const start = Date.now();
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 100 });
    const elapsed = Date.now() - start;
    assert.equal(r.mode, "unavailable");
    assert.ok(elapsed < 5000, `terminou em ${elapsed}ms (timeout funcionou)`);
    assert.ok(r.error && /tempo esgotado/i.test(r.error), "mensagem de timeout legível");
  });

  it("401/403 → unavailable direto, sem tentar legacy", async () => {
    const seen: string[] = [];
    const client = mockClient((columns: string) => {
      seen.push(columns);
      return err("Unauthorized", "401");
    });
    const r = await loadNovidadesState(client, "biz-1", { timeoutMs: 1000 });
    assert.equal(r.mode, "unavailable");
    assert.equal(seen.length, 1, "não tentou o select legado para erro de auth");
    assert.ok(r.error && /Unauthorized/.test(r.error));
  });
});
