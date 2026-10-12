/* eslint-disable */
"use client";

/**
 * app/admin/handover.tsx — Entrega de Montra a cliente (modelo Shopify)
 *
 * Fluxo guiado, 100% via endpoints Super Admin existentes:
 *  1. Localizar a Montra pelo slug (IDs resolvidos no servidor — a
 *     administradora nunca precisa de copiar UUIDs).
 *  2. Verificar a conta de destino pelo email (reutiliza user_id existente
 *     ou prepara convite seguro para login com Google).
 *  3. Ver o inventário/impacto (contagens read-only).
 *  4. Confirmação final explícita → POST /transfer (confirm: true).
 *
 * A transferência SÓ acontece quando a administradora carrega no botão
 * final com a confirmação explícita. Nada é executado automaticamente.
 */

import { useState } from "react";

interface FoundBusiness {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  city?: string | null;
  plan?: string | null;
  published?: boolean;
}

interface DestAccount {
  user_id: string;
  already_exists: boolean;
  email_confirmed: boolean;
  invited?: boolean;
}

interface Impact {
  products: number | null;
  gallery: number | null;
  posts: number | null;
  favorites: number | null;
  shortLinks: number | null;
}

const inputCls =
  "px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F2] w-full focus:outline-none focus:ring-1 focus:ring-[#C8A96B]";
const btnPrimary =
  "px-4 py-2 bg-[#0F172A] text-white text-sm rounded-lg hover:bg-[#1F2937] transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed";
const btnGold =
  "px-4 py-2 bg-[#C8A96B] text-white text-sm rounded-lg hover:bg-[#b8965a] transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed";
const cardCls = "bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm";

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h3 className="font-display text-base font-bold text-[#0F172A] mb-3">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0F172A] text-white text-xs mr-2">
        {n}
      </span>
      {title}
    </h3>
  );
}

export default function HandoverPanel() {
  const [slug, setSlug] = useState("cantinho-da-lu-1780338635504");
  const [email, setEmail] = useState("luana.danies@gmail.com");
  const [biz, setBiz] = useState<FoundBusiness | null>(null);
  const [dest, setDest] = useState<DestAccount | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<any>(null);

  const fail = (m: string) => {
    setError(m);
    setBusy(null);
  };

  // 1. Localizar pelo slug — IDs resolvidos no servidor.
  const locate = async () => {
    setError(null);
    setBusy("locate");
    setBiz(null);
    try {
      const r = await fetch(`/api/admin/businesses?q=${encodeURIComponent(slug.trim())}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha na pesquisa");
      const list: FoundBusiness[] = j.businesses || [];
      const exact = list.find((b) => b.slug === slug.trim()) || list[0];
      if (!exact) throw new Error("Montra não encontrada para este slug.");
      setBiz(exact);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erro desconhecido");
      return;
    }
    setBusy(null);
  };

  // 2. Verificar a conta de destino (reutiliza ou convida).
  const checkAccount = async () => {
    setError(null);
    setBusy("account");
    setDest(null);
    try {
      const r = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao verificar a conta");
      setDest({
        user_id: j.user_id,
        already_exists: !!j.already_exists,
        email_confirmed: !!j.email_confirmed,
        invited: !j.already_exists,
      });
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erro desconhecido");
      return;
    }
    setBusy(null);
  };

  // 3. Inventário read-only.
  const loadImpact = async () => {
    if (!biz) return;
    setError(null);
    setBusy("impact");
    setImpact(null);
    try {
      const r = await fetch(`/api/admin/businesses/${biz.id}/impact`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha no inventário");
      setImpact(j.impact);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erro desconhecido");
      return;
    }
    setBusy(null);
  };

  // 4. Transferência — SÓ com confirmação explícita da administradora.
  const transfer = async () => {
    if (!biz || !dest || !confirm) return;
    if (!window.confirm(`Transferir "${biz.name}" para ${email.trim()}? Esta ação fica registada na auditoria.`))
      return;
    setError(null);
    setBusy("transfer");
    try {
      const r = await fetch(`/api/admin/businesses/${biz.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: dest.user_id,
          confirm: true,
          reason: "Entrega da Montra à cliente (modelo Shopify)",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha na transferência");
      setDone(j);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erro desconhecido");
      return;
    }
    setBusy(null);
  };

  const canTransfer =
    biz && dest && dest.email_confirmed && impact && confirm && !busy && !done;

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h2 className="font-display text-lg font-bold text-[#0F172A] mb-1">
          🔑 Entregar Montra a cliente
        </h2>
        <p className="text-sm text-slate-500">
          Localiza a Montra pelo slug, verifica a conta da cliente e transfere a
          propriedade — sem recriar nada, sem mexer em produtos, fotos, slug ou QR Code.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {done ? (
        <div className={`${cardCls} border-green-200 bg-green-50`}>
          <h3 className="font-display text-base font-bold text-green-800 mb-2">
            ✅ Transferência concluída
          </h3>
          <div className="text-sm text-green-900 space-y-1">
            <p><strong>Montra:</strong> {done.slug}</p>
            <p><strong>De:</strong> <span className="font-mono text-xs">{done.from_user_id}</span></p>
            <p><strong>Para:</strong> <span className="font-mono text-xs">{done.to_user_id}</span></p>
          </div>
          <p className="text-xs text-green-700 mt-3">
            A cliente já pode entrar com Google e gerir a Montra em Minhas Montras.
            A administradora mantém acesso pelo painel.
          </p>
        </div>
      ) : (
        <>
          {/* Passo 1 */}
          <div className={cardCls}>
            <StepTitle n={1} title="Localizar a Montra pelo slug" />
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="slug-da-montra" />
              <button onClick={locate} disabled={busy === "locate" || !slug.trim()} className={btnPrimary}>
                {busy === "locate" ? "A localizar…" : "Localizar"}
              </button>
            </div>
            {biz && (
              <div className="mt-4 text-sm bg-[#FAF7F2] rounded-lg p-4 space-y-1">
                <p><strong>{biz.name}</strong> <span className="text-slate-400">/{biz.slug}</span></p>
                <p className="text-slate-500">Plano: <strong>{biz.plan || "free"}</strong> · {biz.published ? "Publicada" : "Não publicada"} · {biz.city || ""}</p>
                <p className="text-xs text-slate-400">IDs resolvidos internamente — não precisas de os copiar.</p>
              </div>
            )}
          </div>

          {/* Passo 2 */}
          <div className={cardCls}>
            <StepTitle n={2} title="Conta da cliente" />
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="cliente@email.com" type="email" />
              <button onClick={checkAccount} disabled={busy === "account" || !email.trim()} className={btnPrimary}>
                {busy === "account" ? "A verificar…" : "Verificar conta"}
              </button>
            </div>
            {dest && (
              <div className="mt-4 text-sm bg-[#FAF7F2] rounded-lg p-4 space-y-2">
                {dest.already_exists ? (
                  <>
                    <p>✅ Conta existente: <strong>{email.trim()}</strong></p>
                    <p className={dest.email_confirmed ? "text-green-700" : "text-amber-700"}>
                      {dest.email_confirmed
                        ? "Email confirmado — pronta para receber a Montra."
                        : "⚠️ Email ainda não confirmado — a cliente precisa de entrar (Google ou link do convite) antes da transferência."}
                    </p>
                  </>
                ) : (
                  <>
                    <p>📩 Conta ainda não existe. Convite enviado para <strong>{email.trim()}</strong>.</p>
                    <p className="text-slate-500">
                      Pede à cliente para entrar em <strong>vitrinepro.digital com Login Google</strong> usando este
                      email — ou ela define a senha pelo link do convite (uso único, com expiração).
                      Depois carrega em "Verificar conta" novamente.
                    </p>
                    <button onClick={checkAccount} className="text-xs text-[#C8A96B] hover:underline font-semibold">
                      Verificar novamente
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Passo 3 */}
          <div className={cardCls}>
            <StepTitle n={3} title="Inventário antes da transferência" />
            <button onClick={loadImpact} disabled={!biz || busy === "impact"} className={btnPrimary}>
              {busy === "impact" ? "A carregar…" : "Ver inventário"}
            </button>
            {impact && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {[
                  ["Produtos", impact.products],
                  ["Fotografias", impact.gallery],
                  ["Novidades", impact.posts],
                  ["Favoritos", impact.favorites],
                  ["Links curtos", impact.shortLinks],
                ].map(([label, v]) => (
                  <div key={label as string} className="bg-[#FAF7F2] rounded-lg p-3">
                    <div className="font-display text-xl font-bold text-[#0F172A]">{v ?? "—"}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Passo 4 */}
          <div className={`${cardCls} border-amber-200`}>
            <StepTitle n={4} title="Confirmação final" />
            {biz && dest && impact ? (
              <div className="text-sm space-y-2">
                <p>Vais transferir <strong>{biz.name}</strong> (/{biz.slug}) para <strong>{email.trim()}</strong>.</p>
                <p className="text-slate-500">
                  Preservado: {impact.products ?? "—"} produtos, {impact.gallery ?? "—"} fotografias, logo, capa,
                  preços, horários, slug, URL pública e QR Code. Plano: {biz.plan || "free"} (sem alterações).
                </p>
                {!dest.email_confirmed && (
                  <p className="text-amber-700 font-semibold">
                    ⛔ A conta de destino ainda não confirmou o email — a transferência está bloqueada até lá.
                  </p>
                )}
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1" />
                  <span>Confirmo explicitamente a transferência desta Montra para {email.trim()}.</span>
                </label>
                <button onClick={transfer} disabled={!canTransfer} className={btnGold}>
                  {busy === "transfer" ? "A transferir…" : "Transferir propriedade"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Completa os passos 1–3 para veres o resumo e a confirmação.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
