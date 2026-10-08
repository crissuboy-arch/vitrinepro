/* eslint-disable */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AccountMenu from "@/components/auth/AccountMenu";
import CoverFramingEditor from "@/components/dashboard/CoverFramingEditor";
import ProductFramingEditor from "@/components/dashboard/ProductFramingEditor";
import { normalizeProductFraming, productImgStyle, ProductFraming } from "@/lib/product-framing";
import { normalizeCoverFraming, coverImgStyle, CoverFraming } from "@/lib/cover-framing";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { getMyBusinesses, getBusinessByIdForOwner, updateBusiness } from "@/lib/business-actions";
import { isProTier, isBusinessTier, isPaidTier, normalizePlan } from "@/lib/plans";
import { isPublishedBusiness, isOwnerOf } from "@/lib/visibility";
import { getSiteUrl } from "@/lib/site";
import { buildVitrineUrl, buildVitrineQrSrc, buildShortLinkUrl } from "@/lib/vitrine-share";
import { MONTRA_TABS, DEFAULT_MONTRA_TAB, isValidMontraTab } from "@/lib/montra-tabs";
import {
  NOVIDADE_TYPES,
  NOVIDADE_CTA_OPTIONS,
  isMissingColumnError,
  novidadeTypeLabel,
  loadNovidadesState,
} from "@/lib/novidades";
import { buildBusinessUpdatePayload, isValidGoogleReviewUrl } from "@/lib/business-profile";
import { uploadLogo, uploadCover, uploadGallery, uploadProductImage, uploadNovidadeImage } from "@/lib/supabase-storage";
import { persistBusinessImageField } from "@/lib/business-images";
import { assertFreshUploadOwnership } from "@/lib/storage-upload-guard";
import { Sparkles, Lock, Copy, Check, ExternalLink } from "lucide-react";
import { trackCatalogPdfDownload } from "@/app/lib/analytics";

// Interfaces
interface Category {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  country: string;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  // Enquadramento da imagem (migration 20261006000012; NULL = legado).
  image_position_x?: number | null;
  image_position_y?: number | null;
  image_zoom?: number | null;
  // A5 — disponibilidade "hoje" (tri-state: true/false/null=não informado).
  available_today?: boolean | null;
  pickup_today?: boolean | null;
  delivery_today?: boolean | null;
  // Visibilidade (migration 20261007000014; default true).
  is_visible?: boolean;
  show_in_explore?: boolean;
}

interface Testimonial {
  id: string;
  author_name: string;
  text: string;
  rating: number;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  // Visibilidade pública (migration 20261007000014; default true).
  is_visible?: boolean;
}

function isValidStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    restaurante: "🍽️", restaurantes: "🍽️", café: "☕", cafés: "☕", cafetaria: "☕",
    beleza: "💅", estética: "💅", barbearia: "💈", manicure: "✨",
    serviços: "🛠️", construção: "🏗️", canalizador: "🔧", eletricista: "⚡",
    saúde: "🩺", fitness: "💪", academia: "💪",
    automóvel: "🚗", loja: "🛍️", lojas: "🛍️", moda: "👗",
    marketing: "📈", tecnologia: "💻",
  };
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return "🏪";
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A3: URL-driven navigation — /dashboard (conta) vs /dashboard?montra=<id> (gerir).
  const montraId = searchParams.get("montra");
  const tabParam = searchParams.get("tab");
  const activeTab = isValidMontraTab(tabParam) ? (tabParam as string) : DEFAULT_MONTRA_TAB;
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  // A2.5 — multi-business: full list + minimal selector state.
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Detailed lists
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  // Modals visibility
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);

  // Edit Business Form State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [editCountry, setEditCountry] = useState("Portugal");
  const [editAddress, setEditAddress] = useState("");
  // A4 — localização fina (migration 000006; nullable até ser aplicada).
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [editWhatsapp, setEditWhatsapp] = useState("");
  // A10.4: link de avaliação do Google Business Profile.
  const [editGoogleReviewUrl, setEditGoogleReviewUrl] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editOwnerOriginCountry, setEditOwnerOriginCountry] = useState("");
  const [editHours, setEditHours] = useState<OpeningHour[]>([]);
  // A5 — "Atendo hoje" (tri-state: null = não informado).
  const [editServiceToday, setEditServiceToday] = useState<boolean | null>(null);

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [framingOpen, setFramingOpen] = useState(false);
  const [prodFramingOpen, setProdFramingOpen] = useState(false);

  // Product Form State
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [prodPreview, setProdPreview] = useState("");
  // A5 — disponibilidade "hoje" (tri-state: null = não informado).
  const [prodAvailable, setProdAvailable] = useState<boolean | null>(null);
  const [prodPickup, setProdPickup] = useState<boolean | null>(null);
  const [prodDelivery, setProdDelivery] = useState<boolean | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdDesc, setEditProdDesc] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdFile, setEditProdFile] = useState<File | null>(null);
  const [editProdPreview, setEditProdPreview] = useState("");
  // A5 — disponibilidade "hoje" (tri-state: null = não informado).
  const [editProdAvailable, setEditProdAvailable] = useState<boolean | null>(null);
  // Visibilidade: is_visible (Montra) + show_in_explore (Explorar).
  const [editProdVisible, setEditProdVisible] = useState(true);
  const [editProdExplore, setEditProdExplore] = useState(true);
  const [editProdPickup, setEditProdPickup] = useState<boolean | null>(null);
  const [editProdDelivery, setEditProdDelivery] = useState<boolean | null>(null);
  const [savingEditProduct, setSavingEditProduct] = useState(false);

  // Testimonial Form State
  const [testAuthor, setTestAuthor] = useState("");
  const [testText, setTestText] = useState("");
  const [testRating, setTestRating] = useState(5);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // Edit Testimonial State
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editTestAuthor, setEditTestAuthor] = useState("");
  const [editTestText, setEditTestText] = useState("");
  const [editTestRating, setEditTestRating] = useState(5);
  const [savingEditTestimonial, setSavingEditTestimonial] = useState(false);

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showCatalogUpgradeModal, setShowCatalogUpgradeModal] = useState(false);

  // A6.5 — Novidades na Vitrine (business_posts).
  // novidadesMode: "idle" = ainda não carregado (auto-dispara ao abrir a aba);
  // "loading" = a carregar (sempre termina via timeout); "full" = migration
  // aplicada; "legacy" = só colunas base (publicar/editar limitado,
  // validade/preço/CTA escondidos); "unavailable" = tabela inacessível.
  const [novidades, setNovidades] = useState<any[]>([]);
  const [novidadesMode, setNovidadesMode] = useState<"idle" | "loading" | "full" | "legacy" | "unavailable">("idle");
  // A10.5: erro legível quando o carregamento falha (nunca silêncio).
  const [novidadesError, setNovidadesError] = useState<string | null>(null);
  const [showNovidadeModal, setShowNovidadeModal] = useState(false);
  const [editingNovidade, setEditingNovidade] = useState<any | null>(null);
  const [novType, setNovType] = useState("novidade");
  const [novTitle, setNovTitle] = useState("");
  const [novContent, setNovContent] = useState("");
  const [novPrice, setNovPrice] = useState("");
  const [novStartsAt, setNovStartsAt] = useState("");
  const [novExpiresAt, setNovExpiresAt] = useState("");
  const [novCtaType, setNovCtaType] = useState("none");
  const [novProductId, setNovProductId] = useState("");
  const [novFile, setNovFile] = useState<File | null>(null);
  const [novPreview, setNovPreview] = useState("");
  const [savingNovidade, setSavingNovidade] = useState(false);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // BUGFIX (Turma da Mônica): se a conta mudar depois de a página carregar
  // (ex.: logout/login com outra conta noutra aba), o estado `business`
  // fica stale e os uploads falham no Storage RLS com erro críptico.
  // Recarrega para revalidar ownership em vez de operar com estado velho.
  const loadedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
        return;
      }
      const currentId = session?.user?.id ?? null;
      if (
        loadedUserIdRef.current &&
        currentId &&
        currentId !== loadedUserIdRef.current &&
        (event === "SIGNED_IN" || event === "USER_UPDATED")
      ) {
        window.location.reload();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch all business data and lists — A2.5 multi-business aware.
  // A6.5: 0 businesses → vista de conta com estado vazio (NUNCA força /onboarding) ·
  // 1 → auto-select · 2+ → minimal selector
  // (never bounce a multi-business owner to onboarding).
  const loadAllData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      loadedUserIdRef.current = session.user.id;
      const all = await getMyBusinesses(session.user.id);
      setBusinesses(all);

      if (all.length === 0) {
        // A6.5 Parte A — consumidor autenticado com 0 businesses: NUNCA forçado
        // a /onboarding. Fica na vista de conta com estado vazio + CTA "Criar Montra".
        setBusinesses([]);
        setBusiness(null);
        return;
      }

      // A3: /dashboard is the account view (Minhas Montras). Managing a montra
      // requires ?montra=<id> — ownership re-validated server-side below.
      // Never auto-enter; never bounce a multi-business owner to onboarding.
      const wantedId = new URLSearchParams(window.location.search).get("montra");
      if (!wantedId) {
        setBusiness(null);
        return;
      }

      const biz = await getBusinessByIdForOwner(wantedId, session.user.id);
      if (!biz) {
        // Unknown id or not the owner → back to the account view.
        router.push("/dashboard");
        return;
      }

      await loadBusinessData(session.user.id, biz);
    } catch (err) {
      console.error("[DASHBOARD] Fetch load exception:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loads everything for ONE selected business. Ownership is re-checked here
  // (defense in depth — RLS also enforces it on every query).
  const loadBusinessData = async (userId: string, biz: any) => {
    if (!isOwnerOf(biz, userId)) {
      console.error("[DASHBOARD] Ownership check failed for business", biz?.id);
      setBusiness(null);
      router.push("/dashboard");
      return;
    }
    try {
      setBusiness(biz);

      // A10.5: novidades carregam de forma independente e com timeout
      // garantido (lib/novidades: loadNovidadesState). Uma falha noutra
      // secção (products/gallery/...) nunca pode deixar "Novidades"
      // preso em "loading".
      try {
        void loadNovidades(biz.id);
      } catch (err) {
        console.error("[DASHBOARD] loadNovidades dispatch falhou:", err);
      }

      // Populate edit form states
      setEditName(biz.name || "");
      setEditDescription(biz.description || "");
      setEditCategoryId(biz.category_id || "");
      setEditCityId(biz.city_id || "");
      setEditCountry(biz.country || "Portugal");
      setEditAddress(biz.address || "");
      // A4: coordenadas existentes (null até a migration 000006 / geocodificação).
      setEditPostalCode(biz.postal_code || "");
      setEditLatitude(typeof biz.latitude === "number" ? biz.latitude : null);
      setEditLongitude(typeof biz.longitude === "number" ? biz.longitude : null);
      setGeoMessage(null);
      setEditWhatsapp(biz.whatsapp || "");
      // A10.4: coluna ainda pode não existir (migration pendente) — acesso defensivo.
      setEditGoogleReviewUrl((biz as any).google_review_url || "");
      setEditPhone(biz.phone || "");
      setEditEmail(biz.email || "");
      setEditInstagram(biz.instagram || "");
      setEditFacebook(biz.facebook || "");
      setEditTiktok(biz.tiktok || "");
      setEditYoutube(biz.youtube || "");
      setEditLinkedin(biz.linkedin || "");
      setEditWebsite(biz.website || "");
      setEditOwnerOriginCountry((biz as any).owner_origin_country || "");
      setEditHours((biz.opening_hours as unknown as OpeningHour[]) || []);
      // A5 — tri-state preservado: null continua null (não informado).
      setEditServiceToday(
        biz.service_today === true ? true : biz.service_today === false ? false : null
      );

      // Parallel fetch list endpoints
      const [prodRes, testRes, gallRes, catsRes, citiesRes] = await Promise.all([
        supabase.from("products").select("*").eq("business_id", biz.id).order("order_index"),
        supabase.from("testimonials").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
        supabase.from("gallery_images").select("*").eq("business_id", biz.id).order("order_index"),
        supabase.from("categories").select("id, name").eq("is_active", true),
        supabase.from("cities").select("id, name, country").eq("is_active", true),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (testRes.data) setTestimonials(testRes.data);
      if (gallRes.data) setGallery(gallRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
    } catch (err) {
      console.error("[DASHBOARD] Business load exception:", err);
    }
  };

  // A3 — enter the manage view for a montra. Ownership is re-validated
  // server-side by getBusinessByIdForOwner (+ RLS) on every load.
  const selectBusiness = (id: string) => {
    router.push(`/dashboard?montra=${id}`);
  };

  // A3 — back to the account view (Minhas Montras).
  const switchBusiness = () => {
    router.push("/dashboard");
  };

  // A3 — tab navigation inside Gerenciar Montra.
  const goTab = (tabId: string) => {
    if (!business?.id) return;
    router.push(`/dashboard?montra=${business.id}&tab=${tabId}`);
  };

  useEffect(() => {
    if (mounted) {
      loadAllData();
    }
  }, [mounted, montraId]);

  // A10.5b — auto-recuperação de Novidades: se a aba for aberta e o
  // carregamento inicial nunca aconteceu (modo "idle"), dispara-o aqui.
  // NOTA (A10.5d): este hook tem de viver ANTES de qualquer early return
  // do componente (antes de `if (!mounted || loading)` / `if (!business)`).
  // Na posição anterior (após os returns), a vista de conta nunca o
  // registava e "Gerenciar Montra" registava +1 hook após o render
  // anterior → React error #310 ("Rendered more hooks than during the
  // previous render") → "This page couldn't load".
  useEffect(() => {
    if (activeTab === "novidades" && business?.id && novidadesMode === "idle") {
      void loadNovidades(business.id);
    }
  }, [activeTab, business?.id, novidadesMode]);

  const handleUpgrade = async (planId: string) => {
    if (!business?.id) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, businessId: business.id }),
      });

      const data = await response.json();

      // Stripe not yet configured in this environment
      if (response.status === 503 || data.error === "stripe_not_configured") {
        setToast("💳 Pagamentos em breve disponíveis. Aguarda a activação.");
        setCheckoutLoading(false);
        return;
      }

      // Surface the real Stripe error (data.details) so the toast shows e.g.
      // "No such price: ..." instead of the generic message — easier to diagnose.
      if (!response.ok) throw new Error(data.details || data.error || "Erro ao criar sessão.");

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout inválida.");
      }
    } catch (err: any) {
      setToast("Erro no upgrade: " + err.message);
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && business?.id) {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");

      const isCurrentPremium = isProTier(business.plan);
      const isTargetPremium = isProTier(planParam);
      const isCurrentBusiness = isBusinessTier(business.plan);
      const isTargetBusiness = isBusinessTier(planParam);
      const alreadyHasPlan = (isCurrentPremium && isTargetPremium) || (isCurrentBusiness && isTargetBusiness);

      const isSuccessStatus = params.get("success");
      const isCancelStatus = params.get("cancel");
      const isReturningFromStripe = isSuccessStatus === "stripe" || isCancelStatus === "stripe";

      if (planParam && planParam !== "free" && !alreadyHasPlan && !isReturningFromStripe) {
        if (params.get("success") === "onboarding") {
          setShowSuccessBanner(true);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
        handleUpgrade(planParam);
      } else if (params.get("success") === "onboarding") {
        setShowSuccessBanner(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      } else if (params.get("success") === "stripe") {
        alert("Subscrição atualizada com sucesso! O seu plano será ativado em instantes.");
        loadAllData();
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      } else if (params.get("cancel") === "stripe") {
        alert("O processo de pagamento foi cancelado.");
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    }
  }, [business?.id]);

  const handleCancelSubscription = async () => {
    if (!business?.id) return;
    setCancelLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao cancelar.");

      setShowCancelModal(false);

      if (data.immediate) {
        setBusiness((prev: any) => ({ ...prev, plan: "free", subscription_cancel_at: null }));
        setToast("Assinatura cancelada. O teu plano foi alterado para Grátis.");
      } else {
        const formatted = data.cancel_at
          ? new Date(data.cancel_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
          : "fim do período";
        setBusiness((prev: any) => ({ ...prev, subscription_cancel_at: data.cancel_at }));
        setToast(`Cancelamento agendado. Acesso premium até ${formatted}.`);
      }
    } catch (err: any) {
      setToast("Erro: " + (err.message || "Não foi possível cancelar."));
    } finally {
      setCancelLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center flex-col gap-4">
        <img src="/brand/logo-horizontal-transparent.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
        <div className="text-[#C8A96B] font-display text-xl animate-pulse">Carregando painel...</div>
      </div>
    );
  }

  // A3.1/A3.2 — DASHBOARD GERAL (vista de conta).
  // CONTA → MINHAS MONTRAS → GERENCIAR MONTRA → MONTRA PÚBLICA.
  // Shown whenever no ?montra= is selected (0 → onboarding happens earlier).
  if (!business) {
    // A6.5 Parte A — preserva os params do URL (ex.: ?plan=premium do fluxo
    // de subscrição) para o plano escolhido sobreviver ao onboarding.
    const dashSearch = typeof window !== "undefined" ? window.location.search : "";
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
        <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5">
              <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/explorar"
                className="text-[10px] md:text-xs text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                🔍 Explorar
              </Link>
              <AccountMenu />
            </div>
          </div>
        </header>
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-10">
          <h1 className="font-display text-3xl font-bold text-white">A minha conta</h1>
          <p className="text-sm text-gray-400 mt-2 mb-8">
            Ainda não tens nenhuma Montra. A tua área pessoal está em{" "}
            <Link href="/conta" className="text-[#C8A96B] hover:underline font-semibold">
              Minha Conta
            </Link>
            .
          </p>

          <h2 className="font-display text-xl font-semibold text-[#C8A96B] mb-4">Minhas Montras</h2>

          {/* A6.5 Parte A — consumidor sem Montra: estado vazio com CTA,
              em vez do redirect forçado a /onboarding. */}
          {businesses.length === 0 && (
            <div className="bg-gray-900 border border-dashed border-[#C8A96B]/40 rounded-2xl p-8 text-center mb-4">
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-display text-xl font-bold text-white">Ainda não tem uma Montra</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Crie a sua Montra para mostrar o seu negócio a quem está por perto — é aqui que gere tudo.
              </p>
              <Link
                href={`/onboarding${dashSearch}`}
                className="inline-block mt-5 px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-sm transition-colors"
              >
                Criar Montra →
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {businesses.map((b: any) => (
              <div
                key={b.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-white truncate">{b.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">/vitrine/{b.slug}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      isPublishedBusiness(b)
                        ? "bg-green-950 border border-green-800 text-green-400"
                        : "bg-red-950 border border-red-900 text-red-400"
                    }`}>
                      {isPublishedBusiness(b) ? "Publicada" : "Rascunho"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      isPaidTier(b.plan)
                        ? "bg-[#C8A96B]/20 border border-[#C8A96B]/40 text-[#C8A96B]"
                        : "bg-gray-800 border border-gray-700 text-gray-400"
                    }`}>
                      {isBusinessTier(b.plan) ? "Business" : isProTier(b.plan) ? "Pro" : "Free"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => selectBusiness(b.id)}
                    className="flex-1 px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg text-sm transition-colors"
                  >
                    Gerenciar Montra
                  </button>
                  <Link
                    href={`/vitrine/${b.slug}`}
                    target="_blank"
                    className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                  >
                    Ver Montra ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/onboarding${dashSearch}`}
            className="inline-block mt-8 text-sm text-[#C8A96B] hover:text-[#D4BB82] border border-[#C8A96B]/30 hover:border-[#C8A96B]/60 px-5 py-3 rounded-xl transition-colors font-semibold"
          >
            + Nova Montra
          </Link>
        </main>
      </div>
    );
  }


  // Image Fallback Generator
  const getLogoFallback = (nameString: string) => {
    const initials = nameString ? nameString.slice(0, 2).toUpperCase() : "VP";
    return (
      <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-[#C8A96B] text-xl shadow-lg">
        {initials}
      </div>
    );
  };

  // 1. Toggle Publish Status
  const handleTogglePublish = async () => {
    if (!business) return;
    const targetStatus = !business.published;
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ published: targetStatus })
        .eq("id", business.id);

      if (error) throw error;
      setBusiness((prev: any) => ({ ...prev, published: targetStatus }));
    } catch (err: any) {
      alert("Erro ao alterar visibilidade: " + err.message);
    }
  };

  // 2. Edit Profile Save Action
  const handleSaveBusiness = async () => {
    // A10.4: valida o link Google antes de guardar (vazio = limpar, permitido).
    if (editGoogleReviewUrl.trim() !== "" && !isValidGoogleReviewUrl(editGoogleReviewUrl)) {
      alert(
        "O link de avaliação do Google não é válido. Use um link HTTPS do Google " +
        "(ex.: https://g.page/.../review ou um link do Google Maps)."
      );
      return;
    }
    setSavingBusiness(true);
    try {
      // A3.6: payload built by lib/business-profile — `country` is the business
      // location, `owner_origin_country` is the owner's community. Never mixed.
      const result = await updateBusiness(business.id, buildBusinessUpdatePayload({
        name: editName,
        description: editDescription,
        categoryId: editCategoryId,
        cityId: editCityId,
        country: editCountry,
        ownerOriginCountry: editOwnerOriginCountry,
        address: editAddress,
        whatsapp: editWhatsapp,
        phone: editPhone,
        email: editEmail,
        instagram: editInstagram,
        facebook: editFacebook,
        tiktok: editTiktok,
        youtube: editYoutube,
        linkedin: editLinkedin,
        website: editWebsite,
        hours: editHours,
        // A10.4: link de avaliação Google (migration 000020; coluna intocada se ausente do formulário).
        googleReviewUrl: editGoogleReviewUrl,
        // A4: código postal + coordenadas (vêm da geocodificação, nunca inventadas).
        postalCode: editPostalCode,
        latitude: editLatitude,
        longitude: editLongitude,
        // A5: "Atendo hoje" — tri-state passa exatamente como está.
        serviceToday: editServiceToday,
      }));

      if (!result.success) throw new Error(result.error);

      // Refresh local profile
      const { data: updated } = await supabase.from("businesses").select("*").eq("id", business.id).single();
      setBusiness(updated);
      setToast("Informações guardadas com sucesso.");
    } catch (err: any) {
      // A4/A5: se a migration ainda não foi aplicada, o banco rejeita
      // as novas colunas — mensagem clara em vez de erro técnico.
      const msg = String(err?.message || err);
      if (/postal_code|latitude|longitude/i.test(msg)) {
        alert(
          "Para guardar código postal e coordenadas, aplique primeiro a migration " +
          "20261005000006_a4_local_discovery.sql no Supabase SQL Editor. " +
          "Os restantes dados foram mantidos no formulário."
        );
      } else if (/service_today|available_today|pickup_today|delivery_today/i.test(msg)) {
        alert(
          "Para guardar a disponibilidade de hoje, aplique primeiro a migration " +
          "20261005000007_a5_availability.sql no Supabase SQL Editor. " +
          "Os restantes dados foram mantidos no formulário."
        );
      } else if (/google_review_url/i.test(msg)) {
        alert(
          "Para guardar o link de avaliação do Google, aplique primeiro a migration " +
          "20261008000020_google_review_url.sql no Supabase SQL Editor. " +
          "Os restantes dados foram mantidos no formulário."
        );
      } else {
        alert("Erro ao guardar dados: " + msg);
      }
    } finally {
      setSavingBusiness(false);
    }
  };

  // A4.4 — geocodificação: morada + cidade + código postal → coordenadas.
  // O comerciante nunca precisa saber latitude/longitude; o Nominatim
  // (OpenStreetMap, gratuito, sem chave) resolve. Ponto único de integração:
  // lib/geocode.ts. Null = "sem coordenadas", nunca inventadas.
  const handleGeocodeAddress = async () => {
    setGeoMessage(null);
    if (!editAddress.trim()) {
      setGeoMessage("Preencha a morada antes de localizar.");
      return;
    }
    setGeoLoading(true);
    try {
      const { forwardGeocode } = await import("@/lib/geocode");
      const cityName = cities.find((c: any) => c.id === editCityId)?.name || "";
      const result = await forwardGeocode(editAddress, cityName, editPostalCode, editCountry);
      if (result) {
        setEditLatitude(result.lat);
        setEditLongitude(result.lng);
        setGeoMessage(
          `Localização encontrada: ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}.` +
          (result.displayName ? ` (${result.displayName.split(",").slice(0, 2).join(",")})` : "") +
          " Guarde para aplicar."
        );
      } else {
        setGeoMessage("Não foi possível localizar esta morada. Verifique os dados e tente de novo.");
      }
    } catch {
      setGeoMessage("Serviço de localização indisponível no momento.");
    } finally {
      setGeoLoading(false);
    }
  };

  // BUGFIX (Turma da Mônica): a sessão pode ter mudado (troca de conta)
  // depois de a página carregar, deixando o estado `business` stale.
  // Confirma ownership fresca antes de cada upload para falhar com
  // mensagem acionável em vez de "row-level security policy" do Storage.
  const assertCanUploadNow = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    assertFreshUploadOwnership(session?.user?.id, business?.user_id);
  };

  // Edit Profile Image Upload Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploadingLogo(true);
    try {
      await assertCanUploadNow();
      const logoUrl = await uploadLogo(file, business.id);
      // BUGFIX: o erro do UPDATE era ignorado — a UI mostrava a imagem
      // sem ela estar persistida (caso Turma da Mônica).
      await persistBusinessImageField(supabase, business.id, "logo_url", logoUrl);
      setBusiness((prev: any) => ({ ...prev, logo_url: logoUrl }));
    } catch (err: any) {
      alert("Erro no upload do logótipo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploadingCover(true);
    try {
      await assertCanUploadNow();
      const coverUrl = await uploadCover(file, business.id);
      // BUGFIX: ver comentário no handleLogoUpload.
      await persistBusinessImageField(supabase, business.id, "cover_url", coverUrl);
      setBusiness((prev: any) => ({ ...prev, cover_url: coverUrl }));
    } catch (err: any) {
      alert("Erro no upload da capa: " + err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // Editor de enquadramento da capa — só parâmetros de apresentação,
  // a imagem original nunca é alterada. RLS/ownership inalterados.
  const handleSaveFraming = async (f: CoverFraming) => {
    if (!business) return;
    const { error } = await supabase
      .from("businesses")
      .update({
        cover_position_x: f.x,
        cover_position_y: f.y,
        cover_zoom: f.zoom,
      })
      .eq("id", business.id);
    if (error) {
      alert("Erro ao guardar enquadramento: " + error.message);
      return;
    }
    setBusiness((prev: any) => (prev ? {
      ...prev,
      cover_position_x: f.x,
      cover_position_y: f.y,
      cover_zoom: f.zoom,
    } : prev));
    setFramingOpen(false);
  };

  const handleRemoveCover = async () => {
    if (!business) return;
    const { error } = await supabase
      .from("businesses")
      .update({
        cover_url: null,
        cover_position_x: null,
        cover_position_y: null,
        cover_zoom: null,
      })
      .eq("id", business.id);
    if (error) {
      alert("Erro ao remover capa: " + error.message);
      return;
    }
    setBusiness((prev: any) => (prev ? {
      ...prev,
      cover_url: null,
      cover_position_x: null,
      cover_position_y: null,
      cover_zoom: null,
    } : prev));
    setFramingOpen(false);
  };

  const handleReplaceCover = () => {
    document.getElementById("cover-upload-input")?.click();
  };

  // Editor de enquadramento da imagem do produto — só parâmetros de
  // apresentação, a imagem original nunca é alterada. RLS/ownership inalterados.
  const handleSaveProductFraming = async (f: ProductFraming) => {
    if (!editingProduct) return;
    const { error } = await supabase
      .from("products")
      .update({
        image_position_x: f.x,
        image_position_y: f.y,
        image_zoom: f.zoom,
      })
      .eq("id", editingProduct.id);
    if (error) {
      if (error.message?.includes("image_position_x")) {
        alert("Para usar o enquadramento, aplica primeiro a migration 20261006000012_product_image_framing.sql no Supabase SQL Editor.");
      } else {
        alert("Erro ao guardar enquadramento: " + error.message);
      }
      return;
    }
    setProducts((prev: any[]) => prev.map((pr) => pr.id === editingProduct.id ? {
      ...pr, image_position_x: f.x, image_position_y: f.y, image_zoom: f.zoom,
    } : pr));
    setEditingProduct((prev: any) => prev ? {
      ...prev, image_position_x: f.x, image_position_y: f.y, image_zoom: f.zoom,
    } : prev);
    setProdFramingOpen(false);
  };

  // 3. Add Product Action
  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProdFile(file);
      setProdPreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;
    setSavingProduct(true);
    try {
      await assertCanUploadNow();
      let imageUrl = "";
      if (prodFile) {
        imageUrl = await uploadProductImage(prodFile, business.id);
      }

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          business_id: business.id,
          name: prodName,
          description: prodDesc || null,
          price: prodPrice ? parseFloat(prodPrice) : null,
          image_url: imageUrl || null,
          order_index: products.length,
          // A5 — tri-state: null = não informado (nunca convertido).
          available_today: prodAvailable,
          pickup_today: prodPickup,
          delivery_today: prodDelivery,
        })
        .select()
        .single();

      if (error) throw error;

      setProducts((prev) => [...prev, newProduct]);
      setShowProductModal(false);
      // Reset form
      setProdName("");
      setProdDesc("");
      setProdPrice("");
      setProdFile(null);
      setProdPreview("");
      setProdAvailable(null);
      setProdPickup(null);
      setProdDelivery(null);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (/available_today|pickup_today|delivery_today/i.test(msg)) {
        alert(
          "Para guardar a disponibilidade de hoje, aplique primeiro a migration " +
          "20261005000007_a5_availability.sql no Supabase SQL Editor."
        );
      } else {
        alert("Erro ao adicionar produto: " + msg);
      }
    } finally {
      setSavingProduct(false);
    }
  };

  // 4. Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Eliminar este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("Erro ao eliminar: " + error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setToast("Produto eliminado.");
  };

  // 5. Open Edit Modal
  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdDesc(p.description || "");
    setEditProdPrice(p.price !== null && p.price !== undefined ? String(p.price) : "");
    setEditProdFile(null);
    setEditProdPreview(p.image_url || "");
    // A5 — tri-state preservado: null continua null (não informado).
    setEditProdAvailable(p.available_today === true ? true : p.available_today === false ? false : null);
    setEditProdPickup(p.pickup_today === true ? true : p.pickup_today === false ? false : null);
    setEditProdDelivery(p.delivery_today === true ? true : p.delivery_today === false ? false : null);
    // Visibilidade: default true (dados legados sem as colunas).
    setEditProdVisible(p.is_visible !== false);
    setEditProdExplore(p.show_in_explore !== false && p.is_visible !== false);
  };

  // 6. Save Edit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdName) return;
    setSavingEditProduct(true);
    try {
      await assertCanUploadNow();
      let imageUrl = editingProduct.image_url || "";
      if (editProdFile) {
        imageUrl = await uploadProductImage(editProdFile, business.id);
      }
      const dbUpdates = {
        name: editProdName,
        description: editProdDesc || null,
        price: editProdPrice ? parseFloat(editProdPrice) : null,
        image_url: imageUrl || null,
        // A5 — tri-state: null = não informado (nunca convertido).
        available_today: editProdAvailable,
        pickup_today: editProdPickup,
        delivery_today: editProdDelivery,
        // Visibilidade: ocultar da Montra força show_in_explore=false.
        // Mostrar novamente NÃO religa o Explorar automaticamente.
        is_visible: editProdVisible,
        show_in_explore: editProdVisible ? editProdExplore : false,
      };
      const { error } = await supabase.from("products").update(dbUpdates).eq("id", editingProduct.id);
      if (error) throw error;
      // Convert null → undefined for local Product interface compatibility
      const localUpdates: Partial<Product> = {
        name: editProdName,
        description: editProdDesc || undefined,
        price: editProdPrice ? parseFloat(editProdPrice) : undefined,
        image_url: imageUrl || undefined,
        available_today: editProdAvailable,
        pickup_today: editProdPickup,
        delivery_today: editProdDelivery,
        is_visible: editProdVisible,
        show_in_explore: editProdVisible ? editProdExplore : false,
      };
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...localUpdates } : p))
      );
      setEditingProduct(null);
      setToast("Produto atualizado.");
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (/available_today|pickup_today|delivery_today/i.test(msg)) {
        alert(
          "Para guardar a disponibilidade de hoje, aplique primeiro a migration " +
          "20261005000007_a5_availability.sql no Supabase SQL Editor."
        );
      } else {
        alert("Erro ao atualizar: " + msg);
      }
    } finally {
      setSavingEditProduct(false);
    }
  };

  // 7. Add Testimonial Action
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testAuthor || !testText) return;
    setSavingTestimonial(true);
    try {
      const { data: newTest, error } = await supabase
        .from("testimonials")
        .insert({
          business_id: business.id,
          author_name: testAuthor,
          text: testText,
          rating: testRating,
        })
        .select()
        .single();

      if (error) throw error;

      setTestimonials((prev) => [newTest, ...prev]);
      setShowTestimonialModal(false);
      // Reset form
      setTestAuthor("");
      setTestText("");
      setTestRating(5);
    } catch (err: any) {
      alert("Erro ao adicionar depoimento: " + err.message);
    } finally {
      setSavingTestimonial(false);
    }
  };

  // 5. Delete Testimonial
  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Eliminar este depoimento?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) { alert("Erro ao eliminar: " + error.message); return; }
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    setToast("Depoimento eliminado.");
  };

  // 6. Open Edit Testimonial Modal
  const openEditTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t);
    setEditTestAuthor(t.author_name);
    setEditTestText(t.text);
    setEditTestRating(t.rating);
  };

  // 7. Save Edit Testimonial
  const handleSaveEditTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    setSavingEditTestimonial(true);
    try {
      const updates = { author_name: editTestAuthor, text: editTestText, rating: editTestRating };
      const { error } = await supabase.from("testimonials").update(updates).eq("id", editingTestimonial.id);
      if (error) throw error;
      setTestimonials((prev) =>
        prev.map((t) => (t.id === editingTestimonial.id ? { ...t, ...updates } : t))
      );
      setEditingTestimonial(null);
      setToast("Depoimento atualizado.");
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setSavingEditTestimonial(false);
    }
  };

  // 8. Add Gallery Images Action
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      await assertCanUploadNow();
      const filesArray = Array.from(files);
      for (const file of filesArray) {
        const url = await uploadGallery(file, business.id);
        const { data: newImg } = await supabase
          .from("gallery_images")
          .insert({
            business_id: business.id,
            image_url: url,
            order_index: gallery.length,
          })
          .select()
          .single();

        if (newImg) {
          setGallery((prev) => [...prev, newImg]);
        }
      }
    } catch (err: any) {
      alert("Erro no upload de galeria: " + err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleToggleGalleryVisibility = async (imageId: string, currentlyVisible: boolean) => {
    const next = !currentlyVisible;
    const { error } = await supabase.from("gallery_images").update({ is_visible: next }).eq("id", imageId);
    if (error) { alert("Erro ao alterar visibilidade: " + error.message); return; }
    setGallery((prev: any[]) => prev.map((g) => (g.id === imageId ? { ...g, is_visible: next } : g)));
    setToast(next ? "Imagem visível publicamente." : "Imagem oculta (mantida na galeria).");
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta imagem da galeria?")) return;
    try {
      await supabase.from("gallery_images").delete().eq("id", imageId);
      setGallery((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert("Erro ao eliminar imagem: " + err.message);
    }
  };

  // Converte ISO (UTC) para o formato do input datetime-local (hora local).
  const toLocalInput = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ===== A6.5 — Novidades na Vitrine (business_posts) =====
  // A10.5 — "Novidades travadas": o loader anterior deixava o UI preso em
  // "loading" se o fetch nunca resolvesse ou se loadBusinessData lançasse
  // antes da chamada. Agora:
  // - loadNovidadesState (lib/novidades) GARANTE modo terminal via timeout;
  // - a chamada acontece logo após o ownership check, independente do
  //   Promise.all das outras secções;
  // - erro legível + botão "Tentar novamente" em vez de silêncio.
  const loadNovidades = async (businessId: string) => {
    setNovidadesMode("loading");
    setNovidadesError(null);
    try {
      const result = await loadNovidadesState(supabase, businessId);
      setNovidades(result.rows);
      setNovidadesError(result.error);
      setNovidadesMode(result.mode);
    } catch (err: any) {
      // Defesa em profundidade: o helper nunca devia lançar, mas o
      // loading TEM de terminar sempre.
      console.error("[DASHBOARD] loadNovidades falhou de forma inesperada:", err);
      setNovidades([]);
      setNovidadesError("Não foi possível carregar as novidades.");
      setNovidadesMode("unavailable");
    }
  };

  const resetNovidadeForm = () => {
    setEditingNovidade(null);
    setNovType("novidade");
    setNovTitle("");
    setNovContent("");
    setNovPrice("");
    setNovStartsAt("");
    setNovExpiresAt("");
    setNovCtaType("none");
    setNovProductId("");
    setNovFile(null);
    setNovPreview("");
  };

  const openNovidadeModal = () => {
    resetNovidadeForm();
    setShowNovidadeModal(true);
  };

  const openEditNovidade = (n: any) => {
    setEditingNovidade(n);
    setNovType(n.type || "novidade");
    setNovTitle(n.title || "");
    setNovContent(n.content || "");
    setNovPrice(n.price !== null && n.price !== undefined ? String(n.price) : "");
    setNovStartsAt(n.starts_at ? toLocalInput(n.starts_at) : "");
    setNovExpiresAt(n.expires_at ? toLocalInput(n.expires_at) : "");
    setNovCtaType(n.cta_type || "none");
    setNovProductId(n.product_id || "");
    setNovFile(null);
    setNovPreview(n.image_url || "");
    setShowNovidadeModal(true);
  };

  const handleNovidadeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNovFile(file);
      setNovPreview(URL.createObjectURL(file));
    }
  };

  // Atalho "Só hoje": válida de agora até às 23:59 locais.
  const setNovidadeTodayOnly = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 0, 0);
    setNovStartsAt(toLocalInput(now.toISOString()));
    setNovExpiresAt(toLocalInput(end.toISOString()));
  };

  const handleSaveNovidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novTitle.trim() || !business) return;
    if (novStartsAt && novExpiresAt && new Date(novStartsAt) > new Date(novExpiresAt)) {
      alert("A data de início não pode ser posterior à data de fim.");
      return;
    }
    setSavingNovidade(true);
    try {
      await assertCanUploadNow();
      let imageUrl = editingNovidade?.image_url || "";
      if (novFile) {
        imageUrl = await uploadNovidadeImage(novFile, business.id);
      }
      const full = novidadesMode === "full";
      const payload: any = {
        business_id: business.id,
        type: novType,
        title: novTitle.trim(),
        content: novContent.trim() || null,
        image_url: imageUrl || null,
      };
      if (full) {
        payload.price = novPrice ? parseFloat(novPrice) : null;
        payload.starts_at = novStartsAt ? new Date(novStartsAt).toISOString() : null;
        payload.expires_at = novExpiresAt ? new Date(novExpiresAt).toISOString() : null;
        payload.is_active = editingNovidade?.is_active ?? true;
        payload.cta_type = novCtaType === "none" ? null : novCtaType;
        payload.product_id = novCtaType === "ver_produto" ? novProductId || null : null;
        payload.cta_target =
          novCtaType === "ver_produto" ? novProductId || null
          : novCtaType === "ver_montra" ? business.slug
          : null;
      }
      if (editingNovidade) {
        const { error } = await supabase.from("business_posts").update(payload).eq("id", editingNovidade.id);
        if (error) throw error;
        setNovidades((prev) => prev.map((n) => (n.id === editingNovidade.id ? { ...n, ...payload } : n)));
        setToast("Novidade atualizada.");
      } else {
        const { data, error } = await supabase.from("business_posts").insert(payload).select().single();
        if (error) throw error;
        setNovidades((prev) => [data, ...prev]);
        setToast("Novidade publicada!");
      }
      setShowNovidadeModal(false);
      resetNovidadeForm();
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (isMissingColumnError(msg)) {
        alert(
          "Para publicar novidades com preço, validade e CTA, aplica primeiro a migration " +
          "20261006000013_business_posts_novidades.sql no Supabase SQL Editor."
        );
      } else {
        alert("Erro ao guardar novidade: " + msg);
      }
    } finally {
      setSavingNovidade(false);
    }
  };

  const handleToggleNovidade = async (n: any) => {
    const next = !(n.is_active !== false);
    try {
      const { error } = await supabase.from("business_posts").update({ is_active: next }).eq("id", n.id);
      if (error) throw error;
      setNovidades((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_active: next } : x)));
      setToast(next ? "Novidade ativada." : "Novidade desativada.");
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (isMissingColumnError(msg)) {
        alert(
          "Para ativar/desativar novidades, aplica primeiro a migration " +
          "20261006000013_business_posts_novidades.sql no Supabase SQL Editor."
        );
      } else {
        alert("Erro ao atualizar novidade: " + msg);
      }
    }
  };

  const handleDeleteNovidade = async (id: string) => {
    if (!confirm("Eliminar esta novidade?")) return;
    const { error } = await supabase.from("business_posts").delete().eq("id", id);
    if (error) { alert("Erro ao eliminar: " + error.message); return; }
    setNovidades((prev) => prev.filter((n) => n.id !== id));
    setToast("Novidade eliminada.");
  };

  // Partilha: link direto /vitrine/[slug] (regra vitrine-share: domínio
  // canónico). O endpoint /api/short-links exige plano Business, por isso
  // NÃO é adequado para todos os comerciantes — usa-se o link direto.
  const handleShareNovidade = async () => {
    if (!business?.slug) return;
    const url = buildVitrineUrl(business.slug);
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link da Montra copiado!");
    } catch {
      prompt("Copia o link da Montra:", url);
    }
  };

  const handleEditHoursChange = (index: number, field: keyof OpeningHour, value: any) => {
    const newHours = [...editHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setEditHours(newHours);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Fluxo: Minhas Montras → Gerenciar → Ver Montra */}
            <button
              onClick={switchBusiness}
              className="px-3 py-2 border border-gray-700 text-gray-300 rounded-lg text-xs md:text-sm hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors whitespace-nowrap flex-shrink-0"
            >
              ← Minhas Montras
            </button>
            <Link href="/" className="flex items-center gap-1.5 min-w-0">
              <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-8 md:h-10 w-auto object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link
              href={`/vitrine/${business?.slug || ''}`}
              target="_blank"
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-xs md:text-sm hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
            >
              Ver Montra ↗
            </Link>
              <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main Console */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        {showSuccessBanner && (
          <div className="bg-[#0F172A] border border-[#C8A96B]/30 rounded-2xl p-6 shadow-2xl flex items-start gap-4 animate-fade-in relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B]/20 to-[#0F172A]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C8A96B]" />
            <div className="text-2xl text-[#C8A96B] mt-0.5">🎉</div>
            <div className="flex-grow pr-8">
              <h4 className="text-base font-bold text-white font-display mb-1">Vitrine criada com sucesso!</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Vitrine criada com sucesso. Agora personalize sua página e publique seu negócio.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        )}

        
        {/* Profile Card Banner */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-44 w-full bg-gray-950 relative">
            {business?.cover_url && isValidStorageUrl(business.cover_url) ? (
              <img src={business.cover_url} alt="Cover" className="w-full h-full object-cover opacity-60" style={coverImgStyle(normalizeCoverFraming(business))} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl"
                style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
              >
                {business?.category ? getCategoryIcon(business.category) : "🏪"}
              </div>
            )}
            
            {/* Upload Cover button — topo direito para não colidir com a toolbar */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {business?.cover_url && (
                <button
                  onClick={() => setFramingOpen(true)}
                  className="cursor-pointer bg-[#0f172a]/80 backdrop-blur px-3 py-1.5 border border-gray-700 hover:border-[#C8A96B] text-xs text-white font-semibold rounded-lg transition-all"
                >
                  Editar enquadramento
                </button>
              )}
              <label className="cursor-pointer bg-[#0f172a]/80 backdrop-blur px-3 py-1.5 border border-gray-700 hover:border-[#C8A96B] text-xs text-[#C8A96B] font-semibold rounded-lg transition-all">
                {uploadingCover ? "Carregando..." : "Alterar Capa"}
                <input id="cover-upload-input" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="px-8 pb-8 pt-0 flex flex-col md:flex-row items-start md:items-end justify-between -mt-10 gap-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
              {/* Logo Badge */}
              <div className="relative group z-10">
                <div className="w-24 h-24 rounded-2xl bg-gray-900 border-2 border-gray-800 flex items-center justify-center overflow-hidden shadow-xl bg-white/5 backdrop-blur">
                  {business?.logo_url ? (
                    <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    getLogoFallback(business?.name)
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-[#C8A96B] font-bold rounded-2xl transition-opacity">
                  {uploadingLogo ? "..." : "Carregar"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-3xl font-display font-bold text-white leading-none">{business?.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      business?.published ? "bg-green-950 border border-green-800 text-green-400" : "bg-red-950 border border-red-900 text-red-400"
                    }`}>
                      {business?.published ? "Público" : "Rascunho"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                      isProTier(business?.plan)
                        ? "bg-[#C8A96B]/20 border border-[#C8A96B]/40 text-[#C8A96B]"
                        : isBusinessTier(business?.plan)
                        ? "bg-purple-950 border border-purple-800 text-purple-400"
                        : "bg-gray-800 border border-gray-700 text-gray-400"
                    }`}>
                      {isPaidTier(business?.plan) && (
                        <Sparkles className="w-2.5 h-2.5" />
                      )}
                      Plano: {business?.plan || "Free"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1 max-w-xl line-clamp-2">{business?.description || "Adicione uma breve descrição para o seu negócio..."}</p>
                <div className="mt-2 text-xs text-[#C8A96B] flex items-center gap-4">
                  <span>URL: <span className="text-gray-300">/vitrine/{business?.slug}</span></span>
                </div>
              </div>
            </div>

            {/* Profile Action Toolbar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => goTab("informacoes")}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors text-sm"
              >
                Editar Informações
              </button>
              <button
                onClick={() => setShowCatalogModal(true)}
                className="flex-1 md:flex-initial px-5 py-2.5 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                <span>📄</span> Gerar Catálogo PDF
              </button>
              <button
                onClick={handleTogglePublish}
                className={`flex-grow md:flex-initial px-5 py-2.5 border rounded-lg font-bold text-sm transition-colors ${
                  business?.published
                    ? "border-red-900 bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white"
                    : "border-green-800 bg-green-950/20 text-green-400 hover:bg-green-800 hover:text-white"
                }`}
              >
                {business?.published ? "Despublicar Vitrine" : "Publicar Vitrine"}
              </button>
            </div>
          </div>
        </div>

        {/* A3.3/A3.17 — Gerenciar Montra: tab navigation */}
        <div className="sticky top-[69px] z-20 -mx-4 px-4 bg-[#0F172A]/95 backdrop-blur border-y border-gray-800">
          <div className="flex gap-1.5 overflow-x-auto py-3 max-w-7xl mx-auto">
            {MONTRA_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => goTab(t.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                  activeTab === t.id
                    ? "bg-[#C8A96B] text-[#0F172A]"
                    : "text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* A3.4 — VISÃO GERAL */}
        {activeTab === "visao-geral" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row gap-6">
                {business?.cover_url && isValidStorageUrl(business.cover_url) ? (
                  <img src={business.cover_url} alt="Capa" className="w-full md:w-64 h-36 object-cover rounded-xl border border-gray-800" style={coverImgStyle(normalizeCoverFraming(business))} />
                ) : (
                  <div className="w-full md:w-64 h-36 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center text-4xl">🏪</div>
                )}
                <div className="flex-grow space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-display font-bold text-white">{business?.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      business?.published ? "bg-green-950 border border-green-800 text-green-400" : "bg-red-950 border border-red-900 text-red-400"
                    }`}>
                      {business?.published ? "Publicada" : "Rascunho"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      isPaidTier(business?.plan) ? "bg-[#C8A96B]/20 border border-[#C8A96B]/40 text-[#C8A96B]" : "bg-gray-800 border border-gray-700 text-gray-400"
                    }`}>
                      Plano: {business?.plan || "Free"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{business?.description || "Sem descrição."}</p>
                  <p className="text-xs text-gray-500">
                    Montra: <span className="text-[#C8A96B]">/vitrine/{business?.slug}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => goTab("informacoes")}
                      className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg text-xs transition-colors"
                    >
                      ✏️ Editar Informações
                    </button>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="px-4 py-2 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 rounded-lg font-bold text-xs transition-colors"
                    >
                      + Adicionar Produto
                    </button>
                    <Link
                      href={`/vitrine/${business?.slug || ""}`}
                      target="_blank"
                      className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-xs hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                    >
                      Ver Montra ↗
                    </Link>
                    <button
                      onClick={handleTogglePublish}
                      className={`px-4 py-2 border rounded-lg font-bold text-xs transition-colors ${
                        business?.published
                          ? "border-red-900 bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white"
                          : "border-green-800 bg-green-950/20 text-green-400 hover:bg-green-800 hover:text-white"
                      }`}
                    >
                      {business?.published ? "Despublicar" : "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => goTab("produtos")} className="bg-gray-900 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl p-5 text-center transition-colors">
                <div className="text-2xl font-display font-bold text-[#C8A96B]">{products.length}</div>
                <div className="text-xs text-gray-400 mt-1">Produtos</div>
              </button>
              <button onClick={() => goTab("galeria")} className="bg-gray-900 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl p-5 text-center transition-colors">
                <div className="text-2xl font-display font-bold text-[#C8A96B]">{gallery.length}</div>
                <div className="text-xs text-gray-400 mt-1">Fotos</div>
              </button>
              <button onClick={() => goTab("avaliacoes")} className="bg-gray-900 border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl p-5 text-center transition-colors">
                <div className="text-2xl font-display font-bold text-[#C8A96B]">{testimonials.length}</div>
                <div className="text-xs text-gray-400 mt-1">Avaliações</div>
              </button>
            </div>

        {business?.slug && (
          <VitrineShareCard slug={business.slug} />
        )}

            {/* Content Calendar Card */}
            <div
              onClick={() => router.push("/dashboard/calendario")}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl cursor-pointer hover:border-[#C8A96B]/40 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h3 className="font-semibold text-[#C8A96B] text-sm">Calendário de Conteúdo</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Planeie e organize as suas publicações</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}
        {/* A3.5/A3.7 — INFORMAÇÕES (reúso do formulário "Editar Perfil Comercial") */}
        {activeTab === "informacoes" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Informações da Montra</h3>
              <p className="text-xs text-gray-500 mt-1">Estes dados aparecem na tua Montra pública. O slug <span className="text-gray-300">/vitrine/{business?.slug}</span> não é editável.</p>
            </div>

            {/* A3.7 — Identidade: logo + capa com preview */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-medium text-gray-400">Logo</label>
                <div className="w-24 h-24 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden">
                  {business?.logo_url && isValidStorageUrl(business.logo_url) ? (
                    <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 text-xs">Sem logo</span>
                  )}
                </div>
                <label className="inline-block cursor-pointer px-4 py-2 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 rounded-lg text-xs font-bold transition-colors">
                  {uploadingLogo ? "A carregar..." : "Alterar logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
              <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-medium text-gray-400">Capa</label>
                <div className="w-full h-24 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
                  {business?.cover_url && isValidStorageUrl(business.cover_url) ? (
                    <img src={business.cover_url} alt="Capa" className="w-full h-full object-cover" style={coverImgStyle(normalizeCoverFraming(business))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Sem capa</div>
                  )}
                </div>
                <label className="inline-block cursor-pointer px-4 py-2 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 rounded-lg text-xs font-bold transition-colors">
                  {uploadingCover ? "A carregar..." : "Alterar capa"}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Negócio</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Categoria</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="">Selecionar categoria...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">País de Origem do Dono (Comunidade)</label>
                  <select
                    value={editOwnerOriginCountry}
                    onChange={(e) => setEditOwnerOriginCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="">Não especificado</option>
                    <option value="Brasil">Brasil 🇧🇷</option>
                    <option value="Angola">Angola 🇦🇴</option>
                    <option value="Cabo Verde">Cabo Verde 🇨🇻</option>
                    <option value="França">França 🇫🇷</option>
                    <option value="Portugal">Portugal 🇵🇹</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">País</label>
                  <select
                    value={editCountry}
                    onChange={(e) => {
                      setEditCountry(e.target.value);
                      setEditCityId("");
                    }}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Cidade</label>
                  <select
                    value={editCityId}
                    onChange={(e) => setEditCityId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="">Selecionar cidade...</option>
                    {cities.filter((c) => c.country === editCountry).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Morada</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Telefone Fixo</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email Comercial</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Facebook (URL)</label>
                  <input
                    type="text"
                    value={editFacebook}
                    onChange={(e) => setEditFacebook(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">TikTok</label>
                  <input
                    type="text"
                    value={editTiktok}
                    onChange={(e) => setEditTiktok(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">YouTube</label>
                  <input
                    type="text"
                    value={editYoutube}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Website</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
              </div>

              {/* A10.4: link direto de avaliação do Google Business Profile */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  ⭐ Link para avaliações do Google
                </label>
                <input
                  type="url"
                  value={editGoogleReviewUrl}
                  onChange={(e) => setEditGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/.../review"
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white placeholder:text-gray-600"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Cole aqui o link para os clientes avaliarem seu negócio diretamente no Google.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="px-5 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-sm transition-colors disabled:opacity-50"
              >
                {savingBusiness ? "A Guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </div>
        )}
        {/* A3.8 — PRODUTOS / MENU */}
        {activeTab === "produtos" && (
          <div className="space-y-6">
            {/* Products Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Os Meus Produtos</h3>
                  <p className="text-xs text-gray-400">Gerencie os artigos ou serviços exibidos na vitrine.</p>
                </div>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 border border-[#C8A96B] hover:bg-[#C8A96B] hover:text-[#0F172A] text-[#C8A96B] text-xs font-bold rounded-lg transition-all"
                >
                  + Adicionar Produto
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
                  <span className="text-4xl">🛍️</span>
                  <p className="text-sm text-gray-500 mt-2">Nenhum produto cadastrado até o momento.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-gray-700 transition-colors">
                      <div className="w-16 h-16 rounded-lg bg-gray-950 border border-gray-800 flex-shrink-0 overflow-hidden relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" style={productImgStyle(normalizeProductFraming(p))} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-900">📦</div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-white truncate text-sm">
                            {p.name}
                            {p.is_visible === false && (
                              <span className="ml-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400">
                                Oculto
                              </span>
                            )}
                            {p.is_visible !== false && p.show_in_explore === false && (
                              <span className="ml-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400">
                                Só Montra
                              </span>
                            )}
                          </h4>
                          {p.price !== null && p.price !== undefined && (
                            <span className="text-[#C8A96B] font-bold text-xs">€{p.price.toFixed(2)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description || "Sem descrição..."}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
        {/* A3.9 — GALERIA */}
        {activeTab === "galeria" && (
          <div className="space-y-6">
            {/* Gallery Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="font-display font-semibold text-[#C8A96B]">Galeria de Fotos</h3>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="text-xs text-[#C8A96B] font-bold hover:underline"
                >
                  {uploadingGallery ? "Processando..." : "+ Enviar"}
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </div>

              {(() => {
                // Fallback geral: galeria vazia mostra as imagens dos produtos (só leitura).
                const usingProductFallback = gallery.length === 0;
                const fallbackItems = usingProductFallback
                  ? products.filter((pr) => pr.image_url).map((pr) => ({ id: `product-${pr.id}`, image_url: pr.image_url as string, is_visible: true }))
                  : [];
                const items = usingProductFallback ? fallbackItems : gallery;
                if (items.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-gray-500">
                      Nenhuma imagem carregada na galeria.
                    </div>
                  );
                }
                return (
                  <>
                    {usingProductFallback && (
                      <p className="text-[11px] text-gray-500">A mostrar imagens dos produtos. Para gerir fotos próprias, usa "+ Enviar".</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((img) => (
                        <div key={img.id} className={`relative aspect-square rounded-lg overflow-hidden border group bg-gray-950 ${!usingProductFallback && img.is_visible === false ? "border-dashed border-gray-700 opacity-60" : "border-gray-850"}`}>
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          {!usingProductFallback && (
                            <>
                              {/* Visível publicamente ON/OFF (ocultar ≠ excluir) */}
                              <button
                                onClick={() => handleToggleGalleryVisibility(img.id, img.is_visible !== false)}
                                title={img.is_visible !== false ? "Ocultar publicamente" : "Mostrar publicamente"}
                                className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center text-sm transition-colors"
                              >
                                {img.is_visible !== false ? "👁️" : "🚫"}
                              </button>
                              <button
                                onClick={() => handleDeleteGalleryImage(img.id)}
                                className="absolute inset-0 bg-red-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-bold transition-opacity"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        )}
        {/* A6.5 — NOVIDADES */}
        {activeTab === "novidades" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Novidades na Vitrine</h3>
                  <p className="text-xs text-gray-400">Publica promoções, eventos e avisos — aparecem no Explorar.</p>
                </div>
                {/* A10.5: o botão aparece em todos os modos exceto "loading" —
                    em "unavailable" a tentativa de guardar mostra o erro real. */}
                {novidadesMode !== "loading" && (
                  <button
                    onClick={openNovidadeModal}
                    className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg transition-colors"
                  >
                    + Publicar novidade
                  </button>
                )}
              </div>

              {novidadesMode === "idle" && (
                <p className="text-xs text-gray-500">A preparar novidades…</p>
              )}
              {novidadesMode === "loading" && (
                <p className="text-xs text-gray-500">A carregar novidades…</p>
              )}
              {novidadesMode === "legacy" && (
                <p className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900 rounded-lg px-3 py-2">
                  Modo básico: para preço, validade e botões de ação, aplica a migration
                  20261006000013_business_posts_novidades.sql no Supabase SQL Editor.
                </p>
              )}
              {novidadesMode === "unavailable" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">As novidades estão indisponíveis de momento.</p>
                  {novidadesError && (
                    <p className="text-xs text-red-400">{novidadesError}</p>
                  )}
                  <button
                    onClick={() => business?.id && loadNovidades(business.id)}
                    className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-lg text-xs hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {(novidadesMode === "full" || novidadesMode === "legacy") && (
                novidades.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
                    <span className="text-4xl">📰</span>
                    <p className="text-sm text-gray-500 mt-2">Ainda não publicaste nenhuma novidade.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {novidades.map((n) => {
                      const isActive = n.is_active !== false;
                      return (
                        <div key={n.id} className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-gray-700 transition-colors">
                          <div className="w-16 h-16 rounded-lg bg-gray-950 border border-gray-800 flex-shrink-0 overflow-hidden">
                            {n.image_url ? (
                              <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-900">📰</div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-white truncate text-sm">{n.title}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex-shrink-0">
                                {novidadeTypeLabel(n.type)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {n.price !== null && n.price !== undefined && (
                                <span className="text-[#C8A96B] font-bold text-xs">€{Number(n.price).toFixed(2)}</span>
                              )}
                              {novidadesMode === "full" && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                  isActive
                                    ? "bg-green-950 border border-green-800 text-green-400"
                                    : "bg-gray-800 border border-gray-700 text-gray-400"
                                }`}>
                                  {isActive ? "Ativa" : "Desativada"}
                                </span>
                              )}
                            </div>
                            {novidadesMode === "full" && (n.starts_at || n.expires_at) && (
                              <p className="text-[11px] text-gray-500 mt-1">
                                {n.starts_at ? `De ${new Date(n.starts_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
                                {n.starts_at && n.expires_at ? " " : ""}
                                {n.expires_at ? `até ${new Date(n.expires_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : ""}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <button
                                onClick={() => openEditNovidade(n)}
                                className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                              >
                                Editar
                              </button>
                              {novidadesMode === "full" && (
                                <button
                                  onClick={() => handleToggleNovidade(n)}
                                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-amber-600 hover:text-amber-400 transition-colors"
                                >
                                  {isActive ? "Desativar" : "Ativar"}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNovidade(n.id)}
                                className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition-colors"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={handleShareNovidade}
                                className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                              >
                                Compartilhar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        )}
        {/* A3.10 — HORÁRIOS (reúso de editHours + handleEditHoursChange) */}
        {activeTab === "horarios" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Horários de Funcionamento</h3>
              {/* A5 — "Atendo hoje": afirmação explícita para negócios de serviço.
                  Tri-state: "Não informado" = NULL (nunca convertido em Não). */}
              <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 max-w-sm">
                <TriStateControl
                  label="⚡ Atendo hoje"
                  value={editServiceToday}
                  onChange={setEditServiceToday}
                  hint="Para serviços: confirma que tens disponibilidade para atender hoje. Aparece no modo 'Preciso Hoje'."
                />
              </div>
              {/* Hours section in edit profile */}
              <div className="space-y-2 border-t border-gray-800 pt-4">
                <label className="block text-xs font-medium text-gray-400">Horários de Funcionamento</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-[#0F172A] border border-gray-800 p-2 rounded">
                  {editHours.map((row, index) => (
                    <div key={row.day} className="flex flex-wrap items-center justify-between text-xs py-1 border-b border-gray-850 last:border-0 gap-2">
                      <span className="w-24 font-medium">{row.day}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={row.open}
                          onChange={(e) => handleEditHoursChange(index, "open", e.target.value)}
                          disabled={row.closed}
                          className="bg-gray-900 border border-gray-800 text-white rounded px-1.5 py-0.5 disabled:opacity-30"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={row.close}
                          onChange={(e) => handleEditHoursChange(index, "close", e.target.value)}
                          disabled={row.closed}
                          className="bg-gray-900 border border-gray-800 text-white rounded px-1.5 py-0.5 disabled:opacity-30"
                        />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.closed}
                          onChange={(e) => handleEditHoursChange(index, "closed", e.target.checked)}
                          className="rounded text-[#C8A96B] bg-gray-900 border-gray-800"
                        />
                        <span>Fechado</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="px-5 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-sm transition-colors disabled:opacity-50"
              >
                {savingBusiness ? "A Guardar..." : "Guardar Horários"}
              </button>
            </div>
          </div>
        )}
        {/* A3.11 — LOCALIZAÇÃO (país/cidade/morada + mapa existente) */}
        {activeTab === "localizacao" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Localização</h3>
              </div>
              <p className="text-sm text-gray-300">
                {[business?.address, cities.find((c) => c.id === business?.city_id)?.name, business?.country, business?.postal_code].filter(Boolean).join(" · ") || "Morada não definida."}
              </p>
              {(typeof business?.latitude === "number" && typeof business?.longitude === "number") ? (
                <p className="text-[11px] text-gray-500">
                  📍 Coordenadas: {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)} — a sua Montra aparece no "Perto de Mim".
                </p>
              ) : (
                <p className="text-[11px] text-gray-500">
                  Sem coordenadas: adicione a morada abaixo e localize automaticamente para aparecer no "Perto de Mim".
                </p>
              )}
            </div>

            {/* A4.4 — editor de localização */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="font-display font-semibold text-[#C8A96B] border-b border-gray-800 pb-3">Dados de localização</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Morada</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Rua, número…"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Código postal</label>
                  <input
                    type="text"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    placeholder="3750-…"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">País</label>
                  <select
                    value={editCountry}
                    onChange={(e) => { setEditCountry(e.target.value); setEditCityId(""); }}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Cidade</label>
                  <select
                    value={editCityId}
                    onChange={(e) => setEditCityId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                  >
                    <option value="">Selecionar cidade...</option>
                    {cities.filter((c: any) => c.country === editCountry).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Geocodificação — o comerciante não precisa saber lat/lng */}
              <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGeocodeAddress}
                    disabled={geoLoading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {geoLoading ? "A localizar…" : "📍 Localizar morada automaticamente"}
                  </button>
                  <p className="text-[11px] text-gray-500">
                    {editLatitude !== null && editLongitude !== null
                      ? `Coordenadas: ${editLatitude.toFixed(5)}, ${editLongitude.toFixed(5)}`
                      : "Sem coordenadas — a geocodificação preenche automaticamente."}
                  </p>
                </div>
                {geoMessage && (
                  <p className="text-[11px] text-gray-400 leading-relaxed">{geoMessage}</p>
                )}
              </div>

              <button
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="w-full py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {savingBusiness ? "A guardar…" : "Guardar localização"}
              </button>
            </div>
            {/* Location Mini Map */}
            {business?.address && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-display font-semibold text-[#C8A96B] border-b border-gray-800 pb-3">Localização</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{business.address}</p>
                <div className="rounded-xl overflow-hidden h-40 bg-slate-800">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(business.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 border border-[#C8A96B]/30 text-[#C8A96B] rounded-lg text-xs font-semibold hover:bg-[#C8A96B] hover:text-[#0F172A] transition-colors"
                >
                  📍 Ver no Google Maps
                </a>
              </div>
            )}


          </div>
        )}
        {/* A3.12 — AVALIAÇÕES */}
        {activeTab === "avaliacoes" && (
          <div className="space-y-6">
            {/* Testimonials Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Avaliações</h3>
                  <p className="text-xs text-gray-400">Verifique e adicione reviews recomendados por clientes.</p>
                </div>
                <button
                  onClick={() => setShowTestimonialModal(true)}
                  className="px-4 py-2 border border-[#C8A96B] hover:bg-[#C8A96B] hover:text-[#0F172A] text-[#C8A96B] text-xs font-bold rounded-lg transition-all"
                >
                  + Adicionar Depoimento
                </button>
              </div>

              {testimonials.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
                  <span className="text-4xl">⭐</span>
                  <p className="text-sm text-gray-500 mt-2">Sem depoimentos de clientes ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials.map((t) => (
                    <div key={t.id} className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-white">{t.author_name}</span>
                        <div className="flex text-[#C8A96B] text-xs">
                          {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                          {Array.from({ length: 5 - t.rating }).map((_, i) => <span key={i} className="text-gray-700">★</span>)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed italic mb-3">&quot;{t.text}&quot;</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditTestimonial(t)}
                          className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* A3.13 — CATÁLOGO (editor + PDF existentes) */}
        {activeTab === "catalogo" && (
          <div className="space-y-6">
            {/* Catalog Editor Card */}
            <div
              onClick={() => {
                const isPaid = isPaidTier(business?.plan)
                if (isPaid) {
                  router.push("/dashboard/catalogo")
                } else {
                  setShowCatalogUpgradeModal(true)
                }
              }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl cursor-pointer hover:border-[#C8A96B]/40 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <h3 className="font-semibold text-[#C8A96B] text-sm">Catálogo Digital</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Editor de catálogo profissional</p>
                  </div>
                </div>
                {!isPaidTier(business?.plan) && (
                  <span className="text-[10px] font-bold text-[#0a0d14] bg-[#c9a96e] px-2 py-0.5 rounded-full">PRO</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Cria um catálogo elegante com capa, produtos e preços. Partilha online ou exporta em PDF.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-[10px] text-gray-600">
                  <span>✓ Flipbook interativo</span>
                  <span>✓ Exportar PDF</span>
                </div>
                <span className="text-xs text-[#C8A96B] font-semibold group-hover:translate-x-1 transition-transform inline-block">
                  Abrir →
                </span>
              </div>
            </div>


            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-[#C8A96B]">Catálogo em PDF</h3>
                <p className="text-xs text-gray-500 mt-1">Gera um PDF da tua Montra com os produtos atuais.</p>
              </div>
              <button
                onClick={() => setShowCatalogModal(true)}
                className="px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors text-sm"
              >
                📄 Gerar Catálogo PDF
              </button>
            </div>
          </div>
        )}
        {/* A3.14 — ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
        {business && (
          <AnalyticsSection
            businessId={business.id}
            plan={business.plan || "free"}
          />
        )}
          </div>
        )}
        {/* A3.15 — PLANO */}
        {activeTab === "plano" && (
          <div className="space-y-6">
        {business && (
          <PlanSection
            plan={business.plan || "free"}
            onUpgrade={handleUpgrade}
            checkoutLoading={checkoutLoading}
            subscriptionCancelAt={business.subscription_cancel_at ?? null}
            onCancelRequest={() => setShowCancelModal(true)}
          />
        )}

        {business && (
          <ShortLinkCard plan={business.plan || "free"} />
        )}

          </div>
        )}
      </main>

      {/* ---------------- MODALS SECTION ---------------- */}


      {/* ADD PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={handleAddProduct}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-semibold text-[#C8A96B]">Adicionar Novo Produto</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  placeholder="Ex: Bolo de Chocolate, Manicure simples"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                  placeholder="Ex: Feito com chocolate belga e morangos frescos"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Preço (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  placeholder="Ex: 15.50"
                />
              </div>

              {/* A5 — Disponibilidade "hoje" (tri-state; "Não informado" = NULL) */}
              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-[#C8A96B]">⚡ Disponibilidade hoje</p>
                <TriStateControl
                  label="Disponível hoje"
                  value={prodAvailable}
                  onChange={setProdAvailable}
                  hint="O produto pode ser comprado/levantado hoje."
                />
                <TriStateControl
                  label="Retirada hoje"
                  value={prodPickup}
                  onChange={setProdPickup}
                  hint="O cliente pode levantar hoje (independente de 'Disponível hoje')."
                />
                <TriStateControl
                  label="Entrega hoje"
                  value={prodDelivery}
                  onChange={setProdDelivery}
                  hint="Entrega no próprio dia (independente de 'Disponível hoje')."
                />
              </div>

              {/* Product Image Upload */}
              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg">
                <label className="block text-xs font-medium text-gray-400 mb-2">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden">
                    {prodPreview ? (
                      <img src={prodPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-gray-800 text-xs text-[#C8A96B] border border-gray-700 hover:border-[#C8A96B] rounded font-semibold transition-all">
                    Selecionar Imagem
                    <input type="file" accept="image/*" onChange={handleProductImageSelect} className="hidden" />
                  </label>
                </div>
<p className="text-[11px] text-slate-500 mt-2">Formato recomendado: 1080 × 1350 px (4:5). Evite colocar textos, preços ou logótipos muito próximos das bordas.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-xs transition-colors"
              >
                {savingProduct ? "A Guardar..." : "Adicionar"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={handleSaveEditProduct}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-semibold text-[#C8A96B]">Editar Produto</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Preço (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  placeholder="Ex: 15.50"
                />
              </div>

              {/* A5 — Disponibilidade "hoje" (tri-state; "Não informado" = NULL) */}
              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-[#C8A96B]">⚡ Disponibilidade hoje</p>
                <TriStateControl
                  label="Disponível hoje"
                  value={editProdAvailable}
                  onChange={setEditProdAvailable}
                  hint="O produto pode ser comprado/levantado hoje."
                />
                <TriStateControl
                  label="Retirada hoje"
                  value={editProdPickup}
                  onChange={setEditProdPickup}
                  hint="O cliente pode levantar hoje (independente de 'Disponível hoje')."
                />
                <TriStateControl
                  label="Entrega hoje"
                  value={editProdDelivery}
                  onChange={setEditProdDelivery}
                  hint="Entrega no próprio dia (independente de 'Disponível hoje')."
                />
              </div>

              {/* Visibilidade: Montra + Explorar (ocultar ≠ excluir) */}
              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-[#C8A96B]">👁️ Visibilidade</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editProdVisible}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setEditProdVisible(v);
                      // Ocultar da Montra força show_in_explore=false (regra).
                      if (!v) setEditProdExplore(false);
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#C8A96B]"
                  />
                  <span>
                    <span className="block text-xs font-medium text-gray-200">Visível na Montra</span>
                    <span className="block text-[11px] text-gray-500">Aparece no catálogo público da tua Montra.</span>
                  </span>
                </label>
                <label className={`flex items-start gap-3 ${!editProdVisible ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={editProdExplore}
                    disabled={!editProdVisible}
                    onChange={(e) => setEditProdExplore(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#C8A96B]"
                  />
                  <span>
                    <span className="block text-xs font-medium text-gray-200">Aparecer no Explorar</span>
                    <span className="block text-[11px] text-gray-500">Distribuído no feed e na busca do Explorar. Só funciona se visível na Montra.</span>
                  </span>
                </label>
              </div>

              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg">
                <label className="block text-xs font-medium text-gray-400 mb-2">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden">
                    {editProdPreview ? (
                      <img src={editProdPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-gray-800 text-xs text-[#C8A96B] border border-gray-700 hover:border-[#C8A96B] rounded font-semibold transition-all text-center">
                      Alterar Imagem
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setEditProdFile(f); setEditProdPreview(URL.createObjectURL(f)); }
                        }}
                        className="hidden"
                      />
                    </label>
                    {editingProduct?.image_url && (
                      <button
                        type="button"
                        onClick={() => setProdFramingOpen(true)}
                        className="px-3 py-1.5 bg-gray-800 text-xs text-slate-300 border border-gray-700 hover:border-[#C8A96B] hover:text-[#C8A96B] rounded font-semibold transition-all"
                      >
                        Editar enquadramento
                      </button>
                    )}
                  </div>
                </div>
<p className="text-[11px] text-slate-500 mt-2">Formato recomendado: 1080 × 1350 px (4:5). Evite colocar textos, preços ou logótipos muito próximos das bordas.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEditProduct}
                className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-xs transition-colors"
              >
                {savingEditProduct ? "A Guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* A6.5 — PUBLICAR/EDITAR NOVIDADE */}
      {showNovidadeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={handleSaveNovidade}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => { setShowNovidadeModal(false); resetNovidadeForm(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-semibold text-[#C8A96B]">
              {editingNovidade ? "Editar Novidade" : "Publicar Novidade"}
            </h3>

            {/* Pré-visualização ao vivo (como aparece no Explorar) */}
            <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pré-visualização</p>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-w-[240px]">
                {novPreview ? (
                  <div className="relative aspect-[4/3] bg-gray-950">
                    <img src={novPreview} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0F172A]/90 border border-[#C8A96B]/40 text-[#C8A96B] text-[10px] font-bold">
                      {novidadeTypeLabel(novType)}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 pt-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#C8A96B]/40 text-[#C8A96B] text-[10px] font-bold">
                      {novidadeTypeLabel(novType)}
                    </span>
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <p className="text-sm font-semibold text-white line-clamp-2">{novTitle || "Título da novidade"}</p>
                  <p className="text-[11px] text-gray-500 truncate">{business?.name}</p>
                  {novPrice && (
                    <p className="text-sm font-bold text-[#C8A96B]">€{Number(novPrice).toFixed(2)}</p>
                  )}
                  <div className="px-3 py-2 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-lg text-center mt-1">
                    {novCtaType === "ver_produto" ? "Ver produto" : "Ver Montra"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tipo *</label>
                <select
                  value={novType}
                  onChange={(e) => setNovType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                >
                  {NOVIDADE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg">
                <label className="block text-xs font-medium text-gray-400 mb-2">Foto</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden">
                    {novPreview ? (
                      <img src={novPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📰</span>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-gray-800 text-xs text-[#C8A96B] border border-gray-700 hover:border-[#C8A96B] rounded font-semibold transition-all">
                    Selecionar Imagem
                    <input type="file" accept="image/*" onChange={handleNovidadeImageSelect} className="hidden" />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Recomendado: 4:5 — 1080 × 1350 px. JPG ou WEBP. Máx. 5 MB. Retrato, quadrada e paisagem são aceites. Evite textos, preços e logótipos muito próximos das bordas.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Título *</label>
                <input
                  type="text"
                  value={novTitle}
                  onChange={(e) => setNovTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  placeholder="Ex: Menu do dia: feijoada completa"
                  required
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={novContent}
                  onChange={(e) => setNovContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                  placeholder="Detalhes da novidade…"
                />
              </div>

              {novidadesMode === "full" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Preço (€) — opcional</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novPrice}
                      onChange={(e) => setNovPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                      placeholder="Ex: 12.90"
                    />
                  </div>

                  <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#C8A96B]">📅 Validade</p>
                      <button
                        type="button"
                        onClick={setNovidadeTodayOnly}
                        className="text-[10px] px-2 py-1 rounded border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 font-bold transition-colors"
                      >
                        ⚡ Só hoje
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Início</label>
                        <input
                          type="datetime-local"
                          value={novStartsAt}
                          onChange={(e) => setNovStartsAt(e.target.value)}
                          className="w-full px-2 py-2 bg-[#0F172A] border border-gray-800 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Fim</label>
                        <input
                          type="datetime-local"
                          value={novExpiresAt}
                          onChange={(e) => setNovExpiresAt(e.target.value)}
                          className="w-full px-2 py-2 bg-[#0F172A] border border-gray-800 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">Vazio = sem limite. Fora da validade, a novidade sai do Explorar automaticamente.</p>
                  </div>

                  <div className="bg-[#0f172a] p-3 border border-gray-800 rounded-lg space-y-3">
                    <p className="text-xs font-semibold text-[#C8A96B]">🔗 Botão de ação (CTA)</p>
                    <select
                      value={novCtaType}
                      onChange={(e) => setNovCtaType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                    >
                      {NOVIDADE_CTA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {novCtaType === "ver_produto" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Produto de destino *</label>
                        <select
                          value={novProductId}
                          onChange={(e) => setNovProductId(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                          required
                        >
                          <option value="">Escolher produto…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => { setShowNovidadeModal(false); resetNovidadeForm(); }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingNovidade}
                className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-xs transition-colors disabled:opacity-60"
              >
                {savingNovidade ? "A Publicar..." : editingNovidade ? "Guardar Alterações" : "Publicar"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* ADD TESTIMONIAL MODAL */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={handleAddTestimonial}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowTestimonialModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-semibold text-[#C8A96B]">Adicionar Depoimento</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Autor *</label>
                <input
                  type="text"
                  value={testAuthor}
                  onChange={(e) => setTestAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  placeholder="Ex: Carlos Santos"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Avaliação (1 a 5 estrelas) *</label>
                <select
                  value={testRating}
                  onChange={(e) => setTestRating(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                >
                  <option value={5}>5 estrelas (Excelente)</option>
                  <option value={4}>4 estrelas (Bom)</option>
                  <option value={3}>3 estrelas (Regular)</option>
                  <option value={2}>2 estrelas (Ruim)</option>
                  <option value={1}>1 estrela (Péssimo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Depoimento *</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                  placeholder="Ex: Excelente francesinha! O molho é divinal e o atendimento muito simpático."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowTestimonialModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingTestimonial}
                className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-xs transition-colors"
              >
                {savingTestimonial ? "A Guardar..." : "Adicionar"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* EDIT TESTIMONIAL MODAL */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={handleSaveEditTestimonial}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setEditingTestimonial(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-semibold text-[#C8A96B]">Editar Depoimento</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Autor *</label>
                <input
                  type="text"
                  value={editTestAuthor}
                  onChange={(e) => setEditTestAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Avaliação</label>
                <select
                  value={editTestRating}
                  onChange={(e) => setEditTestRating(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none"
                >
                  <option value={5}>5 estrelas (Excelente)</option>
                  <option value={4}>4 estrelas (Bom)</option>
                  <option value={3}>3 estrelas (Regular)</option>
                  <option value={2}>2 estrelas (Ruim)</option>
                  <option value={1}>1 estrela (Péssimo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Depoimento *</label>
                <textarea
                  value={editTestText}
                  onChange={(e) => setEditTestText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEditTestimonial}
                className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-xs transition-colors"
              >
                {savingEditTestimonial ? "A Guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* CANCEL SUBSCRIPTION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="flex min-h-full p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="bg-gray-900 border border-red-900/40 rounded-2xl max-w-md w-full m-auto p-6 shadow-2xl space-y-5 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-white">Cancelar Assinatura</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Plano <span className="capitalize text-[#C8A96B]">{business?.plan}</span>
                </p>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-2 text-sm text-gray-300">
              <p className="font-medium text-white text-sm">O que acontece ao cancelar:</p>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Manténs o acesso premium até ao fim do período já pago.</li>
                <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> A tua vitrine permanece visível no marketplace.</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> No fim do período perdes o destaque e as estatísticas.</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> O plano será revertido para Grátis automaticamente.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                Manter Assinatura
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2.5 bg-red-900 hover:bg-red-800 border border-red-700 text-red-200 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    A cancelar...
                  </>
                ) : (
                  "Confirmar Cancelamento"
                )}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* CATALOG PDF MODAL */}
      {showCatalogModal && business && (
        <CatalogPdfModal
          business={business}
          products={products}
          plan={business.plan || "free"}
          onClose={() => setShowCatalogModal(false)}
        />
      )}

      {/* CATALOG UPGRADE MODAL */}
      {showCatalogUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#C8A96B]/30 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="font-display text-xl font-bold text-[#f5f0e8] mb-3">Catálogo Digital</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              O editor de catálogos está disponível nos planos Pro e Business.<br />
              Actualiza agora para criar o teu catálogo profissional.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCatalogUpgradeModal(false)}
                className="px-5 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:text-white transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => { setShowCatalogUpgradeModal(false); handleUpgrade("pro"); }}
                className="px-6 py-2.5 bg-[#c9a96e] text-[#0a0d14] rounded-lg text-sm font-bold hover:bg-[#d4b87e] transition-colors"
              >
                Actualizar para Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#1E293B] border border-[#C8A96B]/40 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in max-w-sm text-center">
          {toast}
        </div>
      )}

      {/* Editor de enquadramento da capa */}
      {prodFramingOpen && editingProduct?.image_url && (
        <ProductFramingEditor
          imageUrl={editingProduct.image_url}
          initial={normalizeProductFraming(editingProduct)}
          onSave={handleSaveProductFraming}
          onReplace={() => setProdFramingOpen(false)}
          onRemove={async () => {
            const { error } = await supabase.from("products").update({ image_url: null, image_position_x: null, image_position_y: null, image_zoom: null }).eq("id", editingProduct.id);
            if (error) { alert("Erro ao remover imagem: " + error.message); return; }
            setProducts((prev: any[]) => prev.map((pr) => pr.id === editingProduct.id ? { ...pr, image_url: undefined } : pr));
            setEditProdPreview("");
            setProdFramingOpen(false);
          }}
          onClose={() => setProdFramingOpen(false)}
        />
      )}

      {framingOpen && business?.cover_url && (
        <CoverFramingEditor
          coverUrl={business.cover_url}
          initial={normalizeCoverFraming(business)}
          onSave={handleSaveFraming}
          onReplace={handleReplaceCover}
          onRemove={handleRemoveCover}
          onClose={() => setFramingOpen(false)}
        />
      )}
    </div>
  );
}

// A3: useSearchParams requires a Suspense boundary.
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <div className="text-[#C8A96B] font-display text-xl animate-pulse">Carregando painel...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

// ─── Tri-state control (A5 "Preciso Hoje") ────────────────────────────────
// Segmented "Não informado | Sim | Não". NULL é um estado real e visível:
// o comerciante pode voltar um campo para "Não informado" a qualquer momento.
// Nunca converter null em false automaticamente.
function TriStateControl({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  hint?: string;
}) {
  const opts: { v: boolean | null; label: string }[] = [
    { v: null, label: "Não informado" },
    { v: true, label: "Sim" },
    { v: false, label: "Não" },
  ];
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <div className="flex rounded-lg overflow-hidden border border-gray-800">
        {opts.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.v)}
            className={`flex-1 px-2 py-1.5 text-xs font-semibold transition-colors ${
              value === o.v
                ? "bg-[#C8A96B] text-[#0F172A]"
                : "bg-[#0F172A] text-gray-400 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-[10px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Vitrine Share Card ────────────────────────────────────────────────────
function VitrineShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  // QR/data: fonte central única (lib/vitrine-share) — o QR codifica
  // EXATAMENTE a mesma URL do "Copiar Link".
  const vitrineUrl = buildVitrineUrl(slug);
  const waText = encodeURIComponent(`Visita a minha vitrine profissional: ${vitrineUrl}`);
  const waUrl = `https://wa.me/?text=${waText}`;
  const qrSrc = buildVitrineQrSrc(slug);

  const handleCopy = () => {
    navigator.clipboard.writeText(vitrineUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gray-900 border border-[#C8A96B]/20 rounded-2xl p-6 shadow-xl mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#C8A96B] text-base">🔗</span>
        <h4 className="text-sm font-bold text-white">Link da tua Vitrine</h4>
      </div>
      <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">
        Use este link na bio do Instagram, WhatsApp, cartões digitais e materiais de divulgação.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Left: URL + actions */}
        <div className="flex-grow space-y-3">
          {/* URL box */}
          <div className="flex items-center gap-2 bg-[#0F172A] border border-gray-800 rounded-xl px-4 py-3">
            <a
              href={`/vitrine/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow text-xs text-[#C8A96B] font-mono hover:underline truncate"
            >
              {vitrineUrl}
            </a>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? "bg-green-700 text-white"
                  : "bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A]"
              }`}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar Link</>}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-green-700 hover:bg-green-600 text-white transition-all"
            >
              <span>📲</span> Partilhar no WhatsApp
            </a>
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          {/* p-2 + qzone=4 no QR: os padrões de localização nunca tocam
              os cantos arredondados (bug: rounded-xl cortava os finders
              e o QR deixava de ser legível). */}
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden border border-gray-800 bg-[#0F172A] flex items-center justify-center p-2">
            <img
              src={qrSrc}
              alt={`QR Code da vitrine de ${slug}`}
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] text-gray-500">QR Code</span>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog PDF Modal ────────────────────────────────────────────────────

const TITLE_FONTS = [
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Cormorant Garamond", value: "Cormorant Garamond" },
  { label: "Libre Baskerville", value: "Libre Baskerville" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Raleway", value: "Raleway" },
];

const BODY_FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "Lato", value: "Lato" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Source Sans 3", value: "Source Sans 3" },
];

interface CatalogPrefs {
  colorBg: string;
  colorAccent: string;
  colorText: string;
  colorSection: string;
  titleFont: string;
  bodyFont: string;
  inclProducts: boolean;
  inclServices: boolean;
  inclHours: boolean;
  inclLocation: boolean;
  footerPhrase: string;
}

const DEFAULT_PREFS: CatalogPrefs = {
  colorBg: "#0a0d14",
  colorAccent: "#c9a96e",
  colorText: "#f5f0e8",
  colorSection: "#f7f5f0",
  titleFont: "Playfair Display",
  bodyFont: "Inter",
  inclProducts: true,
  inclServices: true,
  inclHours: true,
  inclLocation: true,
  footerPhrase: "",
};

function buildCatalogHtml_DELETED_PLACEHOLDER_DO_NOT_USE(biz: any, products: any[], prefs: CatalogPrefs): string {
  // PDF generation moved to server-side /api/generate-catalog (Puppeteer)
  return "";

  const baseUrl = getSiteUrl();
  const vitrineUrl = `${baseUrl}/vitrine/${biz.slug || ""}`;
  const gFonts = `${prefs.titleFont}:wght@400;700&family=${prefs.bodyFont}:wght@400;600`.replace(/ /g, "+");
  const hours: any[] = Array.isArray(biz.opening_hours) ? biz.opening_hours : [];
  const openDays = hours.filter((h) => !h.closed && h.open && h.close);

  const featured = products[0];
  const rest = products.slice(1);

  const servicesRaw: string[] = Array.isArray(biz.services)
    ? biz.services
    : typeof biz.services === "string"
    ? biz.services.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=${gFonts}&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'${prefs.bodyFont}',sans-serif;background:#fff;color:#111;width:210mm}
  .page{width:210mm;min-height:297mm;page-break-after:always;overflow:hidden}

  /* ── CAPA ── */
  .cover{background:${prefs.colorBg};color:${prefs.colorText};padding:60px 50px;min-height:297mm;display:flex;flex-direction:column;justify-content:space-between;position:relative}
  .cover-top{display:flex;justify-content:space-between;align-items:flex-start}
  .cover-tag{font-family:'${prefs.bodyFont}',sans-serif;font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${prefs.colorAccent};border:1px solid ${prefs.colorAccent}44;padding:5px 12px;border-radius:20px}
  .cover-year{font-size:9px;color:${prefs.colorAccent}88;letter-spacing:2px}
  .cover-center{flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 0}
  .cover-pre{font-family:'${prefs.bodyFont}',sans-serif;font-size:10px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${prefs.colorAccent};margin-bottom:20px}
  .cover-title{font-family:'${prefs.titleFont}',serif;font-size:52px;font-weight:700;line-height:1.1;color:${prefs.colorText};margin-bottom:16px}
  .cover-sub{font-size:14px;color:${prefs.colorAccent};font-weight:600;letter-spacing:1px;margin-bottom:30px}
  .cover-divider{width:60px;height:3px;background:${prefs.colorAccent};margin-bottom:24px;border-radius:2px}
  .cover-desc{font-size:12px;color:${prefs.colorText}bb;line-height:1.7;max-width:420px}
  .cover-contacts{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
  .cover-contact-item{font-size:10px;color:${prefs.colorText}99;text-align:right}
  .cover-contact-label{color:${prefs.colorAccent};font-weight:600;margin-right:6px}
  .cover-footer-bar{border-top:1px solid ${prefs.colorAccent}33;padding-top:20px;display:flex;justify-content:space-between;align-items:center}
  .cover-footer-url{font-size:9px;color:${prefs.colorAccent};letter-spacing:1px}
  .cover-footer-logo{font-family:'${prefs.titleFont}',serif;font-size:12px;color:${prefs.colorText}55;letter-spacing:2px}

  /* ── CONTEÚDO ── */
  .content-page{background:#fff;padding:50px}
  .section{margin-bottom:40px}
  .section-label{font-size:8px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:${prefs.colorAccent};margin-bottom:14px}
  .section-title{font-family:'${prefs.titleFont}',serif;font-size:26px;font-weight:700;color:#0a0d14;margin-bottom:6px}
  .gold-bar{width:40px;height:3px;background:${prefs.colorAccent};border-radius:2px;margin-bottom:24px}

  /* produtos */
  .featured-product{background:${prefs.colorBg};border-radius:12px;padding:24px;display:flex;gap:24px;margin-bottom:24px;align-items:center}
  .featured-img{width:100px;height:100px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#1e2533}
  .featured-img-placeholder{width:100px;height:100px;border-radius:8px;background:#1e2533;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0}
  .featured-badge{display:inline-block;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${prefs.colorAccent};border:1px solid ${prefs.colorAccent}44;padding:3px 8px;border-radius:10px;margin-bottom:8px}
  .featured-name{font-family:'${prefs.titleFont}',serif;font-size:20px;font-weight:700;color:${prefs.colorText};margin-bottom:6px}
  .featured-desc{font-size:11px;color:${prefs.colorText}88;line-height:1.6}
  .featured-price{font-size:18px;font-weight:700;color:${prefs.colorAccent};margin-top:8px}
  .products-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .product-card{border:1px solid #e8e4dd;border-radius:10px;overflow:hidden}
  .product-card-img{width:100%;height:80px;object-fit:cover;background:#f0ede8;display:flex;align-items:center;justify-content:center;font-size:22px}
  .product-card-body{padding:12px}
  .product-card-name{font-family:'${prefs.titleFont}',serif;font-size:13px;font-weight:700;color:#0a0d14;margin-bottom:4px}
  .product-card-desc{font-size:9px;color:#666;line-height:1.5;margin-bottom:6px}
  .product-card-price{font-size:12px;font-weight:700;color:${prefs.colorAccent}}

  /* serviços */
  .services-list{list-style:none;display:flex;flex-direction:column;gap:12px}
  .service-item{display:flex;align-items:flex-start;gap:16px;padding:14px 16px;border:1px solid #e8e4dd;border-radius:8px}
  .service-num{font-family:'${prefs.titleFont}',serif;font-size:22px;font-weight:700;color:${prefs.colorAccent};line-height:1;flex-shrink:0;width:32px}
  .service-text{font-size:12px;color:#333;line-height:1.5;padding-top:4px}

  /* horários */
  .hours-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .hour-row{display:flex;justify-content:space-between;padding:8px 12px;background:${prefs.colorSection};border-radius:6px;font-size:11px}
  .hour-day{font-weight:600;color:#333}
  .hour-time{color:${prefs.colorAccent};font-weight:600}

  /* localização */
  .location-box{background:${prefs.colorSection};border-radius:10px;padding:20px 24px;border-left:3px solid ${prefs.colorAccent}}
  .location-addr{font-size:13px;font-weight:600;color:#0a0d14;margin-bottom:4px}
  .location-city{font-size:11px;color:#666}

  /* rodapé */
  .pdf-footer{border-top:2px solid ${prefs.colorAccent};padding-top:20px;margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-left .footer-biz{font-family:'${prefs.titleFont}',serif;font-size:14px;font-weight:700;color:#0a0d14}
  .footer-left .footer-phrase{font-size:9px;color:#999;margin-top:3px;max-width:260px;line-height:1.5}
  .footer-right .footer-url{font-size:9px;color:${prefs.colorAccent};font-weight:600;letter-spacing:0.5px}
  .footer-right .footer-brand{font-size:8px;color:#ccc;margin-top:3px;text-align:right}
</style>
</head>
<body>

<!-- ══ CAPA ══ -->
<div class="page cover">
  <div class="cover-top">
    <span class="cover-tag">${biz.category || "Negócio Local"}</span>
    <span class="cover-year">CATÁLOGO ${new Date().getFullYear()}</span>
  </div>

  <div class="cover-center">
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <div class="cover-pre">Catálogo Profissional</div>
        <h1 class="cover-title">${biz.name || "Negócio"}</h1>
        <div class="cover-sub">${biz.category || ""}${biz.city ? " · " + biz.city : ""}</div>
        <div class="cover-divider"></div>
        <p class="cover-desc">${(biz.description || "").slice(0, 200)}</p>
      </div>
      <div class="cover-contacts">
        ${biz.phone ? `<div class="cover-contact-item"><span class="cover-contact-label">Tel.</span>${biz.phone}</div>` : ""}
        ${biz.whatsapp ? `<div class="cover-contact-item"><span class="cover-contact-label">WhatsApp</span>${biz.whatsapp}</div>` : ""}
        ${biz.email ? `<div class="cover-contact-item"><span class="cover-contact-label">Email</span>${biz.email}</div>` : ""}
        ${biz.instagram ? `<div class="cover-contact-item"><span class="cover-contact-label">Instagram</span>@${biz.instagram.replace(/^@/, "")}</div>` : ""}
      </div>
    </div>
  </div>

  <div class="cover-footer-bar">
    <span class="cover-footer-url">${vitrineUrl}</span>
    <span class="cover-footer-logo">VITRINEPRO</span>
  </div>
</div>

<!-- ══ CONTEÚDO ══ -->
<div class="page content-page">

  ${prefs.inclProducts && products.length > 0 ? `
  <div class="section">
    <div class="section-label">Catálogo</div>
    <h2 class="section-title">Os Nossos Produtos</h2>
    <div class="gold-bar"></div>

    ${featured ? `
    <div class="featured-product">
      ${featured.image_url
        ? `<img class="featured-img" src="${featured.image_url}" alt="${featured.name}" style="object-position:${featured.image_position_x ?? 50}% ${featured.image_position_y ?? 50}%;transform:scale(${featured.image_zoom ?? 1})"/>`
        : `<div class="featured-img-placeholder">📦</div>`}
      <div>
        <span class="featured-badge">Destaque</span>
        <div class="featured-name">${featured.name}</div>
        <div class="featured-desc">${(featured.description || "").slice(0, 120)}</div>
        ${featured.price != null ? `<div class="featured-price">€${Number(featured.price).toFixed(2)}</div>` : ""}
      </div>
    </div>` : ""}

    ${rest.length > 0 ? `
    <div class="products-grid">
      ${rest.slice(0, 9).map((p: any) => `
      <div class="product-card">
        <div class="product-card-img">
          ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:80px;object-fit:cover"/>` : "📦"}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-desc">${(p.description || "").slice(0, 60)}</div>
          ${p.price != null ? `<div class="product-card-price">€${Number(p.price).toFixed(2)}</div>` : ""}
        </div>
      </div>`).join("")}
    </div>` : ""}
  </div>` : ""}

  ${prefs.inclServices && servicesRaw.length > 0 ? `
  <div class="section">
    <div class="section-label">Serviços</div>
    <h2 class="section-title">O Que Oferecemos</h2>
    <div class="gold-bar"></div>
    <ul class="services-list">
      ${servicesRaw.slice(0, 8).map((s: string, i: number) => `
      <li class="service-item">
        <span class="service-num">0${i + 1}</span>
        <span class="service-text">${s}</span>
      </li>`).join("")}
    </ul>
  </div>` : ""}

  ${prefs.inclHours && openDays.length > 0 ? `
  <div class="section">
    <div class="section-label">Horários</div>
    <h2 class="section-title">Quando Estamos Abertos</h2>
    <div class="gold-bar"></div>
    <div class="hours-grid">
      ${openDays.map((h: any) => `
      <div class="hour-row">
        <span class="hour-day">${h.day}</span>
        <span class="hour-time">${h.open} – ${h.close}</span>
      </div>`).join("")}
    </div>
  </div>` : ""}

  ${prefs.inclLocation && (biz.address || biz.city) ? `
  <div class="section">
    <div class="section-label">Localização</div>
    <h2 class="section-title">Onde Nos Encontrar</h2>
    <div class="gold-bar"></div>
    <div class="location-box">
      ${biz.address ? `<div class="location-addr">${biz.address}</div>` : ""}
      ${biz.city ? `<div class="location-city">${biz.city}${biz.country ? ", " + biz.country : ""}</div>` : ""}
    </div>
  </div>` : ""}

  <div class="pdf-footer">
    <div class="footer-left">
      <div class="footer-biz">${biz.name}</div>
      ${prefs.footerPhrase ? `<div class="footer-phrase">${prefs.footerPhrase}</div>` : ""}
    </div>
    <div class="footer-right">
      <div class="footer-url">${vitrineUrl}</div>
      <div class="footer-brand">vitrinepro.digital</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

function CatalogPdfModal({
  business,
  products,
  plan,
  onClose,
}: {
  business: any;
  products: any[];
  plan: string;
  onClose: () => void;
}) {
  const isPremium = isPaidTier(plan);
  const [prefs, setPrefs] = useState<CatalogPrefs>(() => {
    const saved = business.catalog_settings;
    if (!saved) return DEFAULT_PREFS;
    return {
      colorBg: saved.corCapa ?? DEFAULT_PREFS.colorBg,
      colorAccent: saved.corDestaque ?? DEFAULT_PREFS.colorAccent,
      colorText: saved.corTexto ?? DEFAULT_PREFS.colorText,
      colorSection: saved.corFundo ?? DEFAULT_PREFS.colorSection,
      titleFont: saved.fonteTitulo ?? DEFAULT_PREFS.titleFont,
      bodyFont: saved.fonteCorpo ?? DEFAULT_PREFS.bodyFont,
      inclProducts: saved.incluirProdutos ?? DEFAULT_PREFS.inclProducts,
      inclServices: saved.incluirServicos ?? DEFAULT_PREFS.inclServices,
      inclHours: saved.incluirHorarios ?? DEFAULT_PREFS.inclHours,
      inclLocation: DEFAULT_PREFS.inclLocation,
      footerPhrase: saved.fraseRodape ?? DEFAULT_PREFS.footerPhrase,
    };
  });
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const set = <K extends keyof CatalogPrefs>(key: K, val: CatalogPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const buildSettings = () => ({
    corCapa: prefs.colorBg,
    corDestaque: prefs.colorAccent,
    corTexto: prefs.colorText,
    corFundo: prefs.colorSection,
    fonteTitulo: prefs.titleFont,
    fonteCorpo: prefs.bodyFont,
    incluirProdutos: prefs.inclProducts,
    incluirServicos: prefs.inclServices,
    incluirHorarios: prefs.inclHours,
    fraseRodape: prefs.footerPhrase,
  });

  const handleGenerate = async (preview = false) => {
    if (preview) setPreviewing(true);
    else setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Não autenticado.");

      const res = await fetch("/api/generate-catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId: business.id, settings: buildSettings() }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).error || `Erro ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (preview) {
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(business.name || "catalogo").toLowerCase().replace(/\s+/g, "-")}_catalogo.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        trackCatalogPdfDownload(business.id, business.name);
      }
    } catch (err: any) {
      alert("Erro ao gerar PDF: " + err.message);
    } finally {
      setGenerating(false);
      setPreviewing(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-[#0F172A] border border-gray-800 rounded text-sm text-white focus:outline-none focus:border-[#C8A96B]/50";
  const labelCls = "block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0F172A] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="text-base font-bold text-white font-display">Gerar Catálogo PDF</h2>
              <p className="text-[11px] text-gray-500">Estilo editorial premium para materiais de divulgação</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* FREE PLAN GATE */}
        {!isPremium ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#C8A96B]/10 border border-[#C8A96B]/20 flex items-center justify-center mx-auto text-3xl">🔒</div>
            <h3 className="text-lg font-bold text-white font-display">Funcionalidade Premium</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
              A geração de catálogos PDF está disponível nos planos <span className="text-[#C8A96B] font-semibold">Premium</span> e <span className="text-purple-400 font-semibold">Business</span>.
            </p>
            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-sm transition-colors"
              >
                Ver Planos Premium →
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* ── CORES ── */}
            <div>
              <h3 className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest mb-3">Cores</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "colorBg" as const, label: "Fundo da Capa" },
                  { key: "colorAccent" as const, label: "Destaque / Dourado" },
                  { key: "colorText" as const, label: "Texto Principal" },
                  { key: "colorSection" as const, label: "Fundo das Secções" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={prefs[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="w-10 h-9 rounded cursor-pointer bg-transparent border border-gray-700 p-0.5"
                      />
                      <input
                        type="text"
                        value={prefs[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="flex-1 px-2 py-2 bg-[#0F172A] border border-gray-800 rounded text-xs text-white font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TIPOGRAFIA ── */}
            <div>
              <h3 className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest mb-3">Tipografia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fonte dos Títulos</label>
                  <select value={prefs.titleFont} onChange={(e) => set("titleFont", e.target.value)} className={inputCls}>
                    {TITLE_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fonte do Corpo</label>
                  <select value={prefs.bodyFont} onChange={(e) => set("bodyFont", e.target.value)} className={inputCls}>
                    {BODY_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div>
              <h3 className="text-xs font-bold text-[#C8A96B] uppercase tracking-widest mb-3">Conteúdo</h3>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "inclProducts" as const, label: "Incluir Produtos" },
                  { key: "inclServices" as const, label: "Incluir Serviços" },
                  { key: "inclHours" as const, label: "Incluir Horários" },
                  { key: "inclLocation" as const, label: "Incluir Localização" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-[#C8A96B]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="w-4 h-4 accent-[#C8A96B] cursor-pointer"
                    />
                    <span className="text-xs text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className={labelCls}>Frase de Rodapé</label>
                <input
                  type="text"
                  value={prefs.footerPhrase}
                  onChange={(e) => set("footerPhrase", e.target.value)}
                  placeholder="Ex: Qualidade e tradição em cada detalhe."
                  className={inputCls}
                  maxLength={120}
                />
              </div>
            </div>

            {/* ── PREVIEW ── */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 border border-gray-700 flex items-center justify-center" style={{ background: prefs.colorBg }}>
                <span style={{ color: prefs.colorAccent, fontSize: 16 }}>A</span>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Capa: <span className="font-mono text-[10px]">{prefs.colorBg}</span> · Destaque: <span className="font-mono text-[10px]">{prefs.colorAccent}</span> · Títulos: <span className="text-white text-[10px]">{prefs.titleFont}</span> · Corpo: <span className="text-white text-[10px]">{prefs.bodyFont}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {[prefs.inclProducts && "Produtos", prefs.inclServices && "Serviços", prefs.inclHours && "Horários", prefs.inclLocation && "Localização"].filter(Boolean).join(" · ") || "Nenhuma secção seleccionada"}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Footer actions */}
        {isPremium && (
          <div className="px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleGenerate(true)}
              disabled={previewing || generating}
              className="flex-1 py-2.5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {previewing ? (
                <><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> A pré-visualizar...</>
              ) : (
                "🔍 Pré-visualizar"
              )}
            </button>
            <button
              onClick={() => handleGenerate(false)}
              disabled={generating || previewing}
              className="flex-1 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {generating ? (
                <><span className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" /> A gerar PDF...</>
              ) : (
                "⬇ Gerar e Descarregar PDF"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Plan Section Component ────────────────────────────────────────────────
function PlanSection({
  plan,
  onUpgrade,
  checkoutLoading,
  subscriptionCancelAt,
  onCancelRequest,
}: {
  plan: string;
  onUpgrade: (planId: string) => void;
  checkoutLoading: boolean;
  subscriptionCancelAt?: string | null;
  onCancelRequest?: () => void;
}) {
  const isPremium = isProTier(plan);
  const isBusiness = isBusinessTier(plan);
  const isFree = !isPremium && !isBusiness;
  const isCanceling = Boolean(subscriptionCancelAt);

  const cancelDate = subscriptionCancelAt
    ? new Date(subscriptionCancelAt).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const planLabel = isBusiness ? "Business" : isPremium ? "Premium ✦" : "Grátis";

  return (
    <div
      className={`rounded-2xl p-6 shadow-xl border ${
        isBusiness
          ? "bg-gradient-to-r from-purple-950 to-slate-900 border-purple-700/40"
          : isPremium
          ? "bg-gradient-to-r from-[#C8A96B]/5 to-slate-900 border-[#C8A96B]/30"
          : "bg-gradient-to-r from-slate-900 via-gray-950 to-slate-900 border-gray-800"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className={`w-4 h-4 ${isBusiness ? "text-purple-400" : "text-[#C8A96B]"}`} />
            <h4 className="text-sm font-bold text-white">
              {isBusiness
                ? "Plano Business ★ — Todas as Funcionalidades"
                : isPremium
                ? "Plano Premium ✦ — Activo e a funcionar"
                : "Plano Grátis — Desbloqueie todo o potencial por €12/mês"}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                isBusiness
                  ? "bg-purple-900 border border-purple-700 text-purple-300"
                  : isPremium
                  ? "bg-[#C8A96B]/20 border border-[#C8A96B]/40 text-[#C8A96B]"
                  : "bg-gray-800 border border-gray-700 text-gray-400"
              }`}
            >
              {planLabel}
            </span>
          </div>

          {isFree && (
            <div className="text-xs text-gray-400 space-y-0.5">
              <p>✅ Perfil público da vitrine</p>
              <p>✅ Contacto direto via WhatsApp</p>
              <p className="text-gray-600">🔒 Chatbot IA na página pública — desbloqueado no Premium</p>
              <p className="text-gray-600">🔒 Analytics de visitas e cliques — desbloqueado no Premium</p>
              <p className="text-gray-600">🔒 Destaque no marketplace — desbloqueado no Premium</p>
              <p className="text-gray-600">🔒 Galeria ilimitada — desbloqueado no Premium</p>
            </div>
          )}
          {isPremium && (
            <div className="text-xs text-[#C8A96B]/80 space-y-0.5">
              <p>✅ Chatbot IA 24h na sua página pública</p>
              <p>✅ Analytics de visitas, cliques WhatsApp e produtos</p>
              <p>✅ Destaque ✦ no marketplace (aparece primeiro)</p>
              <p>✅ Galeria de fotos ilimitada</p>
              <p>✅ SEO optimizado para Google</p>
            </div>
          )}
          {isBusiness && (
            <div className="text-xs text-purple-300/80 space-y-0.5">
              <p>✅ Todas as funcionalidades Premium</p>
              <p>✅ Destaque prioritário no marketplace</p>
              <p>✅ Relatório mensal avançado</p>
            </div>
          )}

          {/* Cancellation notice */}
          {isCanceling && cancelDate && (
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2 w-fit mt-1">
              <span className="text-red-400 text-xs">⚠️</span>
              <span className="text-red-300 text-xs font-medium">
                Cancelamento agendado — acesso premium até <strong>{cancelDate}</strong>
              </span>
            </div>
          )}
        </div>

        {isFree && (
          <div className="flex flex-col gap-2 w-full md:w-auto min-w-[220px]">
            <button
              onClick={() => onUpgrade("premium")}
              disabled={checkoutLoading}
              className="px-6 py-3.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#C8A96B]/15"
            >
              {checkoutLoading ? (
                <div className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Activar Premium — €12/mês
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              Chatbot IA · Analytics · Destaque · Galeria ilimitada
            </p>
          </div>
        )}
        {isPremium && !isCanceling && (
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={() => onUpgrade("business")}
              disabled={checkoutLoading}
              className="px-6 py-2.5 border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B] hover:text-[#0F172A] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              Ver Plano Business →
            </button>
            <button
              onClick={onCancelRequest}
              className="text-[11px] text-gray-600 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Cancelar assinatura
            </button>
          </div>
        )}
        {isBusiness && !isCanceling && (
          <button
            onClick={onCancelRequest}
            className="text-[11px] text-gray-600 hover:text-red-400 transition-colors underline underline-offset-2 self-end"
          >
            Cancelar assinatura
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Section Component ──────────────────────────────────────────
function AnalyticsSection({
  businessId,
  plan,
}: {
  businessId: string;
  plan: string;
}) {
  const [stats, setStats] = useState<{
    views_today: number;
    views_week: number;
    views_month: number;
    whatsapp_clicks: number;
    product_views: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const isPaid = isPaidTier(plan);

  useEffect(() => {
    if (!isPaid) {
      setLoadingStats(false);
      return;
    }
    fetch(`/api/analytics?business_id=${businessId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [businessId, isPaid]);

  const cards = [
    { label: "Visitas hoje", value: stats?.views_today ?? 0, icon: "👁️" },
    { label: "Visitas esta semana", value: stats?.views_week ?? 0, icon: "📅" },
    { label: "Cliques no WhatsApp", value: stats?.whatsapp_clicks ?? 0, icon: "💬" },
    { label: "Visualizações de produtos", value: stats?.product_views ?? 0, icon: "📦" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-[#C8A96B] flex items-center gap-2">
          📊 Estatísticas
        </h3>
        {!isPaid && (
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
            Disponível no Plano Pro
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative bg-[#1E293B] border rounded-2xl p-5 text-center overflow-hidden ${
              isPaid ? "border-gray-800" : "border-gray-800/50"
            }`}
          >
            {!isPaid && (
              <div className="absolute inset-0 bg-[#0F172A]/60 flex items-center justify-center z-10 rounded-2xl backdrop-blur-[2px]">
                <span className="text-2xl">🔒</span>
              </div>
            )}
            <p className="text-2xl mb-1">{card.icon}</p>
            <p
              className={`text-[32px] font-display font-bold leading-none mb-1 ${
                isPaid ? "text-[#C8A96B]" : "text-gray-700"
              }`}
            >
              {loadingStats ? "—" : card.value}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Short Link Card Component ──────────────────────────────────────────────
function ShortLinkCard({ plan }: { plan: string }) {
  const [shortLink, setShortLink] = useState<{ short_code: string; clicks: number } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isBusiness = isBusinessTier(plan);

  useEffect(() => {
    if (!isBusiness) {
      setLoading(false);
      return;
    }

    fetch("/api/short-links")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        setShortLink(data);
      })
      .catch((err) => console.error("Error loading short link:", err))
      .finally(() => setLoading(false));
  }, [isBusiness]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanCode = code.trim().toLowerCase();
    
    // Validation: only lowercase letters, numbers, and hyphens (3 to 20 characters)
    const codeRegex = /^[a-z0-9-]{3,20}$/;
    if (!codeRegex.test(cleanCode)) {
      setErrorMsg("Código inválido. Deve conter apenas letras minúsculas, números e hífens (3-20 caracteres).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ short_code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Ocorreu um erro ao criar o link curto.");
      } else {
        setShortLink({ short_code: cleanCode, clicks: 0 });
        setSuccessMsg("Link curto criado com sucesso!");
      }
    } catch (err) {
      setErrorMsg("Erro de ligação ao servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!shortLink) return;
    const url = buildShortLinkUrl(shortLink.short_code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-6 animate-pulse flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-slate-400 text-xs">A carregar informações do link curto...</span>
      </div>
    );
  }

  // Locked State for non-business plans
  if (!isBusiness) {
    return (
      <div className="bg-gray-900/40 border border-gray-850 rounded-2xl p-6 mt-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-none" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">O teu link curto</h4>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Cria um redirecionamento amigável e fácil de lembrar para a tua vitrina: <span className="text-[#C8A96B]">vitrinepro.digital/v/o-teu-codigo</span>.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-purple-950/40 border border-purple-850 px-3 py-1.5 rounded-lg mt-2 text-[10px] font-bold text-purple-300">
              🔒 Disponível no plano Business €29,90/mês
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-6 mt-6 shadow-xl shadow-purple-950/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-bold text-white">O teu link curto (Plano Business)</h4>
      </div>

      {shortLink ? (
        // Active Short Link view
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-light">
            O teu link curto está ativo e a redirecionar para a tua vitrina pública.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm text-slate-200 select-all font-mono">
              <span>{typeof window !== "undefined" ? `${window.location.host}/v/${shortLink.short_code}` : `vitrinepro.digital/v/${shortLink.short_code}`}</span>
              <a
                href={`/v/${shortLink.short_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 ml-2"
                title="Visitar link curto"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <button
              onClick={handleCopy}
              className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Link
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/30 border border-purple-900/20 px-3.5 py-2.5 rounded-xl w-fit">
            <span className="text-purple-300 font-bold text-xs">{shortLink.clicks}</span>
            <span className="text-slate-400 text-[11px] font-light">cliques totais</span>
          </div>
        </div>
      ) : (
        // Form to create short Link
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-xs text-slate-400 font-light">
            Escolhe um código simples e memorável para partilhares nas tuas redes sociais ou cartões de visita.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl flex items-center px-3.5 focus-within:border-purple-600">
              <span className="text-slate-500 text-xs sm:text-sm font-light select-none font-mono">
                {typeof window !== "undefined" ? `${window.location.host}/v/` : "vitrinepro.digital/v/"}
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase())}
                placeholder="o-teu-codigo"
                className="bg-transparent border-none text-white text-xs sm:text-sm font-semibold py-3 px-1 w-full focus:outline-none placeholder-slate-650 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 min-w-[140px] flex items-center justify-center"
            >
              {submitting ? "A criar..." : "Criar link curto"}
            </button>
          </div>

          <p className="text-[10px] text-slate-500 font-light">
            Apenas letras minúsculas, números e hífens. Mínimo 3 e máximo 20 caracteres.
          </p>

          {errorMsg && (
            <div className="text-red-400 text-xs font-semibold mt-1">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-green-400 text-xs font-semibold mt-1">
              🎉 {successMsg}
            </div>
          )}
        </form>
      )}

    </div>
  );
}
