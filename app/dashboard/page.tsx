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

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdDesc, setEditProdDesc] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdFile, setEditProdFile] = useState<File | null>(null);
  const [editProdPreview, setEditProdPreview] = useState("");
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
  };

  // 6. Save Edit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdName) return;
    setSavingEditProduct(true);
    try {
      let imageUrl = editingProduct.image_url || "";
      if (editProdFile) {
        imageUrl = await uploadProductImage(editProdFile, business.id);
      }
      const dbUpdates = {
        name: editProdName,
        description: editProdDesc || null,
        price: editProdPrice ? parseFloat(editProdPrice) : null,
        image_url: imageUrl || null,
      };
      const { error } = await supabase.from("products").update(dbUpdates).eq("id", editingProduct.id);
      if (error) throw error;
      // Convert null → undefined for local Product interface compatibility
      const localUpdates: Partial<Product> = {
        name: editProdName,
        description: editProdDesc || undefined,
        price: editProdPrice ? parseFloat(editProdPrice) : undefined,
        image_url: imageUrl || undefined,
      };
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...localUpdates } : p))
      );
      setEditingProduct(null);
      setToast("Produto atualizado.");
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
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
            subscriptionCancelAt={business.subscription_cancel_at ?? null}
            onCancelRequest={() => setShowCancelModal(true)}
          />
        )}

        {/* ===== VITRINE SHARE CARD ===== */}
        {business?.slug && (
          <VitrineShareCard slug={business.slug} />
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

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEditProduct}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4"
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
                  <label className="cursor-pointer px-3 py-1.5 bg-gray-800 text-xs text-[#C8A96B] border border-gray-700 hover:border-[#C8A96B] rounded font-semibold transition-all">
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
                </div>
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

      {/* EDIT TESTIMONIAL MODAL */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEditTestimonial}
            className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4"
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
      )}

      {/* CANCEL SUBSCRIPTION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-red-900/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
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

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#1E293B] border border-[#C8A96B]/40 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in max-w-sm text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Vitrine Share Card ────────────────────────────────────────────────────
function VitrineShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const vitrineUrl = `https://vitrinepro.pt/vitrine/${slug}`;
  const waText = encodeURIComponent(`Visita a minha vitrine profissional: ${vitrineUrl}`);
  const waUrl = `https://wa.me/?text=${waText}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=0F172A&color=C8A96B&data=${encodeURIComponent(vitrineUrl)}`;

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
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden border border-gray-800 bg-[#0F172A] flex items-center justify-center">
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

  const baseUrl = "https://vitrinepro.pt";
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
        ? `<img class="featured-img" src="${featured.image_url}" alt="${featured.name}"/>`
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
      <div class="footer-brand">vitrinepro.pt</div>
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
  const isPremium = plan === "premium" || plan === "business";
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
  const isPremium = plan === "premium" || plan === "pro";
  const isBusiness = plan === "business";
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
