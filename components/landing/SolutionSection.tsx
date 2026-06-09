const features = [
  { icon: "💬", label: "WhatsApp direto" },
  { icon: "🛍️", label: "Produtos e serviços" },
  { icon: "📄", label: "Catálogo PDF" },
  { icon: "⭐", label: "Avaliações" },
  { icon: "📍", label: "Localização e horários" },
  { icon: "❤️", label: "Curtidas e favoritos" },
  { icon: "📤", label: "Partilhas" },
  { icon: "🏪", label: "Marketplace" },
  { icon: "🔍", label: "SEO local" },
  { icon: "📊", label: "Analytics" },
  { icon: "🤖", label: "Chatbot IA" },
  { icon: "🏆", label: "Ranking social" },
];

export default function SolutionSection() {
  return (
    <section id="solucao" className="py-24 md:py-32 bg-[#0C1120] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-16">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            A Solução
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Tudo o que o seu negócio precisa<br className="hidden md:block" />
            <span className="text-[#C9A96E]"> num único link.</span>
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-2xl mx-auto">
            Uma vitrine profissional com tudo o que o seu negócio precisa para aparecer, convencer e receber clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Feature grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 bg-[#0F172A]/60 border border-white/5 hover:border-[#C9A96E]/25 rounded-xl p-4 group hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xl flex-shrink-0">{f.icon}</span>
                <span className="text-xs font-semibold text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors leading-tight">
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          {/* Vitrine mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#C9A96E]/8 blur-[50px] rounded-3xl" />
            <div className="relative bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="h-24 bg-gradient-to-r from-[#1E293B] to-[#0F172A] flex items-end px-5 pb-3 relative">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[#C9A96E]/20 to-transparent" />
                <div className="flex items-end gap-3 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 flex items-center justify-center text-2xl -mb-4">
                    🍔
                  </div>
                </div>
              </div>
              <div className="px-5 pt-7 pb-5 space-y-3">
                <div>
                  <div className="text-sm font-bold text-[#F5F0E8]">Hambúrguer Artesanal</div>
                  <div className="text-xs text-[#A9B1C3]">🍔 Restaurante · Porto</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { n: "Bacon Cheddar", p: "€10.90" },
                    { n: "Veggie Burger", p: "€9.50" },
                  ].map((item) => (
                    <div key={item.n} className="bg-[#1E293B]/60 border border-white/5 rounded-lg p-2.5">
                      <div className="text-[10px] font-semibold text-[#F5F0E8]">{item.n}</div>
                      <div className="text-[#C9A96E] text-xs font-bold mt-0.5">{item.p}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-2 bg-[#25D366]/15 border border-[#25D366]/30 rounded-lg text-[10px] text-[#25D366] font-bold text-center">
                    💬 WhatsApp
                  </div>
                  <div className="flex-1 py-2 bg-[#C9A96E]/10 border border-[#C9A96E]/25 rounded-lg text-[10px] text-[#C9A96E] font-bold text-center">
                    📄 Catálogo PDF
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-white/5 text-[9px] text-[#A9B1C3]">
                  <span>👁️ 843</span>
                  <span>❤️ 56</span>
                  <span>🔖 23</span>
                  <span>📤 8</span>
                  <span className="ml-auto text-[#C9A96E]">★ 4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
