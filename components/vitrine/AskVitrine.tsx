/**
 * components/vitrine/AskVitrine.tsx — A8 "Pergunte à Vitrine"
 *
 * Entrada de linguagem natural integrada ao /explorar.
 * Mostra CARDS REAIS (vindos dos IDs da A7) + botão Guardar (Favoritos/Coleções).
 * Mobile-first: input confortável, cards legíveis, fácil de fechar.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SaveToCollection from "@/app/components/SaveToCollection";

interface AskResult {
  id: string;
  type: "business" | "product" | "post";
  business_id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  price?: number | null;
  city?: string | null;
  category?: string | null;
  distanceKm?: number | null;
  url: string;
}

const SUGGESTIONS = [
  "Preciso de algo hoje",
  "Comer perto de mim",
  "Presente até €30",
  "Serviços perto de mim",
];

export default function AskVitrine({
  userLat,
  userLng,
}: {
  userLat?: number | null;
  userLng?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<AskResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open ]);

  const ask = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setResults([]);
    try {
      const r = await fetch("/api/vitrine/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg.slice(0, 500),
          latitude: userLat ?? null,
          longitude: userLng ?? null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erro");
      setAnswer(j.answer);
      setResults(j.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível responder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Entrada */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1e293b] border border-[#C8A96B]/20 text-left hover:border-[#C8A96B]/40 transition-all shadow-sm"
        aria-expanded={open}
      >
        <span className="text-2xl">✨</span>
        <div className="flex-1">
          <div className="font-display font-bold text-white text-sm">Pergunte à Vitrine</div>
          <div className="text-xs text-slate-400">O que você está procurando?</div>
        </div>
        <span className="text-slate-400 text-lg">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F172A]/95 p-4 space-y-4">
          {/* Sugestões */}
          <div className="flex gap-2 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setMessage(s); ask(s); }}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(message); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Quero coxinha perto de mim…"
              maxLength={500}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#C8A96B]/50"
              aria-label="Pergunte à Vitrine"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-5 py-3 rounded-xl bg-[#C8A96B] text-[#0F172A] font-bold text-sm hover:bg-[#D4BB82] transition-colors disabled:opacity-40"
            >
              {loading ? "…" : "➤"}
            </button>
          </form>

          {/* Loading */}
          {loading && (
            <div className="text-center text-slate-400 text-sm py-4">
              A procurar na Vitrine…
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="text-center text-sm py-4">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-slate-500 text-xs">A busca tradicional continua disponível abaixo.</p>
            </div>
          )}

          {/* Resposta + cards reais */}
          {answer && (
            <div className="space-y-3">
              <p className="text-sm text-slate-200">{answer}</p>
              {results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((r) => (
                    <div
                      key={`${r.type}-${r.id}`}
                      className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                    >
                      {r.image_url && (
                        <img src={r.image_url} alt={r.name} className="w-full h-32 object-cover" loading="lazy" />
                      )}
                      <div className="p-3">
                        <div className="font-semibold text-white text-sm truncate">{r.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          {r.price != null && <span className="text-[#C8A96B] font-bold">€{r.price}</span>}
                          {r.city && <span>{r.city}</span>}
                          {r.distanceKm != null && <span>{r.distanceKm} km</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Link
                            href={r.url}
                            className="flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C8A96B]/15 text-[#C8A96B] hover:bg-[#C8A96B]/25 transition-colors"
                          >
                            Ver na Vitrine
                          </Link>
                          {r.type !== "post" && (
                            <SaveToCollection
                              itemRef={{
                                businessId: r.business_id,
                                productId: r.type === "product" ? r.id : null,
                              }}
                              label="Guardar"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fechar */}
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
