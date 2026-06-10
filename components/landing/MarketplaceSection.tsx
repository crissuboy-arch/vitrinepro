import Link from "next/link";

const MOCK_BUSINESSES = [
  { emoji: "💅", name: "Estúdio Bella", category: "Beleza", city: "Lisboa", views: "1.2k", likes: 84, favs: 37, plan: "Pro ✦", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80" },
  { emoji: "🍔", name: "Hambúrguer Art", category: "Restaurante", city: "Porto", views: "3.1k", likes: 156, favs: 72, plan: "Pro ✦", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { emoji: "💈", name: "Corte Fino", category: "Barbearia", city: "Braga", views: "890", likes: 63, favs: 28, plan: "Free", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80" },
  { emoji: "⚡", name: "VoltMaster", category: "Eletricista", city: "Faro", views: "540", likes: 41, favs: 19, plan: "Business", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&q=80" },
  { emoji: "🔧", name: "Canalizações Silva", category: "Canalizador", city: "Coimbra", views: "320", likes: 22, favs: 11, plan: "Free", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
  { emoji: "🍰", name: "Doce Segredo", category: "Pastelaria", city: "Setúbal", views: "2.4k", likes: 198, favs: 91, plan: "Pro ✦", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80" },
];

export default function MarketplaceSection() {
  return (
    <section className="py-24 md:py-32 bg-[#0C1120] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-14">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            🏪 Marketplace + Ranking
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
            Os clientes procuram.{" "}
            <span className="text-[#C9A96E]">O seu negócio aparece.</span>
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-2xl mx-auto">
            O marketplace da VitrinePro organiza os negócios por cidade e categoria. Engagement real sobe o ranking — sem gastar em anúncios.
          </p>
        </div>

        {/* Feature pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🗺️", title: "Por cidade e categoria", desc: "O cliente pesquisa \"restaurante Lisboa\" e o seu negócio aparece." },
            { icon: "📈", title: "Ranking orgânico", desc: "Curtidas, favoritos, partilhas e visitas fazem subir no ranking." },
            { icon: "✦", title: "Planos pagos em destaque", desc: "Pro e Business têm bónus de 200 pontos no score de ranking." },
            { icon: "🔎", title: "Descoberta sem seguir", desc: "O cliente descobre o seu negócio mesmo sem seguir no Instagram." },
          ].map((f) => (
            <div key={f.title} className="bg-[#0F172A]/60 border border-white/5 hover:border-[#C9A96E]/20 rounded-xl p-5 space-y-2.5 hover:-translate-y-0.5 transition-all">
              <span className="text-2xl">{f.icon}</span>
              <h4 className="text-sm font-bold text-[#F5F0E8]">{f.title}</h4>
              <p className="text-xs text-[#A9B1C3] leading-relaxed font-light">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Marketplace mock grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-2 flex-wrap">
                {["Todas as categorias", "Lisboa", "Porto"].map((tag, i) => (
                  <span key={tag} className={`text-xs px-3 py-1.5 rounded-full border font-medium ${i === 0 ? "bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E]" : "border-white/10 text-[#A9B1C3]"}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/businesses" className="text-xs text-[#C9A96E] hover:underline font-semibold">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_BUSINESSES.map((b) => (
              <div
                key={b.name}
                className="bg-[#0F172A]/70 border border-white/5 hover:border-[#C9A96E]/20 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all group"
              >
                {/* Cover */}
                <div className="h-[120px] relative overflow-hidden bg-[#0F172A]">
                  <img
                    src={b.image}
                    alt={b.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-3xl flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)", borderRadius: "50%", padding: "8px", lineHeight: 1 }}
                    >
                      {b.emoji}
                    </span>
                  </div>
                  {b.plan !== "Free" && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/25 px-2 py-0.5 rounded-full">
                      {b.plan}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <div className="font-bold text-sm text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors">
                      {b.name}
                    </div>
                    <div className="text-xs text-[#A9B1C3]">{b.category} · {b.city}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#A9B1C3] pt-1 border-t border-white/5">
                    <span>👁️ {b.views}</span>
                    <span>❤️ {b.likes}</span>
                    <span>🔖 {b.favs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
