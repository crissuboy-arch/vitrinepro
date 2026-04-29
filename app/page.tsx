"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/SupabaseAuthContext";
import { supabase } from "./lib/supabase";
import ChatWidget from "./components/ChatWidget";
import { AnimatedBanner } from "./components/ConversionWidgets";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [categories, setCategories] = useState<{ name: string; count: number; icon: string }[]>([]);
  const [cities, setCities] = useState<{ name: string; country: string }[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
      try {
        const [catsRes, citiesRes, bizRes] = await Promise.all([
          supabase.from("categories").select("id, name, icon").eq("is_active", true).order("order_index"),
          supabase.from("cities").select("id, name, country").eq("is_active", true),
          supabase.from("businesses").select(`
            id, name, description, whatsapp,
            categories(name, icon),
            cities(name)
          `).eq("is_published", true).limit(12),
        ]);

        if (catsRes.data) {
          setCategories(catsRes.data.map(c => ({
            name: c.name,
            count: 0,
            icon: c.icon || "📦",
          })));
        }

        if (citiesRes.data) {
          setCities(citiesRes.data);
        }

        if (bizRes.data) {
          setBusinesses(bizRes.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            category: (b.categories as any)?.name || "Outros",
            city: (b.cities as any)?.name || "",
            description: b.description || "",
            logo: (b.categories as any)?.icon || "🏪",
            premium: false,
          })));
        }
      } catch (error) {
        console.error("[DEBUG] Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mounted]);

  // Remove the old mock data arrays
  // const categories = [...] - now loaded from DB
  // const cities = [...] - now loaded from DB  
  // const mockBusinesses = [...] - replaced with businesses state

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = !searchQuery || 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || b.category === selectedCategory;
    const matchesCity = !selectedCity || b.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleSearch = () => {
    window.location.href = `/businesses?q=${encodeURIComponent(searchQuery)}`;
  };

  const handleCadastrarClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!mounted) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[DEBUG] Cadastrar clicked - session:", session?.user?.id);
    
    if (!session?.user) {
      console.log("[DEBUG] No user, going to /login");
      router.push("/login");
      return;
    }
    
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    if (existingBusiness) {
      console.log("[DEBUG] User has business, going to /dashboard");
      router.push("/dashboard");
    } else {
      console.log("[DEBUG] User no business, going to /onboarding");
      router.push("/onboarding");
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? "text-[#C8A96B]" : "text-[#E5E7EB]"}>★</span>
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AnimatedBanner />
      
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937] sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-display text-[#C8A96B]">
              VitrinePro
            </Link>

            {/* Categories Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => { setShowCategories(!showCategories); setShowCities(false); }}
                className="text-[#E5E7EB] hover:text-white transition-colors flex items-center gap-2"
              >
                Categorias
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategories && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-[#E5E7EB] shadow-xl py-2 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/businesses?category=${cat.name}`}
                      className="flex items-center justify-between px-4 py-2 text-[#1F2937] hover:bg-[#FAF7F2]"
                    >
                      <span>{cat.icon} {cat.name}</span>
                      <span className="text-xs text-[#1F2937]">{cat.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Cities Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => { setShowCities(!showCities); setShowCategories(false); }}
                className="text-[#E5E7EB] hover:text-white transition-colors flex items-center gap-2"
              >
                Cidades
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCities && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-xl py-2 z-50">
                  <div className="px-4 py-1 text-xs text-[#1F2937] border-b border-[#E5E7EB] mb-1">Portugal</div>
                  {cities.filter(c => c.country === "Portugal").map((city) => (
                    <Link
                      key={city.name}
                      href={`/businesses?city=${city.name}`}
                      className="flex items-center px-4 py-2 text-[#1F2937] hover:bg-[#FAF7F2]"
                    >
                      📍 {city.name}
                    </Link>
                  ))}
                  <div className="px-4 py-1 text-xs text-[#1F2937] border-t border-[#E5E7EB] mt-1 pt-1">Brasil</div>
                  {cities.filter(c => c.country === "Brasil").map((city) => (
                    <Link
                      key={city.name}
                      href={`/businesses?city=${city.name}`}
                      className="flex items-center px-4 py-2 text-[#1F2937] hover:bg-[#FAF7F2]"
                    >
                      📍 {city.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[#E5E7EB] hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/login?mode=signup"
                className="px-4 py-2 bg-[#C8A96B] text-[#0F172A] rounded-lg font-medium hover:bg-[#D4BB82] transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Search */}
      <div className="bg-[#0F172A] py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-5xl text-white text-center mb-4">
            Cadastre seu negócio grátis e comece a aparecer para novos clientes hoje mesmo
          </h1>
          <p className="text-[#E5E7EB] text-center text-lg mb-8 max-w-2xl mx-auto">
            Sem site. Sem complicação. Em poucos minutos o seu negócio fica online, visível e pronto para receber contactos.
          </p>
          
          {/* Search/CTA Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Pesquisar negócios, serviços..."
                className="w-full px-6 py-4 bg-white rounded-xl text-[#0F172A] text-lg focus:outline-none"
              />
              <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#0F172A] text-white rounded-lg">
                Buscar
              </button>
            </div>
          </div>
          
          {/* Hero CTA Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={handleCadastrarClick}
              className="px-8 py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-semibold hover:bg-[#D4BB82] transition-colors"
            >
              Cadastrar meu negócio grátis
            </button>
            <Link href="/businesses" className="px-8 py-3 bg-white text-[#0F172A] rounded-lg font-semibold hover:bg-[#E5E7EB] transition-colors">
              Explorar negócios
            </Link>
          </div>

           {/* Popular Cities */}
           <div className="flex flex-wrap justify-center gap-4 mt-8">
             <span className="text-[#E5E7EB]">Cidades:</span>
             {cities.filter(c => c.country === "Portugal").slice(0, 6).map((city) => (
               <Link
                 key={city.name}
                 href={`/businesses?city=${city.name}`}
                 className="text-[#E5E7EB] hover:text-[#C8A96B] transition-colors"
               >
                 {city.name}
               </Link>
             ))}
           </div>
        </div>
      </div>

       {/* Categories Grid */}
       <div className="container mx-auto px-4 py-12">
         <h2 className="font-display text-2xl text-[#0F172A] mb-6">Categorias</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
           {categories.map((cat) => (
             <Link
               key={cat.name}
               href={`/businesses?category=${cat.name}`}
               className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#C8A96B] hover:shadow-lg transition-all text-center group"
             >
               <div className="text-3xl mb-2">{cat.icon}</div>
               <div className="text-sm font-medium text-[#0F172A]">{cat.name}</div>
             </Link>
           ))}
         </div>
       </div>

       {/* Featured Businesses */}
       <div className="bg-white py-12">
         <div className="container mx-auto px-4">
           <div className="flex items-center justify-between mb-6">
             <h2 className="font-display text-2xl text-[#0F172A]">
               {selectedCategory || selectedCity ? "Resultados" : "Negócios em destaque"}
             </h2>
             <Link href="/businesses" className="text-[#C8A96B] font-medium hover:underline">
               Ver todos →
             </Link>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {filteredBusinesses.slice(0, 8).map((business) => (
               <Link
                 key={business.id}
                 href={`/business/${business.id}`}
                 className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#C8A96B]/50 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all group"
               >
                 <div className="relative h-40 bg-gradient-to-br from-[#0F172A] to-[#1F2937] flex items-center justify-center">
                   <span className="text-5xl">{business.logo}</span>
                   {business.premium && (
                     <span className="absolute top-3 right-3 px-2 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-semibold rounded">
                       Premium
                     </span>
                   )}
                 </div>
                 <div className="p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-xs text-[#1F2937] bg-[#E5E7EB] px-2 py-1 rounded-full">
                       {business.category}
                     </span>
                   </div>
                   <h3 className="font-display text-lg text-[#0F172A] mb-1">{business.name}</h3>
                   <p className="text-[#1F2937] text-sm mb-2">📍 {business.city}</p>
                 </div>
               </Link>
             ))}
           </div>
          
          {(searchQuery || selectedCategory || selectedCity) && filteredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#1F2937] text-lg mb-4">Nenhum negócio encontrado</p>
              <Link href="/login" className="text-[#C8A96B] font-medium hover:underline">
                Cadastre seu negócio →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Trust Stats */}
      <div className="bg-[#0F172A] py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-display text-[#C8A96B] mb-1">2.500+</div>
              <div className="text-[#E5E7EB]">Negócios ativos</div>
            </div>
            <div>
              <div className="text-3xl font-display text-[#C8A96B] mb-1">15.000+</div>
              <div className="text-[#E5E7EB]">Clientes/mês</div>
            </div>
            <div>
              <div className="text-3xl font-display text-[#C8A96B] mb-1">4.8</div>
              <div className="text-[#E5E7EB]">Nota média</div>
            </div>
            <div>
              <div className="text-3xl font-display text-[#C8A96B] mb-1">50.000+</div>
              <div className="text-[#E5E7EB]">Buscas/dia</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl text-[#0F172A] text-center mb-12">
            Como funciona
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="font-display text-xl text-[#0F172A] mb-2">1. Cadastre seu negócio</h3>
              <p className="text-[#1F2937]">Preencha os dados da sua empresa em poucos minutos</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="font-display text-xl text-[#0F172A] mb-2">2. Apareça online</h3>
              <p className="text-[#1F2937]">Seu negócio fica visível para milhares de clientes</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="font-display text-xl text-[#0F172A] mb-2">3. Receba contactos</h3>
              <p className="text-[#1F2937]">Clientes encontram você via WhatsApp e direct</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 bg-[#0F172A] border-t border-[#1F2937]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-2xl font-display text-[#C8A96B]">VitrinePro</span>
            <div className="text-center text-[#E5E7EB] text-sm">
              © 2025 VitrinePro. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}