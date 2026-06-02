import { IconCheck, IconX } from "@tabler/icons-react";

export default function ComparisonSection() {
  const rows = [
    {
      feature: "Presença online profissional",
      instagram: false,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Preço mensal acessível",
      instagram: false,
      traditional: false,
      vitrine: true,
    },
    {
      feature: "Pronto em 5 minutos",
      instagram: false,
      traditional: false,
      vitrine: true,
    },
    {
      feature: "Chatbot com IA incluído",
      instagram: false,
      traditional: false,
      vitrine: true,
    },
    {
      feature: "Aparece no Google",
      instagram: false,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Galeria de produtos/serviços",
      instagram: false,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Botão WhatsApp direto",
      instagram: true,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Depoimentos de clientes",
      instagram: false,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Analytics de visitas",
      instagram: false,
      traditional: true,
      vitrine: true,
    },
    {
      feature: "Suporte em português",
      instagram: true,
      traditional: true,
      vitrine: true,
      traditionalNote: "€500-3000 setup"
    },
  ];

  return (
    <section id="comparacao" className="py-24 md:py-32 bg-[#0F172A] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Comparação
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Porque a VitrinePro é a escolha certa
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Compare as opções e veja porque somos a alternativa mais inteligente para o seu negócio.
          </p>
        </div>

        {/* Comparison Table / Grid Layout for Mobile and Desktop */}
        <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-5 text-sm font-bold text-slate-400 font-sans w-2/5">
                  Funcionalidades
                </th>
                <th className="p-5 text-xs font-bold text-center text-slate-400 bg-[#1E293B] font-sans w-1/5">
                  Instagram sozinho
                </th>
                <th className="p-5 text-xs font-bold text-center text-slate-400 bg-[#1E293B]/70 font-sans w-1/5">
                  Site tradicional
                </th>
                <th className="p-5 text-xs font-bold text-center text-[#0F172A] bg-[#C8A96B] font-sans w-1/5 rounded-t-xl relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-white text-[#0F172A] rounded shadow-md leading-none">
                    Melhor opção
                  </span>
                  VitrinePro
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${
                    idx === rows.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-5 text-xs sm:text-sm font-medium text-white font-sans">
                    {row.feature}
                  </td>
                  
                  {/* Instagram Column */}
                  <td className="p-5 text-center bg-[#1E293B]/30">
                    <div className="flex justify-center">
                      {row.instagram ? (
                        <IconCheck className="w-5 h-5 text-green-500 stroke-[2.5]" />
                      ) : (
                        <IconX className="w-5 h-5 text-red-500 stroke-[2.5]" />
                      )}
                    </div>
                  </td>

                  {/* Traditional Site Column */}
                  <td className="p-5 text-center bg-[#1E293B]/10">
                    <div className="flex flex-col items-center justify-center space-y-0.5">
                      {row.traditional ? (
                        <IconCheck className="w-5 h-5 text-green-500 stroke-[2.5]" />
                      ) : (
                        <IconX className="w-5 h-5 text-red-500 stroke-[2.5]" />
                      )}
                      {row.traditionalNote && (
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide leading-none">
                          {row.traditionalNote}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* VitrinePro Column (Highlighted) */}
                  <td className="p-5 text-center bg-[#C8A96B]/15 border-x-2 border-[#C8A96B] relative">
                    {idx === rows.length - 1 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8A96B]" />
                    )}
                    <div className="flex justify-center">
                      <IconCheck className="w-6 h-6 text-[#C8A96B] stroke-[3]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
