/* eslint-disable */
"use client";

/**
 * /favoritos — A6 "Favoritos → Coleções"
 *
 * Tabs:
 *  - ❤️ Favoritos: sistema tradicional (public.favorites) — preservado.
 *  - 📁 Minhas Coleções: CRUD de coleções (public.collections +
 *    public.collection_items), itens Montra ou Produto.
 *
 * A6 (correção A): fallbacks de category/city iguais aos do /explorar.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { createSupabaseCollectionsStore } from "@/lib/collections-store";
import { normalizeProductFraming, productImgStyle } from "@/lib/product-framing";
import {
  ensureDefaultCollection,
  getCollections,
  createCollection,
  renameCollection,
  removeItem,
  itemKindOfRow,
  type CollectionRow,
  type CollectionItemRow,
} from "@/lib/collections";

interface FavoriteBusiness {
  id: string;
  name: string;
  category?: string;
  category_id?: string;
  city?: string;
  city_id?: string;
  slug: string;
  logo_url?: string;
  cover_url?: string;
  rating_average?: number;
  description?: string;
  favorite_id: string;
}

interface EnrichedItem {
  item: CollectionItemRow;
  kind: "business" | "product";
  title: string;
  subtitle: string;
  price: string | null;
  imageUrl: string | null;
  framing?: { image_position_x?: number | null; image_position_y?: number | null; image_zoom?: number | null } | null;
  href: string;
}

function displayCategory(b: any, categoryMap: Map<string, any>): string {
  if (b.category) return b.category;
  if (b.category_id && categoryMap.has(b.category_id)) return categoryMap.get(b.category_id).name;
  return "Outros";
}

function displayCity(b: any, cityMap: Map<string, any>): string {
  if (b.city) return b.city;
  if (b.city_id && cityMap.has(b.city_id)) return cityMap.get(b.city_id).name;
  return "Portugal";
}

export default function FavoritosPage() {
  const router = useRouter();
  const storeRef = useRef<ReturnType<typeof createSupabaseCollectionsStore> | null>(null);
  if (!storeRef.current) storeRef.current = createSupabaseCollectionsStore();
  const store = storeRef.current;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<"favorites" | "collections">("favorites");

  // Favoritos tradicionais
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([]);

  // Coleções
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [openCollection, setOpenCollection] = useState<CollectionRow | null>(null);
  const [openItems, setOpenItems] = useState<EnrichedItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryMap, setCategoryMap] = useState<Map<string, any>>(new Map());
  const [cityMap, setCityMap] = useState<Map<string, any>>(new Map());
  // Consumidor (0 businesses) vs comerciante: para navegação coerente.
  const [businessCount, setBusinessCount] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login?next=/favoritos"); return; }
      setUserId(session.user.id);

      // Contagem leve de businesses (uma query, sem duplicar).
      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id);
      setBusinessCount(count ?? 0);

      const [cats, cities] = await Promise.all([
        supabase.from("categories").select("id, name"),
        supabase.from("cities").select("id, name"),
      ]);
      setCategoryMap(new Map((cats.data ?? []).map((c: any) => [c.id, c])));
      setCityMap(new Map((cities.data ?? []).map((c: any) => [c.id, c])));

      const { data } = await supabase
        .from("favorites")
        .select("id, business_id, businesses(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setFavorites(
          data.map((f: any) => ({
            ...f.businesses,
            favorite_id: f.id,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [mounted]);

  const loadCollections = async (uid: string) => {
    setCollectionsLoading(true);
    setError(null);
    try {
      // Cria a coleção padrão apenas no primeiro uso (não migra favorites).
      await ensureDefaultCollection(store, uid);
      setCollections(await getCollections(store, uid));
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível carregar as coleções.");
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "collections" && userId && collections.length === 0 && !collectionsLoading) {
      loadCollections(userId);
    }
  }, [tab, userId]);

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorites").delete().eq("id", favoriteId);
    setFavorites(prev => prev.filter(f => f.favorite_id !== favoriteId));
  };

  const handleCreateCollection = async () => {
    if (!userId || !newCollectionName.trim()) return;
    setError(null);
    try {
      await createCollection(store, userId, newCollectionName);
      setNewCollectionName("");
      setCollections(await getCollections(store, userId));
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível criar a coleção.");
    }
  };

  const handleRename = async (col: CollectionRow) => {
    if (!userId || !renameValue.trim()) { setRenamingId(null); return; }
    setError(null);
    try {
      const updated = await renameCollection(store, userId, col.id, renameValue);
      setCollections(prev => prev.map(c => c.id === col.id ? updated : c));
      if (openCollection?.id === col.id) setOpenCollection(updated);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível renomear.");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (col: CollectionRow) => {
    if (!userId) return;
    if (!window.confirm(`Excluir a coleção "${col.name}"? Os itens guardados nela serão removidos.`)) return;
    setError(null);
    try {
      await store.deleteCollection(col.id, userId);
      setCollections(prev => prev.filter(c => c.id !== col.id));
      if (openCollection?.id === col.id) { setOpenCollection(null); setOpenItems([]); }
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível excluir.");
    }
  };

  const openCollectionDetail = async (col: CollectionRow) => {
    setOpenCollection(col);
    setItemsLoading(true);
    setOpenItems([]);
    try {
      const rows = await store.listItems(col.id);
      const bizIds = rows.filter(r => r.business_id).map(r => r.business_id as string);
      const prodIds = rows.filter(r => r.product_id).map(r => r.product_id as string);

      const [bizRes, prodRes] = await Promise.all([
        bizIds.length
          ? supabase.from("businesses").select("id, name, slug, category, category_id, city, city_id, logo_url").in("id", bizIds)
          : Promise.resolve({ data: [] as any[] }),
        prodIds.length
          ? supabase.from("products").select("id, name, price, image_url, image_position_x, image_position_y, image_zoom, business_id, businesses(id, name, slug)").in("id", prodIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const bizById = new Map((bizRes.data ?? []).map((b: any) => [b.id, b]));
      const prodById = new Map((prodRes.data ?? []).map((p: any) => [p.id, p]));

      const enriched: EnrichedItem[] = [];
      for (const row of rows) {
        const kind = itemKindOfRow(row);
        if (kind === "business") {
          const b = bizById.get(row.business_id as string);
          if (!b) continue; // negócio eliminado
          enriched.push({
            item: row,
            kind,
            title: b.name,
            subtitle: `${displayCategory(b, categoryMap)} · 📍 ${displayCity(b, cityMap)}`,
            price: null,
            imageUrl: b.logo_url ?? null,
            href: `/vitrine/${b.slug}`,
          });
        } else {
          const p = prodById.get(row.product_id as string);
          if (!p) continue; // produto eliminado
          const pb = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
          enriched.push({
            item: row,
            kind,
            title: p.name,
            subtitle: pb?.name ?? "",
            price: p.price !== null && p.price !== undefined && p.price !== ""
              ? `€ ${Number(p.price).toFixed(2).replace(".", ",")}`
              : null,
            imageUrl: p.image_url ?? null,
            framing: { image_position_x: p.image_position_x ?? null, image_position_y: p.image_position_y ?? null, image_zoom: p.image_zoom ?? null },
            href: pb?.slug ? `/vitrine/${pb.slug}` : "#",
          });
        }
      }
      setOpenItems(enriched);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível carregar os itens.");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleRemoveItem = async (item: CollectionItemRow) => {
    try {
      await removeItem(store, item.id);
      setOpenItems(prev => prev.filter(e => e.item.id !== item.id));
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível remover o item.");
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-[#0F172A]/80 backdrop-blur border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Navegação coerente: consumidor (0 businesses) volta ao Explorar,
              comerciante mantém acesso ao Dashboard */}
          {businessCount === 0 ? (
            <Link href="/explorar" className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
              ← Voltar ao Explorar
            </Link>
          ) : (
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
              ← Dashboard
            </Link>
          )}
          <Link href="/" className="font-display font-bold text-[#C8A96B] text-xl">VitrinePro</Link>
          <Link href="/explorar" className="text-xs text-[#C8A96B] border border-[#C8A96B]/30 px-3 py-1.5 rounded-lg hover:bg-[#C8A96B]/10 transition-colors">
            Explorar
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            ❤️ Meus Favoritos
          </h1>
          <p className="text-slate-400 text-sm">
            Guarda Montras e produtos para voltares depois.
          </p>
        </div>

        {/* Tabs — scroll horizontal em vez de estourar a página no mobile */}
        <div className="flex gap-1 sm:gap-2 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setTab("favorites")}
            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === "favorites"
                ? "border-[#C8A96B] text-[#C8A96B]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            ❤️ Favoritos ({favorites.length})
          </button>
          <button
            onClick={() => setTab("collections")}
            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === "collections"
                ? "border-[#C8A96B] text-[#C8A96B]"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📁 Minhas Coleções
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {tab === "favorites" ? (
          /* ── TAB: Favoritos tradicionais (preservado) ── */
          favorites.length === 0 ? (
            <div className="text-center py-20 space-y-6 bg-[#1E293B]/30 border border-white/5 rounded-2xl">
              <span className="text-6xl block">❤️</span>
              <div className="space-y-2">
                <p className="text-white font-bold text-lg">Ainda não tens favoritos</p>
                <p className="text-slate-400 text-sm">Ao visitar uma vitrine, clica em ❤️ para guardar.</p>
              </div>
              <Link
                href="/explorar"
                className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-xl active:scale-95 transition-all"
              >
                Explorar negócios →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((biz) => (
                <div key={biz.favorite_id} className="group bg-[#0F172A]/60 border border-white/5 hover:border-[#C8A96B]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 relative">
                  <button
                    onClick={() => removeFavorite(biz.favorite_id)}
                    className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-[#0F172A]/80 border border-red-500/30 text-red-400 hover:bg-red-900/40 rounded-full text-xs transition-colors"
                    aria-label="Remover dos favoritos"
                    title="Remover"
                  >
                    ✕
                  </button>

                  <Link href={`/vitrine/${biz.slug}`}>
                    <div className="relative h-36 bg-slate-900 overflow-hidden">
                      {biz.cover_url ? (
                        <img src={biz.cover_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-4xl">🏪</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />
                      <span className="absolute top-3 left-3 text-base">❤️</span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                          {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" /> : "🏪"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm truncate group-hover:text-[#C8A96B] transition-colors">{biz.name}</h3>
                          {/* A6 correção A: fallbacks iguais aos do /explorar */}
                          <p className="text-[10px] text-slate-400 truncate">
                            {displayCategory(biz, categoryMap)} · 📍 {displayCity(biz, cityMap)}
                          </p>
                        </div>
                      </div>

                      {biz.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 font-light">{biz.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                        <span className="text-[#C8A96B] font-bold">★ {biz.rating_average?.toFixed(1) || "5.0"}</span>
                        <span className="text-slate-400 group-hover:text-[#C8A96B] font-semibold transition-colors text-[10px]">Ver vitrine →</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : openCollection ? (
          /* ── TAB: Detalhe da coleção ── */
          <div className="space-y-4">
            <button
              onClick={() => { setOpenCollection(null); setOpenItems([]); }}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Voltar às coleções
            </button>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {openCollection.is_default ? "❤️" : "📁"} {openCollection.name}
              </h2>
              <span className="text-xs text-slate-400">
                {openItems.length} {openItems.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {itemsLoading ? (
              <p className="text-sm text-slate-400 py-10 text-center">A carregar itens…</p>
            ) : openItems.length === 0 ? (
              <div className="text-center py-16 bg-[#1E293B]/30 border border-white/5 rounded-2xl space-y-3">
                <span className="text-5xl block">📁</span>
                <p className="text-slate-400 text-sm">Coleção vazia. Guarda Montras e produtos para os veres aqui.</p>
                <Link href="/explorar" className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-xl active:scale-95 transition-all">
                  Explorar →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {openItems.map((e) => (
                  <div key={e.item.id} className="relative bg-[#0F172A]/60 border border-white/5 rounded-2xl p-4 flex gap-3">
                    <button
                      onClick={() => handleRemoveItem(e.item)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-[#0F172A]/80 border border-red-500/30 text-red-400 hover:bg-red-900/40 rounded-full text-[10px] transition-colors"
                      aria-label="Remover item"
                      title="Remover"
                    >
                      ✕
                    </button>
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                      {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-full h-full object-cover" style={e.kind === "product" ? productImgStyle(normalizeProductFraming(e.framing)) : undefined} /> : (e.kind === "business" ? "🏪" : "🛍️")}
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full mb-1 ${
                        e.kind === "business"
                          ? "bg-[#C8A96B]/15 border border-[#C8A96B]/30 text-[#C8A96B]"
                          : "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                      }`}>
                        {e.kind === "business" ? "📍 MONTRA" : "🛍️ PRODUTO"}
                      </span>
                      <h3 className="font-bold text-white text-sm truncate">{e.title}</h3>
                      {e.subtitle && <p className="text-[11px] text-slate-400 truncate">{e.subtitle}</p>}
                      {e.price && <p className="text-xs font-bold text-[#C8A96B] mt-1">{e.price}</p>}
                      <Link href={e.href} className="text-[11px] font-semibold text-[#C8A96B] hover:underline">
                        {e.kind === "business" ? "Ver Montra →" : "Ver produto →"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── TAB: Lista de coleções ── */
          <div className="space-y-6">
            {/* Mobile: empilha vertical (botão sempre visível); desktop: lado a lado */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateCollection(); }}
                placeholder="Nome da nova coleção (ex.: Onde comer)"
                maxLength={60}
                className="w-full sm:flex-1 sm:min-w-0 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8A96B]/50"
              />
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
              >
                + Criar
              </button>
            </div>

            {collectionsLoading ? (
              <p className="text-sm text-slate-400 py-10 text-center">A carregar coleções…</p>
            ) : collections.length === 0 ? (
              <div className="text-center py-16 bg-[#1E293B]/30 border border-white/5 rounded-2xl space-y-3">
                <span className="text-5xl block">📁</span>
                <p className="text-slate-400 text-sm">Ainda não tens coleções. Cria a primeira acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((col) => (
                  <div key={col.id} className="bg-[#0F172A]/60 border border-white/5 hover:border-[#C8A96B]/30 rounded-2xl p-5 space-y-3 transition-all">
                    <button onClick={() => openCollectionDetail(col)} className="w-full text-left group">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{col.is_default ? "❤️" : "📁"}</span>
                        <h3 className="font-bold text-white group-hover:text-[#C8A96B] transition-colors truncate">
                          {col.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Abrir coleção →</p>
                    </button>
                    <div className="flex gap-2 pt-1 border-t border-white/5">
                      {renamingId === col.id ? (
                        <div className="flex gap-2 w-full">
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(col);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            maxLength={60}
                            autoFocus
                            className="flex-1 min-w-0 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96B]/50"
                          />
                          <button onClick={() => handleRename(col)} className="text-xs font-bold text-[#C8A96B] px-2">OK</button>
                          <button onClick={() => setRenamingId(null)} className="text-xs text-slate-400 px-2">✕</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setRenamingId(col.id); setRenameValue(col.name); }}
                            className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1"
                          >
                            ✏️ Renomear
                          </button>
                          {!col.is_default && (
                            <button
                              onClick={() => handleDelete(col)}
                              className="text-[11px] font-semibold text-red-400/80 hover:text-red-400 px-2 py-1"
                            >
                              🗑️ Excluir
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500 break-words">
              As coleções são privadas — só tu as vês. O favorito ❤️ tradicional continua separado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
