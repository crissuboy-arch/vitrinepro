"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

interface BusinessData {
  id: number;
  name: string;
  category: string;
  city: string;
  image: string;
  premium: boolean;
  description: string;
  phone?: string;
  whatsApp?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
}

const mockBusinesses: BusinessData[] = [
  {
    id: 1,
    name: "Bella Estética",
    category: "Beleza e Bem-estar",
    city: "Lisboa",
    image: "https://images.unsplash.com/photo-1570172619644-136d311b71e1?w=400&h=300&fit=crop",
    premium: true,
    description: "Tratamentos faciais, massagens e procedimentos estéticos com tecnologia de ponta.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. da Liberdade, 100",
    rating: 4.9,
    reviewCount: 127,
  },
  {
    id: 2,
    name: "Docura Padaria",
    category: "Alimentação",
    city: "Porto",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    premium: true,
    description: "Pães artesanais, bolos personalizados e quitutes frescos todos os dias.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Rua de Santa Catarina, 50",
    rating: 4.8,
    reviewCount: 89,
  },
  {
    id: 3,
    name: "Studio Fitness",
    category: "Academia",
    city: "Lisboa",
    image: "https://images.unsplash.com/photo-1534438327276-14e5900c3dcc?w=400&h=300&fit=crop",
    premium: false,
    description: "Academia completa com equipamentos modernos e aulas coletivas.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. do Brasil, 500",
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: 4,
    name: "Pet Care Lovers",
    category: "Pet Shop",
    city: "Porto",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    premium: true,
    description: "Pet shop com produtos premium, banho e tosa, e rações importadas.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Rua de Cedofeita, 200",
    rating: 5.0,
    reviewCount: 203,
  },
  {
    id: 5,
    name: "Café Arte",
    category: "Cafeteria",
    city: "Faro",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
    premium: false,
    description: "Café especial torrado na hora, bolos caseiros e ambiente acolhedor.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. de Faro, 300",
    rating: 4.6,
    reviewCount: 78,
  },
  {
    id: 6,
    name: "Lar Decorações",
    category: "Decoração",
    city: "Lisboa",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop",
    premium: true,
    description: "Decoração completa para casa e escritório com peças exclusivas.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. de Roma, 800",
    rating: 4.8,
    reviewCount: 64,
  },
  {
    id: 7,
    name: "Sabor & Arte",
    category: "Restaurante",
    city: "Porto",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    premium: true,
    description: "Restaurante com culinária autoral, ingredientes frescos e ambiente sofisticado.",
    phone: "+351 888 888 888",
    whatsApp: "351888888888",
    address: "Rua de Porto, 750",
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: 8,
    name: "Estilo Feminino",
    category: "Loja de roupas",
    city: "Lisboa",
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop",
    premium: false,
    description: "Moda feminina com peças exclusivas e atendimento personalizado.",
    phone: "+351 777 777 777",
    whatsApp: "351777777777",
    address: "Av. de Casablanca, 400",
    rating: 4.5,
    reviewCount: 91,
  },
  {
    id: 9,
    name: "Limpeza Total",
    category: "Serviços domésticos",
    city: "Faro",
    image: "https://images.unsplash.com/photo-1581578731548-cda95f956d08?w=400&h=300&fit=crop",
    premium: false,
    description: "Serviços de limpeza residencial e comercial com produtos especializados.",
    phone: "+351 666 666 666",
    whatsApp: "351666666666",
    address: "Av. do Algarve, 1200",
    rating: 4.4,
    reviewCount: 45,
  },
  {
    id: 10,
    name: "Spa Zen",
    category: "Beleza e Bem-estar",
    city: "Porto",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    premium: true,
    description: "Espaço de relaxamento com massagens terapêuticas e tratamentos orientais.",
    phone: "+351 555 555 555",
    whatsApp: "351555555555",
    address: "Av. do Brasil, 1500",
    rating: 4.9,
    reviewCount: 178,
  },
  {
    id: 11,
    name: "Dog & Cat Hotel",
    category: "Pet Shop",
    city: "Lisboa",
    image: "https://images.unsplash.com/photo-1601758228041-f3b1c7bf1ded?w=400&h=300&fit=crop",
    premium: false,
    description: "Hotel para pets, creche e daycare com monitoramento 24h.",
    phone: "+351 444 444 444",
    whatsApp: "351444444444",
    address: "Rua dos Pets, 250",
    rating: 4.7,
    reviewCount: 56,
  },
  {
    id: 12,
    name: "Padaria Artesanal",
    category: "Alimentação",
    city: "Faro",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    premium: false,
    description: "Pães integrais, sem glúten e bolos zero açúcar.",
    phone: "+351 333 333 333",
    whatsApp: "351333333333",
    address: "Rua do Pão, 100",
    rating: 4.6,
    reviewCount: 67,
  },
];

const cities = [
  { slug: "lisboa", name: "Lisboa", nameEn: "Lisbon" },
  { slug: "porto", name: "Porto", nameEn: "Porto" },
  { slug: "faro", name: "Faro", nameEn: "Faro" },
];

const categories = [
  { slug: "beleza-e-bem-estar", name: "Beleza e Bem-estar" },
  { slug: "alimentacao", name: "Alimentação" },
  { slug: "academia", name: "Academia" },
  { slug: "pet-shop", name: "Pet Shop" },
  { slug: "cafeteria", name: "Cafeteria" },
  { slug: "decoracao", name: "Decoração" },
  { slug: "restaurante", name: "Restaurante" },
  { slug: "loja-de-roupas", name: "Loja de roupas" },
  { slug: "servicos-domesticos", name: "Serviços domésticos" },
];

function getAllCityCategoryParams() {
  const params = [];
  for (const city of cities) {
    for (const category of categories) {
      params.push({ city: city.slug, category: category.slug });
    }
  }
  return params;
}

export { getAllCityCategoryParams };

interface CityPageProps {
  params: Promise<{ city: string; category: string }>;
}

export default function CityCategoryPage({ params }: CityPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ city: string; category: string } | null>(null);

  if (!resolvedParams) {
    params.then((p) => {
      setResolvedParams(p);
    });
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-[#0F172A]">A carregar...</div>
      </div>
    );
  }

  const { city: citySlug, category: categorySlug } = resolvedParams;
  
  const city = cities.find((c) => c.slug === citySlug);
  const category = categories.find((c) => c.slug === categorySlug);

  if (!city || !category) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-[#0F172A] mb-4">Página não encontrada</h1>
          <Link href="/businesses" className="text-[#C8A96B] hover:underline">
            Ver todos os negócios
          </Link>
        </div>
      </div>
    );
  }

  const filteredBusinesses = useMemo(() => {
    return mockBusinesses.filter(
      (b) => b.city === city.name && b.category === category.name
    );
  }, [city.name, category.name]);

  const seoTitle = `${category.name} em ${city.name} | VitrinePro`;
  const seoDescription = `Encontre as melhores empresas de ${category.name.toLowerCase()} em ${city.name}. ${filteredBusinesses.length} negócios disponíveis com contacto direto via WhatsApp.`;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-display text-[#C8A96B]">
              VitrinePro
            </Link>
            <Link href="/businesses" className="text-[#E5E7EB] hover:text-white transition-colors">
              Ver todos
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#0F172A] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-5xl text-white mb-4">
            {category.name} em {city.name}
          </h1>
          <p className="text-[#E5E7EB] text-lg max-w-2xl">
            Encontre os melhores negócios de {category.name.toLowerCase()} em {city.name}. 
            {filteredBusinesses.length} empresas disponíveis.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#1F2937]">
            <Link href="/" className="hover:text-[#C8A96B]">Início</Link>
            <span>/</span>
            <Link href="/businesses" className="hover:text-[#C8A96B]">Negócios</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-medium">{city.name}</span>
            <span>/</span>
            <span className="text-[#0F172A] font-medium">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {filteredBusinesses.length > 0 ? (
          <>
            <p className="text-[#1F2937] mb-6">
              Showing <strong>{filteredBusinesses.length}</strong> businesses in {city.name} / {category.name}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#C8A96B]/50 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all group"
                >
                  <div className="relative h-48 bg-[#E5E7EB]">
                    <Image
                      src={business.image}
                      alt={business.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {business.premium && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-semibold rounded">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-[#0F172A] mb-1">
                      {business.name}
                    </h3>
                    <p className="text-[#1F2937] text-sm mb-3">{business.city}</p>
                    <p className="text-[#1F2937] text-sm mb-4 line-clamp-2">
                      {business.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[#C8A96B]">★</span>
                        <span className="font-semibold text-[#0F172A] text-sm">{business.rating}</span>
                        <span className="text-[#1F2937] text-sm">({business.reviewCount})</span>
                      </div>
                      {business.whatsApp && (
                        <a
                          href={`https://wa.me/${business.whatsApp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#25D366] font-medium hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">
              Nenhum negócio encontrado
            </h2>
            <p className="text-[#1F2937] mb-6">
              Não há negócios de {category.name} em {city.name} ainda.
            </p>
            <Link
              href="/businesses"
              className="px-6 py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-medium hover:bg-[#D4BB82] transition-colors"
            >
              Ver todos os negócios
            </Link>
          </div>
        )}
      </div>

      {/* SEO Text */}
      <div className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-2xl text-[#0F172A] mb-4">
            {category.name} em {city.name}
          </h2>
          <p className="text-[#1F2937] leading-relaxed">
            Encontre as melhores opções de {category.name.toLowerCase()} em {city.name} na VitrinePro. 
            Мы рекомендуamos apenas negócios verificados com avaliações reais de clientes. 
            Todos os negócios listados permitem contacto direto via WhatsApp para pedir orçamentos ou agendar serviços.
          </p>
        </div>
      </div>

      {/* Footer */}
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