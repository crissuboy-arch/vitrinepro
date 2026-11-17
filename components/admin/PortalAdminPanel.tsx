"use client";
/**
 * components/admin/PortalAdminPanel.tsx — administração da integração
 * Portal de Ofertas: criar a montra (sempre em rascunho) e controlar
 * as definições/sincronização (reutiliza o PortalPanel do dashboard).
 */
import { useCallback, useEffect, useState } from "react";
import PortalPanel from "@/components/dashboard/PortalPanel";

export default function PortalAdminPanel() {
  const [business, setBusiness] = useState<{ slug: string; published: boolean } | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await fetch("/api/portal/settings").then((r) => r.json());
      setReady(s.ready === true);
      setBusiness(s.business ?? null);
    } catch {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/portal-montra", { method: "POST" }).then((x) => x.json());
      if (r.ready && r.business) {
        setMsg(r.created ? "Montra criada em rascunho." : "A montra já existe.");
        setBusiness({ slug: r.business.slug, published: !!r.business.published });
      } else {
        setMsg(r.error || "Não foi possível criar a montra.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h2 className="font-display text-lg font-bold text-[#0F172A]">🛒 Montra Portal de Ofertas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Montra multiloja/afiliados alimentada pelo feed do Portal. A criação é sempre em{" "}
          <strong>rascunho</strong> — a publicação faz-se depois, no painel da montra, quando a
          proprietária aprovar. Os destaques da homepage são controlados no separador da montra
          (e abaixo) e nunca mostram ofertas expiradas.
        </p>
        {ready === false && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Migration 20261117000029 ainda não aplicada a esta base de dados — a criação fica
            disponível depois de aplicada.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {business ? (
            <p className="text-sm text-slate-700">
              Montra: <strong>/vitrine/{business.slug}</strong> · estado:{" "}
              <strong>{business.published ? "publicada" : "rascunho"}</strong>
            </p>
          ) : (
            <button
              onClick={create}
              disabled={busy || ready === false}
              className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "A criar…" : "Criar montra Portal de Ofertas (rascunho)"}
            </button>
          )}
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </div>

      {/* Reutiliza os controlos da proprietária (admin também gere). */}
      <div className="rounded-xl bg-[#0F172A] p-4 md:p-6">
        <PortalPanel />
      </div>
    </div>
  );
}
