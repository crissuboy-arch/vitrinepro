/* eslint-disable */
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getCommunityByCountry } from "@/lib/communities";

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
  country?: string;
}

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

const communitiesList = [
  { slug: "todas", name: "Todas as Comunidades", icon: "🌍", country: "" },
  { slug: "brasileira", name: "Brasileira", icon: "🇧🇷", country: "Brasil" },
  { slug: "angolana", name: "Angolana", icon: "🇦🇴", country: "Angola" },
  { slug: "cabo-verdiana", name: "Cabo-Verdiana", icon: "🇨🇻", country: "Cabo Verde" },
  { slug: "francesa", name: "Francesa", icon: "🇫🇷", country: "França" }
];

export default function ExplorarPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas as Cidades");
  const [selectedCommunity, setSelectedCommunity] = useState("todas");
  const [realBusinesses, setRealBusinesses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCities, setDbCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Read community filter from URL query param
    const params = new URLSearchParams(window.location.search);
    const comm = params.get("comunidade");
    if (comm && communitiesList.some((c) => c.slug === comm.toLowerCase())) {
      setSelectedCommunity(comm.toLowerCase());
    }
    const q = params.get("q");
    if (q) {
      setSearchQuery(q);
    }

    const loadData = async () => {
      try {
        const [bizRes, catsRes, citiesRes] = await Promise.all([
          supabase
            .from("businesses")
            .select("*")
            .eq("published", true)
            .order("created_at", { ascending: false }),
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

  // Sync state with URL parameter changes (e.g. clicking back browser)
  useEffect(() => {
    if (!mounted) return;
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const comm = params.get("comunidade") || "todas";
      setSelectedCommunity(comm.toLowerCase());
      const q = params.get("q") || "";
      setSearchQuery(q);
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [mounted]);

  const selectCommunityHandler = (slug: string) => {
    setSelectedCommunity(slug);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (slug === "todas") {
        url.searchParams.delete("comunidade");
      } else {
        url.searchParams.set("comunidade", slug);
      }
      window.history.pushState({}, "", url.pathname + url.search);
    }
  };

  const displayBusinesses = useMemo(() => {
    const categoryMap = new Map(dbCategories.map((c) => [c.id, c]));
    const cityMap = new Map(dbCities.map((c) => [c.id, c]));

    return realBusinesses.map((b: any) => {
      let mappedCategory = "Outros";
      if (b.category) {
        mappedCategory = b.category;
      } else if (b.category_id && categoryMap.has(b.category_id)) {
        mappedCategory = categoryMap.get(b.category_id).name;
      }

      let mappedCity = "Portugal";
      if (b.city) {
        mappedCity = b.city;
      } else if (b.city_id && cityMap.has(b.city_id)) {
        mappedCity = cityMap.get(b.city_id).name;
      }

      let categoryIcon = "🏪";
      if (b.category_id && categoryMap.has(b.category_id)) {
        categoryIcon = categoryMap.get(b.category_id).icon || "🏪";
      } else {
        const found = categoriesWithIcons.find((c) => c.name.toLowerCase() === mappedCategory.toLowerCase());
        if (found) categoryIcon = found.icon;
      }

      return {
        id: b.id,
        name: b.name,
        category: mappedCategory,
        city: mappedCity,
        logo: b.logo_url || categoryIcon,
        cover: b.cover_url || "",
        premium: b.plan === "pro" || b.plan === "premium" || b.plan === "gold" || b.plan === "business",
        description: b.description || "",
        whatsApp: b.whatsapp || "",
        address: b.address || "",
        rating: b.rating_average || 5.0,
        reviewCount: b.rating_count || 0,
        slug: b.slug,
        country: b.country || b.owner_origin_country || "",
        owner_origin_country: b.owner_origin_country || "",
      };
    });
  }, [realBusinesses, dbCategories, dbCities]);

  const filteredBusinesses = useMemo(() => {
    let result = [...displayBusinesses];

    // Search query filter
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

    // Category filter
    if (selectedCategory !== "Todas") {
      result = result.filter((b) => b.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // City filter
    if (selectedCity !== "Todas as Cidades") {
      result = result.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // Community filter (owner origin country)
    if (selectedCommunity !== "todas") {
      const activeComm = communitiesList.find((c) => c.slug === selectedCommunity);
      if (activeComm && activeComm.country) {
        const targetCountry = activeComm.country.toLowerCase();
        result = result.filter((b) => {
          const origin = b.country?.toLowerCase() || "";
          return (
            origin === targetCountry ||
            origin.includes(targetCountry) ||
            (selectedCommunity === "brasileira" && origin.includes("brasil")) ||
            (selectedCommunity === "angolana" && origin.includes("angola")) ||
            (selectedCommunity === "cabo-verdiana" && origin.includes("cabo")) ||
            (selectedCommunity === "francesa" && origin.includes("fran"))
          );
        });
      }
    }

    // Premium businesses first
    result.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));

    return result;
  }, [displayBusinesses, searchQuery, selectedCategory, selectedCity, selectedCommunity]);

  const featuredSlice = filteredBusinesses.filter((b) => b.premium).slice(0, 3);
  const regularSlice = filteredBusinesses.filter((b) => !b.premium);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-vitrinepro.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
          <div className="w-12 h-12 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#C8A96B] text-sm font-semibold tracking-widest uppercase animate-pulse mt-2">
            Carregando Vitrines...
          </p>
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
              className="text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-slate-650 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-10">
        
        {/* Banner Title */}
        <div className="text-center py-6 space-y-2">
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white tracking-wide">
            Explorar Negócios
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-light max-w-xl mx-auto leading-relaxed">
            Pesquise por categoria, cidade ou pela comunidade dos fundadores locais em Portugal.
          </p>
        </div>

        {/* Filter Controls Row */}
        <section className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pesquisa Livre
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome, descrição ou tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0F172A] border border-gray-850 focus:border-[#C8A96B]/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-gray-850 focus:border-[#C8A96B]/60 rounded-xl text-xs text-white focus:outline-none transition-all cursor-pointer"
              >
                <option value="Todas">Todas as Categorias</option>
                {dbCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Cidade
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F172A] border border-gray-850 focus:border-[#C8A96B]/60 rounded-xl text-xs text-white focus:outline-none transition-all cursor-pointer"
              >
                {citiesList.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Communities Selector Chips */}
          <div className="border-t border-gray-850 pt-5 space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Comunidade do Proprietário
            </span>
            <div className="flex flex-wrap gap-2.5">
              {communitiesList.map((comm) => (
                <button
                  key={comm.slug}
                  onClick={() => selectCommunityHandler(comm.slug)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all duration-350 cursor-pointer ${
                    selectedCommunity === comm.slug
                      ? "bg-[#C8A96B] border-transparent text-[#0F172A] shadow-[0_4px_15px_rgba(200,169,107,0.25)] scale-102"
                      : "bg-[#0F172A] border-gray-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span>{comm.icon}</span>
                  <span>{comm.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Directory Showcase Cards */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-display font-semibold text-lg text-white">
              Vitrinas Publicadas ({filteredBusinesses.length})
            </h3>
          </div>

          {filteredBusinesses.length > 0 ? (
            <div className="space-y-8">
              {/* Featured section */}
              {featuredSlice.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest flex items-center gap-1.5">
                    <span>✦</span> Negócios em Destaque
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredSlice.map((biz) => <ExplorarCard key={biz.id} biz={biz} />)}
                  </div>
                </div>
              )}
              {/* Regular section */}
              {regularSlice.length > 0 && (
                <div className="space-y-4">
                  {featuredSlice.length > 0 && (
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Todos os Negócios
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularSlice.map((biz) => <ExplorarCard key={biz.id} biz={biz} />)}
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
                  Não encontramos negócios locais que atendam aos filtros selecionados.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block px-6 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
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

function ExplorarCard({ biz }: { biz: any }) {
  return (
    <Link
      href={`/vitrine/${biz.slug}`}
      className="group bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]"
    >
      {/* Cover — 140px */}
      <div className="relative h-[140px] w-full bg-slate-900 flex-shrink-0">
        {biz.cover ? (
          <img
            src={biz.cover}
            alt=""
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-40 flex items-center justify-center text-4xl">
            {biz.logo && !biz.logo.startsWith("http") && biz.logo}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10" />

        {biz.premium && (
          <span className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[8px] font-bold bg-[#C8A96B] text-[#0F172A] rounded-full uppercase tracking-wider shadow-md">
            ✦ Destaque
          </span>
        )}

        {/* Community seal */}
        {(() => {
          const comm = biz.owner_origin_country ? getCommunityByCountry(biz.owner_origin_country) : null;
          if (!comm) return null;
          return (
            <span className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[9px] font-bold rounded-full backdrop-blur-md"
              style={{ background: `${comm.color}25`, color: comm.color, border: `1px solid ${comm.color}40` }}>
              {comm.icon} {comm.name}
            </span>
          );
        })()}

        <span className="absolute bottom-3 left-3 z-20 px-2.5 py-0.5 text-[9px] font-bold bg-[#0F172A]/80 border border-white/5 text-[#C8A96B] rounded-full uppercase tracking-wider backdrop-blur-md">
          {biz.category}
        </span>
      </div>

      {/* Info — 180px */}
      <div className="p-5 h-[180px] flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-lg overflow-hidden relative -mt-8 z-20 shadow-xl flex-shrink-0">
              {biz.logo && biz.logo.startsWith("http") ? (
                <img src={biz.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{biz.logo}</span>
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <h4 className="font-display text-base font-bold text-white tracking-wide truncate group-hover:text-[#C8A96B] transition-colors leading-tight">
                {biz.name}
              </h4>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                <span>📍 {biz.city}</span>
                {biz.country && (
                  <span className="text-[#C8A96B]">• 🌍 {biz.country}</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-2">
            {biz.description || "Empresa local com contacto direto via WhatsApp."}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[#C8A96B]">
            <span>★</span>
            <span className="font-bold text-slate-200">{biz.rating?.toFixed(1)}</span>
          </div>
          <span className="font-bold text-[#C8A96B] bg-[#C8A96B]/5 group-hover:bg-[#C8A96B] group-hover:text-[#0F172A] border border-[#C8A96B]/20 group-hover:border-transparent px-3 py-1.5 rounded-xl transition-all text-[10px]">
            Ver Vitrine →
          </span>
        </div>
      </div>
    </Link>
  );
}
