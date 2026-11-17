/**
 * app/orcamentos/page.tsx — Fase 2 "Pedidos de Orçamento".
 * Lista PÚBLICA de pedidos aprovados (sem nenhum dado de contacto),
 * com filtros por cidade e categoria. Degrada com elegância enquanto
 * a migration não está aplicada (estado "a chegar").
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadPublicQuotes, filterQuotes, quoteFacets, type QuoteRequest } from "@/lib/quotes";
import QuoteCard from "@/components/quotes/QuoteCard";

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[] | null>(null);
  const [ready, setReady] = useState(true);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    (async () => {
      const res = await loadPublicQuotes();
      setReady(res.ready);
      setQuotes(res.quotes);
      try {
        const params = new URLSearchParams(window.location.search);
        setCity(params.get("cidade") || "");
        setCategory(params.get("categoria") || "");
      } catch {}
    })();
  }, []);

  const facets = useMemo(() => quoteFacets(quotes || []), [quotes]);
  const visible = useMemo(
    () => filterQuotes(quotes || [], { city: city || null, category: category || null }),
    [quotes, city, category]
  );

  const selectClass =
    "px-3 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-sm text-white focus:border-[#C8A96B] outline-none";

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans">
      {/* Header (mesmo padrão do /explorar e /promocoes) */}
      <header className="border-b border-white/5 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-slate-600 px-3 py-1.5 rounded-lg">
            ← Voltar ao Início
          </Link>
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/pedir-orcamento" className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg">
            Pedir orçamento
          </Link>
        </div>
      </header>
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="text-center py-4 space-y-2">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            🧾 Pedidos de Orçamento
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Quem precisa de <span className="text-[#C8A96B]">profissionais</span>?
          </h1>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-2xl mx-auto">
            Pedidos reais de clientes em Portugal, revistos pela nossa equipa.
            És profissional? Responde a partir do teu painel. Precisas de um serviço?{" "}
            <Link href="/pedir-orcamento" className="text-[#C8A96B] font-semibold hover:underline">Publica o teu pedido grátis</Link>.
          </p>
        </div>

        {!ready ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">🛠️</p>
            <p className="text-[#F5F0E8] font-display font-semibold text-lg">Pedidos de orçamento a chegar</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Estamos a ativar esta área. Entretanto, encontra negócios locais no{" "}
              <Link href="/explorar" className="text-[#C8A96B] hover:underline">Explorar</Link>.
            </p>
          </div>
        ) : quotes === null ? (
          <p className="text-center text-sm text-gray-400 py-20">A carregar pedidos…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass} aria-label="Cidade">
                <option value="">Todas as cidades</option>
                {facets.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label="Categoria">
                <option value="">Todas as categorias</option>
                {facets.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-4xl">🧾</p>
                <p className="text-[#F5F0E8] font-display font-semibold text-lg">Ainda não há pedidos publicados</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Sê o primeiro:{" "}
                  <Link href="/pedir-orcamento" className="text-[#C8A96B] hover:underline">publica o teu pedido</Link>{" "}
                  e recebe respostas de profissionais da tua zona.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mt-8 mb-4">
                  {visible.length} {visible.length === 1 ? "pedido ativo" : "pedidos ativos"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visible.map((q) => (
                    <QuoteCard key={q.id} quote={q} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      {/* Footer (mesmo padrão do /explorar e /promocoes) */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 mt-20 text-center text-slate-500 text-xs">
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
