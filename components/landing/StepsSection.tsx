const steps = [
  {
    num: "01",
    emoji: "🔑",
    title: "Crie a sua conta",
    desc: "Registe-se em segundos com email ou Google. Sem cartão de crédito.",
  },
  {
    num: "02",
    emoji: "🏪",
    title: "Cadastre o seu negócio",
    desc: "Preencha nome, categoria, cidade, contactos e horários de funcionamento.",
  },
  {
    num: "03",
    emoji: "🛍️",
    title: "Adicione produtos, serviços e fotos",
    desc: "Crie o catálogo com fotos, preços e descrições. A galeria mostra o seu trabalho.",
  },
  {
    num: "04",
    emoji: "📱",
    title: "Partilhe o link no Instagram e WhatsApp",
    desc: "O seu link exclusivo fica pronto para colocar na bio e enviar pelo WhatsApp.",
  },
  {
    num: "05",
    emoji: "🎉",
    title: "Receba clientes",
    desc: "Clientes visitam a vitrine, vêem os preços e entram em contacto direto pelo WhatsApp.",
  },
];

export default function StepsSection() {
  return (
    <section className="py-24 md:py-32 bg-[#0C1120] border-b border-white/5 relative z-10">
      <div className="max-w-4xl mx-auto px-4 space-y-16">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            Simples e Rápido
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Como funciona
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            Em 5 passos, o seu negócio fica online e pronto para receber clientes.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A96E]/40 via-[#C9A96E]/20 to-transparent hidden md:block" />

          <div className="space-y-8">
            {steps.map((s, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                {/* Circle */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0F172A] border-2 border-[#C9A96E]/50 group-hover:border-[#C9A96E] flex items-center justify-center text-[#C9A96E] font-bold text-sm transition-colors relative z-10">
                  {s.emoji}
                </div>
                {/* Content */}
                <div className="bg-[#0F172A]/60 border border-white/5 hover:border-[#C9A96E]/20 rounded-2xl p-5 flex-1 space-y-1.5 group-hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Passo {s.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#A9B1C3] leading-relaxed font-light">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
