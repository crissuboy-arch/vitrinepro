/**
 * tests/a6-collections.test.ts — A6 "Favoritos → Coleções"
 *
 * Camada de domínio pura lib/collections.ts com uma fake store
 * em memória que replica as garantias do schema/RLS:
 *  - ownership estrita por user_id (como o RLS);
 *  - CHECK XOR business_id/product_id (como o CHECK do SQL);
 *  - UNIQUE(user_id, name) e unicidade por item (como os índices).
 *
 * Prova também que a camada NUNCA toca em public.favorites
 * (todas as operações passam por "collections"/"collection_items").
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COLLECTION_NAME,
  MAX_COLLECTION_NAME_LENGTH,
  CollectionsError,
  normalizeCollectionName,
  resolveItemKind,
  sortCollections,
  ensureDefaultCollection,
  getCollections,
  createCollection,
  renameCollection,
  saveItem,
  saveBusiness,
  saveProduct,
  removeItem,
  isSavedInAnyCollection,
  itemKindLabel,
  itemKindOfRow,
  type CollectionsStore,
  type CollectionRow,
  type CollectionItemRow,
  type ItemRef,
} from "../lib/collections.ts";

/** Fake store em memória com as mesmas garantias do schema/RLS. */
function makeFakeStore() {
  const tablesTouched = new Set<string>();
  let seq = 0;
  const collections = new Map<string, CollectionRow>();
  const items = new Map<string, CollectionItemRow>();
  const now = () => new Date().toISOString();

  const touch = (t: string) => tablesTouched.add(t);
  const owned = (userId: string, collectionId: string) => {
    const c = collections.get(collectionId);
    if (!c || c.user_id !== userId) throw new CollectionsError("not found");
    return c;
  };

  const store: CollectionsStore = {
    async listCollections(userId: string) {
      touch("collections");
      return [...collections.values()].filter((c) => c.user_id === userId);
    },
    async findDefaultCollection(userId: string) {
      touch("collections");
      return (
        [...collections.values()].find(
          (c) => c.user_id === userId && c.is_default
        ) ?? null
      );
    },
    async createCollection({ userId, name, isDefault }) {
      touch("collections");
      if ([...collections.values()].some((c) => c.user_id === userId && c.name === name))
        throw new CollectionsError("duplicate name");
      const row: CollectionRow = {
        id: `c${++seq}`,
        user_id: userId,
        name,
        is_default: !!isDefault,
        created_at: now(),
      };
      collections.set(row.id, row);
      return row;
    },
    async renameCollection(collectionId: string, userId: string, name: string) {
      touch("collections");
      const c = owned(userId, collectionId);
      if ([...collections.values()].some((o) => o.user_id === userId && o.name === name && o.id !== collectionId))
        throw new CollectionsError("duplicate name");
      c.name = name;
      return c;
    },
    async deleteCollection(collectionId: string, userId: string) {
      touch("collections");
      owned(userId, collectionId);
      collections.delete(collectionId);
      for (const [id, item] of items) {
        if (item.collection_id === collectionId) items.delete(id);
      }
    },
    async listItems(collectionId: string) {
      touch("collection_items");
      return [...items.values()].filter((i) => i.collection_id === collectionId);
    },
    async findItem(collectionId: string, ref: ItemRef) {
      touch("collection_items");
      return (
        [...items.values()].find(
          (i) =>
            i.collection_id === collectionId &&
            ((ref.businessId && i.business_id === ref.businessId) ||
              (ref.productId && i.product_id === ref.productId))
        ) ?? null
      );
    },
    async addItem({ collectionId, businessId, productId }) {
      touch("collection_items");
      const hasB = !!businessId;
      const hasP = !!productId;
      if (hasB === hasP) throw new CollectionsError("CHECK XOR violated");
      const row: CollectionItemRow = {
        id: `i${++seq}`,
        collection_id: collectionId,
        business_id: businessId ?? null,
        product_id: productId ?? null,
        created_at: now(),
      };
      items.set(row.id, row);
      return row;
    },
    async removeItem(itemId: string) {
      touch("collection_items");
      items.delete(itemId);
    },
  };
  return { store, tablesTouched };
}

const U1 = "user-1";
const U2 = "user-2";
const BIZ = "biz-1";
const PROD = "prod-1";

describe("A6 — nomes de coleção", () => {
  it("normaliza espaços e rejeita vazio", () => {
    assert.equal(normalizeCollectionName("  Onde   comer "), "Onde comer");
    assert.throws(() => normalizeCollectionName("   "), CollectionsError);
    assert.throws(
      () => normalizeCollectionName("x".repeat(MAX_COLLECTION_NAME_LENGTH + 1)),
      CollectionsError
    );
  });
});

describe("A6 — referência de item (XOR)", () => {
  it("aceita negócio OU produto", () => {
    assert.equal(resolveItemKind({ businessId: BIZ }), "business");
    assert.equal(resolveItemKind({ productId: PROD }), "product");
  });
  it("rejeita ambos ou nenhum", () => {
    assert.throws(
      () => resolveItemKind({ businessId: BIZ, productId: PROD }),
      CollectionsError
    );
    assert.throws(() => resolveItemKind({}), CollectionsError);
    assert.throws(
      () => resolveItemKind({ businessId: null, productId: null }),
      CollectionsError
    );
  });
});

describe("A6 — CRUD de coleções", () => {
  it("cria, lista ordenada (padrão primeiro), renomeia e exclui", async () => {
    const { store } = makeFakeStore();
    const zeta = await createCollection(store, U1, "Zeta");
    const alfa = await createCollection(store, U1, "Alfa");
    assert.equal(zeta.is_default, false);

    const listed = await getCollections(store, U1);
    assert.deepEqual(listed.map((c) => c.name), ["Alfa", "Zeta"]);

    const renamed = await renameCollection(store, U1, alfa.id, "  Beta ");
    assert.equal(renamed.name, "Beta");

    await store.deleteCollection(zeta.id, U1);
    assert.deepEqual((await getCollections(store, U1)).map((c) => c.name), ["Beta"]);
  });

  it("nomes duplicados por utilizador são rejeitados", async () => {
    const { store } = makeFakeStore();
    await createCollection(store, U1, "Festa");
    await assert.rejects(() => createCollection(store, U1, "Festa"), CollectionsError);
    // outro utilizador pode usar o mesmo nome
    await createCollection(store, U2, "Festa");
  });
});

describe("A6 — coleção padrão", () => {
  it("ensureDefaultCollection cria uma vez e reutiliza (máx. 1 por utilizador)", async () => {
    const { store } = makeFakeStore();
    const first = await ensureDefaultCollection(store, U1);
    assert.equal(first.name, DEFAULT_COLLECTION_NAME);
    assert.equal(first.is_default, true);

    const second = await ensureDefaultCollection(store, U1);
    assert.equal(second.id, first.id);

    const all = await store.listCollections(U1);
    assert.equal(all.filter((c) => c.is_default).length, 1);
  });

  it("padrão de outro utilizador é independente", async () => {
    const { store } = makeFakeStore();
    const a = await ensureDefaultCollection(store, U1);
    const b = await ensureDefaultCollection(store, U2);
    assert.notEqual(a.id, b.id);
  });
});

describe("A6 — itens: Montra e Produto", () => {
  it("adiciona e remove Montra", async () => {
    const { store } = makeFakeStore();
    const col = await createCollection(store, U1, "Onde comer");
    const { item, created } = await saveBusiness(store, col.id, BIZ);
    assert.equal(created, true);
    assert.equal(item.business_id, BIZ);
    assert.equal(item.product_id, null);
    assert.equal(itemKindOfRow(item), "business");
    assert.equal(itemKindLabel("business"), "Montra");

    await removeItem(store, item.id);
    assert.equal((await store.listItems(col.id)).length, 0);
  });

  it("adiciona e remove produto", async () => {
    const { store } = makeFakeStore();
    const col = await createCollection(store, U1, "Quero comprar");
    const { item, created } = await saveProduct(store, col.id, PROD);
    assert.equal(created, true);
    assert.equal(item.product_id, PROD);
    assert.equal(itemKindOfRow(item), "product");
    assert.equal(itemKindLabel("product"), "Produto");

    await removeItem(store, item.id);
    assert.equal((await store.listItems(col.id)).length, 0);
  });

  it("duplicação é impedida (idempotente)", async () => {
    const { store } = makeFakeStore();
    const col = await createCollection(store, U1, "Festa");
    const r1 = await saveBusiness(store, col.id, BIZ);
    const r2 = await saveBusiness(store, col.id, BIZ);
    assert.equal(r1.created, true);
    assert.equal(r2.created, false);
    assert.equal(r2.item.id, r1.item.id);
    assert.equal((await store.listItems(col.id)).length, 1);
  });

  it("item nunca é simultaneamente negócio + produto", async () => {
    const { store } = makeFakeStore();
    const col = await createCollection(store, U1, "Festa");
    await assert.rejects(
      () => saveItem(store, col.id, { businessId: BIZ, productId: PROD }),
      CollectionsError
    );
    await assert.rejects(() => saveItem(store, col.id, {}), CollectionsError);
    assert.equal((await store.listItems(col.id)).length, 0);
  });

  it("o mesmo item pode estar em várias coleções", async () => {
    const { store } = makeFakeStore();
    const a = await createCollection(store, U1, "A");
    const b = await createCollection(store, U1, "B");
    await saveBusiness(store, a.id, BIZ);
    await saveProduct(store, b.id, PROD);
    assert.equal((await store.listItems(a.id)).length, 1);
    assert.equal((await store.listItems(b.id)).length, 1);
  });
});

describe("A6 — isolamento e privacidade", () => {
  it("utilizador não acessa coleção alheia", async () => {
    const { store } = makeFakeStore();
    const col = await createCollection(store, U1, "Privada");
    await assert.rejects(() => renameCollection(store, U2, col.id, "Hack"), CollectionsError);
    await assert.rejects(() => store.deleteCollection(col.id, U2), CollectionsError);
    assert.deepEqual(await getCollections(store, U2), []);
  });

  it("coleções são privadas por padrão (só via user_id)", async () => {
    const { store } = makeFakeStore();
    await createCollection(store, U1, "Só minha");
    // não existe nenhum caminho público: listagem exige userId
    assert.equal((await store.listCollections(U2)).length, 0);
  });
});

describe("A6 — isSavedInAnyCollection", () => {
  it("deteta item guardado em qualquer coleção", async () => {
    const { store } = makeFakeStore();
    const col = await ensureDefaultCollection(store, U1);
    assert.equal(await isSavedInAnyCollection(store, U1, { businessId: BIZ }), false);
    await saveBusiness(store, col.id, BIZ);
    assert.equal(await isSavedInAnyCollection(store, U1, { businessId: BIZ }), true);
    assert.equal(await isSavedInAnyCollection(store, U1, { productId: PROD }), false);
    assert.equal(await isSavedInAnyCollection(store, U2, { businessId: BIZ }), false);
  });
});

describe("A6 — compatibilidade com favoritos antigos", () => {
  it("a camada de coleções NUNCA toca em public.favorites", async () => {
    const { store, tablesTouched } = makeFakeStore();
    const col = await ensureDefaultCollection(store, U1);
    await createCollection(store, U1, "Festa");
    await saveBusiness(store, col.id, BIZ);
    await saveProduct(store, col.id, PROD);
    await renameCollection(store, U1, col.id, DEFAULT_COLLECTION_NAME);
    await getCollections(store, U1);
    await isSavedInAnyCollection(store, U1, { businessId: BIZ });
    const item = await store.findItem(col.id, { businessId: BIZ });
    await removeItem(store, item!.id);
    await store.deleteCollection(col.id, U1);

    assert.ok(!tablesTouched.has("favorites"), "favorites foi tocada!");
    assert.deepEqual([...tablesTouched].sort(), ["collection_items", "collections"]);
  });
});

describe("A6 — ordenação", () => {
  it("padrão primeiro, resto alfabético (pt)", () => {
    const rows = [
      { id: "1", user_id: U1, name: "Zeta", is_default: false, created_at: "" },
      { id: "2", user_id: U1, name: "alfa", is_default: false, created_at: "" },
      { id: "3", user_id: U1, name: "Favoritos", is_default: true, created_at: "" },
    ];
    assert.deepEqual(sortCollections(rows).map((c) => c.name), [
      "Favoritos",
      "alfa",
      "Zeta",
    ]);
  });
});
