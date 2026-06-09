import Link from "next/link";

interface HeroSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

const MICROPROOFS = [
  { icon: "⚡", label: "Online em minutos" },
  { icon: "💳", label: "Sem cartão de crédito" },
  { icon: "👨‍💻", label: "Sem programadores" },
  { icon: "📱", label: "Link pronto para Instagram" },
];

export default function HeroSection({ onCadastrar }: HeroSectionProps) {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[#0A0D14] border-b border-[#C9A96E]/20 z-10">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(rgba(201,169,110,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#C9A96E]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center space-y-6 animate-fade-in-up">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/8 rounded-full uppercase tracking-widest border border-[#C9A96E]/15 shadow-sm">
            ✦ Vitrine profissional para negócios em Portugal
          </span>

          {/* H1 */}
          <h1 className="text-[34px] sm:text-[50px] md:text-[64px] font-bold font-display text-[#F5F0E8] leading-[1.06] tracking-tight max-w-4xl mx-auto">
            Se o seu negócio não for encontrado online,{" "}
            <span className="text-[#C9A96E] italic">o cliente compra ao concorrente.</span>
          </h1>

          {/* Sub */}
          <p className="text-[#A9B1C3] text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Crie uma vitrine profissional em poucos minutos com produtos, serviços, WhatsApp, avaliações, catálogo PDF e link pronto para divulgar no Instagram.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onCadastrar}
              className="w-full sm:w-auto px-9 py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl shadow-[0_8px_30px_rgba(201,169,110,0.28)] active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
            >
              Criar minha vitrine grátis →
            </button>
            <Link
              href="/businesses"
              className="w-full sm:w-auto px-9 py-4 bg-transparent hover:bg-white/5 text-[#F5F0E8] font-semibold rounded-xl border border-white/15 hover:border-[#C9A96E]/40 text-center transition-all text-sm"
            >
              Ver exemplo ao vivo
            </Link>
          </div>

          {/* Microproofs */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-2">
            {MICROPROOFS.map((m) => (
              <span key={m.label} className="flex items-center gap-2 text-[11px] font-semibold text-[#A9B1C3] uppercase tracking-wider">
                <span className="text-[#C9A96E]">{m.icon}</span>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Vitrine mockup ── */}
        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-3xl">
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-[#C9A96E]/10 blur-[60px] rounded-3xl scale-90" />

            {/* Browser chrome */}
            <div className="relative bg-[#0F172A] border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1E293B]/60 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 bg-[#0F172A] rounded-md px-3 py-1 text-[10px] text-[#A9B1C3] text-center border border-white/5">
                  vitrinepro.pt/vitrine/<span className="text-[#C9A96E]">o-seu-negocio</span>
                </div>
              </div>

              {/* Vitrine content mock */}
              <div className="p-0">
                {/* Cover */}
                <div className="h-28 sm:h-36 bg-gradient-to-br from-[#1E293B] to-[#0F172A] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 30% 60%, #C9A96E22, transparent 60%)" }} />
                  <span className="text-4xl sm:text-5xl">💅</span>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {/* Business header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#F5F0E8] text-base sm:text-lg font-display">Estúdio Beleza Premium</h3>
                        <span className="text-[9px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/25 px-2 py-0.5 rounded-full">✦ Pro</span>
                      </div>
                      <p className="text-[11px] text-[#A9B1C3] mt-0.5">💅 Beleza e Bem-estar · Lisboa</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#C9A96E] text-xs font-bold">
                      <span>★</span><span>4.9</span>
                    </div>
                  </div>

                  {/* Product cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { emoji: "💅", name: "Manicure Gel", price: "€25" },
                      { emoji: "💆‍♀️", name: "Massagem Relaxante", price: "€45" },
                      { emoji: "✂️", name: "Corte & Escova", price: "€35" },
                    ].map((p) => (
                      <div key={p.name} className="bg-[#1E293B]/60 border border-white/5 rounded-xl p-3 space-y-1.5">
                        <span className="text-xl">{p.emoji}</span>
                        <p className="text-[11px] font-semibold text-[#F5F0E8] leading-tight">{p.name}</p>
                        <p className="text-[#C9A96E] text-xs font-bold">{p.price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Social bar */}
                  <div className="flex items-center gap-4 pt-1 border-t border-white/5 text-[10px] text-[#A9B1C3]">
                    <span>👁️ 1.2k visitas</span>
                    <span>❤️ 84 curtidas</span>
                    <span>🔖 37 favoritos</span>
                    <span>📤 12 partilhas</span>
                  </div>

                  {/* WhatsApp button */}
                  <button className="w-full py-3 bg-[#25D366] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Falar via WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -left-4 top-1/3 bg-[#0F172A] border border-[#C9A96E]/30 rounded-xl px-3 py-2 shadow-xl text-xs font-bold text-[#C9A96E] hidden sm:flex items-center gap-2">
              📄 Catálogo PDF
            </div>
            <div className="absolute -right-4 top-1/2 bg-[#0F172A] border border-[#C9A96E]/30 rounded-xl px-3 py-2 shadow-xl text-xs font-bold text-[#C9A96E] hidden sm:flex items-center gap-2">
              📍 Google Maps
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
