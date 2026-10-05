/**
 * components/landing/DiscoverySearch.tsx — A4.2
 *
 * Consumer-facing discovery block for the Home page.
 *
 *   VITRINEPRO — Portugal, à sua volta.
 *   "O que você procura perto de você?"
 *
 * Searches REAL VitrinePro data: the form navigates to /explorar?q=…,
 * which filters the live businesses/products catalog. No AI answers.
 * Example chips are search SUGGESTIONS (conceptual examples from the
 * brief) — never presented as results or as existing businesses.
 */
"use client";

import { useState } from "react";
import Link from "next/link";

const EXAMPLE_SEARCHES = [
  "coxinha",
  "cabeleireiro",
  "presente",
  "restaurante brasileiro",
  "manicure",
  "decoração",
  "soldador",
  "bolo",
  "artesanato",
];

export default function DiscoverySearch() {
  const [query, setQuery] = useState("");

  const goToSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    window.location.href = `/explorar?q=${encodeURIComponent(trimmed)}`;
  };

  return (
    <section className="py-16 md:py-24 bg-[#0A0D14] border-b border-[#C9A96E]/10 relative z-10">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-[#C9A96B] bg-[#C9A96B]/8 border border-[#C9A96E]/15 rounded-full uppercase tracking-widest">
            📍 Descoberta local
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] tracking-tight">
            Portugal, <span className="text-[#C9A96E] italic">à sua volta.</span>
          </h2>
          <p className="text-[#A9B1C3] text-base md:text-lg font-light max-w-2xl mx-auto">
            Descubra. Pergunte. Encontre. Compre local.
          </p>
        </div>

        {/* Central search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToSearch(query);
          }}
          className="max-w-2xl mx-auto"
        >
          <label
            htmlFor="discovery-search"
            className="block text-sm font-semibold text-[#F5F0E8] mb-3"
          >
            O que você procura perto de você?
          </label>
          <div className="flex gap-2">
            <input
              id="discovery-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: coxinha, cabeleireiro, presente…"
              className="flex-1 px-5 py-4 bg-[#0F172A] border border-[#C9A96E]/25 rounded-xl text-[#F5F0E8] placeholder:text-slate-500 text-base focus:outline-none focus:border-[#C9A96E]/60"
            />
            <button
              type="submit"
              className="px-6 md:px-8 py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl transition-all text-sm active:scale-95 whitespace-nowrap"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Example searches */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLE_SEARCHES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => goToSearch(example)}
              className="px-3 py-1.5 text-xs font-medium text-[#A9B1C3] bg-white/5 border border-white/10 rounded-full hover:border-[#C9A96E]/50 hover:text-[#C9A96E] transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        {/* Quick access */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/explorar"
            className="px-5 py-2.5 text-sm font-bold text-[#0A0D14] bg-[#C9A96E] hover:bg-[#D4BB82] rounded-xl transition-colors"
          >
            Explorar
          </Link>
          <Link
            href="/explorar"
            className="px-5 py-2.5 text-sm font-semibold text-[#C9A96E] border border-[#C9A96E]/30 rounded-xl hover:bg-[#C9A96E]/10 transition-colors"
          >
            📍 Perto de Mim
          </Link>
          <Link
            href="/explorar"
            className="px-5 py-2.5 text-sm font-semibold text-[#A9B1C3] border border-white/10 rounded-xl hover:border-[#C9A96E]/40 hover:text-[#C9A96E] transition-colors"
          >
            Categorias
          </Link>
        </div>
      </div>
    </section>
  );
}
