/* eslint-disable */
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { COMMUNITIES, getCommunityBySlug } from "@/lib/communities";

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  slug: string;
  logo_url?: string;
  cover_url?: string;
  plan?: string;
  rating_average?: number;
  rating_count?: number;
  view_count?: number;
  created_at: string;
  owner_origin_country?: string;
  owner_name?: string;
  description?: string;
}

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const community = getCommunityBySlug(slug);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"latest" | "featured" | "ranking">("latest");

  useEffect(() => {
    if (!community) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("published", true)
        .ilike("owner_origin_country", `%${community.country}%`)
        .order("created_at", { ascending: false });

      setBusinesses(data || []);
      setLoading(false);
    };
    fetch();
  }, [community?.slug]);

  if (!community) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-center p-8">
        <div className="space-y-4">
          <p className="text-4xl">🌍</p>
          <h1 className="text-white font-bold text-xl">Comunidade não encontrada</h1>
          <Link href="/explorar" className="text-[#C8A96B] text-sm hover:underline">← Ver todas as comunidades</Link>
        </div>
      </div>
    );
  }

  // Tab filters
  const latestBusinesses = [...businesses].slice(0, 12);
  const featuredBusinesses = businesses.filter(b => b.plan === "premium" || b.plan === "pro" || b.plan === "business");
  const rankingBusinesses = [...businesses].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10);

  const currentList = activeTab === "latest" ? latestBusinesses : activeTab === "featured" ? featuredBusinesses : rankingBusinesses;

  // Category counts
  const catMap: Record<string, number> = {};
  businesses.forEach(b => { if (b.category) catMap[b.category] = (catMap[b.category] || 0) + 1; });
  const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 font-sans">

      {/* Header */}
      <header className="bg-[#0F172A]/80 backdrop-blur border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/explorar" className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            ← Explorar
          </Link>
          <Link href="/" className="font-display font-bold text-[#C8A96B] text-xl">VitrinePro</Link>
          <Link href="/login" className="text-xs text-[#C8A96B] border border-[#C8A96B]/30 px-3 py-1.5 rounded-lg hover:bg-[#C8A96B]/10 transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero banner */}
      <div
        className="relative py-16 md:py-24 border-b border-white/5 overflow-hidden"
        style={{ background: `linear-gradient(135deg, #0F172A 0%, ${community.color}15 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: "radial-gradient(rgba(200,169,107,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-5 relative z-10">
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-sm"
            style={{ background: `${community.color}20`, border: `1.5px solid ${community.color}50`, color: community.color }}
          >
            <span className="text-3xl">{community.icon}</span>
            Comunidade {community.name}
          </div>

          <h1 className="text-3xl md:text-6xl font-bold font-display text-white leading-tight">
            {businesses.length > 0 ? (
              <><span style={{ color: community.color }}>{businesses.length}</span> Negócios {community.name}s</>
            ) : (
              <>Comunidade {community.name}</>
            )}
          </h1>

          <p className="text-slate-400 text-base md:text-lg font-light max-w-2xl mx-auto">
            {community.description}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            {[
              { value: businesses.length, label: "Negócios" },
              { value: topCategories.length, label: "Categorias" },
              { value: featuredBusinesses.length, label: "Em destaque" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black font-display text-white">{s.value}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

        {/* All communities nav */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {COMMUNITIES.map(c => (
            <Link
              key={c.slug}
              href={`/comunidade/${c.slug}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                c.slug === slug
                  ? "text-[#0F172A] border-transparent"
                  : "bg-[#1E293B] border-white/5 text-slate-300 hover:border-slate-600"
              }`}
              style={c.slug === slug ? { background: c.color, borderColor: c.color } : {}}
            >
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>

        {/* Category pills */}
        {topCategories.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categorias nesta comunidade</p>
            <div className="flex flex-wrap gap-2">
              {topCategories.map(([cat, count]) => (
                <Link
                  key={cat}
                  href={`/explorar?comunidade=${slug}`}
                  className="px-3 py-1.5 bg-[#1E293B] border border-white/5 rounded-full text-xs text-slate-300 hover:border-[#C8A96B]/40 hover:text-white transition-colors"
                >
                  {cat} <span className="text-[#C8A96B] font-bold ml-1">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="space-y-6">
          <div className="flex items-center gap-1 bg-[#1E293B]/50 rounded-xl p-1 w-fit">
            {([
              { key: "latest", label: "✨ Novidades" },
              { key: "featured", label: `✦ Destaque (${featuredBusinesses.length})` },
              { key: "ranking", label: "🏆 Ranking" },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-[#C8A96B] text-[#0F172A]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="text-5xl">{community.icon}</span>
              <p className="text-slate-400 text-sm">Ainda não há negócios {community.name}s publicados.</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                Criar a primeira vitrine →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((biz, idx) => (
                <Link
                  key={biz.id}
                  href={`/vitrine/${biz.slug}`}
                  className="group bg-[#0F172A]/60 border border-white/5 hover:border-[#C8A96B]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Cover */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    {biz.cover_url ? (
                      <img src={biz.cover_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: `${community.color}15` }}>
                        {community.icon}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />

                    {/* Community seal */}
                    <span
                      className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${community.color}30`, color: community.color, border: `1px solid ${community.color}50` }}
                    >
                      {community.icon} {community.name}
                    </span>

                    {(biz.plan === "premium" || biz.plan === "pro" || biz.plan === "business") && (
                      <span className="absolute top-3 right-3 text-[9px] font-black bg-[#C8A96B] text-[#0F172A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ✦ Destaque
                      </span>
                    )}

                    {activeTab === "ranking" && (
                      <span className="absolute bottom-3 left-3 text-[10px] font-black text-[#C8A96B] bg-[#0F172A]/80 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                        {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" /> : "🏪"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-[#C8A96B] transition-colors">{biz.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate">{biz.category} · 📍 {biz.city}</p>
                      </div>
                    </div>

                    {biz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-light leading-relaxed">{biz.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                      <span className="text-[#C8A96B] font-bold">
                        ★ {biz.rating_average?.toFixed(1) || "5.0"}
                      </span>
                      {activeTab === "ranking" && (
                        <span className="text-slate-500">{(biz.view_count || 0).toLocaleString("pt-PT")} visitas</span>
                      )}
                      <span className="text-slate-400 group-hover:text-[#C8A96B] font-semibold transition-colors text-[10px]">
                        Ver vitrine →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA to join */}
        <div
          className="rounded-2xl p-8 text-center space-y-5"
          style={{ background: `linear-gradient(135deg, ${community.color}10, #1E293B)`, border: `1px solid ${community.color}30` }}
        >
          <div className="text-4xl">{community.icon}</div>
          <div>
            <h3 className="text-white font-bold text-xl font-display">
              Tem um negócio {community.name.toLowerCase()}?
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Junte-se a {businesses.length} negócios e apareça nesta comunidade.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block px-8 py-3 font-bold text-[#0F172A] rounded-xl text-sm active:scale-95 transition-all shadow-lg"
            style={{ background: community.color }}
          >
            Criar minha vitrine grátis →
          </Link>
        </div>

      </div>

      <footer className="border-t border-white/5 py-10 text-center text-slate-500 text-xs mt-10">
        <Link href="/" className="text-[#C8A96B] font-display font-bold text-xl hover:opacity-90">VitrinePro</Link>
        <p className="mt-2">© 2026 VitrinePro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
