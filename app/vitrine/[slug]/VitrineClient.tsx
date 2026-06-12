/* eslint-disable */
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";
// Floating chat widget — lazy-loaded (not needed for first paint).
const BusinessChatWidget = dynamic(() => import("../../components/BusinessChatWidget"), { ssr: false });
import AutomationPopup from "../../components/AutomationPopup";
import { getCommunityByCountry } from "@/lib/communities";
import { trackVitrineView, trackWhatsAppClick, trackPhoneClick } from "@/app/lib/analytics";
import { pixelContact } from "@/app/lib/meta-pixel";
import SocialBar from "../../components/SocialBar";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Business {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  city: string;
  country?: string;
  logo?: string;
  cover?: string;
  cover_gradient?: string;
  gallery?: string[];
  premium: boolean;
  plan?: string;
  description: string;
  phone?: string;
  whatsApp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  email?: string;
  slug: string;
  opening_hours?: OpeningHour[];
  published?: boolean;
  is_published?: boolean;
  owner_origin_country?: string;
  owner_name?: string;
  owner_photo?: string;
  owner_bio?: string;
  like_count?: number;
  favorite_count?: number;
  share_count?: number;
  view_count?: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
}

interface Testimonial {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

// -------------------------------------------------------------
// CLIENT-SIDE FALLBACK DATA FOR THE "/vitrine/exemplo" SHOWCASE
// -------------------------------------------------------------
const mockExampleBusiness: Business = {
  id: "exemplo-id",
  name: "Estúdio Ouro & Co.",
  category: "Beleza e Bem-estar",
  city: "Lisboa",
  logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
  cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800&h=600&fit=crop"
  ],
  premium: true,
  description: "O Estúdio Ouro & Co. é um espaço exclusivo dedicado ao autocuidado, beleza e bem-estar. Oferecemos procedimentos de estética facial, massagens relaxantes, manicure e cortes de cabelo personalizados. Nossa missão é proporcionar uma experiência luxuosa e revigorante com profissionais altamente capacitados no coração de Lisboa.",
  phone: "+351 999 999 999",
  whatsApp: "351999999999",
  instagram: "estudioouro.co",
  facebook: "estudioouro.co",
  tiktok: "estudioouro.co",
  youtube: "estudioouro.co",
  linkedin: "estudioouro.co",
  website: "https://estudioouro.pt",
  address: "Avenida da Liberdade 123, 1250-001 Lisboa, Portugal",
  rating: 4.9,
  reviewCount: 3,
  email: "contacto@estudioouro.pt",
  slug: "exemplo",
  opening_hours: [
    { day: "Segunda-feira", open: "09:00", close: "19:00", closed: false },
    { day: "Terça-feira", open: "09:00", close: "19:00", closed: false },
    { day: "Quarta-feira", open: "09:00", close: "19:00", closed: false },
    { day: "Quinta-feira", open: "09:00", close: "19:00", closed: false },
    { day: "Sexta-feira", open: "09:00", close: "19:00", closed: false },
    { day: "Sábado", open: "09:00", close: "16:00", closed: false },
    { day: "Domingo", open: "00:00", close: "00:00", closed: true }
  ],
  published: true,
  is_published: true
};

const mockExampleProducts: Product[] = [
  {
    id: "p1",
    name: "Tratamento Facial Premium",
    description: "Limpeza de pele profunda, esfoliação com micro-correntes, máscara de argila de ouro e massagem drenante facial.",
    price: 79.00,
    image_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=300&fit=crop"
  },
  {
    id: "p2",
    name: "Corte & Barba Real",
    description: "Corte de cabelo estilizado e barba completa feita com navalha, toalhas quentes aromáticas e massagem facial capilar.",
    price: 35.00,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop"
  },
  {
    id: "p3",
    name: "Massagem Relaxante de Ouro",
    description: "Sessão completa de massagem corporal relaxante utilizando óleos essenciais aquecidos e pedras vulcânicas.",
    price: 60.00,
    image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop"
  }
];

const mockExampleTestimonials: Testimonial[] = [
  {
    id: "t1",
    author: "Maria Silva",
    rating: 5,
    text: "O atendimento do Estúdio Ouro é simplesmente divino! Fiquei maravilhada com o tratamento facial, a minha pele está radiante.",
    date: "01/06/2026"
  },
  {
    id: "t2",
    author: "João Santos",
    rating: 5,
    text: "A melhor barbearia/estúdio que já visitei em Lisboa. O serviço de corte executivo é extremamente detalhado e relaxante.",
    date: "30/05/2026"
  },
  {
    id: "t3",
    author: "Ana Costa",
    rating: 5,
    text: "Espaço sofisticado, limpo e super acolhedor. O chá de boas-vindas é maravilhoso e as terapeutas são muito profissionais.",
    date: "28/05/2026"
  }
];

const mockDemoBusiness: Business = {
  id: "demo-id",
  name: "Café Central",
  category: "Cafetaria & Pastelaria",
  city: "Lisboa",
  logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop",
  cover: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=1200&h=500&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop"
  ],
  premium: true,
  description: "O Café Central é o ponto de encontro de eleição no coração histórico de Lisboa. Unimos o aroma e o sabor de cafés de especialidade de torra artesanal à melhor pastelaria tradicional portuguesa cozida diariamente no nosso forno. Seja para um pequeno-almoço revigorante, um almoço leve e equilibrado ou para desfrutar de um momento calmo ao fim do dia, convidamos a conhecer o nosso espaço e a saborear o nosso expresso premiado.",
  phone: "+351 213 456 789",
  whatsApp: "351999999999",
  instagram: "cafecentral.lisboa",
  facebook: "cafecentral.lisboa",
  tiktok: "cafecentral.lisboa",
  youtube: "cafecentral.lisboa",
  linkedin: "cafecentral.lisboa",
  website: "https://cafecentrallisboa.pt",
  address: "Praça de D. Pedro IV, Rossio, 1100-200 Lisboa, Portugal",
  rating: 4.8,
  reviewCount: 2,
  email: "contacto@cafecentrallisboa.pt",
  slug: "demo",
  opening_hours: [
    { day: "Segunda-feira", open: "08:00", close: "20:00", closed: false },
    { day: "Terça-feira", open: "08:00", close: "20:00", closed: false },
    { day: "Quarta-feira", open: "08:00", close: "20:00", closed: false },
    { day: "Quinta-feira", open: "08:00", close: "20:00", closed: false },
    { day: "Sexta-feira", open: "08:00", close: "20:00", closed: false },
    { day: "Sábado", open: "08:00", close: "18:00", closed: false },
    { day: "Domingo", open: "00:00", close: "00:00", closed: true }
  ],
  published: true,
  is_published: true
};

const mockDemoProducts: Product[] = [
  {
    id: "dp1",
    name: "Expresso de Especialidade",
    description: "Expresso de grãos selecionados 100% arábica com torra local de perfil médio, apresentando notas ricas de chocolate preto e avelã.",
    price: 1.50,
    image_url: "https://images.unsplash.com/photo-151097252790b-af4f42d91dfa?w=400&h=300&fit=crop"
  },
  {
    id: "dp2",
    name: "Pastel de Nata da Casa",
    description: "O clássico pastel de nata português confecionado com massa folhada crocante e recheio cremoso, servido acabado de sair do forno.",
    price: 1.20,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop"
  },
  {
    id: "dp3",
    name: "Brunch do Campo",
    description: "Fatia generosa de pão de fermentação lenta com puré de abacate temperado, ovo escalfado, sementes de sésamo e sumo de laranja natural.",
    price: 12.50,
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop"
  }
];

const mockDemoTestimonials: Testimonial[] = [
  {
    id: "dt1",
    author: "Pedro Alvares",
    rating: 5,
    text: "O melhor pastel de nata que já comi em Lisboa, e olha que já provei muitos! O expresso de especialidade é fora de série.",
    date: "25/05/2026"
  },
  {
    id: "dt2",
    author: "Sofia Antunes",
    rating: 4,
    text: "Espaço incrivelmente bem decorado, ótimo para trabalhar ou para colocar a conversa em dia. O Brunch do Campo é maravilhoso.",
    date: "18/05/2026"
  }
];

export default function VitrineClient({ slug }: { slug: string }) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [similarBusinesses, setSimilarBusinesses] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load favorite status + similar businesses after business loads
  useEffect(() => {
    if (!business?.id) return;

    // Check if current user has favorited
    const checkFav = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("business_id", business.id)
        .maybeSingle();
      if (data) { setIsFavorited(true); setFavoriteId(data.id); }
    };

    // Fetch similar businesses (same category, excluding current)
    const fetchSimilar = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, category, city, logo_url, cover_url, rating_average, plan")
        .eq("published", true)
        .eq("category", business.category)
        .neq("id", business.id)
        .limit(4);
      setSimilarBusinesses(data || []);
    };

    checkFav();
    fetchSimilar();
  }, [business?.id, business?.category]);

  const toggleFavorite = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { window.location.href = "/login?next=" + window.location.pathname; return; }
    if (isFavorited && favoriteId) {
      await supabase.from("favorites").delete().eq("id", favoriteId);
      setIsFavorited(false); setFavoriteId(null);
    } else if (business?.id) {
      const { data } = await supabase.from("favorites").insert({ user_id: session.user.id, business_id: business.id }).select("id").single();
      if (data) { setIsFavorited(true); setFavoriteId(data.id); }
    }
  }, [isFavorited, favoriteId, business?.id]);

  // Show engagement popup 3s after business loads (once per session)
  useEffect(() => {
    if (!business?.id) return;
    const key = `vp_popup_${slug}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(t);
  }, [business?.id, slug]);

  const closePopup = () => {
    setShowPopup(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`vp_popup_${slug}`, "1");
    }
  };

  const scrollToProducts = () => {
    closePopup();
    setTimeout(() => {
      document.getElementById("vitrine-produtos")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // Track page view silently after business loads
  useEffect(() => {
    if (business?.id) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id, event_type: "page_view" }),
      }).catch(() => {});
      trackVitrineView(business.id, business.name, business.category);
    }
  }, [business?.id]);

  useEffect(() => {
    if (!mounted) return;

    const load = async () => {
      let loggedInUser: any = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          loggedInUser = user;
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Error loading user in public page:", err);
      }

      if (slug === "demo") {
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("slug", "demo")
            .maybeSingle();

          if (data) {
            const [imagesRes, productsRes, testimonialsRes] = await Promise.all([
              supabase.from("gallery_images").select("image_url, order_index").eq("business_id", data.id).order("order_index"),
              supabase.from("products").select("*").eq("business_id", data.id).order("order_index"),
              supabase.from("testimonials").select("*").eq("business_id", data.id).order("created_at", { ascending: false }),
            ]);

            const galleryUrls = imagesRes.data?.map((img) => img.image_url) || [];

            setBusiness({
              id: data.id,
              user_id: data.user_id,
              name: data.name,
              category: data.category || "Cafetaria & Pastelaria",
              city: data.city || "Lisboa",
              country: data.country || "Portugal",
              logo: data.logo_url || "",
              cover: data.cover_url || "",
              cover_gradient: data.cover_gradient || "",
              gallery: galleryUrls,
              description: data.description || "",
              whatsApp: data.whatsapp || "",
              phone: data.phone || "",
              email: data.email || "",
              instagram: data.instagram || "",
              facebook: data.facebook || "",
              tiktok: data.tiktok || "",
              youtube: data.youtube || "",
              linkedin: data.linkedin || "",
              website: data.website || "",
              address: data.address || "",
              rating: data.rating_average || 4.8,
              reviewCount: testimonialsRes.data?.length || 2,
              premium: true,
              plan: data.plan || "free",
              slug: data.slug,
              opening_hours: (data.opening_hours as unknown as OpeningHour[]) || [],
            });

            setProducts(productsRes.data && productsRes.data.length > 0 ? productsRes.data : mockDemoProducts);
            setTestimonials(
              testimonialsRes.data && testimonialsRes.data.length > 0
                ? testimonialsRes.data.map((t) => ({
                    id: t.id,
                    author: t.author_name,
                    rating: t.rating,
                    text: t.text,
                    date: new Date(t.created_at).toLocaleDateString("pt-PT"),
                  }))
                : mockDemoTestimonials
            );
            setLoaded(true);
            return;
          }
        } catch (e) {
          console.error("DB demo query failed, using static fallback:", e);
        }

        setBusiness(mockDemoBusiness);
        setProducts(mockDemoProducts);
        setTestimonials(mockDemoTestimonials);
        setLoaded(true);
        return;
      }

      if (slug === "exemplo") {
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("slug", "exemplo")
            .maybeSingle();

          if (data) {
            const [imagesRes, productsRes, testimonialsRes] = await Promise.all([
              supabase.from("gallery_images").select("image_url, order_index").eq("business_id", data.id).order("order_index"),
              supabase.from("products").select("*").eq("business_id", data.id).order("order_index"),
              supabase.from("testimonials").select("*").eq("business_id", data.id).order("created_at", { ascending: false }),
            ]);

            const galleryUrls = imagesRes.data?.map((img) => img.image_url) || [];

            setBusiness({
              id: data.id,
              user_id: data.user_id,
              name: data.name,
              category: data.category || "Beleza e Bem-estar",
              city: data.city || "Lisboa",
              country: data.country || "Portugal",
              logo: data.logo_url || "",
              cover: data.cover_url || "",
              cover_gradient: data.cover_gradient || "",
              gallery: galleryUrls,
              description: data.description || "",
              whatsApp: data.whatsapp || "",
              phone: data.phone || "",
              email: data.email || "",
              instagram: data.instagram || "",
              facebook: data.facebook || "",
              tiktok: data.tiktok || "",
              youtube: data.youtube || "",
              linkedin: data.linkedin || "",
              website: data.website || "",
              address: data.address || "",
              rating: data.rating_average || 4.9,
              reviewCount: testimonialsRes.data?.length || 3,
              premium: true,
              plan: data.plan || "free",
              slug: data.slug,
              opening_hours: (data.opening_hours as unknown as OpeningHour[]) || [],
            });

            setProducts(productsRes.data && productsRes.data.length > 0 ? productsRes.data : mockExampleProducts);
            setTestimonials(
              testimonialsRes.data && testimonialsRes.data.length > 0
                ? testimonialsRes.data.map((t) => ({
                    id: t.id,
                    author: t.author_name,
                    rating: t.rating,
                    text: t.text,
                    date: new Date(t.created_at).toLocaleDateString("pt-PT"),
                  }))
                : mockExampleTestimonials
            );
            setLoaded(true);
            return;
          }
        } catch (e) {
          console.error("DB example query failed, using static fallback:", e);
        }

        setBusiness(mockExampleBusiness);
        setProducts(mockExampleProducts);
        setTestimonials(mockExampleTestimonials);
        setLoaded(true);
        return;
      }

      // Carregamento padrão de negócios do BD
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("[VITRINE] Erro ao carregar negócio:", error.message);
        }

        if (data) {
          const isPublished = data.published || data.is_published;
          const isOwner = loggedInUser && loggedInUser.id === data.user_id;

          if (!isPublished && !isOwner) {
            setBusiness(null);
            setLoaded(true);
            return;
          }

          const [imagesRes, productsRes, testimonialsRes] = await Promise.all([
            supabase.from("gallery_images").select("image_url, order_index").eq("business_id", data.id).order("order_index"),
            supabase.from("products").select("*").eq("business_id", data.id).order("order_index"),
            supabase.from("testimonials").select("*").eq("business_id", data.id).order("created_at", { ascending: false }),
          ]);

          const galleryUrls = imagesRes.data?.map((img) => img.image_url) || [];

          setBusiness({
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            category: data.category || "Serviços",
            city: data.city || "Geral",
            country: data.country || "Portugal",
            logo: data.logo_url || "",
            cover: data.cover_url || "",
            cover_gradient: data.cover_gradient || "",
            gallery: galleryUrls,
            description: data.description || "",
            whatsApp: data.whatsapp || "",
            phone: data.phone || "",
            email: data.email || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            tiktok: data.tiktok || "",
            youtube: data.youtube || "",
            linkedin: data.linkedin || "",
            website: data.website || "",
            address: data.address || "",
            rating: data.rating_average || 5.0,
            reviewCount: testimonialsRes.data?.length || 0,
            premium: data.plan === "pro" || data.plan === "premium" || data.plan === "gold" || data.plan === "business",
            plan: data.plan || "free",
            slug: data.slug,
            opening_hours: (data.opening_hours as unknown as OpeningHour[]) || [],
            published: data.published,
            is_published: data.is_published,
            owner_origin_country: data.owner_origin_country || "",
            owner_name: data.owner_name || "",
            owner_photo: data.owner_photo || "",
            owner_bio: data.owner_bio || "",
            like_count:     data.like_count     ?? 0,
            favorite_count: data.favorite_count ?? 0,
            share_count:    data.share_count    ?? 0,
            view_count:     data.view_count     ?? 0,
          });

          if (productsRes.data) {
            setProducts(productsRes.data);
          }

          if (testimonialsRes.data) {
            setTestimonials(
              testimonialsRes.data.map((t) => ({
                id: t.id,
                author: t.author_name,
                rating: t.rating,
                text: t.text,
                date: new Date(t.created_at).toLocaleDateString("pt-PT"),
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
  }, [mounted, slug]);

  if (!mounted || !loaded) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-vitrinepro.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
          <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#C8A96B] text-sm font-semibold font-display tracking-widest uppercase animate-pulse mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-6xl">🏪</div>
          <h1 className="text-2xl font-display font-bold text-white">Vitrine não encontrada</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Esta página não existe, está inativa ou o administrador desativou a publicação.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
              Voltar à Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allGalleryImages = [business.logo, business.cover, ...(business.gallery || [])].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none">
      
      {/* Draft Banner for Owner Preview */}
      {business && !(business.published || business.is_published) && (
        <div className="w-full bg-[#78350f] border-b border-[#92400e] text-[#fef3c7] px-4 py-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 select-text z-50">
          <span>⚠️</span>
          <span>
            <strong>Rascunho Privado:</strong> Esta página não está publicada e só é visível para si. 
            Para a tornar pública para os seus clientes, clique em <strong>&quot;Publicar Vitrine&quot;</strong> no seu{" "}
            <Link href="/dashboard" className="underline hover:text-white transition-colors">
              Dashboard
            </Link>.
          </span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B14]/95 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImg}
              alt="Ampliação da imagem"
              className="object-contain max-w-full max-h-full rounded-xl shadow-2xl border border-slate-800"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 bg-slate-900/80 border border-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow hover:bg-[#C8A96B] hover:text-[#0F172A] hover:border-transparent transition-all"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Engagement Popup ── */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(5,8,22,0.75)", backdropFilter: "blur(4px)" }}
          onClick={closePopup}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "#0F172A",
              border: "1.5px solid rgba(200,169,107,0.45)",
              boxShadow: "0 0 60px rgba(200,169,107,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header stripe */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(90deg,#1E293B,#0F172A)", borderBottom: "1px solid rgba(200,169,107,0.15)" }}
            >
              <div className="flex items-center gap-2">
                {business.logo && business.logo.startsWith("http") ? (
                  <img src={business.logo} alt={`Logo de ${business.name}`} className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <span className="text-2xl">{business.logo || "🏪"}</span>
                )}
                <div>
                  <p className="text-white font-bold text-sm leading-none">{business.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">📍 {business.city}</p>
                </div>
              </div>
              <button
                onClick={closePopup}
                aria-label="Fechar popup"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-white text-xl leading-tight">
                  Gostou desta vitrine?
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  Fale diretamente com este negócio pelo WhatsApp, veja produtos, serviços e ofertas disponíveis.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {/* WhatsApp */}
                {business.whatsApp && (
                  <a
                    href={`https://wa.me/${business.whatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi a vossa vitrine no VitrinePro e gostaria de saber mais.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { closePopup(); trackWhatsAppClick(business.id, business.name); pixelContact(); }}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{ background: "#25D366", color: "#fff" }}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.572.13-.756.149-.174.297-.347.446-.521.151-.174.198-.298.297-.496.099-.198.05-.371-.025-.52-.075-.149-.66-1.43-.9-1.957-.239-.527-.478-.545-.66-.558-.149-.015-.322-.024-.492-.024-.17 0-.471.074-.717.371-.245.297-.836.99-.836 1.712 0 .722.836 1.958 1.958 2.096.37.1.721.149 1.025.173.473.037.905.03 1.274-.02.297-.04.69-.173.99-.371.099-.074.571-.347.648-.695.075-.348.075-.647.05-.723-.074-.149-.272-.347-.446-.521z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.858L0 24l6.335-1.523A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.897 0-3.677-.502-5.215-1.381l-.374-.216-3.876.932.976-3.762-.239-.387A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Falar no WhatsApp
                  </a>
                )}

                {/* Ver produtos */}
                {products.length > 0 && (
                  <button
                    onClick={scrollToProducts}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                    style={{ background: "rgba(200,169,107,0.12)", color: "#C8A96B", border: "1px solid rgba(200,169,107,0.3)" }}
                  >
                    📦 Ver produtos
                  </button>
                )}

                {/* Fechar */}
                <button
                  onClick={closePopup}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Help Badge ── */}
      {!showPopup && (
        <button
          onClick={() => setShowPopup(true)}
          aria-label="Precisa de ajuda?"
          className="fixed z-40 flex items-center gap-2 font-semibold text-xs transition-all active:scale-95 hover:scale-105"
          style={{
            bottom: "96px",
            right: "16px",
            background: "#1E293B",
            border: "1.5px solid rgba(200,169,107,0.4)",
            color: "#C8A96B",
            borderRadius: "9999px",
            padding: "8px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          💬 Precisa de ajuda?
        </button>
      )}

      {/* Floating green WhatsApp Button */}
      {business.whatsApp && (
        <a
          href={`https://wa.me/${business.whatsApp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (business.id) {
              fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ business_id: business.id, event_type: "whatsapp_click" }),
              }).catch(() => {});
              trackWhatsAppClick(business.id, business.name);
              pixelContact();
            }
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all group duration-300"
          title="Fale no WhatsApp"
        >
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.416 9.863-9.848.001-2.63-1.019-5.101-2.872-6.958C16.39 1.982 13.921.962 11.29.959c-5.44.004-9.866 4.423-9.868 9.856-.001 2.03.529 4.017 1.535 5.768L1.903 21.8l5.59-1.465zM17.47 14.86c-.3-.15-1.77-.874-2.04-.972-.27-.1-.47-.15-.67.15-.2.3-.77.972-.94 1.172-.17.2-.34.225-.64.075-.3-.15-1.265-.467-2.41-1.488-.89-.795-1.49-1.777-1.665-2.077-.175-.3-.02-.46.13-.61.135-.13.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.62-.92-2.2-.24-.58-.48-.5-.67-.512-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.22 5.11 4.52.714.31 1.27.495 1.702.63.714.227 1.363.195 1.875.118.571-.085 1.77-.724 2.02-1.388.25-.664.25-1.233.175-1.388-.075-.15-.275-.25-.575-.4z" />
          </svg>
          <span className="absolute right-full mr-3 bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            WhatsApp Online
          </span>
        </a>
      )}

      {/* Top Navbar */}
      <nav className="bg-[#0b1326] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentUser && business && currentUser.id === business.user_id ? (
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-[#C8A96B] hover:text-[#D4BB82] transition-colors border border-[#C8A96B]/30 hover:border-[#C8A96B]/60 px-3 py-2 rounded-lg"
              >
                ⚙️ Voltar ao Dashboard
              </Link>
            ) : (
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 px-3 py-2 rounded-lg"
              >
                ← Início
              </Link>
            )}
            <Link href="/explorar" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-650 px-3 py-2 rounded-lg">
              🔍 Explorar
            </Link>
          </div>
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </nav>

      {/* Full-width Cover Header */}
      <div className="relative h-60 sm:h-72 md:h-96 w-full bg-[#1b253b]">
        {business.cover ? (
          <Image
            src={business.cover}
            alt={business.name}
            fill
            className="object-cover"
            priority
          />
        ) : business.cover_gradient ? (
          <div className="w-full h-full" style={{ background: business.cover_gradient }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0F172A] to-slate-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />
      </div>

      {/* Profile Summary Overlay */}
      <div className="relative max-w-5xl mx-auto w-full px-4 -mt-20 sm:-mt-24 md:-mt-28 pb-8 flex flex-col items-center sm:items-start text-center sm:text-left sm:flex-row sm:gap-6 border-b border-slate-800">
        
        {/* Overlay Logo */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-[#0F172A] bg-slate-900 shadow-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          {business.logo ? (
            <Image
              src={business.logo}
              alt={`Logo ${business.name}`}
              fill
              className="object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => business.logo && setLightboxImg(business.logo)}
            />
          ) : (
            <span className="text-5xl text-[#C8A96B]">🏪</span>
          )}
        </div>

        {/* Business details */}
        <div className="mt-4 sm:mt-24 flex-grow">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-white leading-tight">{business.name}</h1>
            {business.premium && (
              <span className="px-2.5 py-1 text-[10px] md:text-xs font-bold text-[#0F172A] bg-[#C8A96B] rounded-full uppercase tracking-wider shadow-lg shadow-[#C8A96B]/10">
                Premium
              </span>
            )}
          </div>
          <p className="text-[#C8A96B] font-medium text-sm mt-1 sm:mt-0">{business.category} · 📍 {business.city}</p>
          
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-xs">
            {business.rating && (business.reviewCount ?? 0) > 0 ? (
              <>
                <div className="flex text-[#C8A96B] text-sm">
                  {Array.from({ length: Math.round(business.rating) }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                  {Array.from({ length: 5 - Math.round(business.rating) }).map((_, i) => (
                    <span key={i} className="text-slate-700">★</span>
                  ))}
                </div>
                <span className="font-bold text-white ml-1">{business.rating.toFixed(1)}</span>
                <span className="text-slate-400">({business.reviewCount} avaliações)</span>
              </>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Sem avaliações</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Description, Products, Testimonials vs Contact details */}
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-grow">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Description */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold font-display text-white border-b border-slate-800 pb-2">Sobre Nós</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-light">
                {business.description || "Bem-vindo à nossa página profissional. Conecte-se connosco por um dos canais disponíveis."}
              </p>
            </div>

            {/* Products Showcase */}
            {products.length > 0 && (
              <div id="vitrine-produtos" className="space-y-6">
                <h2 className="text-2xl font-bold font-display text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>📦</span> Produtos & Serviços
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden hover:border-[#C8A96B]/50 transition-all duration-300 flex flex-col group"
                    >
                      <div
                        className="relative h-44 bg-slate-950 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden"
                        onClick={() => product.image_url && setLightboxImg(product.image_url)}
                      >
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-slate-700 flex flex-col items-center gap-1">
                            <span className="text-5xl">📦</span>
                            <span className="text-[10px] text-slate-500 font-semibold">Sem Imagem</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="font-bold text-white text-base font-display">{product.name}</h3>
                            {product.price !== null && product.price !== undefined && (
                              <span className="text-[#C8A96B] font-bold text-xs bg-[#C8A96B]/10 px-2 py-0.5 rounded border border-[#C8A96B]/25">
                                €{product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-3">{product.description}</p>
                        </div>

                        {business.whatsApp && (
                          <a
                            href={`https://wa.me/${business.whatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Olá! Vi o vosso produto *${product.name}* no VitrinePro e gostava de obter mais informações.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-[#C8A96B] hover:text-[#0F172A] text-[#C8A96B] rounded-lg text-xs font-semibold transition-all border border-[#C8A96B]/20 hover:border-transparent active:scale-95"
                          >
                            Pedir Informações
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Images Lightbox Showcase */}
            {business.gallery && business.gallery.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-display text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>🖼️</span> Galeria de Fotos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {business.gallery.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="relative h-28 sm:h-36 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-[#C8A96B]/50 transition-all hover:scale-[1.02] duration-300 group"
                      onClick={() => setLightboxImg(imgUrl)}
                    >
                      <Image
                        src={imgUrl}
                        alt={`${business.name} galeria ${i + 1}`}
                        fill
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-[#0F172A]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-[10px] text-white bg-slate-950/80 px-2 py-1 rounded-md border border-slate-700">🔍 Ampliar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-display text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <span>⭐</span> Avaliações e Depoimentos
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-[#C8A96B]/30 transition-all duration-300"
                    >
                      <p className="text-slate-300 italic text-xs leading-relaxed font-light">&quot;{t.text}&quot;</p>
                      <div className="flex justify-between items-center border-t border-slate-800/50 pt-3">
                        <span className="font-bold text-xs text-white font-display">{t.author}</span>
                        <div className="flex text-[#C8A96B] text-[10px]">
                          {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                          {Array.from({ length: 5 - t.rating }).map((_, i) => <span key={i} className="text-slate-800">★</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contact Details, Social Links, Map, Hours */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Contact list block */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-2">Canais de Contacto</h3>
              
              <div className="flex flex-col gap-3">
                {/* Whatsapp */}
                {business.whatsApp && (
                  <a
                    href={`https://wa.me/${business.whatsApp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { trackWhatsAppClick(business.id, business.name); pixelContact(); }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20ba5a] active:scale-95 transition-all text-xs tracking-wider uppercase shadow-lg shadow-[#25D366]/10"
                  >
                    Falar via WhatsApp
                  </a>
                )}

                {/* Telephone */}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    onClick={() => trackPhoneClick(business.id, business.name)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl font-bold transition-all text-xs tracking-wider uppercase"
                  >
                    Ligar para Telefone
                  </a>
                )}
              </div>

              {/* Social Grid */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800/80">
                {/* Email */}
                {business.email && (
                  <SocialLink
                    href={`mailto:${business.email}`}
                    label="E-mail"
                    value={business.email}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                )}

                {/* Instagram */}
                {business.instagram && (
                  <SocialLink
                    href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                    label="Instagram"
                    value={`@${business.instagram.replace("@", "")}`}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    }
                  />
                )}

                {/* Facebook */}
                {business.facebook && (
                  <SocialLink
                    href={`https://facebook.com/${business.facebook}`}
                    label="Facebook"
                    value={business.facebook}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                )}

                {/* TikTok */}
                {business.tiktok && (
                  <SocialLink
                    href={`https://tiktok.com/@${business.tiktok.replace("@", "")}`}
                    label="TikTok"
                    value={`@${business.tiktok.replace("@", "")}`}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                )}

                {/* YouTube */}
                {business.youtube && (
                  <SocialLink
                    href={`https://youtube.com/c/${business.youtube}`}
                    label="YouTube"
                    value={business.youtube}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25a29 29 0 0 0-.46-5.33z" stroke="currentColor" strokeWidth="2" />
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                      </svg>
                    }
                  />
                )}

                {/* LinkedIn */}
                {business.linkedin && (
                  <SocialLink
                    href={`https://linkedin.com/in/${business.linkedin}`}
                    label="LinkedIn"
                    value={business.linkedin}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2" />
                        <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" />
                        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    }
                  />
                )}

                {/* Official Website */}
                {business.website && (
                  <SocialLink
                    href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                    label="Site Oficial"
                    value={business.website.replace(/(^\w+:|^)\/\//, "")}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    }
                  />
                )}
              </div>
            </div>

            {/* Opening Hours list block */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-2">
                Horário de Funcionamento
              </h3>
              
              <div className="space-y-2">
                {business.opening_hours && business.opening_hours.length > 0 ? (
                  business.opening_hours.map((oh) => (
                    <div key={oh.day} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/30 last:border-0">
                      <span className="text-slate-400 font-medium">{oh.day}</span>
                      {oh.closed ? (
                        <span className="text-red-400 font-semibold text-[10px] bg-red-400/10 px-2 py-0.5 rounded border border-red-400/10">Fechado</span>
                      ) : (
                        <span className="text-slate-200 font-semibold">{oh.open} - {oh.close}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Horário não configurado.</p>
                )}
              </div>
            </div>

            {/* Location & Map Block */}
            {business.address && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-2">Localização</h3>
                <p className="text-slate-300 text-xs leading-relaxed font-light">{business.address}</p>
                
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-[#C8A96B] hover:text-[#0F172A] text-[#C8A96B] rounded-xl font-bold transition-all text-xs border border-[#C8A96B]/20 hover:border-transparent active:scale-95"
                >
                  📍 Ver no Google Maps
                </a>
              </div>
            )}

            {/* ── Community seal ── */}
            {(() => {
              const community = business.owner_origin_country
                ? getCommunityByCountry(business.owner_origin_country)
                : null;
              if (!community) return null;
              return (
                <Link
                  href={`/comunidade/${community.slug}`}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 hover:border-[#C8A96B]/30 transition-colors"
                >
                  <span className="text-3xl">{community.icon}</span>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Comunidade</p>
                    <p className="text-white font-bold text-sm">{community.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: community.color }}>Ver todos os negócios →</p>
                  </div>
                </Link>
              );
            })()}

            {/* ── Founder profile ── */}
            {(business.owner_name || business.owner_origin_country) && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 pb-2">Fundador(a)</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#C8A96B]/10 border border-[#C8A96B]/20 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {business.owner_photo
                      ? <img src={business.owner_photo} alt={`Foto de ${business.owner_name || "fundador(a)"}`} className="w-full h-full object-cover" />
                      : "👤"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm">{business.owner_name || "Fundador(a)"}</p>
                    <p className="text-slate-400 text-xs">{business.owner_origin_country || ""}</p>
                    <p className="text-[#C8A96B] text-[10px] font-semibold">📍 {business.city}</p>
                  </div>
                </div>
                {business.owner_bio && (
                  <p className="text-slate-400 text-xs leading-relaxed font-light">{business.owner_bio}</p>
                )}
              </div>
            )}

            {/* ── Social Bar: Like · Favorite · Share · Views ── */}
            <SocialBar
              businessId={business.id}
              businessName={business.name}
              businessSlug={business.slug}
              initialLikeCount={business.like_count ?? 0}
              initialFavoriteCount={business.favorite_count ?? 0}
              initialShareCount={business.share_count ?? 0}
              initialViewCount={business.view_count ?? 0}
            />

            {/* Invite button */}
            <button
              onClick={() => {
                const url = window.location.origin + "/login?ref=" + business.slug;
                navigator.clipboard.writeText(url);
                alert("Link de convite copiado! Partilha com outro negócio.");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              🔗 Convidar outro negócio
            </button>

            {/* Share Widget */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center space-y-3">
              <span className="text-xs text-slate-400 font-semibold block">Partilhar esta Vitrina</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copiado para a área de transferência!");
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
              >
                🔗 Copiar Link da Vitrine
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Vê a vitrine de ${business.name} em ${business.city}! \n${(process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""))}/vitrine/${business.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#25D366",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  marginTop: "8px",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                💚 Partilhar no WhatsApp
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ── Similar businesses ── */}
      {similarBusinesses.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <h3 className="text-xl font-bold font-display text-white">Pessoas também visitaram</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarBusinesses.map(biz => (
              <Link
                key={biz.id}
                href={`/vitrine/${biz.slug}`}
                className="group bg-slate-900/60 border border-slate-800 hover:border-[#C8A96B]/40 rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
              >
                <div className="h-20 bg-slate-800 overflow-hidden relative">
                  {biz.cover_url
                    ? <img src={biz.cover_url} alt={`Capa de ${biz.name}`} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
                <div className="p-3">
                  <p className="text-white text-xs font-bold truncate group-hover:text-[#C8A96B] transition-colors">{biz.name}</p>
                  <p className="text-slate-500 text-[10px] truncate">📍 {biz.city}</p>
                  <p className="text-[#C8A96B] text-[10px] mt-1 font-bold">★ {biz.rating_average?.toFixed(1) || "5.0"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#050B14] border-t border-slate-900 py-10 mt-16 text-center text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-3">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 object-contain bg-transparent" />
          </Link>
          <p className="text-slate-400">
            <a href={`https://vitrinepro.pt?ref=${business.slug}`} 
               target="_blank"
               rel="noopener noreferrer"
               style={{ color: "#C8A96B", textDecoration: "none", fontSize: "13px" }}>
              ⚡ Criado com VitrinePro
            </a>
          </p>
          <p className="text-[10px] text-slate-600">© 2026 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Floating AI Chat Widget - Only appears for Pro/Business plan */}
      {(business.plan === "pro" || business.plan === "business" || business.plan === "premium") && (
        <BusinessChatWidget business={business} products={products} />
      )}

      {/* Automation Popup */}
      <AutomationPopup plan={business.plan} businessName={business.name} />

    </div>
  );
}

const SocialLink = ({ href, label, icon, value }: { href: string; label: string; icon: React.ReactNode; value?: string }) => {
  if (!value) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-[#C8A96B]/50 rounded-xl text-slate-300 hover:text-white transition-all group"
    >
      <div className="text-[#C8A96B] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </a>
  );
};
