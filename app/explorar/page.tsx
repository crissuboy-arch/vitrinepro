/* eslint-disable */
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getCommunityByCountry } from "@/lib/communities";
import { getLocalFavoriteIds } from "@/lib/favorites";
import { vitrineUrl } from "@/lib/share";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";

const citiesList = [
  "Todas as Cidades",
  "Águeda", "Aveiro", "Porto", "Lisboa", "Braga", "Coimbra", "Viseu", "Leiria", "Faro", "Setúbal",
];

const categoriesWithIcons = [
  { name: "Todas", icon: "🌐" },
  { name: "Restaurantes", icon: "🍽️" },
  { name: "Cafés", icon: "☕" },
  { name: "Beleza", icon: "💆" },
  { name: "Manicure", icon: "✨" },
  { name: "Barbearia", icon: "💈" },
  { name: "Serviços", icon: "🛠️" },
  { name: "Construção", icon: "🏗️" },
  { name: "Saúde", icon: "🩺" },
  { name: "Automóvel", icon: "🚗" },
  { name: "Lojas", icon: "🛍️" },
];

const communitiesList = [
  { slug: "todas", name: "Todas", icon: "🌍", country: "" },
  { slug: "brasileira", name: "Brasileira", icon: "🇧🇷", country: "Brasil" },
  { slug: "angolana", name: "Angolana", icon: "🇦🇴", country: "Angola" },
  { slug: "cabo-verdiana", name: "Cabo-Verdiana", icon: "🇨🇻", country: "Cabo Verde" },
  { slug: "francesa", name: "Francesa", icon: "🇫🇷", country: "França" },
  { slug: "portuguesa", name: "Portuguesa", icon: "🇵🇹", country: "Portugal" },
];

const SORTS = [
  { key: "relevance", label: "Relevância" },
  { key: "recent", label: "Mais recentes" },
  { key: "rated", label: "Mais avaliados" },
  { key: "visited", label: "Mais visitados" },
  { key: "favorited", label: "Mais favoritados" },
];

const PAGE_SIZE = 12;

export default function ExplorarPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas as Cidades");
  const [selectedCommunity, setSelectedCommunity] = useState("todas");
  const [sortBy, setSortBy] = useState("relevance");
  const [nearCity, setNearCity] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [realBusinesses, setRealBusinesses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCities, setDbCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);
    const comm = params.get("comunidade");
    if (comm && communitiesList.some((c) => c.slug === comm.toLowerCase())) setSelectedCommunity(comm.toLowerCase());
    const q = params.get("q");
    if (q) setSearchQuery(q);

    const loadData = async () => {
      try {
        const [bizRes, catsRes, citiesRes] = await Promise.all([
          supabase.from("businesses").select("*").eq("published", true).order("created_at", { ascending: false }),
          supabase.from("categories").select("id, name, icon").eq("is_active", true),
          supabase.from("cities").select("id, name, country").eq("is_active", true),
        ]);
        if (bizRes.data) setRealBusinesses(bizRes.data);
        if (catsRes.data) setDbCategories(catsRes.data);
        if (citiesRes.data) setDbCities(citiesRes.data);

        // Preload favorites: DB for logged-in users, localStorage for anonymous.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: favs } = await supabase.from("favorites").select("business_id").eq("user_id", session.user.id);
          if (favs) setFavSet(new Set(favs.map((r: any) => r.business_id)));
        } else {
          setFavSet(new Set(getLocalFavoriteIds()));
        }
      } catch (error) {
        console.error("[EXPLORAR] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [mounted]);

  const selectCommunityHandler = (slug: string) => {
    setSelectedCommunity(slug);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (slug === "todas") url.searchParams.delete("comunidade");
      else url.searchParams.set("comunidade", slug);
      window.history.pushState({}, "", url.pathname + url.search);
    }
  };

  const handleNearMe = useCallback(() => {
    if (nearCity) { setNearCity(null); return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("Geolocalização não suportada.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
          );
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "";
          if (city) { setNearCity(city); showToast(`📍 Perto de ti: ${city}`); }
          else showToast("Não foi possível detetar a tua cidade.");
        } catch {
          showToast("Não foi possível detetar a tua localização.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => { setGeoLoading(false); showToast("Permissão de localização negada."); },
      { timeout: 8000 }
    );
  }, [nearCity, showToast]);

  const displayBusinesses = useMemo(() => {
    const categoryMap = new Map(dbCategories.map((c) => [c.id, c]));
    const cityMap = new Map(dbCities.map((c) => [c.id, c]));

    return realBusinesses.map((b: any) => {
      let mappedCategory = b.category || (b.category_id && categoryMap.get(b.category_id)?.name) || "Outros";
      let mappedCity = b.city || (b.city_id && cityMap.get(b.city_id)?.name) || "Portugal";

      let categoryIcon = "🏪";
      if (b.category_id && categoryMap.get(b.category_id)?.icon) categoryIcon = categoryMap.get(b.category_id).icon;
      else {
        const found = categoriesWithIcons.find((c) => c.name.toLowerCase() === String(mappedCategory).toLowerCase());
        if (found) categoryIcon = found.icon;
      }

      return {
        id: b.id,
        name: b.name,
        category: mappedCategory,
        city: mappedCity,
        logo: b.logo_url || categoryIcon,
        cover: b.cover_url || "",
        cover_gradient: b.cover_gradient || "",
        premium: b.plan === "pro" || b.plan === "premium" || b.plan === "business",
        description: b.description || "",
        slug: b.slug,
        country: b.country || b.owner_origin_country || "",
        owner_origin_country: b.owner_origin_country || "",
        created_at: b.created_at || "",
        rating: b.rating_average || 0,
        reviewCount: b.rating_count || 0,
        view_count: b.view_count ?? 0,
        favorite_count: b.favorite_count ?? 0,
        share_count: b.share_count ?? 0,
      };
    });
  }, [realBusinesses, dbCategories, dbCities]);

  const score = (b: any) =>
    (b.premium ? 200 : 0) + (b.view_count ?? 0) + (b.favorite_count ?? 0) * 10 +
    (b.share_count ?? 0) * 3 + Math.round((b.rating ?? 0) * 20);

  const filteredBusinesses = useMemo(() => {
    let result = [...displayBusinesses];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        String(b.category).toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "Todas") {
      result = result.filter((b) => String(b.category).toLowerCase() === selectedCategory.toLowerCase());
    }
    if (nearCity) {
      result = result.filter((b) => b.city.toLowerCase().includes(nearCity.toLowerCase()));
    } else if (selectedCity !== "Todas as Cidades") {
      result = result.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase());
    }
    if (selectedCommunity !== "todas") {
      const activeComm = communitiesList.find((c) => c.slug === selectedCommunity);
      if (activeComm?.country) {
        const target = activeComm.country.toLowerCase();
        result = result.filter((b) => {
          const origin = b.country?.toLowerCase() || "";
          return origin.includes(target) ||
            (selectedCommunity === "brasileira" && origin.includes("brasil")) ||
            (selectedCommunity === "cabo-verdiana" && origin.includes("cabo")) ||
            (selectedCommunity === "francesa" && origin.includes("fran")) ||
            (selectedCommunity === "portuguesa" && origin.includes("portug"));
        });
      }
    }

    switch (sortBy) {
      case "recent": result.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); break;
      case "rated": result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "visited": result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)); break;
      case "favorited": result.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0)); break;
      default: result.sort((a, b) => score(b) - score(a));
    }
    return result;
  }, [displayBusinesses, searchQuery, selectedCategory, selectedCity, selectedCommunity, sortBy, nearCity]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, selectedCategory, selectedCity, selectedCommunity, sortBy, nearCity]);

  const visibleBusinesses = filteredBusinesses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBusinesses.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((v) => v + PAGE_SIZE); },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredBusinesses.length, visibleCount]);

  // Sidebar data (computed from all businesses, not the filtered set)
  const featured = useMemo(() => [...displayBusinesses].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3), [displayBusinesses]);
  const recent = useMemo(() => [...displayBusinesses].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 5), [displayBusinesses]);
  const topCityName = nearCity || (selectedCity !== "Todas as Cidades" ? selectedCity : null);
  const topCity = useMemo(() => {
    if (!topCityName) return [];
    return [...displayBusinesses].filter((b) => b.city.toLowerCase().includes(topCityName.toLowerCase()))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  }, [displayBusinesses, topCityName]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#C8A96B] text-sm font-semibold tracking-widest uppercase animate-pulse mt-2">Carregando Vitrines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col font-sans selection:bg-[#C8A96B] selection:text-[#0F172A]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F172A]/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white border border-white/5 px-3 py-1.5 rounded-lg">← Início</Link>
            <Link href="/dashboard" className="text-xs text-[#C8A96B] border border-[#C8A96B]/15 px-3 py-1.5 rounded-lg">⚙️ Painel</Link>
          </div>
          <Link href="/" className="font-display font-bold text-[#C8A96B] text-xl">VitrinePro</Link>
          <Link href="/favoritos" className="text-xs text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#C8A96B]/40">❤️ Favoritos</Link>
        </div>
      </header>

      {/* Sticky filters */}
      <div className="sticky top-[64px] z-40 bg-[#050816]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          {/* Search + near me + sort */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Pesquisar nome, produto ou serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#0F172A] border border-gray-800 focus:border-[#C8A96B]/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleNearMe}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
                  nearCity ? "bg-[#C8A96B] border-transparent text-[#0F172A]" : "bg-[#0F172A] border-gray-800 text-slate-300 hover:border-[#C8A96B]/40"
                }`}
              >
                {geoLoading ? "📍 ..." : nearCity ? `📍 ${nearCity} ✕` : "📍 Perto de mim"}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 bg-[#0F172A] border border-gray-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categoriesWithIcons.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                  selectedCategory === cat.name ? "bg-[#C8A96B] border-transparent text-[#0F172A]" : "bg-[#0F172A] border-gray-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
          </div>

          {/* Community + city pills */}
          <div className="flex flex-wrap gap-2">
            {communitiesList.map((comm) => (
              <button
                key={comm.slug}
                onClick={() => selectCommunityHandler(comm.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  selectedCommunity === comm.slug ? "bg-[#C8A96B] border-transparent text-[#0F172A]" : "bg-[#0F172A] border-gray-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span className="text-sm leading-none">{comm.icon}</span>{comm.name}
              </button>
            ))}
            <span className="w-px bg-gray-800 mx-1" />
            {citiesList.map((city) => (
              <button
                key={city}
                onClick={() => { setSelectedCity(city); if (city !== "Todas as Cidades") setNearCity(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedCity === city && !nearCity ? "bg-slate-700 border-transparent text-white" : "bg-[#0F172A] border-gray-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {city === "Todas as Cidades" ? "Todas" : city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
          {/* Feed */}
          <section>
            <h3 className="font-display font-semibold text-lg text-white mb-5 px-1">
              {filteredBusinesses.length} negócio{filteredBusinesses.length !== 1 ? "s" : ""}
            </h3>

            {filteredBusinesses.length > 0 ? (
              <>
                <div className="columns-1 sm:columns-2 2xl:columns-3 gap-4">
                  {visibleBusinesses.map((biz) => (
                    <ExplorarCard key={biz.id} biz={biz} initialFav={favSet.has(biz.id)} onToast={showToast} />
                  ))}
                </div>

                {hasMore && (
                  <div ref={sentinelRef} className="columns-1 sm:columns-2 2xl:columns-3 gap-4 mt-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="break-inside-avoid mb-4 rounded-2xl border border-[#C8A96B]/20 bg-[#C8A96B]/5 animate-pulse" style={{ height: 200 + i * 40 }} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl space-y-4">
                <span className="text-5xl block">🏪</span>
                <h4 className="text-lg font-bold text-white font-display">Nenhum negócio encontrado</h4>
                <p className="text-xs text-slate-400">Tenta ajustar os filtros ou a pesquisa.</p>
              </div>
            )}
          </section>

          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[230px] space-y-6">
              <SidebarBlock title="🔥 Em Destaque esta semana" items={featured} emptyText="Sem dados ainda." />
              {topCityName && <SidebarBlock title={`📍 Top em ${topCityName}`} items={topCity} emptyText="Sem negócios nesta cidade." />}
              <SidebarBlock title="✨ Recém adicionados" items={recent} emptyText="Sem novidades." />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#050816] border-t border-white/5 py-12 mt-12 text-center text-slate-500 text-xs">
        <p className="text-slate-400">O maior Pinterest de negócios locais em Portugal.</p>
        <p className="text-[10px] text-slate-600 mt-2">© 2026 VitrinePro.</p>
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-[#0F172A] border border-[#C8A96B]/40 text-[#C8A96B] text-xs font-semibold shadow-2xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}

function SidebarBlock({ title, items, emptyText }: { title: string; items: any[]; emptyText: string }) {
  return (
    <div className="bg-[#0F172A]/40 border border-gray-800 rounded-2xl p-4">
      <h4 className="text-sm font-bold text-white mb-3">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <Link key={b.id} href={`/vitrine/${b.slug}`} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                {b.logo && b.logo.startsWith("http") ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : <span>{b.logo}</span>}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate group-hover:text-[#C8A96B] transition-colors">{b.name}</div>
                <div className="text-[10px] text-slate-500 truncate">📍 {b.city} · ★ {(b.rating || 0).toFixed(1)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ExplorarCard({ biz, initialFav, onToast }: { biz: any; initialFav: boolean; onToast: (m: string) => void }) {
  const comm = biz.owner_origin_country ? getCommunityByCountry(biz.owner_origin_country) : null;
  const hasImage = !!biz.cover;

  return (
    <Link
      href={`/vitrine/${biz.slug}`}
      className="group block break-inside-avoid mb-4 bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover — natural height (masonry) */}
      <div className="relative w-full bg-slate-900">
        {hasImage ? (
          <img src={biz.cover} alt={`Capa de ${biz.name}`} className="block w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700" />
        ) : (
          <div className="w-full flex items-center justify-center text-5xl py-10" style={{ background: biz.cover_gradient || "linear-gradient(135deg,#0a0d14,#1a2235)" }}>
            {biz.logo && !String(biz.logo).startsWith("http") ? biz.logo : "🏪"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent z-10" />

        {/* Category badge (top-left) */}
        <span className="absolute top-3 left-3 z-20 px-2.5 py-0.5 text-[9px] font-bold bg-[#0F172A]/80 border border-white/5 text-[#C8A96B] rounded-full uppercase tracking-wider backdrop-blur-md">
          {biz.category}
        </span>

        {/* Community badge (top-right) */}
        {comm && (
          <span className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[9px] font-bold rounded-full backdrop-blur-md"
            style={{ background: `${comm.color}25`, color: comm.color, border: `1px solid ${comm.color}40` }}>
            {comm.icon} {comm.name}
          </span>
        )}

        {/* Favorite + share (bottom-right) */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <FavoriteButton businessId={biz.id} initialCount={biz.favorite_count} initialFavorited={initialFav} variant="card" />
          <ShareButton url={vitrineUrl(biz.slug)} title={biz.name} businessId={biz.id} variant="card" onShared={onToast} />
        </div>

        {/* Ver Vitrine on hover (bottom-left) */}
        <span className="absolute bottom-3 left-3 z-20 px-3 py-1 text-[10px] font-bold bg-[#C8A96B] text-[#0F172A] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Ver Vitrine →
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2.5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-lg overflow-hidden relative -mt-8 z-20 shadow-xl flex-shrink-0">
            {biz.logo && String(biz.logo).startsWith("http") ? <img src={biz.logo} alt={`Logo de ${biz.name}`} className="w-full h-full object-cover" /> : <span className="text-sm">{biz.logo}</span>}
          </div>
          <div className="min-w-0 pt-0.5">
            <h4 className="font-display text-base font-bold text-white truncate group-hover:text-[#C8A96B] transition-colors leading-tight">{biz.name}</h4>
            <div className="text-[10px] text-slate-400 truncate">📍 {biz.city} · {biz.category}</div>
          </div>
        </div>

        {biz.description && <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-2">{biz.description}</p>}

        {/* Stats line */}
        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#888]">
          <div className="flex items-center gap-3">
            <span className="text-[#C8A96B]">★ <span className="text-slate-200 font-bold">{(biz.rating || 0).toFixed(1)}</span></span>
            <span>❤️ {biz.favorite_count}</span>
            <span>👁 {biz.view_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
