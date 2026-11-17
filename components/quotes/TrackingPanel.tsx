/**
 * components/quotes/TrackingPanel.tsx — Fase 2.
 * Página de acompanhamento do consumidor via LINK PRIVADO (token).
 * Mostra o estado do pedido e os interesses recebidos; o consumidor
 * aceita/recusa interesses e pode fechar o pedido. Aceitar um interesse
 * autoriza a revelação do contacto APENAS a essa empresa.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_INTEREST_LABELS,
  isValidTrackingToken,
  type QuoteRequest,
  type QuoteInterestForConsumer,
} from "@/lib/quotes";

interface TrackState {
  request: QuoteRequest;
  interests: QuoteInterestForConsumer[];
}

export default function TrackingPanel({ token }: { token: string }) {
  const [state, setState] = useState<TrackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const call = useCallback(
    async (payload: Record<string, unknown>): Promise<TrackState | null> => {
      const res = await fetch("/api/quotes/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar o pedido.");
      return { request: data.request, interests: data.interests || [] };
    },
    [token]
  );

  useEffect(() => {
    (async () => {
      if (!isValidTrackingToken(token)) {
        setError("Este link é inválido. Verifica se copiaste o link completo que recebeste ao publicar o pedido.");
        setLoading(false);
        return;
      }
      try {
        setState(await call({}));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, call]);

  async function decide(interestId: string, decision: "accepted" | "declined") {
    setBusy(interestId);
    try {
      setState(await call({ action: "decide", interestId, decision }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao guardar a decisão.");
    } finally {
      setBusy(null);
    }
  }

  async function closeRequest() {
    if (!window.confirm("Fechar este pedido? Ele deixa de aparecer para os profissionais.")) return;
    setBusy("close");
    try {
      setState(await call({ action: "close" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao fechar o pedido.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-center text-sm text-gray-400 py-16">A carregar o teu pedido…</p>;

  if (error && !state) {
    return (
      <div className="bg-[#0F172A] border border-gray-800 rounded-2xl p-6 text-center space-y-3">
        <p className="text-3xl">🔍</p>
        <p className="text-sm text-[#A9B1C3]">{error}</p>
        <Link href="/pedir-orcamento" className="inline-block text-sm text-[#C8A96B] hover:underline">Fazer um novo pedido →</Link>
      </div>
    );
  }
  if (!state) return null;

  const { request, interests } = state;
  const statusColor =
    request.status === "approved"
      ? "bg-green-400/10 text-green-300 border-green-400/20"
      : request.status === "pending"
        ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
        : "bg-gray-400/10 text-gray-300 border-gray-400/20";

  return (
    <div className="space-y-6">
      <div className="bg-[#0F172A] border border-gray-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-[#0F172A] bg-[#C8A96B] px-2 py-0.5 rounded-full uppercase tracking-wide">{request.category}</span>
          <span className="text-[10px] font-bold text-gray-300 bg-white/5 border border-gray-700 px-2 py-0.5 rounded-full">📍 {request.city}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {QUOTE_STATUS_LABELS[request.status]}
          </span>
        </div>
        <h2 className="font-display font-semibold text-[#F5F0E8] text-xl leading-snug">{request.title}</h2>
        <p className="text-sm text-[#A9B1C3] font-light leading-relaxed whitespace-pre-line">{request.description}</p>
        <p className="text-[11px] text-gray-400">
          Publicado a {new Date(request.created_at).toLocaleDateString("pt-PT")}
          {request.status === "approved" && <> · visível até {new Date(request.expires_at).toLocaleDateString("pt-PT")}</>}
        </p>
        {request.status === "pending" && (
          <p className="text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
            O teu pedido está a ser revisto. Assim que for aprovado, os profissionais da tua zona podem responder aqui.
          </p>
        )}
        {(request.status === "pending" || request.status === "approved") && (
          <button onClick={closeRequest} disabled={busy === "close"} className="text-xs font-bold text-red-300 border border-red-400/30 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {busy === "close" ? "A fechar…" : "Fechar pedido"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-display font-semibold text-[#F5F0E8]">
          Respostas de profissionais <span className="text-gray-400 text-sm font-sans font-normal">({interests.length})</span>
        </h3>
        {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        {interests.length === 0 ? (
          <p className="text-sm text-gray-400 bg-[#0F172A] border border-gray-800 rounded-2xl px-5 py-6 text-center">
            Ainda não há respostas. Quando um profissional mostrar interesse, aparece aqui para aceitares ou recusares.
          </p>
        ) : (
          interests.map((i) => (
            <div key={i.id} className="bg-[#0F172A] border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#F5F0E8]">{i.business.name}</span>
                {i.business.category && <span className="text-[11px] text-gray-400">{i.business.category}</span>}
                {i.business.city && <span className="text-[11px] text-gray-400">· {i.business.city}</span>}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/5 border-gray-700 text-gray-300 ml-auto">
                  {QUOTE_INTEREST_LABELS[i.status]}
                </span>
              </div>
              {i.message && <p className="text-sm text-[#A9B1C3] font-light leading-relaxed">“{i.message}”</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {i.business.slug && (
                  <a href={`/vitrine/${i.business.slug}`} className="text-xs font-bold text-[#C8A96B] border border-[#C8A96B]/40 hover:bg-[#C8A96B]/10 px-3 py-1.5 rounded-lg transition-colors">
                    Ver Montra
                  </a>
                )}
                {i.status === "sent" && (
                  <>
                    <button onClick={() => decide(i.id, "accepted")} disabled={busy === i.id} className="text-xs font-bold bg-green-500 hover:bg-green-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      Aceitar e partilhar o meu contacto
                    </button>
                    <button onClick={() => decide(i.id, "declined")} disabled={busy === i.id} className="text-xs font-bold text-gray-300 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      Recusar
                    </button>
                  </>
                )}
                {i.status === "accepted" && (
                  <span className="text-[11px] text-green-300">✓ O teu contacto foi partilhado com este profissional — ele entrará em contacto contigo.</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        🔒 Esta página é privada: só quem tem este link a vê. Os teus contactos nunca aparecem publicamente.
      </p>
    </div>
  );
}
