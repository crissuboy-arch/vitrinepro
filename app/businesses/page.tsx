"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../lib/supabase";

interface Business {
  id: number;
  name: string;
  category: string;
  city: string;
  logo?: string;
  cover?: string;
  premium: boolean;
  description: string;
  whatsApp?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
}

const categories = [
  "Todas",
  "Restaurantes",
  "Beleza",
  "Serviços",
  "Construção",
  "Automóvel",
  "Saúde",
  "Lojas",
  "Pet Shop",
  "Cafetaria",
  "Academia",
  "Decoração",
  "Loja de Roupa",
  "Serviço Doméstico",
  "Produtos Digitais",
  "Infoprodutos",
  "Marketing",
  "Serviços Online",
  "Outros",
];

export default function BusinessesPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [realBusinesses, setRealBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            *,
            categories(name, icon),
            cities(name)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        
        if (data) {
          console.log("[DEBUG] Loaded businesses:", data.length);
          setRealBusinesses(data);
        }
      } catch (error) {
        console.error("[DEBUG] Error loading businesses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBusinesses();
  }, [mounted]);

  const displayBusinesses = useMemo(() => {
    return realBusinesses.map((b: any) => ({
      id: b.id,
      name: b.name,
      category: b.categories?.name || "Outros",
      city: b.cities?.name || "",
      logo: b.logo_url || b.categories?.icon || "🏪",
      cover: b.cover_url,
      premium: b.plan === 'pro' || b.plan === 'premium',
      description: b.description,
      whatsApp: b.whatsapp,
      address: b.address || "",
      rating: b.rating_average || 0,
      reviewCount: b.rating_count || 0,
    }));
  }, [realBusinesses]);

  const filteredBusinesses = useMemo(() => {
    let result = [...displayBusinesses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.city.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "Todas") {
      result = result.filter((b) => b.category === selectedCategory);
    }

    return result;
  }, [displayBusinesses, searchQuery, selectedCategory]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-[#0F172A]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-display text-[#C8A96B]">
              VitrinePro
            </Link>
            <Link href="/" className="text-[#E5E7EB] hover:text-white transition-colors">
              Voltar ao inicio
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2937]">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar negócios por nome, categoria ou cidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <p className="text-[#1F2937]">
          <strong>{filteredBusinesses.length}</strong> negócios encontrados
        </p>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {filteredBusinesses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#C8A96B]/50 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all group"
              >
                <div className="relative h-52 bg-gradient-to-br from-[#0F172A] to-[#1F2937] flex items-center justify-center">
                  {business.cover ? (
                    <Image
                      src={business.cover}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{business.logo}</span>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-xs text-[#1F2937] bg-[#E5E7EB] px-2 py-1 rounded-full mb-2 inline-block">
                    {business.category}
                  </span>
                  <h3 className="font-display text-xl text-[#0F172A] mb-1">
                    {business.name}
                  </h3>
                  <p className="text-[#1F2937] text-sm mb-3">{business.city}</p>
                  <div className="flex gap-2">
                    {business.whatsApp && (
                      <a
                        href={`https://wa.me/${business.whatsApp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2.5 bg-[#25D366] text-white text-center rounded-lg font-medium hover:bg-[#20BD5A] transition-colors text-sm"
                      >
                        WhatsApp
                      </a>
                    )}
                    <span className="flex-1 py-2.5 border-2 border-[#0F172A] text-[#0F172A] rounded-lg font-medium text-center text-sm inline-block">
                      Ver perfil
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-[#0F172A] mb-2">
              Nenhum negócio encontrado
            </h3>
            <p className="text-[#1F2937] mb-6">
              Seja o primeiro a cadastrar um negócio!
            </p>
            <Link
              href="/login"
              className="px-6 py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-medium hover:bg-[#D4BB82] transition-colors"
            >
              Cadastrar negócio
            </Link>
          </div>
        )}
      </div>

      <footer className="py-10 bg-[#0F172A] border-t border-[#1F2937]">
        <div className="container mx-auto px-4">
          <div className="text-center text-[#E5E7EB] text-sm">
            <p>© 2025 VitrinePro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}