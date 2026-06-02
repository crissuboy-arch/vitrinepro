import {
  IconBrandInstagram,
  IconCurrencyEuro,
  IconPhotoOff,
  IconMapPinOff,
  IconStarOff,
  IconLinkOff,
} from "@tabler/icons-react";

const problems = [
  {
    icon: IconBrandInstagram,
    title: "Instagram desorganizado",
    desc: "Clientes não encontram preços, horários nem contactos de forma simples.",
    delay: "delay-100"
  },
  {
    icon: IconCurrencyEuro,
    title: "Sem preços visíveis",
    desc: "O cliente desiste instantaneamente quando não vê quanto custa o serviço ou produto.",
    delay: "delay-200"
  },
  {
    icon: IconPhotoOff,
    title: "Fotos de má qualidade",
    desc: "Sem galeria ou portfólio bem organizados, a confiança no seu trabalho diminui.",
    delay: "delay-300"
  },
  {
    icon: IconMapPinOff,
    title: "Sem localização clara",
    desc: "Perde potenciais clientes na sua cidade que simplesmente não sabem onde fica o seu espaço.",
    delay: "delay-400"
  },
  {
    icon: IconStarOff,
    title: "Sem depoimentos",
    desc: "Sem prova social de clientes reais, novos utilizadores têm medo de arriscar no seu serviço.",
    delay: "delay-500"
  },
  {
    icon: IconLinkOff,
    title: "Sem link profissional",
    desc: "O seu negócio não aparece nas pesquisas do Google nem ganha relevância orgânica.",
    delay: "delay-600"
  }
];

export default function ProblemSection() {
  return (
    <section id="problema" className="py-24 md:py-32 bg-[#111827] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-widest bg-[#EF4444]/5 px-3 py-1.5 rounded-full border border-[#EF4444]/15">
            ⚠️ O Grande Desafio
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Pare de perder clientes<br />
            por ter as suas informações espalhadas
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Sem uma presença organizada, os clientes desistem antes de contactar.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {problems.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`bg-[#0F172A]/50 border border-white/5 hover:border-[#EF4444]/35 rounded-2xl p-6 shadow-xl space-y-4 hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up ${p.delay}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-base group-hover:text-[#EF4444] transition-colors font-sans">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light font-sans">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
