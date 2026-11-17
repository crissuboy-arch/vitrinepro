/**
 * app/promocoes/page.tsx — FASE 1 "Vitrine Flash"
 *
 * Página pública de promoções de negócios locais: cartões com desconto,
 * contador, filtros por cidade, categoria e validade. Só promoções
 * reais e visíveis agora (lib/promotions) — sem dados fictícios.
 * Não altera o /explorar: vive ao lado dele e reutiliza os mesmos dados.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import {
  loadPromotions,
  filterPromotions,
  promotionFacets,
  PROMOTION_VALIDITY_OPTIONS,
  type PromotionRow,
  type PromotionValidityFilter,
} from "@/lib/promotions";
import PromotionCard from "@/components/promotions/PromotionCard";

export default function PromocoesPage() {
  const [promotions, setPromotions] = useState<PromotionRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [validity, setValidity] = useState<PromotionValidityFilter>("todas");

  // Filtros iniciais a partir da URL (?cidade=&categoria=&validade=).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("cidade");
      const cat = params.get("categoria");
      const v = params.get("validade");
      if (c) setCity(c);
      if (cat) setCategory(cat);
      if (v === "hoje" || v === "48h" || v === "semana") setValidity(v);
    } catch {
      // sem URL legível — filtros por omissão
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPromotions(supabase)
      .then((rows) => {
        if (!cancelled) setPromotions(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setPromotions([]);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const facets = useMemo(
    () => (promotions ? promotionFacets(promotions) : { cities: [], categories: [] }),
    [promotions]
  );

  const visible = useMemo(
    () =>
      promotions
        ? filterPromotions(promotions, { city: city || null, category: category || null, validity })
        : [],
    [promotions, city, category, validity]
  );

  const selectClass =
    "px-3 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-sm text-white focus:border-[#C8A96B] outline-none";

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans selection:bg-[#C8A96B] selection:text-[#0F172A]">
      {/* Header (mesmo padrão do /explorar) */}
      <header className="border-b border-white/5 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-slate-600 px-3 py-1.5 rounded-lg"
          >
            ← Voltar ao Início
          </Link>
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <Link
            href="/explorar"
            className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg"
          >
            Explorar negócios
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="text-center py-4 space-y-2">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            🏷️ Vitrine Flash
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Promoções <span className="text-[#C8A96B]">perto de si</span>
          </h1>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-2xl mx-auto">
            Ofertas reais de negócios locais em Portugal. Quando o prazo termina, a promoção sai daqui automaticamente.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass} aria-label="Cidade">
            <option value="">Todas as cidades</option>
            {facets.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {facets.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5" role="group" aria-label="Validade">
            {PROMOTION_VALIDITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setValidity(o.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  validity === o.value
                    ? "bg-[#C8A96B] border-[#C8A96B] text-[#0F172A]"
                    : "border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {promotions === null ? (
          <p className="text-center text-sm text-gray-400 py-16">A carregar promoções…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">🏷️</span>
            <p className="text-sm text-gray-400">
              {loadError
                ? "Não foi possível carregar as promoções de momento. Tenta novamente dentro de instantes."
                : promotions.length === 0
                  ? "Ainda não há promoções ativas. Volta em breve — os negócios locais publicam ofertas novas com frequência."
                  : "Nenhuma promoção corresponde aos filtros escolhidos. Experimenta outra cidade ou categoria."}
            </p>
            {promotions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCity("");
                  setCategory("");
                  setValidity("todas");
                }}
                className="text-xs px-3 py-2 rounded-lg border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 font-bold transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mt-8 mb-4">
              {visible.length} {visible.length === 1 ? "promoção ativa" : "promoções ativas"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((p) => (
                <PromotionCard key={p.id} promotion={p} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer (mesmo padrão do /explorar) */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 mt-20 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-1" />
          </Link>
          <p className="text-slate-400">Portugal, à sua volta.</p>
          <p className="text-[10px] text-slate-600 mt-2">© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
