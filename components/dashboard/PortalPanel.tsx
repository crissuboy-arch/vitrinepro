"use client";
/**
 * components/dashboard/PortalPanel.tsx — painel da integração Portal de
 * Ofertas (proprietária da montra multiloja ou admin).
 *
 * Controlos: ativar/desativar, categorias visíveis, produtos em
 * destaque (prioridade no carrossel da homepage), estado da ligação,
 * última sincronização + erros, e "Atualizar agora".
 */
import { useCallback, useEffect, useMemo, useState } from "react";

interface FeedProduct { externalId: string; name: string; category: string; store: string; featured: boolean }
interface Settings { enabled: boolean; categories: string[]; featuredIds: string[]; portalUrl: string; updatedAt: string | null }
interface SyncRun { status: string; total: number | null; destaques: number | null; error: string | null; createdAt: string; finishedAt: string | null }

export default function PortalPanel() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [business, setBusiness] = useState<{ slug: string; published: boolean } | null>(null);
  const [feedProducts, setFeedProducts] = useState<FeedProduct[]>([]);
  const [feedCategories, setFeedCategories] = useState<string[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<SyncRun | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, y] = await Promise.all([
        fetch("/api/portal/settings").then((r) => r.json()),
        fetch("/api/portal/sync").then((r) => r.json()).catch(() => ({})),
      ]);
      setReady(s.ready === true);
      if (s.settings) setSettings(s.settings);
      setBusiness(s.business ?? null);
      setFeedProducts(s.feed?.products ?? []);
      setFeedCategories(s.feed?.categories ?? []);
      setFeedError(s.feed?.error ?? null);
      if (y.lastRun) setLastRun(y.lastRun);
    } catch {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!settings) return;
    setBusy("save");
    setMsg("");
    try {
      const r = await fetch("/api/portal/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).then((x) => x.json());
      if (r.ready) {
        setSettings(r.settings);
        setMsg("Definições guardadas.");
      } else {
        setMsg(r.error || "Não foi possível guardar.");
      }
    } finally {
      setBusy("");
    }
  };

  const syncNow = async () => {
    setBusy("sync");
    setMsg("");
    try {
      const r = await fetch("/api/portal/sync", { method: "POST" }).then((x) => x.json());
      if (r.run) setLastRun(r.run);
      setMsg(r.feed?.ok ? `Sincronização concluída: ${r.feed.total} produtos.` : `Erro na sincronização: ${r.feed?.error || "desconhecido"}`);
      void load();
    } finally {
      setBusy("");
    }
  };

  const visibleProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? feedProducts.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q)) : feedProducts;
  }, [feedProducts, filter]);

  if (ready === null) return <p className="text-sm text-gray-400">A carregar a integração…</p>;
  if (!ready || !settings) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
        A integração ainda não está ativa nesta base de dados (migration 20261117000029 por aplicar).
        Nada muda publicamente até lá.
      </div>
    );
  }

  const toggleList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">Integração Portal de Ofertas</h3>
        <p className="mt-1 text-sm text-gray-400">
          Os produtos vêm automaticamente do Portal (fonte principal) — não é preciso cadastrar nada aqui.
          A compra conclui-se sempre na loja de origem.
        </p>

        <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-gray-400">Estado da ligação</p>
            <p className="mt-1 font-bold text-white">
              {settings.enabled ? "Ativa" : "Desativada"} · Montra {business ? (business.published ? "publicada" : "em rascunho") : "por criar"}
            </p>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-gray-400">Última sincronização</p>
            <p className="mt-1 font-bold text-white">
              {lastRun
                ? `${lastRun.status === "ok" ? "OK" : "Erro"} · ${new Date(lastRun.createdAt).toLocaleString("pt-PT")}${lastRun.total != null ? ` · ${lastRun.total} produtos` : ""}`
                : "Ainda sem registo"}
            </p>
            {lastRun?.error && <p className="mt-1 text-xs text-red-300">{lastRun.error}</p>}
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-gray-400">Feed do Portal agora</p>
            <p className="mt-1 font-bold text-white">{feedError ? `Erro: ${feedError}` : `${feedProducts.length} produtos disponíveis`}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="h-5 w-5 accent-orange-500"
            />
            Integração ativa
          </label>
          <button
            onClick={syncNow}
            disabled={busy === "sync"}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
          >
            {busy === "sync" ? "A sincronizar…" : "Atualizar agora"}
          </button>
          <button
            onClick={save}
            disabled={busy === "save"}
            className="rounded-lg bg-[#C8A96B] px-4 py-2 text-sm font-bold text-[#0F172A] transition hover:brightness-110 disabled:opacity-50"
          >
            {busy === "save" ? "A guardar…" : "Guardar definições"}
          </button>
          {msg && <span className="text-sm text-gray-300">{msg}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h4 className="font-bold text-white">Categorias visíveis na montra</h4>
        <p className="mt-1 text-xs text-gray-400">Sem nenhuma selecionada, mostram-se todas.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {feedCategories.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                settings.categories.includes(c) ? "bg-orange-500 text-black" : "bg-black/30 text-gray-300 ring-1 ring-gray-700"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={settings.categories.includes(c)}
                onChange={() => setSettings({ ...settings, categories: toggleList(settings.categories, c) })}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h4 className="font-bold text-white">Produtos em destaque</h4>
        <p className="mt-1 text-xs text-gray-400">
          Os produtos marcados têm prioridade no carrossel “Ofertas em destaque” da homepage
          (intercalados com as promoções dos comerciantes — nenhuma fonte ocupa tudo).
        </p>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar produtos…"
          className="mt-3 w-full max-w-sm rounded-lg bg-black/30 px-3 py-2 text-sm text-white ring-1 ring-gray-700 placeholder:text-gray-500 focus:outline-none"
        />
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {visibleProducts.map((p) => (
            <label key={p.externalId} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-black/30">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-500"
                checked={settings.featuredIds.includes(p.externalId)}
                onChange={() => setSettings({ ...settings, featuredIds: toggleList(settings.featuredIds, p.externalId) })}
              />
              <span className="flex-1">{p.name}</span>
              <span className="text-xs text-gray-500">{p.store} · {p.category}{p.featured ? " · destaque no Portal" : ""}</span>
            </label>
          ))}
          {visibleProducts.length === 0 && <p className="text-sm text-gray-500">Sem produtos para o filtro.</p>}
        </div>
      </div>
    </div>
  );
}
