const ROWS = [
  {
    feature: "Link profissional",
    instagram: "Link na bio genérico, sem identidade",
    vitrine: "URL próprio vitrinepro.com/vitrine/seu-negocio",
  },
  {
    feature: "Produtos organizados",
    instagram: "Posts espalhados no feed, sem ordem",
    vitrine: "Catálogo com fotos, nomes e preços visíveis",
  },
  {
    feature: "Serviços com preços",
    instagram: "\"Preço por DM\" afasta clientes",
    vitrine: "Tabela de serviços com preços públicos",
  },
  {
    feature: "Botão WhatsApp direto",
    instagram: "Link genérico na bio, sem contexto",
    vitrine: "Botão flutuante vai direto ao número configurado",
  },
  {
    feature: "Catálogo PDF",
    instagram: "Não existe — apenas posts e stories",
    vitrine: "Gera PDF profissional dos produtos em segundos",
  },
  {
    feature: "Avaliações de clientes",
    instagram: "Comentários misturados, difíceis de filtrar",
    vitrine: "Secção dedicada de avaliações com estrelas",
  },
  {
    feature: "Localização no mapa",
    instagram: "Sem mapa integrado — só texto na bio",
    vitrine: "Mapa integrado com redirecionamento para Google Maps",
  },
  {
    feature: "Horários de funcionamento",
    instagram: "Apenas no campo bio limitado",
    vitrine: "Tabela completa dia a dia com horários de abertura",
  },
  {
    feature: "Aparece no Google",
    instagram: "Perfil indexado mas sem SEO local",
    vitrine: "Página otimizada com schema, cidade e categoria",
  },
  {
    feature: "Marketplace local",
    instagram: "Não existe diretório por cidade/categoria",
    vitrine: "Aparece no explorar por cidade, categoria e ranking",
  },
  {
    feature: "Curtidas e favoritos",
    instagram: "Likes em posts, não no negócio",
    vitrine: "Clientes curtem e guardam o negócio diretamente",
  },
  {
    feature: "Partilhas",
    instagram: "Story share desaparece em 24h",
    vitrine: "Link permanente partilhável no WhatsApp e redes sociais",
  },
  {
    feature: "Ranking social",
    instagram: "Sem ranking — só alcance pago",
    vitrine: "Engagement real sobe o negócio no ranking orgânico",
  },
  {
    feature: "Analytics e Pixel",
    instagram: "Dados básicos de insights por conta profissional",
    vitrine: "Google Analytics + Meta Pixel integrados e RGPD",
  },
];

export default function ComparisonSection() {
  return (
    <section id="comparacao" className="py-24 md:py-32 bg-[#08090F] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-14">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            Comparação
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Instagram vs VitrinePro
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            O Instagram é ótimo para conteúdo. Mas não substitui uma presença profissional.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="rounded-2xl border border-white/5 shadow-2xl overflow-hidden min-w-[600px]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#1E293B]/40">
              <div className="px-5 py-4 text-xs font-bold text-[#A9B1C3] uppercase tracking-wider">Funcionalidade</div>
              <div className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-l border-white/5">
                <span className="text-base">📷</span> Instagram
              </div>
              <div className="px-5 py-4 text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-2 border-l border-white/5">
                <span className="text-base">✦</span> VitrinePro
              </div>
            </div>

            {ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_1fr_1fr] border-t border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "bg-[#0F172A]/30" : "bg-[#0A0D14]/50"}`}
              >
                <div className="px-5 py-4 text-xs font-semibold text-[#F5F0E8]">{row.feature}</div>
                <div className="px-5 py-4 text-xs text-slate-500 border-l border-white/5 flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>
                  <span>{row.instagram}</span>
                </div>
                <div className="px-5 py-4 text-xs text-slate-300 border-l border-white/5 flex items-start gap-2">
                  <span className="text-[#C9A96E] flex-shrink-0 mt-0.5">✓</span>
                  <span>{row.vitrine}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
