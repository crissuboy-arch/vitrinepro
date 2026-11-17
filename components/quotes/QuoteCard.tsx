/**
 * components/quotes/QuoteCard.tsx — Fase 2.
 * Cartão público de um pedido de orçamento aprovado.
 * NUNCA mostra dados de contacto (não existem em QuoteRequest).
 */
"use client";

import type { QuoteRequest } from "@/lib/quotes";

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export default function QuoteCard({ quote }: { quote: QuoteRequest }) {
  const left = daysLeft(quote.expires_at);
  return (
    <article className="bg-[#0F172A] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-[#C8A96B]/50 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-[#0F172A] bg-[#C8A96B] px-2 py-0.5 rounded-full uppercase tracking-wide">
          {quote.category}
        </span>
        <span className="text-[10px] font-bold text-gray-300 bg-white/5 border border-gray-700 px-2 py-0.5 rounded-full">
          📍 {quote.city}
        </span>
        <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full ml-auto">
          ⏳ {left === 0 ? "Termina hoje" : `Termina em ${left}d`}
        </span>
      </div>

      <h3 className="font-display font-semibold text-[#F5F0E8] leading-snug">{quote.title}</h3>
      <p className="text-sm text-[#A9B1C3] font-light leading-relaxed line-clamp-3">{quote.description}</p>

      <p className="text-[11px] text-gray-500 mt-auto">
        Publicado {new Date(quote.created_at).toLocaleDateString("pt-PT")}
      </p>
    </article>
  );
}
