"use client";

/**
 * components/landing/DiscoverMockup.tsx
 *
 * Barra de pesquisa da nova landing (mockup aprovado).
 * A pesquisa é REAL: usa o mesmo comportamento da DiscoverySearch
 * atual — submeter navega para /explorar?q=…, que filtra o catálogo
 * vivo de negócios/produtos. Sem texto, o botão leva ao /explorar
 * ("Perto de mim"). Nada de pesquisa falsa.
 *
 * LIMPEZA DE REPETIÇÕES (21/10/2026): a linha de chips de categorias
 * que seguia a barra foi removida — as categorias passam a ser
 * apresentadas UMA vez nesta zona, nos cartões de setor da secção
 * "Negócios reais. Todos os setores." (SectorsMockup).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverMockup() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/explorar?q=${encodeURIComponent(q)}` : "/explorar");
  };

  return (
    <div id="descobrir" className="relative z-[3] pt-2.5 pb-10 lg:pb-14">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10">
        <form
          onSubmit={submit}
          className="flex items-center gap-2 lg:gap-3.5 max-w-[980px] mx-auto p-2 pl-4 lg:p-2.5 lg:pl-6 bg-[#0B1224]/90 border border-[#C8A96B]/[0.22] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <span aria-hidden="true">🔍</span>
          <label htmlFor="landing-search" className="sr-only">
            Pesquise negócios, serviços, produtos
          </label>
          <input
            id="landing-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise negócios, serviços, produtos…"
            className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px] lg:text-[15px] text-[#F7F4EE] placeholder:text-[#A9B1C3]"
          />
          <button
            type="submit"
            className="shrink-0 inline-flex items-center justify-center px-3.5 py-[11px] lg:px-[26px] lg:py-3.5 rounded-[10px] lg:rounded-xl font-bold text-[13px] lg:text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          >
            📍 <span className="hidden sm:inline">Perto de mim</span>
            <span className="sm:hidden">Perto</span>
          </button>
        </form>
      </div>
    </div>
  );
}
