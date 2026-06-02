/* eslint-disable */
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  logo: string;
  cover: string;
  premium: boolean;
  description: string;
  whatsApp?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  slug: string;
}

// 10 key Portuguese cities
const citiesList = [
  "Todas as Cidades",
  "Águeda",
  "Aveiro",
  "Porto",
  "Lisboa",
  "Braga",
  "Coimbra",
  "Viseu",
  "Leiria",
  "Faro",
  "Setúbal"
];

// 16 key categories with icons
const categoriesWithIcons = [
  { name: "Todas", icon: "🌐" },
  { name: "Restaurantes", icon: "🍽️" },
  { name: "Cafés", icon: "☕" },
  { name: "Beleza", icon: "💅" },
  { name: "Manicure", icon: "✨" },
  { name: "Barbearia", icon: "💈" },
  { name: "Serviços", icon: "🛠️" },
  { name: "Construção", icon: "🏗️" },
  { name: "Pedreiro", icon: "🧱" },
  { name: "Canalizador", icon: "🔧" },
  { name: "Eletricista", icon: "⚡" },
  { name: "Marketing", icon: "📈" },
  { name: "Infoprodutos", icon: "📚" },
  { name: "Produtos Digitais", icon: "💻" },
  { name: "Saúde", icon: "🩺" },
  { name: "Automóvel", icon: "🚗" },
  { name: "Lojas", icon: "🛍️" }
];

// Advertisements / Highlights Carousel data
const ads = [
  {
    id: "ad-1",
    title: "Café Central - Rossio",
    tagline: "O melhor pastel de nata e expresso de especialidade em Lisboa.",
    badge: "Destaque da Semana",
    cover: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=1200&h=500&fit=crop",
    link: "/vitrine/demo",
    cta: "Visitar Vitrine"
  },
  {
    id: "ad-2",
    title: "Estúdio Ouro & Co.",
    tagline: "Procedimentos de estética premium, cortes e cuidados no coração de Lisboa.",
    badge: "Premium Beauty",
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop",
    link: "/vitrine/exemplo",
    cta: "Explorar Serviços"
  },
  {
    id: "ad-3",
    title: "Crie a Sua Vitrine Grátis",
    tagline: "Destaque o seu negócio no maior Pinterest local de Portugal e receba pedidos no WhatsApp.",
    badge: "VitrinePro SaaS",
    cover: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=500&fit=crop",
    link: "/login",
    cta: "Começar Agora"
  }
];

export default function BusinessesPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas as Cidades");
  const [realBusinesses, setRealBusinesses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCities, setDbCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatic carousel rotation
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setActiveAd((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
      try {
        // Fetch raw data
        const [bizRes, catsRes, citiesRes] = await Promise.all([
          supabase
            .from('businesses')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false }),
          supabase.from("categories").select("id, name, icon").eq("is_active", true),
          supabase.from("cities").select("id, name, country").eq("is_active", true),
        ]);

        if (bizRes.data) {
          setRealBusinesses(bizRes.data);
        }
        if (catsRes.data) {
          setDbCategories(catsRes.data);
        }
        if (citiesRes.data) {
          setDbCities(citiesRes.data);
        }
      } catch (error) {
        console.error("[EXPLORAR] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [mounted]);

  // Robust client-side mapping for categories and cities to handle all data sources
  const displayBusinesses = useMemo(() => {
    const categoryMap = new Map(dbCategories.map(c => [c.id, c]));
    const cityMap = new Map(dbCities.map(c => [c.id, c]));

    return realBusinesses.map((b: any) => {
      // Find category name
      let mappedCategory = "Outros";
      if (b.category) {
        mappedCategory = b.category;
      } else if (b.category_id && categoryMap.has(b.category_id)) {
        mappedCategory = categoryMap.get(b.category_id).name;
      }

      // Find city name
      let mappedCity = "Portugal";
      if (b.city) {
        mappedCity = b.city;
      } else if (b.city_id && cityMap.has(b.city_id)) {
        mappedCity = cityMap.get(b.city_id).name;
      }

      // Icon fallback for logo
      let categoryIcon = "🏪";
      if (b.category_id && categoryMap.has(b.category_id)) {
        categoryIcon = categoryMap.get(b.category_id).icon || "🏪";
      } else {
        const found = categoriesWithIcons.find(c => c.name.toLowerCase() === mappedCategory.toLowerCase());
        if (found) categoryIcon = found.icon;
      }

      return {
        id: b.id,
        name: b.name,
        category: mappedCategory,
        city: mappedCity,
        logo: b.logo_url || categoryIcon,
        cover: b.cover_url || "",
        premium: b.plan === 'pro' || b.plan === 'premium' || b.plan === 'gold',
        description: b.description || "",
        whatsApp: b.whatsapp || "",
        address: b.address || "",
        rating: b.rating_average || 5.0,
        reviewCount: b.rating_count || 0,
        slug: b.slug,
      };
    });
  }, [realBusinesses, dbCategories, dbCities]);

  // Filtering Logic — featured (pro/business) always first
  const filteredBusinesses = useMemo(() => {
    let result = [...displayBusinesses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.city.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "Todas") {
      result = result.filter((b) => b.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedCity !== "Todas as Cidades") {
      result = result.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // Premium businesses first
    result.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));

    return result;
  }, [displayBusinesses, searchQuery, selectedCategory, selectedCity]);

  const featuredSlice = filteredBusinesses.filter((b) => b.premium).slice(0, 3);
  const regularSlice = filteredBusinesses.filter((b) => !b.premium);

  // Top featured cards in dedicated section (first 3 premium across all, before filtering)
  const featuredBusinesses = useMemo(() => {
    return displayBusinesses.filter((b) => b.premium).slice(0, 3);
  }, [displayBusinesses]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-vitrinepro.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
          <div className="w-12 h-12 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#C8A96B] text-sm font-semibold tracking-widest uppercase animate-pulse mt-2">Carregando Vitrines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans select-none selection:bg-[#C8A96B] selection:text-[#0F172A]">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-55 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              ← Voltar ao Início
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              ⚙️ Painel do Dono
            </Link>
          </div>
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-12">
        
        {/* Ads / Highlights Carousel Section */}
        <section className="relative h-64 sm:h-80 md:h-96 w-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-slate-900/60">
          {ads.map((ad, idx) => (
            <div
              key={ad.id}
              className={`absolute inset-0 transition-opacity duration-1000 flex flex-col justify-end p-6 sm:p-12 ${
                idx === activeAd ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {ad.cover ? (
                <Image
                  src={ad.cover}
                  alt={ad.title}
                  fill
                  className="object-cover opacity-35"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="relative z-20 max-w-2xl space-y-3 sm:space-y-4">
                <span className="inline-block px-3 py-1 text-[9px] font-bold text-[#0F172A] bg-[#C8A96B] rounded-full uppercase tracking-wider">
                  {ad.badge}
                </span>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-wide leading-tight">
                  {ad.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light line-clamp-2">
                  {ad.tagline}
                </p>
                <div className="pt-2">
                  <Link
                    href={ad.link}
                    className="inline-block px-6 py-2.5 sm:px-8 sm:py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    {ad.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel dots indicators */}
          <div className="absolute bottom-6 right-6 z-25 flex items-center gap-2">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveAd(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeAd ? "bg-[#C8A96B] w-6" : "bg-white/30"
                }`}
                aria-label={`Ir para anúncio ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Featured Premium Listings Section */}
        {featuredBusinesses.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-display font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="text-[#C8A96B]">⭐</span> Negócios em Destaque
                </h3>
                <p className="text-xs text-slate-400">Vitrines recomendadas e verificadas pela plataforma.</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {featuredBusinesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/vitrine/${biz.slug}`}
                  className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/40 border-2 border-[#C8A96B]/20 hover:border-[#C8A96B] rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[#C8A96B]/5 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl overflow-hidden relative">
                        {biz.logo && biz.logo.startsWith("http") ? (
                          <img src={biz.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{biz.logo}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 px-2 py-0.5 rounded border border-[#C8A96B]/20 uppercase tracking-widest">
                        PREMIUM
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-lg font-bold text-white group-hover:text-[#C8A96B] transition-colors line-clamp-1">
                        {biz.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{biz.category} · 📍 {biz.city}</p>
                    </div>

                    <p className="text-xs text-slate-350 line-clamp-3 leading-relaxed font-light">
                      {biz.description || "Conecte-se connosco por um dos canais disponíveis na nossa vitrina oficial."}
                    </p>
                  </div>

                  <div className="pt-5 flex items-center justify-between border-t border-slate-850 mt-5">
                    <div className="flex items-center text-xs text-[#C8A96B]">
                      <span className="text-sm mr-1">★</span>
                      <span className="font-bold text-white">{biz.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                      Ver Vitrina →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-display font-bold text-white tracking-wide">
            Categorias Populares
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {categoriesWithIcons.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.name
                    ? "bg-[#C8A96B] text-[#0F172A] border-transparent shadow-lg shadow-[#C8A96B]/15"
                    : "bg-slate-900/40 border-slate-850 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Main Feed Controls & Search Grid */}
        <section className="space-y-6 pt-4">
          
          {/* Filters controls bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-slate-900/30 p-4 border border-white/5 rounded-2xl">
            {/* Search Input */}
            <div className="flex-grow relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Pesquisar por nome, palavra-chave, cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0F172A] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A96B]/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* City Dropdown */}
            <div className="w-full md:w-64">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#C8A96B]/60 cursor-pointer"
              >
                {citiesList.map((city) => (
                  <option key={city} value={city}>
                    {city === "Todas as Cidades" ? "📍 Todas as Cidades (PT)" : `📍 ${city}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>
              Mostrando <span className="text-[#C8A96B] font-bold">{filteredBusinesses.length}</span> vitrines locais
            </p>
            {(selectedCategory !== "Todas" || selectedCity !== "Todas as Cidades" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("Todas");
                  setSelectedCity("Todas as Cidades");
                  setSearchQuery("");
                }}
                className="text-[#C8A96B] hover:underline"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Pinterest-Style Responsive Grid with section labels */}
          {filteredBusinesses.length > 0 ? (
            <div className="space-y-8">
              {/* Featured (Pro/Business) group */}
              {featuredSlice.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest flex items-center gap-1.5">
                    <span>✦</span> Negócios em Destaque
                  </p>
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {featuredSlice.map((biz) => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </div>
              )}

              {/* Regular group */}
              {regularSlice.length > 0 && (
                <div className="space-y-4">
                  {featuredSlice.length > 0 && (
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Todos os Negócios
                    </p>
                  )}
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {regularSlice.map((biz) => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl space-y-6">
              <span className="text-5xl block">🏪</span>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-white font-display">Nenhum negócio encontrado</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Não encontramos vitrines na categoria <span className="text-slate-300 font-semibold">{selectedCategory}</span> em <span className="text-slate-300 font-semibold">{selectedCity}</span>.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block px-6 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  Cadastrar Minha Vitrina Grátis
                </Link>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 mt-20 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-1" />
          </Link>
          <p className="text-slate-400">O maior Pinterest de negócios locais em Portugal.</p>
          <p className="text-[10px] text-slate-600 mt-2">© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    restaurante: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    restaurantes: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    cafés: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    cafeteria: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    beleza: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    manicure: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    barbearia: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    serviços: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    construção: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    saúde: "bg-green-500/20 text-green-400 border-green-500/30",
    automóvel: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  };
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return "bg-[#C8A96B]/10 text-[#C8A96B] border-[#C8A96B]/20";
}

function BusinessCard({ biz }: { biz: any }) {
  return (
    <Link
      href={`/vitrine/${biz.slug}`}
      className="break-inside-avoid bg-slate-900/40 border border-slate-800 hover:border-[#C8A96B]/40 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-[#050816] hover:scale-[1.02] mb-6"
    >
      {/* Cover — 140px */}
      <div className="relative h-[140px] w-full bg-slate-950 overflow-hidden flex-shrink-0">
        {biz.cover ? (
          <img
            src={biz.cover}
            alt={biz.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] to-slate-800 opacity-70 flex items-center justify-center text-4xl">
              {biz.logo && !biz.logo.startsWith("http") && biz.logo}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent" />

        {/* ✦ Featured badge */}
        {biz.premium && (
          <span className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[8px] font-bold text-[#0F172A] bg-[#C8A96B] rounded-full uppercase tracking-wider shadow-md">
            ✦ Destaque
          </span>
        )}

        {/* Category badge with color */}
        <span className={`absolute bottom-3 left-3 z-20 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border backdrop-blur-md ${getCategoryColor(biz.category)}`}>
          {biz.category}
        </span>
      </div>

      {/* Info — 180px */}
      <div className="p-5 h-[180px] flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* Logo circle overlapping cover */}
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-lg overflow-hidden relative -mt-8 z-20 shadow-xl flex-shrink-0">
              {biz.logo && biz.logo.startsWith("http") ? (
                <img src={biz.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{biz.logo}</span>
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <h4 className="font-display text-base font-bold text-white truncate group-hover:text-[#C8A96B] transition-colors leading-tight">
                {biz.name}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">📍 {biz.city}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-2">
            {biz.description || "Empresa local com contacto direto via WhatsApp."}
          </p>
        </div>

        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[#C8A96B]">
            <span>★</span>
            <span className="font-bold text-slate-200">{biz.rating?.toFixed(1)}</span>
          </div>
          <span className="font-bold text-[#C8A96B] bg-[#C8A96B]/5 group-hover:bg-[#C8A96B] group-hover:text-[#0F172A] border border-[#C8A96B]/20 group-hover:border-transparent px-3 py-1.5 rounded-lg transition-all text-[10px]">
            Ver Vitrine →
          </span>
        </div>
      </div>
    </Link>
  );
}