import { IconCheck, IconX } from "@tabler/icons-react";

const ROWS = [
  { feature: "Presença online profissional",  instagram: false, vitrine: true },
  { feature: "Preços visíveis aos clientes",  instagram: false, vitrine: true },
  { feature: "Aparece no Google",             instagram: false, vitrine: true },
  { feature: "Galeria de produtos/serviços",  instagram: false, vitrine: true },
  { feature: "Chatbot IA 24h incluído",        instagram: false, vitrine: true },
  { feature: "Analytics de visitas",          instagram: false, vitrine: true },
  { feature: "Botão WhatsApp directo",        instagram: true,  vitrine: true },
  { feature: "Depoimentos de clientes",       instagram: false, vitrine: true },
  { feature: "Localização no mapa",           instagram: false, vitrine: true },
  { feature: "Pronto em 5 minutos",           instagram: false, vitrine: true },
  { feature: "Sem programadores",             instagram: false, vitrine: true },
  { feature: "€12/mês (vs €500+ site)",       instagram: false, vitrine: true },
];

export default function ComparisonSection() {
  return (
    <section id="comparacao" className="py-24 md:py-32 bg-[#090E1A] border-b border-white/5 relative z-10">
      <div className="max-w-4xl mx-auto px-4 space-y-14">

        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Comparação
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Instagram vs VitrinePro
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            O Instagram é ótimo para conteúdo. Mas não substitui uma presença profissional.
          </p>
        </div>

        {/* Visual 2-column comparison */}
        <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl">

          {/* Column headers */}
          <div className="grid grid-cols-3 text-center">
            <div className="p-5 bg-[#1E293B] text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-white/5">
              Funcionalidade
            </div>
            <div className="p-5 bg-[#1E293B]/80 border-b border-white/5 border-l border-white/5">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">📸</span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Instagram</span>
                <span className="text-[9px] text-red-400 font-semibold">Apenas social</span>
              </div>
            </div>
            <div className="p-5 bg-[#C8A96B]/10 border-b border-[#C8A96B]/30 border-l border-[#C8A96B]/20 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[8px] font-black uppercase tracking-widest bg-[#C8A96B] text-[#0F172A] rounded-full shadow whitespace-nowrap">
                ✦ Melhor opção
              </span>
              <div className="flex flex-col items-center gap-1 mt-1">
                <span className="text-2xl">🏪</span>
                <span className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest">VitrinePro</span>
                <span className="text-[9px] text-[#C8A96B] font-semibold">Vitrine profissional</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors ${idx % 2 === 0 ? "" : "bg-white/[0.01]"}`}
            >
              <div className="px-5 py-3.5 text-xs font-medium text-slate-300">{row.feature}</div>

              {/* Instagram */}
              <div className="px-5 py-3.5 flex justify-center items-center border-l border-white/5 bg-[#1E293B]/20">
                {row.instagram
                  ? <IconCheck className="w-5 h-5 text-green-500 stroke-[2.5]" />
                  : <IconX className="w-5 h-5 text-red-500/70 stroke-[2.5]" />
                }
              </div>

              {/* VitrinePro */}
              <div className="px-5 py-3.5 flex justify-center items-center bg-[#C8A96B]/8 border-l border-[#C8A96B]/20">
                <IconCheck className="w-5 h-5 text-[#C8A96B] stroke-[3]" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom label */}
        <p className="text-center text-slate-500 text-xs">
          O Instagram continua útil para publicar conteúdo — a VitrinePro é a sua casa profissional.
        </p>

      </div>
    </section>
  );
}
