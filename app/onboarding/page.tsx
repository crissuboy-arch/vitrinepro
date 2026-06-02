/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { createBusiness } from "@/lib/business-actions";
import { uploadLogo, uploadCover, uploadGallery } from "@/lib/supabase-storage";

interface Category {
  id: string;
  name: string;
  icon?: string;
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

const INITIAL_HOURS: OpeningHour[] = [
  { day: "Segunda-feira", open: "09:00", close: "18:00", closed: false },
  { day: "Terça-feira", open: "09:00", close: "18:00", closed: false },
  { day: "Quarta-feira", open: "09:00", close: "18:00", closed: false },
  { day: "Quinta-feira", open: "09:00", close: "18:00", closed: false },
  { day: "Sexta-feira", open: "09:00", close: "18:00", closed: false },
  { day: "Sábado", open: "09:00", close: "13:00", closed: false },
  { day: "Domingo", open: "09:00", close: "13:00", closed: true },
];

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // DB Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [country, setCountry] = useState("Portugal");
  const [address, setAddress] = useState("");

  // Step 2: Contacts & Socials
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3: Images Files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // Previews
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Step 4: Hours
  const [hours, setHours] = useState<OpeningHour[]>(INITIAL_HOURS);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const planParam = urlParams.get("plan");
      if (planParam) {
        setSelectedPlan(planParam);
      }
    }
  }, []);

  // Auth Protection Check
  useEffect(() => {
    const checkAuth = async () => {
      if (!mounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get("plan");
        const redirectUrl = plan ? `/login?plan=${plan}` : "/login";
        router.push(redirectUrl);
      }
    };
    checkAuth();
  }, [mounted, router]);

  // Load Dropdowns
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [catsRes, citiesRes] = await Promise.all([
          supabase.from("categories").select("id, name, icon").eq("is_active", true).order("order_index"),
          supabase.from("cities").select("id, name, country").eq("is_active", true).order("order_index"),
        ]);
        if (catsRes.data) setCategories(catsRes.data);
        if (citiesRes.data) setCities(citiesRes.data);
      } catch (err) {
        console.error("[ONBOARDING] Error loading dropdown data:", err);
      }
    };
    loadDropdownData();
  }, []);

  if (!mounted) return null;

  // Filter cities by selected country
  const filteredCities = cities.filter((c) => c.country === country);

  // File Upload Handlers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setGalleryFiles((prev) => [...prev, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Hours Change Handler
  const handleHoursChange = (index: number, field: keyof OpeningHour, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  // Submit Handler
  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Não autenticado. Por favor, faça login novamente.");
        setLoading(false);
        return;
      }

      // 1. Create base business profile
      const result = await createBusiness({
        user_id: session.user.id,
        name,
        description,
        category_id: categoryId || undefined,
        city_id: cityId || undefined,
        country,
        address,
        whatsapp,
        phone: phone || undefined,
        email: email || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        tiktok: tiktok || undefined,
        youtube: youtube || undefined,
        linkedin: linkedin || undefined,
        website: website || undefined,
        opening_hours: hours as unknown as Record<string, unknown>,
        published: true, // Auto publish on successful onboarding
      });

      if (!result.success || !result.businessId) {
        throw new Error(result.error || "Falha ao registar o negócio.");
      }

      const businessId = result.businessId;

      // 2. Upload images if selected
      let uploadedLogoUrl = "";
      let uploadedCoverUrl = "";
      const uploadedGalleryUrls: string[] = [];

      try {
        if (logoFile) {
          uploadedLogoUrl = await uploadLogo(logoFile, businessId);
        }
        if (coverFile) {
          uploadedCoverUrl = await uploadCover(coverFile, businessId);
        }
        if (galleryFiles.length > 0) {
          for (const file of galleryFiles) {
            const url = await uploadGallery(file, businessId);
            uploadedGalleryUrls.push(url);
          }
        }
      } catch (uploadErr: any) {
        console.error("[ONBOARDING] Upload warning:", uploadErr.message);
        // We do not fail the whole onboarding if an image upload fails, but we show a warning
        setError(`Negócio criado, mas com avisos de imagem: ${uploadErr.message}`);
      }

      // 3. Update business with upload URLs
      const updateData: any = {};
      if (uploadedLogoUrl) updateData.logo_url = uploadedLogoUrl;
      if (uploadedCoverUrl) updateData.cover_url = uploadedCoverUrl;

      if (Object.keys(updateData).length > 0) {
        await supabase.from("businesses").update(updateData).eq("id", businessId);
      }

      // 4. Save gallery images to database (automatically syncs to gallery_images via triggers)
      if (uploadedGalleryUrls.length > 0) {
        const imageInserts = uploadedGalleryUrls.map((url, index) => ({
          business_id: businessId,
          url,
          type: "gallery",
          order_index: index,
        }));
        await supabase.from("business_images").insert(imageInserts);
      }

      setSuccess("Negócio criado com sucesso! A redirecionar...");
      setTimeout(() => {
        const redirectUrl = selectedPlan 
          ? `/dashboard?success=onboarding&plan=${selectedPlan}` 
          : "/dashboard?success=onboarding";
        router.push(redirectUrl);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao guardar.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              ← Voltar ao início
            </Link>
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain bg-transparent" />
          </div>
          <span className="text-sm text-gray-400">Passo {step} de 4</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-800 h-1">
        <div
          className="bg-[#C8A96B] h-full transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content Wizard */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-950/40 border border-green-900 text-green-400 rounded-xl text-sm">
              {success}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-[#C8A96B] font-semibold mb-2">Informações Básicas</h2>
                <p className="text-sm text-gray-400">Insira os dados essenciais sobre a sua empresa.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Negócio *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                    placeholder="Ex: Pastelaria central, Studio Bella, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B] resize-none"
                    placeholder="Escreva um breve resumo dos seus serviços ou produtos..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Categoria *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#C8A96B]"
                      required
                    >
                      <option value="">Selecionar categoria...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">País *</label>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setCityId(""); // Reset city when country changes
                      }}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#C8A96B]"
                    >
                      <option value="Portugal">Portugal</option>
                      <option value="Brasil">Brasil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cidade *</label>
                    <select
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#C8A96B]"
                      required
                    >
                      <option value="">Selecionar cidade...</option>
                      {filteredCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Morada / Endereço</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="Ex: Av. Principal, nº 123"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!name || !categoryId || !cityId) {
                      setError("Por favor, preencha todos os campos obrigatórios (*).");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                  className="px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors"
                >
                  Seguinte →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Contacts & Socials */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-[#C8A96B] font-semibold mb-2">Contactos e Redes Sociais</h2>
                <p className="text-sm text-gray-400">Adicione os canais de contacto preferidos dos seus clientes.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp *</label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="Ex: +351912345678"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Telefone Fixo</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="Ex: +351212345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Comercial</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                    placeholder="exemplo@empresa.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@nome)</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="@minha_empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Facebook (URL)</label>
                    <input
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="facebook.com/pagina"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">TikTok (@nome)</label>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="@minha_empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn (URL)</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="linkedin.com/company/nome"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">YouTube (Canal)</label>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="youtube.com/c/canal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Website Oficial</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96B]"
                      placeholder="https://www.meusite.pt"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!whatsapp) {
                      setError("WhatsApp é obrigatório para que os clientes o contactem.");
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                  className="px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors"
                >
                  Seguinte →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Images */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-[#C8A96B] font-semibold mb-2">Imagens e Média</h2>
                <p className="text-sm text-gray-400">Adicione a identidade visual da sua marca e fotos de galeria.</p>
              </div>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div className="bg-[#0F172A] p-6 border border-gray-800 rounded-xl">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Logótipo do Negócio</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl text-gray-700">🏪</span>
                      )}
                    </div>
                    <label className="cursor-pointer px-5 py-2.5 bg-gray-850 hover:bg-gray-800 border border-gray-700 text-[#C8A96B] font-medium text-sm rounded-lg transition-all">
                      Selecionar Logo
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Cover Upload */}
                <div className="bg-[#0F172A] p-6 border border-gray-800 rounded-xl">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Foto de Capa</label>
                  <div className="space-y-3">
                    <div className="h-40 w-full rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden relative">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 text-sm">Nenhuma imagem de capa selecionada</span>
                      )}
                    </div>
                    <label className="inline-block cursor-pointer px-5 py-2.5 bg-gray-850 hover:bg-gray-800 border border-gray-700 text-[#C8A96B] font-medium text-sm rounded-lg transition-all">
                      Selecionar Capa
                      <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Gallery Upload */}
                <div className="bg-[#0F172A] p-6 border border-gray-800 rounded-xl">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Galeria de Fotos (Múltiplas)</label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryPreviews.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-950 group">
                          <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className="aspect-video border-2 border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#C8A96B] bg-gray-950/40 text-gray-500 hover:text-[#C8A96B] transition-all">
                        <span className="text-2xl font-light">+</span>
                        <span className="text-xs">Foto</span>
                        <input type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors"
                >
                  Seguinte →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Hours */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display text-[#C8A96B] font-semibold mb-2">Horário de Funcionamento</h2>
                <p className="text-sm text-gray-400">Defina os dias e horas de abertura do seu negócio.</p>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-xl bg-[#0F172A]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-800 text-sm text-gray-400">
                      <th className="p-4">Dia</th>
                      <th className="p-4">Abertura</th>
                      <th className="p-4">Fecho</th>
                      <th className="p-4 text-center">Fechado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 text-sm text-gray-200">
                    {hours.map((row, index) => (
                      <tr key={row.day} className="hover:bg-gray-900/30">
                        <td className="p-4 font-medium">{row.day}</td>
                        <td className="p-4">
                          <input
                            type="time"
                            value={row.open}
                            onChange={(e) => handleHoursChange(index, "open", e.target.value)}
                            disabled={row.closed}
                            className="bg-[#0F172A] border border-gray-800 text-white rounded px-2 py-1.5 focus:outline-none focus:border-[#C8A96B] disabled:opacity-30 disabled:border-transparent"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="time"
                            value={row.close}
                            onChange={(e) => handleHoursChange(index, "close", e.target.value)}
                            disabled={row.closed}
                            className="bg-[#0F172A] border border-gray-800 text-white rounded px-2 py-1.5 focus:outline-none focus:border-[#C8A96B] disabled:opacity-30 disabled:border-transparent"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={row.closed}
                            onChange={(e) => handleHoursChange(index, "closed", e.target.checked)}
                            className="w-4 h-4 rounded text-[#C8A96B] bg-[#0F172A] border-gray-800 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? "A Guardar..." : "Guardar e Concluir ✔"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}