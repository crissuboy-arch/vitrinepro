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
import SavePromptModal from "./SavePromptModal";
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

// A6.5 Parte B — intenção de Guardar pendente (visitante → login → concluir).
// Só é consumida pelo SaveToCollection cujo itemRef coincide, e expira em 24h.
const PENDING_SAVE_KEY = "vp_pending_save";
const PENDING_SAVE_MS = 24 * 3600 * 1000;
interface PendingSave {
  itemRef: ItemRef;
  next: string;
  savedAt: number;
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

  // A6.5 Parte B — modal amigável para visitante não autenticado
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptNext, setPromptNext] = useState("/explorar");

  const savedCount = savedIn.size;

  // A6.5 Parte B — concluir o guardar após login (só se seguro):
  // só completa quando (a) existe intenção pendente PARA ESTE item,
  // (b) o utilizador está agora autenticado, e (c) a intenção é recente (<24h).
  // Guarda na coleção padrão ("Favoritos") — o destino natural do Guardar rápido.
  useEffect(() => {
    const completePending = async () => {
      try {
        const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw) as PendingSave | null;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        if (!pending || Date.now() - (pending.savedAt ?? 0) > PENDING_SAVE_MS) {
          sessionStorage.removeItem(PENDING_SAVE_KEY);
          return;
        }
        if (JSON.stringify(pending.itemRef) !== JSON.stringify(itemRef)) return;
        const col = await ensureDefaultCollection(store, session.user.id);
        const { item } = await saveItem(store, col.id, itemRef);
        setSavedIn(new Map([[col.id, item]]));
        sessionStorage.removeItem(PENDING_SAVE_KEY);
      } catch {
        /* intenção pendente inválida/expirada — ignora em silêncio */
      }
    };
    completePending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // A6.5 Parte B — visitante: modal amigável em vez de redirect seco.
          // Guarda a intenção para concluir o guardar após login (se seguro).
          const backTo = loginNext
            || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/explorar");
          setPromptNext(backTo);
          try {
            const pending: PendingSave = { itemRef, next: backTo, savedAt: Date.now() };
            sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(pending));
          } catch {
            /* storage indisponível — o modal continua a funcionar */
          }
          setOpen(false);
          setShowPrompt(true);
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

  // Fecha com Escape (foco/acessibilidade)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
    <div className={className}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all border-[#C8A96B]/30 text-[#C8A96B] hover:bg-[#C8A96B]/10 active:scale-95"
        aria-label="Guardar em coleção"
        title="Guardar em coleção"
      >
        <span className="text-sm leading-none">{savedCount > 0 ? "📁" : "🗂️"}</span>
        <span>{label}{savedCount > 0 ? ` (${savedCount})` : ""}</span>
      </button>

      {/* A6.5 Parte B — modal para visitante não autenticado */}
      <SavePromptModal
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        next={promptNext}
      />

      {open && (
        <>
          {/* Backdrop: fecha por ação explícita */}
          <div
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Diálogo compacto, sempre dentro da viewport:
              mobile = bottom-sheet · desktop = centrado.
              Não depende da posição vertical do botão. */}
          <div className="fixed inset-0 z-[61] flex items-end justify-center sm:items-center p-4 pointer-events-none">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Guardar em coleção"
              tabIndex={-1}
              className="pointer-events-auto w-full sm:max-w-xs bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-bold text-white">Guardar em…</span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white text-lg leading-none px-2 py-1"
                  aria-label="Fechar"
                  autoFocus
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto p-2 flex-1">
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

              <div className="p-3 border-t border-slate-800 flex-shrink-0">
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
          </div>
        </>
      )}    </div>
  );
}
