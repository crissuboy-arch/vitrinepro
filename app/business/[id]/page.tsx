/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Business {
  id: string;
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
  linkedin?: string;
  website?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  email?: string;
  services?: string[];
}

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

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
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<span key={`e${i}`} className="text-[#E5E7EB]">★</span>);
  }
  return stars;
}

export default function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const load = async () => {
      const { id: businessId } = await params;

      try {
        const { data } = await supabase
          .from("businesses")
          .select("*, categories(name), cities(name)")
          .eq("id", businessId)
          .eq("published", true)
          .single();

        if (data) {
          const { data: images } = await supabase
            .from("business_images")
            .select("url, type")
            .eq("business_id", businessId)
            .order("order_index");

          const logoImg = images?.find((i) => i.type === "logo");
          const coverImg = images?.find((i) => i.type === "cover");
          const galleryImgs = (images?.filter((i) => i.type === "gallery") || []).slice(0, 10);

          setBusiness({
            id: data.id,
            name: data.name,
            category: (data.categories as any)?.name || data.category || "",
            city: (data.cities as any)?.name || data.city || "",
            logo: logoImg?.url || data.logo_url || "",
            cover: coverImg?.url || data.cover_url || "",
            gallery: galleryImgs.map((i: any) => i.url),
            description: data.description || "",
            whatsApp: data.whatsapp || "",
            phone: data.phone || "",
            email: data.email || "",
            instagram: data.instagram || "",
            linkedin: data.linkedin || "",
            website: data.website || "",
            address: data.address || "",
            rating: data.rating_average || 0,
            reviewCount: data.rating_count || 0,
            premium: data.plan === "pro" || data.plan === "premium",
          });

          const { data: reviewData } = await supabase
            .from("reviews")
            .select("*")
            .eq("business_id", businessId)
            .eq("is_approved", true)
            .order("created_at", { ascending: false });

          if (reviewData) {
            setReviews(
              reviewData.map((r: any) => ({
                id: r.id,
                author: r.author_name,
                rating: r.rating,
                text: r.comment,
                date: new Date(r.created_at).toLocaleDateString("pt-PT"),
              }))
            );
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoaded(true);
    };

    load();
  }, [mounted, params]);

  if (!mounted || !loaded) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-pulse text-[#C8A96B] text-lg font-display">VitrinePro</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display text-[#0F172A] mb-4">Negócio não encontrado</h1>
          <Link href="/explorar" className="text-[#C8A96B] hover:underline">Ver negócios →</Link>
        </div>
      </div>
    );
  }

  return <BusinessMinisite business={business} reviews={reviews} />;
}

function BusinessMinisite({ business, reviews }: { business: Business; reviews: Review[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [shareMsg, setShareMsg] = useState("Copiar link");

  const images = [business.cover, ...(business.gallery || [])].filter(Boolean) as string[];
  const hasCarousel = images.length > 1;

  const nextSlide = () => setCurrentSlide((s) => (s + 1) % images.length);
  const prevSlide = () => setCurrentSlide((s) => (s - 1 + images.length) % images.length);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    business.address || business.city + ", Portugal"
  )}`;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareMsg("Copiado!");
    setTimeout(() => setShareMsg("Copiar link"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/explorar" className="text-[#E5E7EB] hover:text-white text-sm transition-colors">
            ← Ver todos os negócios
          </Link>
        </div>
      </header>

      {/* Hero / Carousel */}
      <div className="relative h-72 md:h-[420px] bg-[#1F2937]">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentSlide]}
              alt={`${business.name} - foto ${currentSlide + 1}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-transparent to-transparent" />

            {/* Logo badge */}
            <div className="absolute bottom-4 left-4 flex items-end gap-3">
              {business.logo && (
                business.logo.startsWith("http") ? (
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-2 border-white">
                    <Image src={business.logo} alt="Logo" width={80} height={80} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-xl">
                    {business.logo}
                  </div>
                )
              )}
              <div className="mb-1">
                <h1 className="text-white font-display text-2xl md:text-3xl drop-shadow">{business.name}</h1>
                <p className="text-white/80 text-sm">{business.category} · {business.city}</p>
              </div>
            </div>

            {/* Carousel controls */}
            {hasCarousel && (
              <>
                <button onClick={prevSlide} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors text-[#0F172A] font-bold">‹</button>
                <button onClick={nextSlide} aria-label="Próxima" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors text-[#0F172A] font-bold">›</button>
                <div className="absolute bottom-4 right-4 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-white scale-110" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#1F2937]">
            <div className="text-center">
              <div className="text-6xl mb-3">{business.logo || "🏪"}</div>
              <h1 className="text-white font-display text-3xl">{business.name}</h1>
            </div>
          </div>
        )}

        {business.premium && (
          <span className="absolute top-4 right-4 px-3 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-full uppercase tracking-wide">
            Premium
          </span>
        )}
      </div>

      {/* Photo strip (thumbnail row) */}
      {images.length > 1 && (
        <div className="bg-[#0F172A] px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {images.slice(0, 10).map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentSlide ? "border-[#C8A96B]" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <Image src={img} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xs bg-[#FAF7F2] text-[#0F172A] px-3 py-1 rounded-full border border-[#E5E7EB]">{business.category}</span>
                <span className="text-xs text-[#1F2937] flex items-center gap-1">📍 {business.city}</span>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-0.5">{generateStars(business.rating || 0)}</div>
                <span className="font-semibold text-[#0F172A]">{business.rating?.toFixed(1)}</span>
                <span className="text-[#1F2937] text-sm">({business.reviewCount} avaliações)</span>
              </div>

              <p className="text-[#1F2937] leading-relaxed">{business.description}</p>

              {/* Services */}
              {business.services && business.services.length > 0 && (
                <div className="border-t border-[#E5E7EB] pt-5 mt-5">
                  <h3 className="font-semibold text-[#0F172A] mb-3">Serviços</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#FAF7F2] text-[#1F2937] rounded-lg text-sm border border-[#E5E7EB]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8">
              <h3 className="font-semibold text-[#0F172A] mb-4">Localização</h3>
              {business.address && (
                <p className="text-[#1F2937] mb-4 flex items-center gap-2 text-sm">
                  <span>📍</span>{business.address}
                </p>
              )}
              <div className="rounded-xl overflow-hidden h-64 md:h-80 relative bg-[#E5E7EB]">
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
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-[#0F172A] text-[#0F172A] rounded-xl font-medium hover:bg-[#0F172A] hover:text-white transition-colors text-sm"
              >
                Abrir no Google Maps
              </a>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8">
              <h3 className="font-display text-xl text-[#0F172A] mb-6">
                Avaliações {reviews.length > 0 && `(${business.reviewCount || reviews.length})`}
              </h3>

              {reviews.length === 0 ? (
                <p className="text-[#1F2937] text-center py-6">Ainda não há avaliações.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-[#E5E7EB] pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#0F172A]">{r.author}</span>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className={s <= r.rating ? "text-[#C8A96B] text-sm" : "text-[#E5E7EB] text-sm"}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.text && <p className="text-[#1F2937] text-sm leading-relaxed">{r.text}</p>}
                      <span className="text-xs text-[#9CA3AF] mt-1 block">{r.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sticky top-6 space-y-3">
              <h3 className="font-semibold text-[#0F172A] text-lg mb-1">Contactar</h3>

              {/* WhatsApp */}
              {business.whatsApp && (
                <a
                  href={`https://wa.me/${business.whatsApp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BD5A] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.572.13-.756.149-.174.297-.347.446-.521.151-.174.198-.298.297-.496.099-.198.05-.371-.025-.52-.075-.149-.66-1.43-.9-1.957-.239-.527-.478-.545-.66-.558-.149-.015-.322-.024-.492-.024-.17 0-.471.074-.717.371-.245.297-.836.99-.836 1.712 0 .722.836 1.958 1.958 2.096.37.1.721.149 1.025.173.473.037.905.03 1.274-.02.297-.04.69-.173.99-.371.099-.074.571-.347.648-.695.075-.348.075-.647.05-.723-.074-.149-.272-.347-.446-.521z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L0 24l6.335-1.523A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.897 0-3.677-.502-5.215-1.381l-.374-.216-3.876.932.976-3.762-.239-.387A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
              )}

              {/* Phone */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#0F172A] text-white rounded-xl font-semibold hover:bg-[#1F2937] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Ligar
                </a>
              )}

              {/* Instagram */}
              {business.instagram && (
                <a
                  href={business.instagram.startsWith("http") ? business.instagram : `https://instagram.com/${business.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              )}

              {/* LinkedIn */}
              {business.linkedin && (
                <a
                  href={business.linkedin.startsWith("http") ? business.linkedin : `https://linkedin.com/company/${business.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#0A66C2] text-white rounded-xl font-semibold hover:bg-[#0958A8] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-white border-2 border-[#0F172A] text-[#0F172A] rounded-xl font-semibold hover:bg-[#0F172A] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              )}

              {/* Contact info */}
              {(business.phone || business.email) && (
                <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
                  {business.phone && (
                    <p className="text-[#1F2937] text-sm flex items-center gap-2">
                      <span>📞</span>{business.phone}
                    </p>
                  )}
                  {business.email && (
                    <p className="text-[#1F2937] text-sm flex items-center gap-2 break-all">
                      <span>✉️</span>{business.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Share */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mt-4">
              <h4 className="text-[#0F172A] font-medium mb-3 text-sm">Partilhar este negócio</h4>
              <div className="flex gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-[#1877F2] text-white rounded-lg text-xs text-center font-medium hover:opacity-90 transition-opacity"
                >
                  Facebook
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(business.name + " - " + (typeof window !== "undefined" ? window.location.href : ""))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-[#25D366] text-white rounded-lg text-xs text-center font-medium hover:opacity-90 transition-opacity"
                >
                  WhatsApp
                </a>
                <button
                  onClick={copyLink}
                  className="flex-1 py-2 bg-[#E5E7EB] text-[#0F172A] rounded-lg text-xs text-center font-medium hover:bg-[#C8A96B] transition-colors"
                >
                  {shareMsg}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#0F172A] border-t border-[#1F2937] mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-[#E5E7EB] text-sm">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain bg-transparent mb-2" />
          </Link>
          <p className="mt-2 text-xs text-[#9CA3AF]">© 2025 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
