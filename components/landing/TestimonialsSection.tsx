export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Maria Santos",
      location: "Lisboa",
      type: "Restaurante Brasileiro",
      initials: "MS",
      colorBg: "bg-green-600/25 text-green-400 border-green-500/25",
      text: "Em 10 minutos tinha a minha vitrine online. Os clientes já chegam pelo Google sem eu fazer nada."
    },
    {
      name: "João Ferreira",
      location: "Porto",
      type: "Barbearia",
      initials: "JF",
      colorBg: "bg-blue-600/25 text-blue-400 border-blue-500/25",
      text: "O chatbot responde os clientes enquanto eu trabalho. Recebi 3 novos clientes na primeira semana."
    },
    {
      name: "Ana Costa",
      location: "Brasil → Lisboa",
      type: "Consultora",
      initials: "AC",
      colorBg: "bg-[#C8A96B]/25 text-[#C8A96B] border-[#C8A96B]/25",
      text: "Perfeito para mostrar os meus serviços aos clientes portugueses. Muito mais profissional que o Instagram."
    }
  ];

  return (
    <section id="depoimentos" className="py-24 md:py-32 bg-[#0F172A] border-b border-white/5 relative z-10 font-sans">
      <div className="max-w-5xl mx-auto px-4 space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Opiniões Reais
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            O que dizem os nossos clientes
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Empreendedores locais que simplificaram a sua presença digital e impulsionaram as suas vendas.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#1E293B]/40 border border-white/5 hover:border-[#C8A96B]/30 rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:-translate-y-1.5 transition-all duration-350 relative group"
            >
              
              {/* Quote text */}
              <div className="space-y-4">
                <div className="flex text-[#C8A96B] text-sm tracking-wide">
                  ★★★★★
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-light italic font-display">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              {/* Client Info Info */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-white/5">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs uppercase ${t.colorBg}`}>
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-xs truncate">
                    {t.name}
                  </h4>
                  <p className="text-[9px] text-[#C8A96B] font-semibold truncate uppercase tracking-wider mt-0.5">
                    {t.type} · {t.location}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
