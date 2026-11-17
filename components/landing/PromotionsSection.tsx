/**
 * components/landing/PromotionsSection.tsx — FASE 1 "Vitrine Flash"
 *
 * Secção da homepage com as promoções em destaque (as que terminam
 * primeiro). Só dados reais: sem promoções ativas, a secção não aparece.
 * Estilo alinhado com as restantes secções da landing (fundo escuro,
 * dourado #C9A96E).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { loadPromotions, filterPromotions, type PromotionRow } from "@/lib/promotions";
import PromotionCard from "@/components/promotions/PromotionCard";

const HIGHLIGHT_LIMIT = 8;

export default function PromotionsSection() {
  const [promotions, setPromotions] = useState<PromotionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPromotions(supabase)
      .then((rows) => {
        if (!cancelled) setPromotions(filterPromotions(rows).slice(0, HIGHLIGHT_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setPromotions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sem promoções reais → a secção não aparece (nada de enchimento fictício).
  if (!promotions || promotions.length === 0) return null;

  return (
    <section className="py-24 md:py-32 bg-[#050816] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            🏷️ Vitrine Flash
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Promoções a <span className="text-[#C9A96E]">terminar</span>
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-2xl mx-auto">
            Ofertas reais de negócios locais — aproveita antes que o prazo acabe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {promotions.map((p) => (
            <PromotionCard key={p.id} promotion={p} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/promocoes"
            className="inline-block px-6 py-3 rounded-xl bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold transition-colors"
          >
            Ver todas as promoções
          </Link>
        </div>
      </div>
    </section>
  );
}
