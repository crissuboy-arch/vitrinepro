"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Business {
  id: number;
  name: string;
  category: string;
  city: string;
  logo?: string;
  cover?: string;
  gallery?: string[];
  premium: boolean;
  description: string;
  phone?: string;
  whatsApp?: string;
  instagram?: string;
  website?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  email?: string;
  services?: string[];
  reviews?: Review[];
}

interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

const mockBusinesses: Record<number, Business> = {
  1: {
    id: 1,
    name: "Bella Estética",
    category: "Beleza e Bem-estar",
    city: "Lisboa",
    logo: "💅",
    cover: "https://images.unsplash.com/photo-1570172619644-136d311b71e1?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1570172619644-136d311b71e1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519415518136-90a1d1aa500e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138dadb6b22d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606813907291-d87efa1e62e2?w=800&h=600&fit=crop",
    ],
    premium: true,
    description: "Tratamentos faciais, massagens e procedimentos estéticos com tecnologia de ponta. Nossa equipe altamente qualificada oferece os melhores serviços de beleza e bem-estar em Lisboa. Utilizamos produtos premium e equipamentos de última geração para garantir resultados excepcionais.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    instagram: "https://instagram.com/bellaestetica",
    address: "Av. da Liberdade, 100, 1250-096 Lisboa",
    rating: 4.9,
    reviewCount: 127,
    email: "contact@bellaestetica.pt",
    website: "https://bellaestetica.pt",
    services: ["Tratamentos Faciais", "Massagens", "Depilação", "Tratamentos Anticelulite"],
    reviews: [
      { id: 1, author: "Maria Silva", rating: 5, text: "Excelente atendimento! Profesinais muito qualificados.", date: "2025-03-15" },
      { id: 2, author: "João Santos", rating: 5, text: "Melhor spa de Lisboa. Recomendo!", date: "2025-03-10" },
      { id: 3, author: "Ana Costa", rating: 4, text: "Ótimos tratamentos, ambiente agradável.", date: "2025-02-28" },
    ],
  },
  2: {
    id: 2,
    name: "Docura Padaria",
    category: "Alimentação",
    city: "Porto",
    logo: "🥐",
    cover: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555507036-ab1f40384385?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509365465982-56a7dd53dceb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558303136-40c068bac7c3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=600&fit=crop",
    ],
    premium: true,
    description: "Pães artesanais, bolos personalizados e quitutes frescos todos os dias. Nossa padaria utiliza ingredientes biológicos e técnicas tradicionais para criar productos únicos.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    instagram: "https://instagram.com/docurapadaria",
    address: "Rua de Santa Catarina, 50, 4000-123 Porto",
    rating: 4.8,
    reviewCount: 89,
    email: "hello@docurapadaria.pt",
    website: "https://docurapadaria.pt",
    services: ["Pães Artesanais", "Bolos Personalizados", "Pastéis", "Coffe Break"],
  },
  3: {
    id: 3,
    name: "Studio Fitness",
    category: "Academia",
    city: "Lisboa",
    logo: "💪",
    cover: "https://images.unsplash.com/photo-1534438327276-14e5900c3dcc?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1534438327276-14e5900c3dcc?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1574680170966-d5d31c2819e9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dffaaca1e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571909823203-4a0803615f76?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583454116168-87b0d07b2a54?w=800&h=600&fit=crop",
    ],
    premium: false,
    description: "Academia completa com equipamentos modernos e aulas coletivas. Espaço moderno com infraestrutura de ponta para você alcançar seus objetivos fitness.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. do Brasil, 500, 1700-048 Lisboa",
    rating: 4.7,
    reviewCount: 156,
    email: "info@studiofitness.pt",
    services: ["Musculação", "Aulas Coletivas", "Personal Trainer", "Avaliação Física"],
  },
  4: {
    id: 4,
    name: "Pet Care Lovers",
    category: "Pet Shop",
    city: "Porto",
    logo: "🐕",
    cover: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1601758228041-f3b1c7bf1ded?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1516734212186-a967f81bfe35?w=800&h=600&fit=crop",
    ],
    premium: true,
    description: "Pet shop com produtos premium, banho e tosa, e rações importadas.Seu pet merece o melhor cuidado. Oferecemos serviços completos para animais de estimação.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Rua de Cedofeita, 200, 4050-161 Porto",
    rating: 5.0,
    reviewCount: 203,
    email: "contact@petcarelovers.pt",
    website: "https://petcarelovers.pt",
    services: ["Banho e Tosa", "Rações Premium", "Acessórios", "Creche Pet"],
  },
  5: {
    id: 5,
    name: "Café Arte",
    category: "Cafeteria",
    city: "Faro",
    logo: "☕",
    cover: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd08ee?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1498804103079-a6351b0507d0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop",
    ],
    premium: false,
    description: "Café especial torrado na hora, bolos caseiros e ambiente acolhedor. Um espaço perfeito para reuniões, trabalho ou simplemente disfrutar de um bom café.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. de Faro, 300, 8000-123 Faro",
    rating: 4.6,
    reviewCount: 78,
    email: "ola@cafearte.pt",
    services: ["Café Special", "Bolos Caseiros", "Sanduíches", "Almoço Leve"],
  },
  6: {
    id: 6,
    name: "Lar Decorações",
    category: "Decoração",
    city: "Lisboa",
    logo: "🛋️",
    cover: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045a788?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1615529182904-14819c2a76ae?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558997519-efa1b9e5a9b3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556228453-efd6c1cc04f2?w=800&h=600&fit=crop",
    ],
    premium: true,
    description: "Decoração completa para casa e escritório com peças exclusivas. Transformamos espaços com design único e peças selecionadas.",
    phone: "+351 999 999 999",
    whatsApp: "351999999999",
    address: "Av. de Roma, 800, 1000-001 Lisboa",
    rating: 4.8,
    reviewCount: 64,
    email: "info@lardecoracoes.pt",
    website: "https://lardecoracoes.pt",
    services: ["Decoração Residencial", "Decoração Corporativa", "Projectos", "Consultoria"],
  },
};

function generateStars(rating: number) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={i} className="text-[#C8A96B]">★</span>);
  }
  if (hasHalf) {
    stars.push(<span key="half" className="text-[#C8A96B]">★</span>);
  }
  return stars;
}

export default function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [realBusiness, setRealBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    const loadBusiness = async () => {
      const p = await params;
      const businessId = p.id;
      console.log("[DEBUG] Loading business ID:", businessId);
      
      try {
        const { data: business, error } = await supabase
          .from('businesses')
          .select(`
            *,
            categories(name),
            cities(name)
          `)
          .eq('id', businessId)
          .eq('is_published', true)
          .single();
        
        if (business) {
          console.log("[DEBUG] Found business:", business.name);
          
          const { data: images } = await supabase
            .from('business_images')
            .select('url, type')
            .eq('business_id', businessId)
            .order('order_index');
          
          const logoImg = images?.find(i => i.type === 'logo');
          const coverImg = images?.find(i => i.type === 'cover');
          const galleryImgs = images?.filter(i => i.type === 'gallery') || [];
          
          const businessData = {
            id: business.id,
            name: business.name,
            category: business.categories?.name || '',
            city: business.cities?.name || '',
            logo: logoImg?.url || business.logo_url || '',
            cover: coverImg?.url || business.cover_url || '',
            gallery: galleryImgs.map(i => i.url),
            description: business.description || '',
            whatsApp: business.whatsapp || '',
            phone: business.phone || '',
            email: business.email || '',
            instagram: business.instagram || '',
            website: business.website || '',
            address: business.address || '',
            rating: business.rating_average || 0,
            reviewCount: business.rating_count || 0,
            premium: business.plan === 'pro' || business.plan === 'premium',
          };
          
          setRealBusiness(businessData);
          
          // Load approved reviews
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
          
          if (reviewData) {
            setReviews(reviewData.map(r => ({
              id: r.id,
              author: r.author_name,
              rating: r.rating,
              text: r.comment,
              date: new Date(r.created_at).toLocaleDateString('pt-PT'),
            })));
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error loading business:", error);
      }
      setLoaded(true);
    };
    
    loadBusiness();
  }, [mounted, params]);
  
  if (!mounted || !loaded) {
    return <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">Loading...</div>;
  }
  
  // If real business exists, use it; otherwise show empty state
  if (realBusiness) {
    return <RealBusinessContent business={realBusiness} reviews={reviews} />;
  }
  
  // No business found - show empty state
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-display text-[#0F172A] mb-4">Negócio não encontrado</h1>
        <Link href="/businesses" className="text-[#C8A96B] hover:underline">
          Ver negócios →
        </Link>
      </div>
    </div>
  );
}

function RealBusinessContent({ business, reviews = [] }: { business: Business; reviews?: Review[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const googleMapsUrl = business.address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.city + ", Portugal")}`;

  const images = [business.cover, ...(business.gallery || [])].filter(Boolean);
  const hasCarousel = images.length > 1;

  const nextSlide = () => setCurrentSlide((currentSlide + 1) % images.length);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + images.length) % images.length);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-display text-[#C8A96B]">
              VitrinePro
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/businesses" className="text-[#E5E7EB] hover:text-white transition-colors">
                Ver todos
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Carousel / Hero Image */}
      <div className="relative h-72 md:h-96 bg-[#E5E7EB]">
        {images.length > 0 && images[currentSlide] ? (
          <>
            <Image
              src={images[currentSlide] || ""}
              alt={`${business.name} - imagem ${currentSlide + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 via-transparent to-transparent" />
            
            {/* Logo overlay */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              {business.logo && (
                business.logo.startsWith('http') ? (
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                    <Image src={business.logo} alt="Logo" width={64} height={64} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-4xl shadow-lg">
                    {business.logo}
                  </div>
                )
              )}
            </div>
            
            {/* Carousel controls */}
            {hasCarousel && (
              <>
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                  ←
                </button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                  →
                </button>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i === currentSlide ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1F2937]">
            {business.logo && business.logo.startsWith('http') ? (
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                <Image src={business.logo} alt="Logo" width={96} height={96} className="object-cover" />
              </div>
            ) : (
              <span className="text-6xl">{business.logo || "🏪"}</span>
            )}
          </div>
        )}
        {business.premium && (
          <span className="absolute top-4 right-4 px-4 py-1.5 bg-[#C8A96B] text-[#0F172A] text-sm font-semibold rounded-md">
            Premium
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            {/* Title & Meta */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-[#1F2937] bg-[#E5E7EB] px-3 py-1 rounded-full">
                  {business.category}
                </span>
                <span className="text-xs text-[#1F2937]">📍 {business.city}</span>
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl text-[#0F172A] mb-4">
                {business.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {generateStars(business.rating || 0)}
                  <span className="ml-2 font-semibold text-[#0F172A]">{business.rating}</span>
                  <span className="text-[#1F2937] text-sm">({business.reviewCount} avaliações)</span>
                </div>
              </div>

              <p className="text-[#1F2937] leading-relaxed mb-6">
                {business.description}
              </p>

              {/* Services */}
              {business.services && business.services.length > 0 && (
                <div className="border-t border-[#E5E7EB] pt-6">
                  <h3 className="font-semibold text-[#0F172A] mb-4">Serviços oferecidos</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service, index) => (
                      <span key={index} className="px-4 py-2 bg-[#FAF7F2] text-[#1F2937] rounded-lg text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Address & Map */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8">
              <h3 className="font-semibold text-[#0F172A] mb-4">Localização</h3>
              {business.address && (
                <p className="text-[#1F2937] mb-4 flex items-center gap-2">
                  <span>📍</span>
                  {business.address}
                </p>
              )}
              
              {/* Embedded Map */}
              <div className="bg-[#E5E7EB] rounded-xl h-64 md:h-80 overflow-hidden relative">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(business.address || business.city + ", Portugal")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>
              
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-[#0F172A] text-[#0F172A] rounded-lg font-medium hover:bg-[#0F172A] hover:text-white transition-colors"
              >
                Ver no Google Maps
              </a>
            </div>

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mt-6">
                <h3 className="font-display text-xl text-[#0F172A] mb-6">
                  Avaliações ({business.reviewCount || reviews.length})
                </h3>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-[#E5E7EB] pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#0F172A]">{review.author}</span>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <span key={star} className={star <= review.rating ? "text-[#C8A96B]" : "text-[#E5E7EB]"}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[#1F2937] text-sm">{review.text}</p>
                      <span className="text-xs text-[#1F2937]">{review.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 sticky top-24">
              <h3 className="font-semibold text-[#0F172A] mb-4">Contactar {business.name}</h3>
              
              {/* WhatsApp - Primary CTA */}
              {business.whatsApp && (
                <a
                  href={`https://wa.me/${business.whatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] text-white rounded-lg font-semibold text-lg hover:bg-[#20BD5A] transition-colors mb-3"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.572.13-.756.149-.174.297-.347.446-.521.151-.174.198-.298.297-.496.099-.198.05-.371-.025-.52-.075-.149-.66-1.43-.9-1.957-.239-.527-.478-.545-.66-.558-.149-.015-.322-.024-.492-.024-.17 0-.471.074-.717.371-.245.297-.836.99-.836 1.712 0 .722.836 1.958 1.958 2.096.37.1.721.149 1.025.173.473.037.905.03 1.274-.02.297-.04.69-.173.99-.371.099-.074.571-.347.648-.695.075-.348.075-.647.05-.723-.074-.149-.272-.347-.446-.521z"/>
                  </svg>
                  WhatsApp
                </a>
              )}

              {/* Phone Call */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#0F172A] text-white rounded-lg font-semibold hover:bg-[#1F2937] transition-colors mb-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Ligar
                </a>
              )}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-[#0F172A] text-[#0F172A] rounded-lg font-semibold hover:bg-[#0F172A] hover:text-white transition-colors mb-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              )}

              {/* Instagram */}
              {business.instagram && (
                <a
                  href={business.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mb-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              )}

              {/* Contact Info */}
              <div className="border-t border-[#E5E7EB] pt-4 mt-4">
                {business.phone && (
                  <p className="text-[#1F2937] text-sm mb-2 flex items-center gap-2">
                    <span>📞</span>
                    {business.phone}
                  </p>
                )}
                {business.email && (
                  <p className="text-[#1F2937] text-sm mb-2 flex items-center gap-2">
                    <span>✉️</span>
                    {business.email}
                  </p>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C8A96B] text-sm hover:underline flex items-center gap-2"
                  >
                    <span>🌐</span>
                    {business.website}
                  </a>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mt-6">
              <h4 className="text-[#0F172A] mb-3">Partilhar</h4>
              <div className="flex gap-3">
                <button className="flex-1 py-2 bg-[#E5E7EB] text-[#1F2937] rounded-lg text-sm hover:bg-[#C8A96B] hover:text-[#0F172A] transition-colors">
                  Facebook
                </button>
                <button className="flex-1 py-2 bg-[#E5E7EB] text-[#1F2937] rounded-lg text-sm hover:bg-[#C8A96B] hover:text-[#0F172A] transition-colors">
                  WhatsApp
                </button>
                <button className="flex-1 py-2 bg-[#E5E7EB] text-[#1F2937] rounded-lg text-sm hover:bg-[#C8A96B] hover:text-[#0F172A] transition-colors">
                  Copiar link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 bg-[#0F172A] border-t border-[#1F2937] mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-[#E5E7EB] text-sm">
            <p>© 2025 VitrinePro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}