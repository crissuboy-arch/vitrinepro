interface PlansSectionProps {
  onSelectPlan: (planId: string) => void;
}

function Check() {
  return (
    <svg className="w-4 h-4 text-[#C9A96E] flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function PlansSection({ onSelectPlan }: PlansSectionProps) {
  return (
    <section id="planos" className="py-24 md:py-32 bg-[#0C1120] border-b border-white/5 relative z-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 space-y-16">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            Preços Justos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Escolha o plano certo para si
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            Comece grátis e faça upgrade quando precisar de mais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">

          {/* Grátis */}
          <div className="bg-[#1E293B]/60 border border-white/5 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F5F0E8] uppercase tracking-wider">Grátis</h3>
                <div className="flex items-baseline gap-1 text-[#F5F0E8]">
                  <span className="text-3xl font-extrabold">€0</span>
                  <span className="text-[#A9B1C3] text-xs font-light">/mês</span>
                </div>
                <p className="text-xs text-[#A9B1C3] font-light">Para começar sem investimento</p>
              </div>
              <ul className="space-y-3 text-[#A9B1C3] text-xs">
                {[
                  "Vitrine básica com link público",
                  "Até 3 produtos no catálogo",
                  "Botão WhatsApp e redes sociais",
                  "Aparece no marketplace",
                  "Curtidas, favoritos e partilhas",
                  "Horários e localização",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan("free")}
              className="w-full py-3.5 bg-transparent hover:bg-white/5 border border-[#C9A96E]/50 hover:border-[#C9A96E] text-[#F5F0E8] font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Começar grátis
            </button>
          </div>

          {/* Pro (destacado) */}
          <div className="bg-[#1A1505] border-2 border-[#C9A96E] rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-[#C9A96E]/10 space-y-8 md:scale-[1.04] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#C9A96E] text-[#0A0D14] rounded-full shadow-md whitespace-nowrap">
              Mais popular
            </span>
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F5F0E8] uppercase tracking-wider flex items-center gap-1.5">Pro ✦</h3>
                <div className="flex items-baseline gap-1 text-[#F5F0E8]">
                  <span className="text-3xl font-extrabold">€12</span>
                  <span className="text-[#A9B1C3] text-xs font-light">/mês</span>
                </div>
                <p className="text-xs text-[#A9B1C3] font-light">Para negócios que querem crescer</p>
              </div>
              <ul className="space-y-3 text-slate-200 text-xs">
                {[
                  "Tudo do Grátis +",
                  "Produtos e serviços ilimitados",
                  "Catálogo PDF profissional",
                  "Avaliações e depoimentos",
                  "Destaque no marketplace",
                  "Ranking melhorado",
                  "Chatbot IA 24h por dia",
                  "Galeria de fotos completa",
                  "SEO otimizado por cidade",
                  "Suporte prioritário",
                ].map((f, i) => (
                  <li key={f} className={`flex items-start gap-2 ${i === 0 ? "font-semibold" : ""}`}>
                    <Check /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan("premium")}
              className="w-full py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#C9A96E]/15 hover:shadow-[#C9A96E]/30 active:scale-98 transition-all cursor-pointer"
            >
              Activar Pro — €12/mês →
            </button>
          </div>

          {/* Business */}
          <div className="bg-[#1E293B]/60 border border-white/5 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F5F0E8] uppercase tracking-wider">Business</h3>
                <div className="flex items-baseline gap-1 text-[#F5F0E8]">
                  <span className="text-3xl font-extrabold">€29</span>
                  <span className="text-[#A9B1C3] text-xs font-light">/mês</span>
                </div>
                <p className="text-xs text-[#A9B1C3] font-light">Para negócios com maior volume</p>
              </div>
              <ul className="space-y-3 text-[#A9B1C3] text-xs">
                {[
                  "Tudo do Pro +",
                  "Chatbot IA avançado com IA generativa",
                  "Máximo destaque no marketplace",
                  "Posição prioritária no ranking",
                  "Suporte dedicado e prioritário",
                  "Acesso antecipado a novas funcionalidades",
                ].map((f, i) => (
                  <li key={f} className={`flex items-start gap-2 ${i === 0 ? "font-semibold" : ""}`}>
                    <Check /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onSelectPlan("business")}
              className="w-full py-3.5 bg-transparent hover:bg-white/5 border border-[#C9A96E]/50 hover:border-[#C9A96E] text-[#F5F0E8] font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Começar com Business
            </button>
          </div>

        </div>

        <p className="text-center text-[10px] text-[#A9B1C3]/60 font-semibold uppercase tracking-widest pt-4">
          Sem contratos · Cancele quando quiser · Pagamento seguro via Stripe
        </p>

      </div>
    </section>
  );
}
