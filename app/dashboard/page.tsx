/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { getMyBusiness, updateBusiness } from "@/lib/business-actions";
import { uploadLogo, uploadCover, uploadGallery, uploadProductImage } from "@/lib/supabase-storage";
import { Sparkles, Lock, Copy, Check, ExternalLink } from "lucide-react";

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

export default function DashboardPage() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Detailed lists
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  // Modals visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);

  // Edit Business Form State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [editCountry, setEditCountry] = useState("Portugal");
  const [editAddress, setEditAddress] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
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

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Product Form State
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [prodPreview, setProdPreview] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // Testimonial Form State
  const [testAuthor, setTestAuthor] = useState("");
  const [testText, setTestText] = useState("");
  const [testRating, setTestRating] = useState(5);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all business data and lists
  const loadAllData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Fetch business profile
      const biz = await getMyBusiness(session.user.id);
      if (!biz) {
        // Redirect to onboarding if no business registered
        router.push("/onboarding");
        return;
      }

      setBusiness(biz);

      // Populate edit form states
      setEditName(biz.name || "");
      setEditDescription(biz.description || "");
      setEditCategoryId(biz.category_id || "");
      setEditCityId(biz.city_id || "");
      setEditCountry(biz.country || "Portugal");
      setEditAddress(biz.address || "");
      setEditWhatsapp(biz.whatsapp || "");
      setEditPhone(biz.phone || "");
      setEditEmail(biz.email || "");
      setEditInstagram(biz.instagram || "");
      setEditFacebook(biz.facebook || "");
      setEditTiktok(biz.tiktok || "");
      setEditYoutube(biz.youtube || "");
      setEditLinkedin(biz.linkedin || "");
      setEditWebsite(biz.website || "");
      setEditOwnerOriginCountry(biz.country || (biz as any).owner_origin_country || "");
      setEditHours((biz.opening_hours as unknown as OpeningHour[]) || []);

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
      console.error("[DASHBOARD] Fetch load exception:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadAllData();
    }
  }, [mounted]);

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

      if (!response.ok) throw new Error(data.error || "Erro ao criar sessão.");

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

      const isCurrentPremium = business.plan === "premium" || business.plan === "pro";
      const isTargetPremium = planParam === "premium" || planParam === "pro";
      const isCurrentBusiness = business.plan === "business";
      const isTargetBusiness = planParam === "business";
      const alreadyHasPlan = (isCurrentPremium && isTargetPremium) || (isCurrentBusiness && isTargetBusiness);

      const isSuccessStatus = params.get("success");
      const isCancelStatus = params.get("cancel");
      const isReturningFromStripe = isSuccessStatus === "stripe" || isSuccessStatus === "stripe_mock" || isCancelStatus === "stripe";

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
      } else if (params.get("success") === "stripe_mock") {
        const plan = params.get("plan") || "pro";
        const businessId = params.get("businessId");
        if (businessId) {
          supabase
            .from("businesses")
            .update({ plan: plan })
            .eq("id", businessId)
            .then(({ error }) => {
              if (!error) {
                alert(`[TESTE LOCAL] Plano atualizado para '${plan}' com sucesso!`);
                loadAllData();
              }
            });
        }
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center flex-col gap-4">
        <img src="/logo-vitrinepro.png" alt="Loading..." className="w-16 h-16 animate-pulse bg-transparent object-contain" />
        <div className="text-[#C8A96B] font-display text-xl animate-pulse">Carregando painel...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
    setSavingBusiness(true);
    try {
      const result = await updateBusiness(business.id, {
        name: editName,
        description: editDescription,
        category_id: editCategoryId || undefined,
        city_id: editCityId || undefined,
        country: editOwnerOriginCountry || editCountry,
        address: editAddress,
        whatsapp: editWhatsapp,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        instagram: editInstagram || undefined,
        facebook: editFacebook || undefined,
        tiktok: editTiktok || undefined,
        youtube: editYoutube || undefined,
        linkedin: editLinkedin || undefined,
        website: editWebsite || undefined,
        opening_hours: editHours as any,
      });

      if (!result.success) throw new Error(result.error);

      // Refresh local profile
      const { data: updated } = await supabase.from("businesses").select("*").eq("id", business.id).single();
      setBusiness(updated);
      setShowEditModal(false);
    } catch (err: any) {
      alert("Erro ao guardar dados: " + err.message);
    } finally {
      setSavingBusiness(false);
    }
  };

  // Edit Profile Image Upload Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadLogo(file, business.id);
      await supabase.from("businesses").update({ logo_url: logoUrl }).eq("id", business.id);
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
      const coverUrl = await uploadCover(file, business.id);
      await supabase.from("businesses").update({ cover_url: coverUrl }).eq("id", business.id);
      setBusiness((prev: any) => ({ ...prev, cover_url: coverUrl }));
    } catch (err: any) {
      alert("Erro no upload da capa: " + err.message);
    } finally {
      setUploadingCover(false);
    }
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
    } catch (err: any) {
      alert("Erro ao adicionar produto: " + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // 4. Add Testimonial Action
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

  // 5. Add Gallery Images Action
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
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

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta imagem da galeria?")) return;
    try {
      await supabase.from("gallery_images").delete().eq("id", imageId);
      setGallery((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert("Erro ao eliminar imagem: " + err.message);
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
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/"
              className="text-[10px] md:text-xs text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              ← Voltar ao início
            </Link>
            <Link
              href="/explorar"
              className="text-[10px] md:text-xs text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-2.5 py-1.5 rounded-lg hidden sm:flex items-center gap-1"
            >
              🔍 Explorar
            </Link>
            <Link href="/" className="flex items-center gap-1.5 ml-1 md:ml-2">
              <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/vitrine/${business?.slug || ''}`}
              target="_blank"
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-xs md:text-sm hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
            >
              Ver Minisite Público
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white rounded-lg text-xs md:text-sm transition-colors"
            >
              Sair
            </button>
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

        {/* ===== PLAN SECTION ===== */}
        {business && (
          <PlanSection
            plan={business.plan || "free"}
            onUpgrade={handleUpgrade}
            checkoutLoading={checkoutLoading}
          />
        )}

        {/* ===== SHORT LINK SECTION ===== */}
        {business && (
          <ShortLinkCard plan={business.plan || "free"} />
        )}

        {/* ===== ANALYTICS SECTION ===== */}
        {business && (
          <AnalyticsSection
            businessId={business.id}
            plan={business.plan || "free"}
          />
        )}
        
        {/* Profile Card Banner */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="h-44 w-full bg-gray-950 relative">
            {business?.cover_url && isValidStorageUrl(business.cover_url) ? (
              <img src={business.cover_url} alt="Cover" className="w-full h-full object-cover opacity-60" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl"
                style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
              >
                {business?.category ? getCategoryIcon(business.category) : "🏪"}
              </div>
            )}
            
            {/* Upload Cover button */}
            <label className="absolute bottom-4 right-4 cursor-pointer bg-[#0f172a]/80 backdrop-blur px-3 py-1.5 border border-gray-700 hover:border-[#C8A96B] text-xs text-[#C8A96B] font-semibold rounded-lg transition-all">
              {uploadingCover ? "Carregando..." : "Alterar Capa"}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
          </div>

          <div className="px-8 pb-8 pt-0 flex flex-col md:flex-row items-start md:items-end justify-between -mt-10 gap-6">
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
                      business?.plan === "pro" || business?.plan === "premium"
                        ? "bg-[#C8A96B]/20 border border-[#C8A96B]/40 text-[#C8A96B]"
                        : business?.plan === "business"
                        ? "bg-purple-950 border border-purple-800 text-purple-400"
                        : "bg-gray-800 border border-gray-700 text-gray-400"
                    }`}>
                      {(business?.plan === "pro" || business?.plan === "premium" || business?.plan === "business") && (
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
                onClick={() => setShowEditModal(true)}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors text-sm"
              >
                Editar Informações
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

        {/* Dashboard Grid Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Column: Products & Testimonials */}
          <div className="lg:col-span-2 space-y-8">
            
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
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-900">📦</div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-white truncate text-sm">{p.name}</h4>
                          {p.price !== null && p.price !== undefined && (
                            <span className="text-[#C8A96B] font-bold text-xs">€{p.price.toFixed(2)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description || "Sem descrição..."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Testimonials Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Depoimentos e Avaliações</h3>
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-white">{t.author_name}</span>
                        <div className="flex text-[#C8A96B] text-xs">
                          {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                          {Array.from({ length: 5 - t.rating }).map((_, i) => <span key={i} className="text-gray-700">★</span>)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed italic">&quot;{t.text}&quot;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Gallery Manager & Opening Hours */}
          <div className="lg:col-span-1 space-y-8">
            
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

              {gallery.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  Nenhuma imagem carregada na galeria.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-850 group bg-gray-950">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        className="absolute inset-0 bg-red-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-bold transition-opacity"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opening Hours Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-display font-semibold text-[#C8A96B] border-b border-gray-800 pb-3">Horário de Funcionamento</h3>
              <div className="space-y-2 text-xs">
                {editHours.length === 0 ? (
                  <p className="text-gray-500">Horário não definido.</p>
                ) : (
                  editHours.map((row) => (
                    <div key={row.day} className="flex justify-between text-gray-300">
                      <span className="font-medium">{row.day}</span>
                      <span>{row.closed ? <span className="text-red-400">Fechado</span> : `${row.open} - ${row.close}`}</span>
                    </div>
                  ))
                )}
              </div>
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
        </div>
      </main>

      {/* ---------------- MODALS SECTION ---------------- */}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-display font-semibold text-[#C8A96B]">Editar Perfil Comercial</h3>

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
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="px-5 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded text-sm transition-colors"
              >
                {savingBusiness ? "A Guardar..." : "Guardar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddProduct}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4"
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
      )}

      {/* ADD TESTIMONIAL MODAL */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddTestimonial}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4"
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
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#1E293B] border border-[#C8A96B]/40 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in max-w-sm text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Plan Section Component ────────────────────────────────────────────────
function PlanSection({
  plan,
  onUpgrade,
  checkoutLoading,
}: {
  plan: string;
  onUpgrade: (planId: string) => void;
  checkoutLoading: boolean;
}) {
  const isPremium = plan === "premium" || plan === "pro";
  const isBusiness = plan === "business";
  const isFree = !isPremium && !isBusiness;

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
        {isPremium && (
          <button
            onClick={() => onUpgrade("business")}
            disabled={checkoutLoading}
            className="px-6 py-2.5 border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B] hover:text-[#0F172A] font-bold rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            Ver Plano Business →
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

  const isPaid = plan === "pro" || plan === "premium" || plan === "business";

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

  const isBusiness = plan === "business";

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
    const url = `${window.location.origin}/v/${shortLink.short_code}`;
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
              Cria um redirecionamento amigável e fácil de lembrar para a tua vitrina: <span className="text-[#C8A96B]">vitrinepro.pt/v/o-teu-codigo</span>.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-purple-950/40 border border-purple-850 px-3 py-1.5 rounded-lg mt-2 text-[10px] font-bold text-purple-300">
              🔒 Disponível no plano Business €29/mês
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
              <span>{typeof window !== "undefined" ? `${window.location.host}/v/${shortLink.short_code}` : `vitrinepro.pt/v/${shortLink.short_code}`}</span>
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
                {typeof window !== "undefined" ? `${window.location.host}/v/` : "vitrinepro.pt/v/"}
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
