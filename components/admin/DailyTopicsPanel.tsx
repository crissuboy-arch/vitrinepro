"use client";

/**
 * components/admin/DailyTopicsPanel.tsx — tab «Assunto do Dia».
 * Gestão editorial: criar, editar, agendar, fixar, publicar e
 * arquivar. Fila de aprovação: rascunhos 'pending' (incl. os da
 * Atena, marcados) só entram no ar com aprovação do admin.
 */
import { useCallback, useEffect, useState } from "react";

interface Topic {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  city: string | null;
  category: string | null;
  status: "draft" | "pending" | "published" | "archived";
  is_pinned: boolean;
  scheduled_for: string | null;
  created_by: string | null;
  created_via: "admin" | "atena";
  created_at: string;
  published_at: string | null;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#0F172A] placeholder:text-slate-500 focus:border-[#A88B4F] outline-none";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-1.5 border border-[#E5E7EB] text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50";

const STATUS_LABEL: Record<Topic["status"], string> = {
  draft: "Rascunho",
  pending: "⏳ Aguarda aprovação",
  published: "Publicado",
  archived: "Arquivado",
};

export default function DailyTopicsPanel() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", summary: "", source_name: "", source_url: "", city: "", category: "", scheduled_for: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/daily-topics");
      if (res.status === 503) {
        setNotReady(true);
        return;
      }
      const data = await res.json();
      if (res.ok) setTopics(data.topics ?? []);
    } catch {
      setError("Erro ao carregar.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/daily-topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A operação falhou.");
      setNotice(okMsg);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "A operação falhou.");
    } finally {
      setBusy(false);
    }
  }

  async function create(publish: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/daily-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, publish }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível criar.");
      setNotice(publish ? "Assunto publicado." : "Rascunho criado.");
      setForm({ title: "", summary: "", source_name: "", source_url: "", city: "", category: "", scheduled_for: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar.");
    } finally {
      setBusy(false);
    }
  }

  if (notReady) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-2">Assunto do Dia — a ser ativado</h3>
        <p className="text-sm text-slate-600">
          Aplica primeiro a migration <code className="font-mono text-[#8A6F3E]">20261117000028_assunto_do_dia.sql</code> no
          Supabase (SQL Editor).
        </p>
      </div>
    );
  }

  const pending = topics.filter((t) => t.status === "pending");
  const rest = topics.filter((t) => t.status !== "pending");

  const renderTopic = (t: Topic) => (
    <div key={t.id} className="border border-[#E5E7EB] rounded-lg p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-[#0F172A] text-sm">{t.title}</strong>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.status === "published" ? "bg-emerald-100 text-emerald-900" : t.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
          {STATUS_LABEL[t.status]}
        </span>
        {t.created_via === "atena" && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900">🤖 Rascunho da Atena</span>}
        {t.is_pinned && <span className="text-[11px] font-bold text-[#8A6F3E]">📌 Fixado</span>}
        <span className="text-[11px] text-[#4B5563] ml-auto">
          {[t.city, t.category].filter(Boolean).join(" · ")}
          {t.scheduled_for ? ` · agenda: ${t.scheduled_for}` : ""}
        </span>
      </div>
      {t.summary && <p className="text-sm text-slate-600 line-clamp-2">{t.summary}</p>}
      {t.source_url && (
        <a href={t.source_url} target="_blank" rel="noreferrer" className="text-xs text-[#8A6F3E] underline">
          Fonte: {t.source_name || t.source_url} ↗
        </a>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {t.status !== "published" && (
          <button onClick={() => patch(t.id, { status: "published" }, "Assunto publicado.")} disabled={busy} className={btnGhost}>
            ✅ Aprovar e publicar
          </button>
        )}
        {t.status === "pending" && (
          <button onClick={() => patch(t.id, { status: "draft" }, "Devolvido a rascunho.")} disabled={busy} className={btnGhost}>
            Rejeitar (voltar a rascunho)
          </button>
        )}
        {t.status === "published" && (
          <button onClick={() => patch(t.id, { is_pinned: !t.is_pinned }, t.is_pinned ? "Desafixado." : "Fixado no topo.")} disabled={busy} className={btnGhost}>
            {t.is_pinned ? "Desafixar" : "📌 Fixar"}
          </button>
        )}
        {t.status !== "archived" && (
          <button onClick={() => patch(t.id, { status: "archived" }, "Assunto arquivado.")} disabled={busy} className={btnGhost}>
            Arquivar
          </button>
        )}
        {t.status === "archived" && (
          <button onClick={() => patch(t.id, { status: "draft" }, "Restaurado para rascunho.")} disabled={busy} className={btnGhost}>
            Restaurar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-800">{notice}</p>}

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-1">Novo Assunto do Dia</h3>
        <p className="text-sm text-slate-600 mb-4">Conteúdo editorial com fonte indicada. Nada entra no ar sem a tua aprovação.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Título *" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="Cidade/região (opcional)" />
          <input value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} className={inputCls} placeholder="Fonte (nome)" />
          <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className={inputCls} placeholder="Fonte (URL https://…)" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="Categoria (ex.: Emprego, Eventos)" />
          <input type="date" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} className={inputCls} />
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={`${inputCls} sm:col-span-2`} rows={3} placeholder="Resumo original do assunto…" />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => create(false)} disabled={busy || !form.title.trim()} className={btnGhost}>Guardar rascunho</button>
          <button onClick={() => create(true)} disabled={busy || !form.title.trim()} className={btnGold}>Publicar já</button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Aguardam a tua aprovação ({pending.length})</h3>
          <div className="space-y-3">{pending.map(renderTopic)}</div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Todos os assuntos ({topics.length})</h3>
        {topics.length === 0 && <p className="text-sm text-slate-600">Ainda não há assuntos. Cria o primeiro acima.</p>}
        <div className="space-y-3">{rest.map(renderTopic)}</div>
      </div>
    </div>
  );
}
