import Link from "next/link";

const TYPES = [
  {
    icon: "🍽️",
    name: "Restaurante",
    desc: "Menu completo com fotos, preços e WhatsApp directo",
    example: "Sabor Brasil · Lisboa",
    color: "#FB923C",
    slug: "explorar?comunidade=brasileira",
  },
  {
    icon: "💈",
    name: "Barbearia",
    desc: "Galeria de cortes, lista de serviços e reservas pelo WhatsApp",
    example: "Corte Fino · Porto",
    color: "#60A5FA",
    slug: "explorar",
  },
  {
    icon: "⚖️",
    name: "Advogado",
    desc: "Perfil profissional, áreas de actuação e contacto imediato",
    example: "Dr. Silva & Associados · Lisboa",
    color: "#C8A96B",
    slug: "explorar",
  },
  {
    icon: "🔧",
    name: "Canalizador",
    desc: "Serviços de urgência, mapa de localização e botão de chamada",
    example: "Reparações Rápidas · Braga",
    color: "#34D399",
    slug: "explorar",
  },
  {
    icon: "🛍️",
    name: "Loja Online",
    desc: "Catálogo de produtos, preços e pedidos pelo WhatsApp",
    example: "Boutique Elegance · Funchal",
    color: "#A78BFA",
    slug: "explorar",
  },
];

export default function BusinessTypesSection() {
  return (
    <section className="py-24 md:py-32 bg-[#090E1A] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-14">

        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Para todos os negócios
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Negócios que já usam
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            De restaurantes a advogados — qualquer negócio local precisa de uma vitrine.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {TYPES.map((t) => (
            <Link
              key={t.name}
              href={`/${t.slug}`}
              className="group bg-[#1E293B]/50 border border-white/5 hover:border-[#C8A96B]/40 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${t.color}20`, border: `1px solid ${t.color}30` }}
              >
                {t.icon}
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base font-sans group-hover:text-[#C8A96B] transition-colors">
                  {t.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">{t.desc}</p>
              </div>

              <div
                className="mt-auto text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                style={{ color: t.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                {t.example}
              </div>
            </Link>
          ))}
        </div>

        {/* Link to all */}
        <div className="text-center">
          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C8A96B] hover:text-[#D4BB82] transition-colors"
          >
            Ver todos os negócios no marketplace →
          </Link>
        </div>
      </div>
    </section>
  );
}
