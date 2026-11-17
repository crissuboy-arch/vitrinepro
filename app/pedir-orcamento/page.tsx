/**
 * app/pedir-orcamento/page.tsx — Fase 2.
 * Página pública do formulário de pedido de orçamento (sem conta),
 * com a explicação do fluxo e das proteções de privacidade.
 */
"use client";

import Link from "next/link";
import QuoteForm from "@/components/quotes/QuoteForm";

const STEPS = [
  { icon: "✍️", title: "1. Publica o pedido", text: "Sem conta e sem custos. Descreve o que precisas, onde e quando." },
  { icon: "🛡️", title: "2. Nós revemos", text: "Cada pedido é aprovado pela nossa equipa antes de ficar visível — sem spam nem dados pessoais expostos." },
  { icon: "🤝", title: "3. Tu escolhes quem te contacta", text: "Os profissionais mostram interesse; só quem tu aceitares recebe o teu contacto." },
];

export default function PedirOrcamentoPage() {
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
          <Link href="/orcamentos" className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg">
            Ver pedidos
          </Link>
        </div>
      </header>
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-8">
        <div className="text-center py-4 space-y-2">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            🧾 Pedir Orçamento
          </span>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Precisas de um <span className="text-[#C8A96B]">profissional</span>?
          </h1>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            Publica o teu pedido e recebe respostas de negócios locais — sem partilhares os teus contactos com toda a gente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8">
          {STEPS.map((s) => (
            <div key={s.title} className="bg-[#0F172A] border border-gray-800 rounded-2xl p-4 space-y-1.5">
              <p className="text-xl">{s.icon}</p>
              <p className="text-sm font-semibold text-[#F5F0E8]">{s.title}</p>
              <p className="text-xs text-[#A9B1C3] font-light leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <QuoteForm />
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
