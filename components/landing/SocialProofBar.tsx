const REVIEWS = [
  { initials: "MS", name: "Maria Santos", type: "Restaurante · Lisboa", text: "Em 10 minutos tinha a minha vitrine online.", bg: "bg-green-700" },
  { initials: "JF", name: "João Ferreira", type: "Barbearia · Porto", text: "Recebi 3 novos clientes na primeira semana.", bg: "bg-blue-700" },
  { initials: "AC", name: "Ana Costa", type: "Consultora · Lisboa", text: "Muito mais profissional que o Instagram.", bg: "bg-[#C8A96B]" },
  { initials: "RB", name: "Rui Barbosa", type: "Barbeiro · Porto", text: "O WhatsApp facilitou tudo. Excelente!", bg: "bg-purple-700" },
  { initials: "MF", name: "Marta Fonseca", type: "Cake Designer · Lisboa", text: "Envio o link e o cliente escolhe logo.", bg: "bg-pink-700" },
  { initials: "VM", name: "Vítor Mendes", type: "Restaurante · Coimbra", text: "Pedidos pelo WhatsApp aumentaram 50%.", bg: "bg-orange-700" },
];

export default function SocialProofBar() {
  return (
    <section className="py-20 bg-[#0C1322] border-b border-white/5 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1 text-[#C8A96B] text-lg mb-2">
            {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
            Mais de 2.500 negócios confiam na VitrinePro
          </h2>
          <p className="text-slate-400 text-sm font-light">
            Empreendedores locais que simplificaram a presença digital e ganharam mais clientes.
          </p>
        </div>

        {/* Review cards scrolling row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="bg-[#1E293B]/50 border border-white/5 rounded-2xl p-5 space-y-3 hover:border-[#C8A96B]/25 transition-colors"
            >
              <div className="flex text-[#C8A96B] text-xs">★★★★★</div>
              <p className="text-slate-200 text-sm font-light italic leading-relaxed">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className={`w-8 h-8 rounded-full ${r.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{r.name}</p>
                  <p className="text-[#C8A96B] text-[10px] font-semibold uppercase tracking-wider">{r.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust logos row */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-4 border-t border-white/5">
          <span className="text-slate-500 text-[11px] uppercase tracking-widest font-semibold">Utilizado por negócios em:</span>
          {["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Funchal", "Setúbal", "Aveiro"].map((c) => (
            <span key={c} className="text-slate-400 text-xs font-semibold">📍 {c}</span>
          ))}
        </div>

      </div>
    </section>
  );
}
