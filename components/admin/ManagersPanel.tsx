"use client";

/**
 * components/admin/ManagersPanel.tsx — tab «Equipa» do admin.
 * Gestão das Gestoras de Montras: convites por email, atribuição de
 * montras, chaves de API (identidade de agente) e revogação.
 * Só fala com /api/admin/managers* (requireAdmin no servidor).
 */
import { useCallback, useEffect, useState } from "react";

interface Manager {
  id: string;
  email: string;
  user_id: string | null;
  status: "invited" | "active" | "revoked";
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
}
interface Grant {
  business_id: string;
  manager_id: string;
}
interface ApiKey {
  id: string;
  manager_id: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}
interface Biz {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  published: boolean;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#0F172A] placeholder:text-slate-500 focus:border-[#A88B4F] outline-none";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-1.5 border border-[#E5E7EB] text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors";

export default function ManagersPanel() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [grantManager, setGrantManager] = useState("");
  const [grantBusiness, setGrantBusiness] = useState("");
  const [keyLabel, setKeyLabel] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/managers");
      if (res.status === 503) {
        setNotReady(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar.");
      setManagers(data.managers ?? []);
      setGrants(data.grants ?? []);
      setKeys(data.keys ?? []);
      setBusinesses(data.businesses ?? []);
      setNotReady(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
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
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "A operação falhou.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    const data = await act(
      () =>
        fetch("/api/admin/managers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail }),
        }),
      "Convite criado. A gestora aceita ao entrar com esse email e abrir o Painel da Gestora."
    );
    if (data) setInviteEmail("");
  }

  async function revoke(m: Manager) {
    await act(
      () =>
        fetch("/api/admin/managers", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: m.id }),
        }),
      `Acesso de ${m.email} revogado (sessão e chaves de API).`
    );
  }

  async function grant() {
    if (!grantManager || !grantBusiness) return;
    await act(
      () =>
        fetch("/api/admin/managers/grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId: grantManager, businessId: grantBusiness }),
        }),
      "Montra atribuída à gestora."
    );
  }

  async function ungrant(g: Grant) {
    await act(
      () =>
        fetch("/api/admin/managers/grant", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId: g.manager_id, businessId: g.business_id }),
        }),
      "Atribuição retirada."
    );
  }

  async function createKey(m: Manager) {
    const data = await act(
      () =>
        fetch("/api/admin/managers/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId: m.id, label: keyLabel[m.id] || "API" }),
        }),
      "Chave criada — copia-a agora, não volta a ser mostrada."
    );
    if (data?.key) setNewKey(data.key as string);
  }

  async function revokeKey(k: ApiKey) {
    await act(
      () =>
        fetch("/api/admin/managers/keys", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyId: k.id }),
        }),
      "Chave revogada."
    );
  }

  const bizName = (id: string) => businesses.find((b) => b.id === id)?.name ?? id.slice(0, 8);
  const statusBadge = (s: Manager["status"]) =>
    s === "active"
      ? "bg-emerald-100 text-emerald-900"
      : s === "invited"
        ? "bg-amber-100 text-amber-900"
        : "bg-red-100 text-red-900";
  const statusLabel = (s: Manager["status"]) => (s === "active" ? "Ativa" : s === "invited" ? "Convidada" : "Revogada");

  if (loading) {
    return <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center text-slate-600">A carregar equipa…</div>;
  }
  if (notReady) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-2">Gestor de Montras — a ser ativado</h3>
        <p className="text-sm text-slate-600">
          Aplica primeiro a migration <code className="font-mono text-[#8A6F3E]">20261117000026_gestor_montras.sql</code> no
          Supabase (SQL Editor). Depois esta área fica funcional: convites por email, atribuição de montras e chaves de API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-display text-lg font-bold text-[#0F172A] mb-1">Convidar gestora de montras</h3>
        <p className="text-sm text-slate-600 mb-4">
          A gestora gere apenas as montras que lhe atribuíres — sem senhas de clientes, sem acesso a pagamentos nem a
          administradores. O convite só ativa quando ela entrar com este email e aceitar no Painel da Gestora.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@exemplo.pt"
            className={inputCls}
          />
          <button onClick={invite} disabled={busy || !inviteEmail.trim()} className={btnGold}>
            Enviar convite
          </button>
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        {notice && <p className="text-sm text-emerald-800 mt-3">{notice}</p>}
      </div>

      {newKey && (
        <div className="bg-[#0F172A] rounded-xl p-6">
          <h4 className="text-white font-bold text-sm mb-2">Nova chave de API — copia agora (só é mostrada uma vez)</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <code className="flex-grow bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-100 font-mono break-all select-all">
              {newKey}
            </code>
            <button onClick={() => setNewKey(null)} className="px-4 py-2 border border-slate-600 text-slate-200 hover:text-white text-sm font-semibold rounded-lg">
              Já copiei
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {managers.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 text-sm text-slate-600">Ainda não há gestoras convidadas.</div>
        )}
        {managers.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#0F172A]">{m.email}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusBadge(m.status)}`}>{statusLabel(m.status)}</span>
              <span className="text-xs text-[#4B5563]">
                {m.user_id ? "Conta vinculada" : "Sem conta vinculada"} · convidada por {m.invited_by ?? "—"}
              </span>
              {m.status !== "revoked" && (
                <button onClick={() => revoke(m)} disabled={busy} className="ml-auto px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg">
                  Revogar acesso
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Montras atribuídas</p>
              <div className="flex flex-wrap gap-2">
                {grants.filter((g) => g.manager_id === m.id).length === 0 && (
                  <span className="text-xs text-[#4B5563]">Nenhuma — atribui abaixo ou ela cria as próprias.</span>
                )}
                {grants
                  .filter((g) => g.manager_id === m.id)
                  .map((g) => (
                    <span key={g.business_id} className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#FAF7F2] border border-[#E5E7EB] rounded-full text-xs font-semibold text-[#0F172A]">
                      {bizName(g.business_id)}
                      <button onClick={() => ungrant(g)} disabled={busy} className="text-red-700 font-bold" aria-label="Retirar montra">
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>

            {m.status === "active" && (
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Chaves de API (identidade de agente)</p>
                <div className="flex flex-col sm:flex-row gap-3 mb-2">
                  <input
                    value={keyLabel[m.id] ?? ""}
                    onChange={(e) => setKeyLabel((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="Etiqueta (ex.: Atena — produção)"
                    className={inputCls}
                  />
                  <button onClick={() => createKey(m)} disabled={busy} className={btnGhost}>
                    Gerar chave
                  </button>
                </div>
                {keys
                  .filter((k) => k.manager_id === m.id)
                  .map((k) => (
                    <div key={k.id} className="flex flex-wrap items-center gap-3 text-xs text-[#4B5563] py-1">
                      <span className="font-semibold text-[#0F172A]">{k.label ?? "API"}</span>
                      <span>criada {new Date(k.created_at).toLocaleDateString("pt-PT")}</span>
                      <span>{k.last_used_at ? `último uso ${new Date(k.last_used_at).toLocaleDateString("pt-PT")}` : "nunca usada"}</span>
                      {k.revoked_at ? (
                        <span className="text-red-700 font-semibold">revogada</span>
                      ) : (
                        <button onClick={() => revokeKey(k)} disabled={busy} className="text-red-700 font-semibold hover:underline">
                          Revogar
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h4 className="font-display text-base font-bold text-[#0F172A] mb-3">Atribuir uma montra a uma gestora</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={grantManager} onChange={(e) => setGrantManager(e.target.value)} className={inputCls}>
            <option value="">Escolher gestora…</option>
            {managers.filter((m) => m.status !== "revoked").map((m) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>
          <select value={grantBusiness} onChange={(e) => setGrantBusiness(e.target.value)} className={inputCls}>
            <option value="">Escolher montra…</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.city ? `· ${b.city}` : ""}
              </option>
            ))}
          </select>
          <button onClick={grant} disabled={busy || !grantManager || !grantBusiness} className={btnGold}>
            Atribuir
          </button>
        </div>
      </div>
    </div>
  );
}
