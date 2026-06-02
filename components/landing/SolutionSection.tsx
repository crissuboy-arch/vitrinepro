import {
  IconBadge,
  IconPhoto,
  IconShoppingBag,
  IconBriefcase,
  IconAlbum,
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandLinkedin,
  IconMapPin,
  IconStar,
  IconClock,
  IconRobot,
  IconWorld,
  IconChartBar
} from "@tabler/icons-react";

const solutions = [
  { label: "Logo", icon: IconBadge },
  { label: "Capa", icon: IconPhoto },
  { label: "Produtos", icon: IconShoppingBag },
  { label: "Serviços", icon: IconBriefcase },
  { label: "Galeria", icon: IconAlbum },
  { label: "WhatsApp", icon: IconBrandWhatsapp },
  { label: "Instagram", icon: IconBrandInstagram },
  { label: "YouTube", icon: IconBrandYoutube },
  { label: "LinkedIn", icon: IconBrandLinkedin },
  { label: "Localização", icon: IconMapPin },
  { label: "Depoimentos", icon: IconStar },
  { label: "Horário", icon: IconClock },
  { label: "Chatbot IA", icon: IconRobot },
  { label: "Domínio próprio", icon: IconWorld },
  { label: "Analytics", icon: IconChartBar }
];

export default function SolutionSection() {
  return (
    <section id="solucao" className="py-24 md:py-32 bg-[#0F172A] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            A solução completa
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Com a VitrinePro, tudo fica<br />
            numa única página
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-2xl mx-auto">
            Uma vitrine profissional com tudo o que o teu negócio precisa para aparecer, convencer e vender.
          </p>
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-10 gap-x-6 pt-4">
          {solutions.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex flex-col items-center justify-center text-center space-y-2.5 group">
                <div className="w-14 h-14 rounded-full bg-[#C8A96B]/5 group-hover:bg-[#C8A96B]/10 border border-white/5 flex items-center justify-center text-[#C8A96B] transition-colors">
                  <Icon className="w-8 h-8 stroke-[1.25]" />
                </div>
                <span className="text-[12px] font-medium tracking-wide text-slate-300 font-sans group-hover:text-white transition-colors">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Feature Highlight Banner */}
        <div className="bg-[#1C2030]/40 border border-[#C8A96B]/30 rounded-2xl p-6 text-center max-w-3xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C8A96B]" />
          <p className="text-xs sm:text-sm text-white font-medium flex items-center justify-center gap-1.5 leading-relaxed font-sans">
            <span className="text-[#C8A96B] text-base">✦</span>
            <span className="font-bold text-[#C8A96B]">Novo:</span> Chatbot com IA incluído no plano Pro — o teu assistente virtual responde clientes 24h por dia.
          </p>
        </div>

      </div>
    </section>
  );
}
