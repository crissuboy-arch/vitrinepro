/**
 * lib/collections-store.ts — A6
 *
 * Adapter Supabase da camada de domínio lib/collections.ts.
 * Implementa `CollectionsStore` com o client browser (anon key);
 * a ownership é garantida pelo RLS (policies vp_collections_manage
 * e vp_collection_items_manage). NUNCA usa service_role.
 */

import { supabase } from "@/app/lib/supabase";
import type {
  CollectionsStore,
  CollectionRow,
  CollectionItemRow,
  ItemRef,
} from "./collections";

type Row = Record<string, unknown>;

function toCollection(r: Row): CollectionRow {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    name: String(r.name),
    is_default: r.is_default === true,
    created_at: String(r.created_at),
  };
}

function toItem(r: Row): CollectionItemRow {
  return {
    id: String(r.id),
    collection_id: String(r.collection_id),
    business_id: r.business_id != null ? String(r.business_id) : null,
    product_id: r.product_id != null ? String(r.product_id) : null,
    created_at: String(r.created_at),
  };
}

export function createSupabaseCollectionsStore(): CollectionsStore {
  return {
    async listCollections(userId: string) {
      const { data, error } = await supabase
        .from("collections")
        .select("id, user_id, name, is_default, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toCollection);
    },

    async findDefaultCollection(userId: string) {
      const { data, error } = await supabase
        .from("collections")
        .select("id, user_id, name, is_default, created_at")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle();
      if (error) throw error;
      return data ? toCollection(data) : null;
    },

    async createCollection({ userId, name, isDefault }) {
      const { data, error } = await supabase
        .from("collections")
        .insert({ user_id: userId, name, is_default: !!isDefault })
        .select("id, user_id, name, is_default, created_at")
        .single();
      if (error) throw error;
      return toCollection(data);
    },

    async renameCollection(collectionId: string, userId: string, name: string) {
      const { data, error } = await supabase
        .from("collections")
        .update({ name })
        .eq("id", collectionId)
        .eq("user_id", userId)
        .select("id, user_id, name, is_default, created_at")
        .single();
      if (error) throw error;
      return toCollection(data);
    },

    async deleteCollection(collectionId: string, userId: string) {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", userId);
      if (error) throw error;
    },

    async listItems(collectionId: string) {
      const { data, error } = await supabase
        .from("collection_items")
        .select("id, collection_id, business_id, product_id, created_at")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toItem);
    },

    async findItem(collectionId: string, ref: ItemRef) {
      let q = supabase
        .from("collection_items")
        .select("id, collection_id, business_id, product_id, created_at")
        .eq("collection_id", collectionId);
      q = ref.businessId
        ? q.eq("business_id", ref.businessId)
        : q.eq("product_id", ref.productId ?? "");
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data ? toItem(data as Row) : null;
    },

    async addItem({ collectionId, businessId, productId }) {
      const { data, error } = await supabase
        .from("collection_items")
        .insert({
          collection_id: collectionId,
          business_id: businessId ?? null,
          product_id: productId ?? null,
        })
        .select("id, collection_id, business_id, product_id, created_at")
        .single();
      if (error) throw error;
      return toItem(data);
    },

    async removeItem(itemId: string) {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
  };
}
