"use client";

/**
 * components/landing/DiscoverMockup.tsx
 *
 * Barra de pesquisa + categorias da nova landing (mockup aprovado).
 * A pesquisa é REAL: usa o mesmo comportamento da DiscoverySearch
 * atual — submeter navega para /explorar?q=…, que filtra o catálogo
 * vivo de negócios/produtos. Sem texto, o botão leva ao /explorar
 * ("Perto de mim"). As categorias ligam à mesma pesquisa real por
 * termo (o /explorar lê o parâmetro q). Nada de pesquisa falsa.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CHIPS: { icon: string; label: string; q?: string }[] = [
  { icon: "🍴", label: "Restaurantes e Cafés", q: "restaurante" },
  { icon: "✂", label: "Salões de Beleza", q: "salão de beleza" },
  { icon: "💈", label: "Barbearias", q: "barbearia" },
  { icon: "🛍", label: "Lojas e Comércio", q: "loja" },
  { icon: "💼", label: "Serviços Profissionais", q: "serviços" },
  { icon: "💚", label: "Saúde e Bem-estar", q: "saúde" },
  { icon: "🏋", label: "Ginásios e Fitness", q: "ginásio" },
  { icon: "✚", label: "Clínicas", q: "clínica" },
  { icon: "🚗", label: "Automóvel", q: "automóvel" },
  { icon: "🏠", label: "Casa e Construção", q: "construção" },
  { icon: "🎓", label: "Explicadores", q: "explicadores" },
  { icon: "🐾", label: "Animais", q: "animais" },
  { icon: "💻", label: "Tecnologia", q: "tecnologia" },
  { icon: "⋯", label: "Mais categorias" },
];

export default function DiscoverMockup() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/explorar?q=${encodeURIComponent(q)}` : "/explorar");
  };

  return (
    <div id="descobrir" className="relative z-[3] pt-2.5 pb-[70px]">
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

        <div className="flex lg:flex-wrap flex-nowrap lg:justify-center gap-2.5 lg:gap-3 mt-4 lg:mt-[26px] lg:max-w-[1180px] mx-auto overflow-x-auto lg:overflow-visible -mx-5 px-5 lg:mx-auto lg:px-0 pb-1.5 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.q ? `/explorar?q=${encodeURIComponent(chip.q)}` : "/explorar"}
              className="inline-flex items-center gap-2.5 whitespace-nowrap px-4 py-2.5 lg:px-5 lg:py-3 rounded-full border border-white/[0.16] bg-white/[0.03] text-[13px] lg:text-sm font-medium transition-colors hover:border-[#C8A96B] hover:text-[#E6CB8C]"
            >
              <span className="not-italic text-[#C8A96B]">{chip.icon}</span>
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
