/**
 * components/quotes/BusinessQuotesPanel.tsx — Fase 2 (dashboard).
 * Tab «Pedidos» da Montra: pedidos aprovados (por defeito da cidade e
 * categoria do negócio), manifestar interesse, e acompanhar as
 * manifestações — com o contacto do consumidor visível APENAS quando
 * ele aceitou o interesse (revelação autorizada pela API).
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadPublicQuotes,
  QUOTE_INTEREST_LABELS,
  type QuoteRequest,
  type QuoteInterestForBusiness,
} from "@/lib/quotes";
import QuoteCard from "@/components/quotes/QuoteCard";

interface Props {
  businessId: string;
  businessCity: string | null;
  businessCategory: string | null;
}

export default function BusinessQuotesPanel({ businessId, businessCity, businessCategory }: Props) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [city, setCity] = useState<string>(businessCity || "");
  const [category, setCategory] = useState<string>(businessCategory || "");
  const [interests, setInterests] = useState<QuoteInterestForBusiness[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openDraft, setOpenDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    const res = await loadPublicQuotes({ city: city || null, category: category || null });
    setReady(res.ready);
    setQuotes(res.quotes);
  }, [city, category]);

  const loadInterests = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/interest?business_id=${businessId}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ready) setInterests((data.interests || []).filter((i: QuoteInterestForBusiness) => i.request));
    } catch {}
  }, [businessId]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);
  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  const sentFor = useMemo(() => new Map(interests.map((i) => [i.request_id, i])), [interests]);
  const acceptedCount = interests.filter((i) => i.status === "accepted").length;

  async function sendInterest(quoteId: string) {
    setBusy(quoteId);
    setFeedback(null);
    try {
      const res = await fetch("/api/quotes/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, request_id: quoteId, message: drafts[quoteId] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(data.error || "Não foi possível registar o interesse.");
        return;
      }
      setFeedback("Interesse enviado! Se o cliente aceitar, o contacto dele aparece aqui.");
      setOpenDraft(null);
      await loadInterests();
    } catch {
      setFeedback("Falha de ligação. Tenta novamente.");
    } finally {
      setBusy(null);
    }
  }

  const selectClass =
    "px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white focus:border-[#C8A96B] outline-none";

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-gray-800 pb-4">
          <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Pedidos de Orçamento</h3>
          <p className="text-xs text-gray-400">
            Pedidos reais de clientes, aprovados pela nossa equipa. Manifesta interesse e, se o cliente aceitar, recebes o contacto dele.
          </p>
        </div>

        {ready === false ? (
          <p className="text-sm text-gray-400 bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-5 text-center">
            🛠️ Os Pedidos de Orçamento estão a ser ativados. Volta dentro de dias.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade (a tua, por defeito)" className={selectClass} />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria (a tua, por defeito)" className={selectClass} />
              <p className="text-xs text-gray-400 ml-auto">
                <strong className="text-[#F5F0E8]">{quotes.length}</strong> pedidos disponíveis ·{" "}
                <strong className="text-[#F5F0E8]">{interests.length}</strong> interesses enviados ·{" "}
                <strong className="text-green-300">{acceptedCount}</strong> aceites
              </p>
            </div>

            {feedback && <p className="text-xs text-[#C8A96B] bg-[#C8A96B]/10 border border-[#C8A96B]/20 rounded-lg px-3 py-2">{feedback}</p>}

            {ready === null ? (
              <p className="text-sm text-gray-500">A carregar pedidos…</p>
            ) : quotes.length === 0 ? (
              <p className="text-sm text-gray-500 bg-[#0B1120] border border-gray-800 rounded-xl px-4 py-5 text-center">
                Ainda não há pedidos aprovados com estes filtros. Alarga a cidade/categoria ou volta mais tarde.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {quotes.map((q) => {
                  const mine = sentFor.get(q.id);
                  return (
                    <div key={q.id} className="flex flex-col gap-2">
                      <QuoteCard quote={q} />
                      {mine ? (
                        <p className="text-xs text-gray-400 px-1">
                          O teu interesse: <strong className="text-[#F5F0E8]">{QUOTE_INTEREST_LABELS[mine.status]}</strong>
                          {mine.status === "accepted" && " — o contacto está em «As minhas manifestações» abaixo."}
                        </p>
                      ) : openDraft === q.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={drafts[q.id] || ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                            rows={2}
                            maxLength={500}
                            placeholder="Mensagem curta para o cliente (opcional): prazos, experiência, próximo passo…"
                            className="w-full px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:border-[#C8A96B] outline-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => sendInterest(q.id)} disabled={busy === q.id} className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                              {busy === q.id ? "A enviar…" : "Enviar interesse"}
                            </button>
                            <button onClick={() => setOpenDraft(null)} className="px-4 py-2 border border-gray-700 text-gray-300 text-xs font-bold rounded-lg">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setOpenDraft(q.id)} className="self-start px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-lg transition-colors">
                          Tenho interesse
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {interests.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="font-display font-semibold text-[#F5F0E8]">As minhas manifestações</h4>
          <div className="space-y-3">
            {interests.map((i) => (
              <div key={i.id} className="bg-[#0B1120] border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#F5F0E8]">{i.request.title}</span>
                  <span className="text-[11px] text-gray-500">{i.request.city} · {i.request.category}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/5 border-gray-700 text-gray-300 ml-auto">
                    {QUOTE_INTEREST_LABELS[i.status]}
                  </span>
                </div>
                {i.status === "accepted" && i.contact && (
                  <div className="text-sm text-green-200 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 space-y-0.5">
                    <p>👤 {i.contact.name}</p>
                    {i.contact.phone && (
                      <p>
                        📱{" "}
                        <a href={`https://wa.me/${i.contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                          {i.contact.phone} (WhatsApp)
                        </a>
                      </p>
                    )}
                    {i.contact.email && <p>✉️ {i.contact.email}</p>}
                  </div>
                )}
                {i.status === "accepted" && !i.contact && (
                  <p className="text-xs text-gray-500">Contacto aceite — a carregar dados…</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
