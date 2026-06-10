const problems = [
  {
    icon: "📷",
    title: "O Instagram não organiza produtos",
    desc: "Posts desaparecem no feed. Clientes não conseguem ver o catálogo completo nem os preços sem perguntar.",
  },
  {
    icon: "💰",
    title: "O cliente não encontra preços",
    desc: "Sem preços visíveis, o cliente desiste antes de contactar. 'Preço por mensagem' afasta mais do que atrai.",
  },
  {
    icon: "💬",
    title: "O WhatsApp fica perdido na bio",
    desc: "Um link enterrado numa bio de Instagram não converte. Falta um botão direto e profissional.",
  },
  {
    icon: "🔍",
    title: "O negócio não aparece bem no Google",
    desc: "Sem página indexável, o negócio é invisível para quem pesquisa serviços na sua cidade.",
  },
  {
    icon: "📄",
    title: "Falta catálogo profissional",
    desc: "Enviar fotos soltas pelo WhatsApp não passa confiança. Um catálogo PDF organizado fecha mais vendas.",
  },
  {
    icon: "🏆",
    title: "A concorrência parece mais confiável",
    desc: "Negócios com presença organizada, avaliações e fotos profissionais ganham a preferência dos clientes.",
  },
];

export default function ProblemSection() {
  return (
    <section id="problema" className="py-24 md:py-32 bg-[#0A0D14] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 space-y-16">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/15">
            ⚠️ O Problema
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            A forma como vende hoje pode estar<br className="hidden md:block" />
            <span className="text-red-400"> a custar-lhe clientes.</span>
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            Sem uma presença profissional, os seus clientes vão para a concorrência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((p, idx) => (
            <div
              key={idx}
              className="bg-[#0F172A]/70 border border-white/5 hover:border-red-500/25 rounded-2xl p-6 shadow-xl space-y-4 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="text-[64px] leading-none">
                {p.icon}
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#F5F0E8] text-sm group-hover:text-red-400 transition-colors">
                  {p.title}
                </h4>
                <p className="text-xs text-[#A9B1C3] leading-relaxed font-light">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
