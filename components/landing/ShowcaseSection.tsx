import Link from "next/link";

const EXAMPLES = [
  {
    name: "Café Central",
    category: "Cafetaria & Pastelaria",
    city: "Lisboa",
    cover: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&h=300&fit=crop",
    logo: "☕",
    rating: "4.9",
    slug: "demo",
    badge: "Premium ✦",
    badgeColor: "#C8A96B",
  },
  {
    name: "Estúdio Ouro & Co.",
    category: "Beleza e Bem-estar",
    city: "Lisboa",
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=300&fit=crop",
    logo: "💅",
    rating: "4.8",
    slug: "exemplo",
    badge: "Pro",
    badgeColor: "#60A5FA",
  },
  {
    name: "Corte Fino Barber",
    category: "Barbearia",
    city: "Porto",
    cover: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=300&fit=crop",
    logo: "💈",
    rating: "5.0",
    slug: "explorar",
    badge: "Premium ✦",
    badgeColor: "#C8A96B",
  },
];

export default function ShowcaseSection() {
  return (
    <section className="py-24 md:py-32 bg-[#0F172A] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-14">

        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Exemplos reais
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Como fica a sua vitrine
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Veja vitrines reais publicadas por negócios em Portugal.
          </p>
        </div>

        {/* Showcase cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {EXAMPLES.map((ex) => (
            <Link
              key={ex.slug}
              href={`/vitrine/${ex.slug}`}
              className="group bg-[#1E293B]/40 border border-white/5 hover:border-[#C8A96B]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(200,169,107,0.1)]"
            >
              {/* Cover */}
              <div className="relative h-40 bg-slate-900 overflow-hidden">
                <img
                  src={ex.cover}
                  alt={ex.name}
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
                <span
                  className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: `${ex.badgeColor}22`, color: ex.badgeColor, border: `1px solid ${ex.badgeColor}44` }}
                >
                  {ex.badge}
                </span>
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl -mt-8 relative z-10 shadow-lg flex-shrink-0">
                    {ex.logo}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate group-hover:text-[#C8A96B] transition-colors">{ex.name}</h3>
                    <p className="text-slate-400 text-[11px]">{ex.category} · 📍 {ex.city}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
                  <span className="text-[#C8A96B] font-bold">★ {ex.rating}</span>
                  <span className="text-slate-400 group-hover:text-[#C8A96B] font-semibold transition-colors">
                    Ver vitrine →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C8A96B] hover:text-[#D4BB82] transition-colors"
          >
            Explorar todas as vitrines no marketplace →
          </Link>
        </div>

      </div>
    </section>
  );
}
