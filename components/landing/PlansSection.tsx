import { IconCheck } from "@tabler/icons-react";

interface PlansSectionProps {
  onSelectPlan: (planId: string) => void;
}

export default function PlansSection({ onSelectPlan }: PlansSectionProps) {
  return (
    <section id="planos" className="py-24 md:py-32 bg-[#0C1322] border-b border-white/5 relative z-10 font-sans">
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Preços Justos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Escolha o plano certo para si
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Planos flexíveis para qualquer tamanho de negócio. Comece grátis e faça upgrade quando crescer.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
          
          {/* Card Grátis */}
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-8 relative">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Grátis</h3>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-3xl font-extrabold">€0</span>
                  <span className="text-slate-400 text-xs font-light">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3 text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Vitrine básica online</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>3 produtos no catálogo</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>WhatsApp e redes</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Aparece no diretório</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Link partilhável</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan("free")}
              className="w-full py-3.5 bg-transparent hover:bg-white/5 border border-[#C8A96B] hover:border-[#D4BB82] text-white hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-98 cursor-pointer block text-center"
            >
              Começar grátis
            </button>
          </div>

          {/* Card Pro (DESTACADO) */}
          <div className="bg-[#1A1A0E] border-2 border-[#C8A96B] rounded-3xl p-8 flex flex-col justify-between shadow-2xl space-y-8 md:scale-[1.05] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#C8A96B] text-[#0F172A] rounded-full shadow-md">
              Mais popular
            </span>
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Pro ✦
                </h3>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-3xl font-extrabold">€12</span>
                  <span className="text-slate-400 text-xs font-light">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3 text-slate-200 text-xs">
                <li className="flex items-start gap-2 font-semibold">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Tudo do Grátis +</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Produtos ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Chatbot IA 24h por dia</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Destaque no diretório</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Analytics de visitas</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>SEO otimizado Google</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Domínio próprio</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Sem branding VitrinePro</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan("premium")}
              className="w-full py-4 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#C8A96B]/10 hover:shadow-[#C8A96B]/25 active:scale-98 transition-all cursor-pointer block text-center"
            >
              Activar Premium — €12/mês →
            </button>
          </div>

          {/* Card Business */}
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-8 relative">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Business</h3>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-3xl font-extrabold">€29</span>
                  <span className="text-slate-400 text-xs font-light">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3 text-slate-300 text-xs">
                <li className="flex items-start gap-2 font-semibold">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Tudo do Pro +</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Loja online com pagamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Chatbot IA avançado</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Posição topo Google</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Relatório mensal</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-[#C8A96B] flex-shrink-0" />
                  <span>Multi-idioma</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan("business")}
              className="w-full py-3.5 bg-transparent hover:bg-white/5 border border-[#C8A96B] hover:border-[#D4BB82] text-white hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-98 cursor-pointer block text-center"
            >
              Começar com Business
            </button>
          </div>

        </div>

        {/* Footer Support Tag */}
        <p className="text-center text-[10px] text-slate-500 font-semibold uppercase tracking-widest pt-4">
          Sem contratos. Cancele quando quiser. Pagamento seguro via Stripe.
        </p>

      </div>
    </section>
  );
}
