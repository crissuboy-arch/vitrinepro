"use client";

import { useState } from "react";

interface Product {
  emoji: string;
  name: string;
  desc: string;
  price: string;
}

const PRODUCTS: Product[] = [
  { emoji: "🍔", name: "Burger Clássico", desc: "Carne de vaca, alface, tomate, queijo", price: "€8.90" },
  { emoji: "🍔", name: "Burger Duplo", desc: "Dupla carne, bacon, cheddar, molho especial", price: "€12.50" },
  { emoji: "🍗", name: "Chicken Crispy", desc: "Frango crocante, coleslaw, pickles", price: "€9.90" },
  { emoji: "🍟", name: "Batata Frita Grande", desc: "Batatas fritas com sal e alecrim", price: "€3.50" },
  { emoji: "🥤", name: "Milkshake Chocolate", desc: "Milkshake artesanal de chocolate belga", price: "€5.90" },
  { emoji: "🎁", name: "Combo Família", desc: "4 Burgers + 4 Batatas + 4 Bebidas", price: "€28.00" },
];

interface CatalogSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function CatalogSection({ onCadastrar }: CatalogSectionProps) {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <section className="py-24 md:py-32 bg-[#0A0D14] border-b border-white/5 relative z-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C9A96E]/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text */}
          <div className="space-y-6 order-2 lg:order-1">
            <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15 inline-block">
              📄 Catálogo PDF
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
              Transforme os seus produtos num{" "}
              <span className="text-[#C9A96E] italic">catálogo profissional</span>{" "}
              em segundos.
            </h2>
            <p className="text-[#A9B1C3] text-sm md:text-base font-light leading-relaxed">
              Restaurantes, salões, lojas e prestadores de serviço podem gerar um catálogo elegante para enviar no WhatsApp ou partilhar no Instagram.
            </p>

            <ul className="space-y-3 text-sm text-[#A9B1C3]">
              {[
                "Gerado automaticamente a partir dos seus produtos",
                "Design elegante com logo, cores e contactos",
                "Pronto para descarregar e partilhar em segundos",
                "Disponível nos planos Pro e Business",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-[#C9A96E] flex-shrink-0 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onCadastrar}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#C9A96E]/15"
            >
              Criar minha vitrine com catálogo →
            </button>
          </div>

          {/* Interactive Catalog Mockup */}
          <div className="flex justify-center order-1 lg:order-2">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#C9A96E]/12 blur-[40px] rounded-2xl scale-90 translate-y-4" />

              {/* Main catalog card */}
              <div
                className="relative bg-[#0F172A] border border-[#C9A96E]/25 rounded-2xl shadow-2xl overflow-hidden w-72"
                style={{ transform: "rotate(2deg)" }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1A1505] to-[#0F172A] px-5 py-4 border-b border-[#C9A96E]/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#C9A96E]/15 border border-[#C9A96E]/25 flex items-center justify-center text-lg">
                      🍔
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F5F0E8]">Burger House</div>
                      <div className="text-[10px] text-[#C9A96E]">Menu 2026</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#0A0D14] bg-[#C9A96E] px-2 py-0.5 rounded-full whitespace-nowrap">
                    Clique para ver
                  </span>
                </div>

                {/* Product grid 2×3 */}
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  {PRODUCTS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelected(p)}
                      className="bg-[#1E293B]/60 hover:bg-[#1E293B] border border-white/5 hover:border-[#C9A96E]/40 rounded-xl p-2.5 text-left transition-all active:scale-95 group cursor-pointer"
                    >
                      <span className="text-xl block mb-1">{p.emoji}</span>
                      <p className="text-[10px] font-semibold text-[#F5F0E8] leading-tight group-hover:text-[#C9A96E] transition-colors">{p.name}</p>
                      <p className="text-[#C9A96E] text-[11px] font-bold mt-0.5">{p.price}</p>
                    </button>
                  ))}
                </div>

                {/* Nav arrows + footer */}
                <div className="px-4 py-2.5 bg-[#1E293B]/30 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#A9B1C3] text-sm select-none">←</span>
                    <span className="text-[#A9B1C3] text-sm select-none">→</span>
                  </div>
                  <span className="text-[9px] text-[#A9B1C3]">vitrinepro.com/vitrine/burger-house</span>
                </div>
              </div>

              {/* Background layer */}
              <div
                className="absolute top-3 left-3 right-0 bg-[#1E293B]/40 border border-white/5 rounded-2xl h-full -z-10"
                style={{ transform: "rotate(-1deg)" }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Product modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0F172A] border border-[#C9A96E]/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selected.emoji}</span>
              <div>
                <h3 className="text-base font-bold text-[#F5F0E8]">{selected.name}</h3>
                <p className="text-xs text-[#A9B1C3] mt-0.5">{selected.desc}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#C9A96E]">{selected.price}</div>
            <button
              onClick={() => setSelected(null)}
              className="w-full py-3 bg-[#25D366] hover:bg-[#22C55E] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              💬 Pedir pelo WhatsApp
            </button>
            <button
              onClick={() => setSelected(null)}
              className="w-full py-2.5 border border-white/10 text-[#A9B1C3] text-xs font-medium rounded-xl hover:border-white/20 transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
