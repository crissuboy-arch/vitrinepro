interface CatalogSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function CatalogSection({ onCadastrar }: CatalogSectionProps) {
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

          {/* PDF Mockup */}
          <div className="flex justify-center order-1 lg:order-2">
            <div className="relative">
              {/* Shadow/glow */}
              <div className="absolute inset-0 bg-[#C9A96E]/12 blur-[40px] rounded-2xl scale-90 translate-y-4" />

              {/* Main PDF card */}
              <div
                className="relative bg-[#0F172A] border border-[#C9A96E]/25 rounded-2xl shadow-2xl overflow-hidden w-72"
                style={{ transform: "rotate(2deg)" }}
              >
                {/* PDF header */}
                <div className="bg-gradient-to-r from-[#1A1505] to-[#0F172A] px-6 py-5 border-b border-[#C9A96E]/15">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/15 border border-[#C9A96E]/25 flex items-center justify-center text-xl">
                      🍔
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F5F0E8]">Hambúrguer Artesanal</div>
                      <div className="text-[10px] text-[#C9A96E]">Menu · Primavera 2026</div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="px-5 py-4 space-y-3">
                  {[
                    { emoji: "🍔", name: "Bacon Cheddar", desc: "Carne 150g, bacon, cheddar", price: "€10.90" },
                    { emoji: "🍟", name: "Batatas Rústicas", desc: "Com alecrim e maionese", price: "€3.50" },
                    { emoji: "🥗", name: "Salada Caesar", desc: "Frango grelhado, croutons", price: "€8.90" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-lg">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#F5F0E8]">{p.name}</div>
                        <div className="text-[9px] text-[#A9B1C3]">{p.desc}</div>
                      </div>
                      <div className="text-[#C9A96E] text-xs font-bold flex-shrink-0">{p.price}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-[#1E293B]/30 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-[#A9B1C3]">vitrinepro.pt/vitrine/negocio</span>
                  <span className="text-[9px] text-[#C9A96E] font-bold">📞 WhatsApp</span>
                </div>
              </div>

              {/* Second PDF behind */}
              <div
                className="absolute top-3 left-3 right-0 bg-[#1E293B]/40 border border-white/5 rounded-2xl h-full -z-10"
                style={{ transform: "rotate(-1deg)" }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
