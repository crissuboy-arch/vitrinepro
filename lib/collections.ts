/**
 * lib/collections.ts — A6 "Favoritos → Coleções"
 *
 * Camada de domínio PURA (sem React, sem I/O, sem Supabase).
 * Regras de coleções vivem aqui para serem reutilizadas por
 * Web, iOS, Android e pela futura Intelligence Layer.
 *
 * A persistência real é injetada via `CollectionsStore`
 * (ver lib/collections-store.ts para o adapter Supabase).
 *
 * IMPORTANTE: public.favorites NÃO é tocado por esta camada.
 * O favorito tradicional (Montra, favorite_count, ranking)
 * continua exatamente como está.
 */

export const DEFAULT_COLLECTION_NAME = "Favoritos";
export const MAX_COLLECTION_NAME_LENGTH = 60;

export interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface CollectionItemRow {
  id: string;
  collection_id: string;
  business_id: string | null;
  product_id: string | null;
  created_at: string;
}

/** Referência a um item guardável: negócio OU produto, nunca ambos. */
export interface ItemRef {
  businessId?: string | null;
  productId?: string | null;
}

export type ItemKind = "business" | "product";

/**
 * Interface mínima de persistência. Qualquer plataforma
 * (web via Supabase, app nativo, etc.) implementa isto.
 */
export interface CollectionsStore {
  listCollections(userId: string): Promise<CollectionRow[]>;
  findDefaultCollection(userId: string): Promise<CollectionRow | null>;
  createCollection(input: {
    userId: string;
    name: string;
    isDefault?: boolean;
  }): Promise<CollectionRow>;
  renameCollection(
    collectionId: string,
    userId: string,
    name: string
  ): Promise<CollectionRow>;
  deleteCollection(collectionId: string, userId: string): Promise<void>;
  listItems(collectionId: string): Promise<CollectionItemRow[]>;
  findItem(
    collectionId: string,
    ref: ItemRef
  ): Promise<CollectionItemRow | null>;
  addItem(input: {
    collectionId: string;
    businessId?: string | null;
    productId?: string | null;
  }): Promise<CollectionItemRow>;
  removeItem(itemId: string): Promise<void>;
}

export class CollectionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollectionsError";
  }
}

/** Normaliza nome de coleção. Lança CollectionsError se inválido. */
export function normalizeCollectionName(raw: string): string {
  const name = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) throw new CollectionsError("O nome da coleção não pode estar vazio.");
  if (name.length > MAX_COLLECTION_NAME_LENGTH) {
    throw new CollectionsError(
      `O nome da coleção não pode ter mais de ${MAX_COLLECTION_NAME_LENGTH} caracteres.`
    );
  }
  return name;
}

/** Valida que a referência é exatamente um negócio OU um produto. */
export function resolveItemKind(ref: ItemRef): ItemKind {
  const hasBusiness = !!ref.businessId;
  const hasProduct = !!ref.productId;
  if (hasBusiness === hasProduct) {
    throw new CollectionsError(
      "O item deve ser um negócio OU um produto, nunca ambos nem nenhum."
    );
  }
  return hasBusiness ? "business" : "product";
}

/** Ordena: padrão primeiro, depois por nome (pt, case-insensitive). */
export function sortCollections(list: CollectionRow[]): CollectionRow[] {
  return [...list].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.name.localeCompare(b.name, "pt", { sensitivity: "base" });
  });
}

/**
 * Garante que existe no máximo UMA coleção padrão por utilizador.
 * Se já existir, devolve-a. Caso contrário cria-a.
 * (O schema não tem unique parcial em is_default; a garantia é
 *  feita aqui + UNIQUE(user_id, name) como rede de segurança.)
 */
export async function ensureDefaultCollection(
  store: CollectionsStore,
  userId: string,
  name: string = DEFAULT_COLLECTION_NAME
): Promise<CollectionRow> {
  const existing = await store.findDefaultCollection(userId);
  if (existing) return existing;
  return store.createCollection({
    userId,
    name: normalizeCollectionName(name),
    isDefault: true,
  });
}

/** Lista coleções do utilizador, já ordenadas. */
export async function getCollections(
  store: CollectionsStore,
  userId: string
): Promise<CollectionRow[]> {
  return sortCollections(await store.listCollections(userId));
}

/** Cria coleção (nome validado e normalizado). */
export async function createCollection(
  store: CollectionsStore,
  userId: string,
  rawName: string
): Promise<CollectionRow> {
  return store.createCollection({
    userId,
    name: normalizeCollectionName(rawName),
    isDefault: false,
  });
}

/** Renomeia coleção (nome validado e normalizado). */
export async function renameCollection(
  store: CollectionsStore,
  userId: string,
  collectionId: string,
  rawName: string
): Promise<CollectionRow> {
  return store.renameCollection(
    collectionId,
    userId,
    normalizeCollectionName(rawName)
  );
}

/**
 * Guarda um negócio ou produto numa coleção.
 * Idempotente: se o item já estiver na coleção, devolve-o sem duplicar.
 */
export async function saveItem(
  store: CollectionsStore,
  collectionId: string,
  ref: ItemRef
): Promise<{ item: CollectionItemRow; created: boolean }> {
  resolveItemKind(ref);
  const existing = await store.findItem(collectionId, ref);
  if (existing) return { item: existing, created: false };
  const item = await store.addItem({
    collectionId,
    businessId: ref.businessId ?? null,
    productId: ref.productId ?? null,
  });
  return { item, created: true };
}

export function saveBusiness(
  store: CollectionsStore,
  collectionId: string,
  businessId: string
): Promise<{ item: CollectionItemRow; created: boolean }> {
  return saveItem(store, collectionId, { businessId });
}

export function saveProduct(
  store: CollectionsStore,
  collectionId: string,
  productId: string
): Promise<{ item: CollectionItemRow; created: boolean }> {
  return saveItem(store, collectionId, { productId });
}

/** Remove um item de uma coleção. */
export async function removeItem(
  store: CollectionsStore,
  itemId: string
): Promise<void> {
  await store.removeItem(itemId);
}

/** Verifica se o item já está guardado em ALGUMA coleção do utilizador. */
export async function isSavedInAnyCollection(
  store: CollectionsStore,
  userId: string,
  ref: ItemRef
): Promise<boolean> {
  resolveItemKind(ref);
  const collections = await store.listCollections(userId);
  for (const c of collections) {
    const found = await store.findItem(c.id, ref);
    if (found) return true;
  }
  return false;
}

/** Rótulo de tipo para a UI diferenciar Montra de Produto. */
export function itemKindLabel(kind: ItemKind): string {
  return kind === "business" ? "Montra" : "Produto";
}

export function itemKindOfRow(row: CollectionItemRow): ItemKind {
  return row.business_id ? "business" : "product";
}
