"use client";

/**
 * components/admin/CommunitiesPanel.tsx — tab «Comunidades» do admin.
 * Criar comunidades sem código, ativar/desativar, moderação de
 * publicações e gestão de denúncias, estatísticas de participação.
 */
import { useCallback, useEffect, useState } from "react";

interface Community {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  counts: { members: number; posts: number };
}
interface Report {
  id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: string | null;
  created_at: string;
  target: { author_name?: string; content?: string; status?: string } | null;
}
interface HiddenPost {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}
interface Stats {
  radar: { activePromotions: number; approvedQuotes: number; newBusinesses7d: number };
  communities: { members: number; posts: number; comments: number };
  topics: { published: number; pendingApproval: number; pendingFromAtena: number };
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#0F172A] placeholder:text-slate-500 focus:border-[#A88B4F] outline-none";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-1.5 border border-[#E5E7EB] text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50";

export default function CommunitiesPanel() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [hiddenPosts, setHiddenPosts] = useState<HiddenPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, mRes, sRes] = await Promise.all([
        fetch("/api/admin/communities"),
        fetch("/api/admin/community-moderation"),
        fetch("/api/admin/platform-stats"),
      ]);
      if (cRes.status === 503) {
        setNotReady(true);
        return;
      }
      const cData = await cRes.json();
      if (cRes.ok) setCommunities(cData.communities ?? []);
      const mData = await mRes.json().catch(() => ({}));
      if (mRes.ok) {
        setReports(mData.reports ?? []);
        setHiddenPosts(mData.hiddenPosts ?? []);
      }
      const sData = await sRes.json().catch(() => ({}));
      if (sRes.ok) setStats(sData as Stats);
    } catch {
      setError("Erro ao carregar.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<Response>, okMsg: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fn();
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

  async function moderate(action: string, id: string, okMsg: string) {
    await act(
      () =>
        fetch("/api/admin/community-moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, id }),
        }),
      okMsg
    );
  }

  if (notReady) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-2">Comunidades — a ser ativado</h3>
        <p className="text-sm text-slate-600">
          Aplica primeiro a migration <code className="font-mono text-[#8A6F3E]">20261117000027_comunidades_sociais.sql</code> no
          Supabase (SQL Editor).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Membros nas comunidades", stats.communities.members],
            ["Publicações", stats.communities.posts],
            ["Comentários", stats.communities.comments],
            ["Denúncias pendentes", reports.length],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <p className="text-2xl font-bold text-[#0F172A]">{value as number}</p>
              <p className="text-xs text-[#4B5563]">{label as string}</p>
            </div>
          ))}
        </div>
      )}
      {stats && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#4B5563]">
          <strong className="text-[#0F172A]">Radar:</strong> {stats.radar.activePromotions} promoções ativas ·{" "}
          {stats.radar.approvedQuotes} pedidos aprovados · {stats.radar.newBusinesses7d} empresas novas (7 dias)
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-800">{notice}</p>}

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Criar comunidade</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Nome (ex.: Comunidade Moçambicana)" />
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="Ícone/emoji (opcional)" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Descrição curta" />
        </div>
        <button
          onClick={() =>
            act(
              () =>
                fetch("/api/admin/communities", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(form),
                }),
              "Comunidade criada."
            ).then(() => setForm({ name: "", icon: "", description: "" }))
          }
          disabled={busy || !form.name.trim()}
          className={`${btnGold} mt-3`}
        >
          Criar comunidade
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Comunidades ({communities.length})</h3>
        <div className="space-y-2">
          {communities.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className="text-2xl">{c.icon || "👥"}</span>
              <div className="min-w-0">
                <p className="font-bold text-[#0F172A] text-sm">{c.name}</p>
                <p className="text-xs text-[#4B5563]">
                  /comunidades/{c.slug} · {c.counts.members} membros · {c.counts.posts} publicações · {c.is_active ? "ativa" : "inativa"}
                </p>
              </div>
              <button
                onClick={() =>
                  act(
                    () =>
                      fetch("/api/admin/communities", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
                      }),
                    c.is_active ? "Comunidade desativada." : "Comunidade ativada."
                  )
                }
                disabled={busy}
                className={`${btnGhost} ml-auto`}
              >
                {c.is_active ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Denúncias pendentes ({reports.length})</h3>
        {reports.length === 0 && <p className="text-sm text-slate-600">Sem denúncias pendentes. 🎉</p>}
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="border border-[#E5E7EB] rounded-lg p-4 space-y-2">
              <p className="text-xs text-[#4B5563]">
                {r.target_type === "post" ? "Publicação" : "Comentário"} · {new Date(r.created_at).toLocaleString("pt-PT")}
                {r.reason ? ` · Motivo: ${r.reason}` : ""}
              </p>
              <p className="text-sm text-[#0F172A]">
                <strong>{r.target?.author_name ?? "?"}</strong>: {(r.target?.content ?? "(conteúdo indisponível)").slice(0, 240)}
              </p>
              <div className="flex flex-wrap gap-2">
                {r.target_type === "post" ? (
                  <>
                    <button onClick={() => moderate("hide_post", r.target_id, "Publicação ocultada.")} disabled={busy} className={btnGhost}>Ocultar publicação</button>
                    <button onClick={() => moderate("remove_post", r.target_id, "Publicação removida.")} disabled={busy} className={btnGhost}>Remover</button>
                  </>
                ) : (
                  <button onClick={() => moderate("hide_comment", r.target_id, "Comentário ocultado.")} disabled={busy} className={btnGhost}>Ocultar comentário</button>
                )}
                <button onClick={() => moderate("resolve_report", r.id, "Denúncia resolvida.")} disabled={busy} className={btnGhost}>Resolver denúncia</button>
                <button onClick={() => moderate("dismiss_report", r.id, "Denúncia ignorada.")} disabled={busy} className={btnGhost}>Ignorar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hiddenPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">Publicações ocultas ({hiddenPosts.length})</h3>
          <div className="space-y-2">
            {hiddenPosts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm text-[#0F172A] min-w-0 flex-grow">
                  <strong>{p.author_name}</strong>: {p.content.slice(0, 120)}
                </p>
                <button onClick={() => moderate("restore_post", p.id, "Publicação restaurada.")} disabled={busy} className={btnGhost}>Restaurar</button>
                <button onClick={() => moderate("remove_post", p.id, "Publicação removida.")} disabled={busy} className={btnGhost}>Remover</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
