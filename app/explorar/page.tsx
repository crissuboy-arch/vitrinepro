/* eslint-disable */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/SupabaseAuthContext";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getCommunityByCountry } from "@/lib/communities";
import { isPaidTier } from "@/lib/plans";
import { normalizeProductFraming, productImgStyle } from "@/lib/product-framing";
import { scoreBusiness } from "@/lib/ranking";
// A4 — descoberta local: distância, busca reutilizável, mapa.
import {
  businessCoords,
  distanceKm,
  formatDistance,
  DISTANCE_FILTERS,
} from "@/lib/geo";
import { businessMatchesQuery, productMatchesQuery } from "@/lib/local-search";
import dynamic from "next/dynamic";

const NearbyMap = dynamic(() => import("../components/NearbyMap"), { ssr: false });
import SaveToCollection from "../components/SaveToCollection";
import NovidadesFeed from "@/components/NovidadesFeed";
import { splitExploreSlices } from "@/lib/explore-slices";
// A5 — "Preciso Hoje": disponibilidade honesta (camada pura, sem React).
import {
  isOpenNow,
  businessServiceState,
  businessQualifiesNeedToday,
  productAvailabilityState,
  productCapabilities,
  productQualifiesNeedToday,
} from "@/lib/availability";

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
  const { user } = useAuth();
  // A6.5 fix (iPhone smoke): "Painel do Dono" só para quem tem gestão real —
  // merchant (≥1 business) ou admin (verificado no servidor). Visitante e
  // consumidor com 0 businesses NÃO veem. Não é CSS: é renderização condicional
  // baseada em estado real (sessão + query + verificação server-side).
  const [canSeeOwnerPanel, setCanSeeOwnerPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas as Cidades");
  const [selectedCommunity, setSelectedCommunity] = useState("todas");
  const [realBusinesses, setRealBusinesses] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCities, setDbCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // A4 — "Perto de Mim": localização do visitante (sessão apenas, nunca persistida).
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "requesting" | "granted" | "denied" | "unsupported" | "error">("idle");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<"relevance" | "nearest">("relevance");
  // A5 — "⚡ Preciso Hoje": modo/filtro adicional sobre a descoberta A4.
  const [needToday, setNeedToday] = useState(false);
  // A4.9 — resultados de produtos (buscados só quando há pesquisa).
  const [productHits, setProductHits] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // A6.5 fix: resolve visibilidade do "Painel do Dono" com estado real.
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) setCanSeeOwnerPanel(false);
        return;
      }
      try {
        const [bizRes, adminRes] = await Promise.all([
          supabase.from("businesses").select("id").eq("user_id", user.id).limit(1),
          fetch("/api/auth/is-admin").then((r) => r.json()).catch(() => ({ isAdmin: false })),
        ]);
        const isMerchant = (bizRes.data?.length ?? 0) > 0;
        const isAdmin = !!adminRes?.isAdmin;
        if (!cancelled) setCanSeeOwnerPanel(isMerchant || isAdmin);
      } catch {
        if (!cancelled) setCanSeeOwnerPanel(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, user]);

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
            .select(
              "id, name, slug, description, category, city, country, logo_url, cover_url, rating_average, rating_count, owner_origin_country, opening_hours, service_today, latitude, longitude"
            )
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

  // A4.5 — "Perto de Mim": pede a localização UMA vez, só após clique.
  // A4.13 — as coordenadas vivem só nesta sessão; nada é persistido nem
  // enviado para analytics.
  const requestNearMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("granted");
        setSortMode("nearest");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearNearMe = () => {
    setUserLoc(null);
    setGeoState("idle");
    setMaxDistanceKm(null);
    setSortMode("relevance");
  };

  // A4.18 — cliques de descoberta (sem coordenadas no payload).
  // A5: em modo "Preciso Hoje", o clique é registado como need_today_result_click.
  const trackDiscoveryClick = (
    businessId: string,
    eventType: "business_result_click" | "product_result_click" | "need_today_result_click"
  ) => {
    try {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, event_type: eventType }),
      }).catch(() => {});
    } catch {
      // analytics nunca quebra a navegação
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
        // A2.5: plan must reach the ranking algorithm (was dropped here,
        // so the premium bonus in score() never applied).
        plan: b.plan || "free",
        premium: isPaidTier(b.plan),
        description: b.description || "",
        whatsApp: b.whatsapp || "",
        address: b.address || "",
        rating: b.rating_average || 5.0,
        reviewCount: b.rating_count || 0,
        slug: b.slug,
        country: b.country || b.owner_origin_country || "",
        owner_origin_country: b.owner_origin_country || "",
        // A2.5: ranking inputs must reach scoreBusiness (were dropped here).
        view_count: b.view_count ?? 0,
        like_count: b.like_count ?? 0,
        favorite_count: b.favorite_count ?? 0,
        share_count: b.share_count ?? 0,
        rating_average: b.rating_average ?? 0,
        // A4: coordenadas (nullable até a migration 000006 ser aplicada).
        latitude: b.latitude ?? null,
        longitude: b.longitude ?? null,
        // A5: disponibilidade "hoje" (tri-state; null = não informado).
        // "Aberto agora" é derivado de opening_hours em tempo de leitura.
        service_today: b.service_today ?? null,
        opening_hours: b.opening_hours ?? null,
      };
    });
  }, [realBusinesses, dbCategories, dbCities]);

  // A4.8/A4.9 — busca de produtos: só quando há pesquisa, com debounce,
  // filtrada no servidor (ilike) para não trazer o catálogo inteiro.
  // A5-UX: extraída para runProductSearch para que o botão "🔎 Buscar" e o
  // Enter executem EXATAMENTE a mesma pesquisa do debounce automático.
  const runProductSearch = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    try {
      // Sanitiza para o filtro PostgREST: só letras/números/espaços.
      const safe = q.replace(/[^\p{L}\p{N} ]/gu, "").trim();
      if (safe.length < 2) {
        setProductHits([]);
        return;
      }
      const like = `%${safe}%`;
      const { data } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, image_position_x, image_position_y, image_zoom, business_id, available_today, pickup_today, delivery_today")
        .or(`name.ilike.${like},description.ilike.${like}`)
        .limit(30);
        // RLS já restringe a produtos de negócios publicados; reforço
        // client-side com o helper reutilizável + join com os negócios.
        const bizById = new Map(displayBusinesses.map((b: any) => [b.id, b]));
        const hits = (data || [])
          .filter((p: any) => productMatchesQuery(p, q))
          .map((p: any) => ({ ...p, business: bizById.get(p.business_id) || null }))
          .filter((h: any) => h.business)
          // A5 — modo "Preciso Hoje": só exclui com evidência negativa.
          // Produto FALSE nunca aparece como disponível; UNKNOWN passa.
          // Negócio fechado agora: só passa se o produto tem capacidade confirmada.
          .filter((h: any) => {
            if (!needToday) return true;
            if (!productQualifiesNeedToday(h)) return false;
            const b = h.business;
            if (isOpenNow(b.opening_hours) === "CLOSED") {
              const caps = productCapabilities(h);
              return (
                productAvailabilityState(h) === "AVAILABLE" ||
                caps.pickup === "AVAILABLE" ||
                caps.delivery === "AVAILABLE"
              );
            }
            return true;
          });
        setProductHits(hits);
      } catch {
        setProductHits([]);
      }
  };

  useEffect(() => {
    if (!mounted) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    const timer = setTimeout(() => {
      void runProductSearch(q);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, mounted, displayBusinesses, needToday]);

  // A5-UX — submit da pesquisa (botão "🔎 Buscar" ou Enter): executa
  // imediatamente a MESMA pesquisa do debounce automático.
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runProductSearch(searchQuery);
  };


  const filteredBusinesses = useMemo(() => {
    let result = [...displayBusinesses];

    // Search query filter — A4.8: camada reutilizável (nome, descrição,
    // categoria, cidade, comunidade; insensível a acentos).
    if (searchQuery) {
      result = result.filter((b) =>
        businessMatchesQuery(
          {
            id: b.id,
            name: b.name,
            description: b.description,
            category: b.category,
            city: b.city,
            community: b.owner_origin_country || b.country,
          },
          searchQuery
        )
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

    // A4.6/A4.7 — distância: calculada uma vez por negócio (helper central).
    // Sem localização do visitante, ou sem coordenadas no negócio,
    // a distância é null → nunca exibida, nunca filtrada por ela.
    // A5: estado de disponibilidade/"aberto agora" calculado uma vez aqui
    // (camada pura lib/availability.ts — sem lógica em componentes).
    const withDistance = result.map((b) => {
      const coords = businessCoords(b);
      const d =
        userLoc && coords
          ? distanceKm(userLoc.lat, userLoc.lng, coords.lat, coords.lng)
          : null;
      return {
        ...b,
        _distanceKm: d,
        _openState: isOpenNow(b.opening_hours),
        _serviceState: businessServiceState({ service_today: b.service_today }),
      };
    });

    // A5 — "⚡ Preciso Hoje": filtro adicional. Só exclui com evidência
    // negativa (service_today=false ou horário CLOSED). UNKNOWN passa —
    // disponibilidade e "aberto agora" são sinais diferentes, e não se
    // esconde um resultado útil só porque o horário é desconhecido.
    let scoped = withDistance;
    if (needToday) {
      scoped = withDistance.filter((b) =>
        businessQualifiesNeedToday({
          service_today: b.service_today,
          opening_hours: b.opening_hours,
        })
      );
    }
    // A4.5 — filtro de distância: mostra SÓ negócios com coordenadas válidas
    // dentro do raio. Sem localização, o filtro nem é oferecido (UI).
    // Encadeia após o filtro "Preciso Hoje" (usa `scoped`, não `withDistance`).
    if (maxDistanceKm !== null && userLoc) {
      scoped = scoped.filter(
        (b) => b._distanceKm !== null && b._distanceKm <= maxDistanceKm
      );
    }

    // Ordenação — A4.6: "Relevância" preserva o ranking atual (scoreBusiness);
    // "Mais perto" ordena por distância (desconhecidas por último).
    // A5: no modo "Preciso Hoje", disponibilidade confirmada e "aberto agora"
    // somam bónus ao ranking existente — sem criar um segundo motor.
    const needTodayBoost = (b: any) =>
      (b._serviceState === "AVAILABLE" ? 500 : 0) +
      (b._openState === "OPEN" ? 300 : 0);

    if (sortMode === "nearest" && userLoc) {
      scoped.sort((a, b) => {
        if (a._distanceKm === null && b._distanceKm === null)
          return scoreBusiness(b) - scoreBusiness(a);
        if (a._distanceKm === null) return 1;
        if (b._distanceKm === null) return -1;
        if (a._distanceKm !== b._distanceKm) return a._distanceKm - b._distanceKm;
        return scoreBusiness(b) - scoreBusiness(a);
      });
    } else {
      // Ranking: premium plan bonus (200pts) + engagement score.
      // A2.5: scoreBusiness is the single implementation (lib/ranking.ts).
      scoped.sort((a, b) => {
        const sa = scoreBusiness(a) + (needToday ? needTodayBoost(a) : 0);
        const sb = scoreBusiness(b) + (needToday ? needTodayBoost(b) : 0);
        return sb - sa;
      });
    }

    return scoped;
  }, [displayBusinesses, searchQuery, selectedCategory, selectedCity, selectedCommunity, userLoc, maxDistanceKm, sortMode, needToday]);

  // A6 fix (Problema 3): premium além do cap desce para a secção regular —
  // a contagem "Vitrinas Publicadas (N)" corresponde sempre aos cartões visíveis.
  const { featured: featuredSlice, regular: regularSlice } =
    splitExploreSlices(filteredBusinesses, 3);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/brand/logo-horizontal-transparent.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
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
            {canSeeOwnerPanel && (
              <Link
                href="/dashboard"
                className="text-xs text-[#C8A96B] hover:text-[#D4BB82] transition-all border border-[#C8A96B]/15 hover:border-[#C8A96B]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                ⚙️ Painel do Dono
              </Link>
            )}
          </div>
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
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

        {/* A6.5 — "Novidades na Vitrine": dados reais de business_posts. */}
        <NovidadesFeed />

        {/* Filter Controls Row */}
        <section className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input — A5-UX: form com botão "🔎 Buscar"; Enter faz submit */}
            <div className="space-y-1.5">
              <label
                htmlFor="explorar-search"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >
                Pesquisa Livre
              </label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="explorar-search"
                    type="text"
                    placeholder="Nome, descrição ou tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F172A] border border-gray-850 focus:border-[#C8A96B]/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 text-xs font-bold rounded-xl bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  🔎 Buscar
                </button>
              </form>
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

          {/* A4.5 — Perto de Mim */}
          <div className="border-t border-gray-850 pt-5 space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📍 Perto de Mim
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {geoState !== "granted" ? (
                <button
                  onClick={requestNearMe}
                  disabled={geoState === "requesting"}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {geoState === "requesting" ? "A localizar…" : "📍 Usar a minha localização"}
                </button>
              ) : (
                <button
                  onClick={clearNearMe}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B]/10 transition-all cursor-pointer"
                >
                  ✕ Limpar localização
                </button>
              )}

              {/* Distance filters — only when we know where the visitor is */}
              {geoState === "granted" &&
                DISTANCE_FILTERS.map((f) => (
                  <button
                    key={f.km}
                    onClick={() => setMaxDistanceKm(maxDistanceKm === f.km ? null : f.km)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      maxDistanceKm === f.km
                        ? "bg-[#C8A96B] border-transparent text-[#0F172A]"
                        : "bg-[#0F172A] border-gray-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

              {/* Sort — Relevância (ranking atual) vs Mais perto */}
              {geoState === "granted" && (
                <div className="flex items-center gap-1 ml-1 text-xs">
                  <span className="text-slate-500 mr-1">Ordenar:</span>
                  <button
                    onClick={() => setSortMode("relevance")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      sortMode === "relevance"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Relevância
                  </button>
                  <button
                    onClick={() => setSortMode("nearest")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      sortMode === "nearest"
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Mais perto
                  </button>
                </div>
              )}
            </div>

            {/* A4.13 — privacy notice */}
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
              Usamos a sua localização para mostrar negócios próximos. A sua
              localização exata não é publicada nem guardada — serve apenas
              para calcular distâncias nesta sessão.
              {geoState === "denied" && (
                <span className="text-slate-400">
                  {" "}Localização recusada: a Vitrine continua a funcionar normalmente
                  por pesquisa, cidade e categoria.
                </span>
              )}
              {geoState === "unsupported" && (
                <span className="text-slate-400">
                  {" "}Este navegador não suporta geolocalização: use a pesquisa,
                  cidade e categoria.
                </span>
              )}
              {geoState === "error" && (
                <span className="text-slate-400">
                  {" "}Não foi possível obter a localização: use a pesquisa,
                  cidade e categoria.
                </span>
              )}
            </p>
          </div>

          {/* A5 — ⚡ Preciso Hoje: modo de urgência sobre a descoberta A4.
              Só usa dados reais: UNKNOWN nunca recebe badge "Disponível hoje". */}
          <div className="border-t border-gray-850 pt-5 space-y-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ Preciso Hoje
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setNeedToday((v) => !v)}
                aria-pressed={needToday}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  needToday
                    ? "bg-[#C8A96B] text-[#0F172A] shadow-[0_4px_15px_rgba(200,169,107,0.35)]"
                    : "border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B]/10"
                }`}
              >
                {needToday ? "⚡ Preciso Hoje: ATIVO" : "⚡ Preciso Hoje"}
              </button>
              {needToday && (
                <button
                  onClick={() => setNeedToday(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-800 text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
                >
                  ✕ Desativar
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
              {needToday
                ? "A mostrar negócios e produtos que podem atender hoje, com base em dados reais dos comerciantes. Sem informação de disponibilidade, mostramos o resultado sem selo — nunca inventamos."
                : "Ative para ver quem pode atender ainda hoje: disponibilidade confirmada, negócio aberto agora e distância."}
            </p>
          </div>
        </section>

        {/* A4.12 — Mapa (Leaflet): mesmos resultados filtrados, com coordenadas */}
        {(() => {
          const mappable = filteredBusinesses.filter((b) =>
            businessCoords(b)
          );
          if (mappable.length === 0 && !userLoc) return null;
          return (
            <section className="space-y-3">
              <h3 className="font-display font-semibold text-lg text-white px-2">
                🗺️ No mapa
              </h3>
              {mappable.length > 0 ? (
                <NearbyMap
                  businesses={mappable.map((b) => ({
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    lat: b.latitude,
                    lng: b.longitude,
                  }))}
                  userLocation={userLoc}
                />
              ) : (
                <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                  <p className="text-xs text-slate-400">
                    Ainda nenhum negócio com localização no mapa — os comerciantes
                    podem adicionar as coordenadas na sua Montra.
                  </p>
                </div>
              )}
            </section>
          );
        })()}

        {/* A4.9 — Resultados de produtos (quando a pesquisa encontra produtos) */}
        {searchQuery.trim().length >= 2 && productHits.length > 0 && (
          <section className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-white px-2">
              🛍️ Produtos ({productHits.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productHits.map((hit) => (
                <ProductResultCard
                  key={hit.id}
                  hit={hit}
                  userLoc={userLoc}
                  onClick={() => trackDiscoveryClick(hit.business.id, needToday ? "need_today_result_click" : "product_result_click")}
                />
              ))}
            </div>
          </section>
        )}

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
                    {featuredSlice.map((biz) => (
                      <ExplorarCard
                        key={biz.id}
                        biz={biz}
                        onResultClick={() => trackDiscoveryClick(biz.id, needToday ? "need_today_result_click" : "business_result_click")}
                      />
                    ))}
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
                    {regularSlice.map((biz) => (
                      <ExplorarCard
                        key={biz.id}
                        biz={biz}
                        onResultClick={() => trackDiscoveryClick(biz.id, needToday ? "need_today_result_click" : "business_result_click")}
                      />
                    ))}
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
                  {needToday
                    ? "Em modo ⚡ Preciso Hoje mostramos apenas negócios e produtos que podem atender hoje, com base em dados reais dos comerciantes. Nenhum resultado confirma disponibilidade para esta pesquisa — experimente desativar o modo ou tentar outra pesquisa."
                    : "Não encontramos negócios locais que atendam aos filtros selecionados."}
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
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-1" />
          </Link>
          <p className="text-slate-400">Portugal, à sua volta.</p>
          <p className="text-[10px] text-slate-600 mt-2">© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function ExplorarCard({ biz, onResultClick }: { biz: any; onResultClick?: () => void }) {
  const distLabel = formatDistance(biz._distanceKm);
  return (
    <Link
      href={`/vitrine/${biz.slug}`}
      onClick={onResultClick}
      className="group bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]"
    >
      {/* Cover — 140px */}
      <div className="relative h-[140px] w-full bg-slate-900 flex-shrink-0">
        {biz.cover ? (
          <Image
            src={biz.cover}
            alt={`Capa de ${biz.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-40 flex items-center justify-center text-4xl">
            {biz.logo && !biz.logo.startsWith("http") && biz.logo}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10" />


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
                <Image src={biz.logo} alt={`Logo de ${biz.name}`} fill sizes="96px" className="object-cover" />
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
                {distLabel && (
                  <span className="text-[#C8A96B] font-semibold">• {distLabel}</span>
                )}
                {biz.country && (
                  <span className="text-[#C8A96B]">• 🌍 {biz.country}</span>
                )}
              </div>
              {/* A5 — badges honestos: só com confirmação do comerciante/dados reais */}
              {(biz._serviceState === "AVAILABLE" || biz._openState === "OPEN") && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {biz._serviceState === "AVAILABLE" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#C8A96B]/15 border border-[#C8A96B]/30 text-[#C8A96B]">
                      ⚡ Atende hoje
                    </span>
                  )}
                  {biz._openState === "OPEN" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      🟢 Aberto agora
                    </span>
                  )}
                </div>
              )}
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

/**
 * A4.9 — cartão de resultado de PRODUTO: mostra [produto] [preço]
 * [negócio] [cidade] [distância, quando disponível] [Ver produto/Montra].
 * Usa a relação real produto → business (sem duplicar cadastros).
 */
function ProductResultCard({
  hit,
  userLoc,
  onClick,
}: {
  hit: any;
  userLoc: { lat: number; lng: number } | null;
  onClick?: () => void;
}) {
  const b = hit.business;
  const coords = b ? businessCoords(b) : null;
  const d =
    userLoc && coords
      ? distanceKm(userLoc.lat, userLoc.lng, coords.lat, coords.lng)
      : null;
  const distLabel = formatDistance(d);
  const price =
    hit.price !== null && hit.price !== undefined && hit.price !== ""
      ? `€ ${Number(hit.price).toFixed(2).replace(".", ",")}`
      : null;

  return (
    <div className="relative group bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link
        href={`/vitrine/${b.slug}`}
        onClick={onClick}
        className="flex"
      >
      <div className="relative w-24 h-24 m-4 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl">
        {hit.image_url ? (
          <Image src={hit.image_url} alt={hit.name} fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" style={productImgStyle(normalizeProductFraming(hit))} />
        ) : (
          <span>🛍️</span>
        )}
      </div>
      <div className="py-4 pr-24 flex flex-col justify-between min-w-0 flex-1">
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-[#C8A96B] uppercase tracking-widest">
            Produto
          </p>
          <h4 className="font-bold text-white text-sm truncate group-hover:text-[#C8A96B] transition-colors">
            {hit.name}
          </h4>
          <p className="text-[11px] text-slate-400 truncate">
            {b.name} • 📍 {b.city}
            {distLabel && <span className="text-[#C8A96B] font-semibold"> • {distLabel}</span>}
          </p>
          {/* A5 — badges honestos: só com confirmação do comerciante */}
          {(() => {
            const badges: string[] = [];
            if (productAvailabilityState(hit) === "AVAILABLE") badges.push("⚡ Disponível hoje");
            const caps = productCapabilities(hit);
            if (caps.pickup === "AVAILABLE") badges.push("🛍️ Retirada hoje");
            if (caps.delivery === "AVAILABLE") badges.push("🚚 Entrega hoje");
            if (badges.length === 0) return null;
            return (
              <p className="flex flex-wrap gap-1 mt-1">
                {badges.map((bd) => (
                  <span
                    key={bd}
                    className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#C8A96B]/15 border border-[#C8A96B]/30 text-[#C8A96B]"
                  >
                    {bd}
                  </span>
                ))}
              </p>
            );
          })()}
        </div>
        <div className="flex items-center justify-between pt-2">
          {price ? (
            <span className="text-sm font-bold text-[#C8A96B]">{price}</span>
          ) : (
            <span />
          )}
          <span className="text-[10px] font-bold text-[#C8A96B] group-hover:underline">
            Ver produto →
          </span>
        </div>
      </div>
      </Link>
      {/* A6 — guardar produto em coleção (fora do Link: sem nesting inválido) */}
      <div className="absolute top-2 right-2 z-10">
        <SaveToCollection
          itemRef={{ productId: hit.id }}
          label="Guardar"
          loginNext="/explorar"
        />
      </div>
    </div>
  );
}
