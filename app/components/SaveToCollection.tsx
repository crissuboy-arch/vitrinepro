"use client";

/**
 * SaveToCollection — A6
 *
 * Botão + picker para guardar um negócio OU um produto numa coleção.
 * Regras em lib/collections.ts (fora do React); aqui só UI.
 * Mobile: painel vira bottom-sheet (touch friendly).
 */
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { createSupabaseCollectionsStore } from "@/lib/collections-store";
import {
  ensureDefaultCollection,
  getCollections,
  createCollection,
  saveItem,
  removeItem,
  type ItemRef,
  type CollectionRow,
  type CollectionItemRow,
} from "@/lib/collections";

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function findItemAcross(
  store: ReturnType<typeof createSupabaseCollectionsStore>,
  collections: CollectionRow[],
  ref: ItemRef
): Promise<Map<string, CollectionItemRow>> {
  const map = new Map<string, CollectionItemRow>();
  for (const c of collections) {
    const found = await store.findItem(c.id, ref);
    if (found) map.set(c.id, found);
  }
  return map;
}

interface SaveToCollectionProps {
  itemRef: ItemRef;
  /** Texto do botão principal. Ex.: "Guardar" */
  label?: string;
  /** Onde redirecionar após login (ex.: "/vitrine/slug"). Opcional. */
  loginNext?: string;
  className?: string;
}

export default function SaveToCollection({
  itemRef,
  label = "Guardar",
  loginNext,
  className = "",
}: SaveToCollectionProps) {
  const [store] = useState(() => createSupabaseCollectionsStore());

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [savedIn, setSavedIn] = useState<Map<string, CollectionItemRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const savedCount = savedIn.size;

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          window.location.href = loginNext ? `/login?next=${encodeURIComponent(loginNext)}` : "/login";
          return;
        }
        const uid = session.user.id;
        setUserId(uid);
        // Cria a coleção padrão "Favoritos" apenas no primeiro uso das coleções.
        // NÃO migra public.favorites (sistemas separados nesta fase).
        await ensureDefaultCollection(store, uid);
        const cols = await getCollections(store, uid);
        setCollections(cols);
        setSavedIn(await findItemAcross(store, cols, itemRef));
      } catch (e) {
        setError(errorMessage(e, "Não foi possível carregar as coleções."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fecha ao clicar fora (desktop)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleInCollection = async (col: CollectionRow) => {
    if (savingId) return;
    setSavingId(col.id);
    setError(null);
    try {
      const existing = savedIn.get(col.id);
      if (existing) {
        await removeItem(store, existing.id);
        const next = new Map(savedIn);
        next.delete(col.id);
        setSavedIn(next);
      } else {
        const { item } = await saveItem(store, col.id, itemRef);
        setSavedIn(new Map(savedIn).set(col.id, item));
      }
    } catch (e) {
      setError(errorMessage(e, "Não foi possível guardar."));
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    if (creating || !userId) return;
    setCreating(true);
    setError(null);
    try {
      const col = await createCollection(store, userId, newName);
      const cols = await getCollections(store, userId);
      setCollections(cols);
      setNewName("");
      // Guarda logo o item na coleção recém-criada
      const { item } = await saveItem(store, col.id, itemRef);
      setSavedIn(new Map(savedIn).set(col.id, item));
    } catch (e) {
      setError(errorMessage(e, "Não foi possível criar a coleção."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all border-[#C8A96B]/30 text-[#C8A96B] hover:bg-[#C8A96B]/10 active:scale-95"
        aria-label="Guardar em coleção"
        title="Guardar em coleção"
      >
        <span className="text-sm leading-none">{savedCount > 0 ? "📁" : "🗂️"}</span>
        <span>{label}{savedCount > 0 ? ` (${savedCount})` : ""}</span>
      </button>

      {open && (
        <>
          {/* Overlay mobile: bottom-sheet */}
          <div
            className="fixed inset-0 z-40 bg-black/60 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:z-50 bg-[#0F172A] border border-slate-700 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Guardar em coleção"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Guardar em…</span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {loading && (
                <p className="text-xs text-slate-400 px-3 py-4 text-center">A carregar coleções…</p>
              )}
              {!loading && collections.map((col) => {
                const isSaved = savedIn.has(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleInCollection(col)}
                    disabled={savingId !== null}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left active:scale-[0.98] ${
                      isSaved ? "bg-[#C8A96B]/10 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-base">{col.is_default ? "❤️" : "📁"}</span>
                    <span className="flex-1 truncate">{col.name}</span>
                    <span className="text-base w-5 text-center">
                      {savingId === col.id ? "⏳" : isSaved ? "✅" : ""}
                    </span>
                  </button>
                );
              })}
              {!loading && collections.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-4 text-center">
                  Ainda não tens coleções.
                </p>
              )}
            </div>

            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder="+ Nova coleção"
                  maxLength={60}
                  className="flex-1 min-w-0 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C8A96B]/50"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="px-3 py-2 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-lg disabled:opacity-40 active:scale-95 transition-all"
                >
                  {creating ? "…" : "Criar"}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
