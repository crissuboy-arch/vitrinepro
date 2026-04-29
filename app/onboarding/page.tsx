"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { uploadBusinessImage } from "../lib/storage";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface City {
  id: string;
  name: string;
  country: string;
}

interface BusinessData {
  name: string;
  categoryId: string;
  cityId: string;
  whatsApp: string;
  phone: string;
  address: string;
  description: string;
  logoFile: File | null;
  coverFile: File | null;
  galleryFiles: (File | null)[];
  instagram?: string;
  website?: string;
}

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [, setPurpose] = useState<"list" | "find" | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<"Portugal" | "Brasil">("Portugal");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    categoryId: "",
    cityId: "",
    whatsApp: "",
    phone: "",
    address: "",
    description: "",
    logoFile: null,
    coverFile: null,
    galleryFiles: [null, null, null],
    instagram: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(["", "", ""]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!mounted) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[DEBUG] Onboarding - session:", session?.user?.id);
      
      if (!session?.user) {
        console.log("[DEBUG] Onboarding - no user, redirecting to login");
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [mounted, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, citiesRes] = await Promise.all([
          supabase.from("categories").select("id, name, icon").eq("is_active", true).order("order_index"),
          supabase.from("cities").select("id, name, country").eq("is_active", true).order("order_index"),
        ]);
        
        if (catsRes.error) console.error("[ONBOARDING] Categories error:", catsRes.error);
        if (citiesRes.error) console.error("[ONBOARDING] Cities error:", citiesRes.error);
        
        if (catsRes.data) {
          console.log("[ONBOARDING] Categories loaded:", catsRes.data.length);
          setCategories(catsRes.data);
        }
        if (citiesRes.data) {
          console.log("[ONBOARDING] Cities loaded:", citiesRes.data.length);
          setCities(citiesRes.data);
        }
      } catch (error) {
        console.error("[ONBOARDING] Fetch error:", error);
      }
    };
    
    fetchData();
  }, []);

  if (!mounted) {
    return null;
  }

  const filteredCities = cities.filter(
    c => c.country === selectedCountry && 
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitySearch(e.target.value);
    setShowSuggestions(true);
  };

  const handleCitySelect = (cityId: string, cityName: string) => {
    setBusinessData(prev => ({ ...prev, cityId }));
    setCitySearch(cityName);
    setShowSuggestions(false);
    setStep(4);
  };

  const handleCustomCity = async () => {
    if (citySearch.trim()) {
      try {
        const { data: newCity, error } = await supabase
          .from("cities")
          .insert({
            name: citySearch.trim(),
            slug: citySearch.trim().toLowerCase().replace(/\s+/g, '-'),
            country: selectedCountry,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        if (newCity) {
          setCities(prev => [...prev, newCity]);
          setBusinessData(prev => ({ ...prev, cityId: newCity.id }));
          setShowSuggestions(false);
          setStep(4);
        }
      } catch (error) {
        console.error("[DEBUG] Error creating custom city:", error);
        alert("Erro ao criar cidade. Tente novamente.");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover" | "gallery", index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "logo") {
          setLogoPreview(base64);
          setBusinessData(prev => ({ ...prev, logoFile: file }));
        } else if (type === "cover") {
          setCoverPreview(base64);
          setBusinessData(prev => ({ ...prev, coverFile: file }));
        } else if (type === "gallery" && index !== undefined) {
          const newPreviews = [...galleryPreviews];
          newPreviews[index] = base64;
          setGalleryPreviews(newPreviews);
          const newGalleryFiles = [...businessData.galleryFiles];
          newGalleryFiles[index] = file;
          setBusinessData(prev => ({ ...prev, galleryFiles: newGalleryFiles }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePurposeSelect = (p: "list" | "find") => {
    setPurpose(p);
    setStep(2);
  };

  const handleCategorySelect = (categoryId: string) => {
    setBusinessData(prev => ({ ...prev, categoryId }));
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push("/login");
      return;
    }
    
    try {
      const slug = businessData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

      let logoUrl = "";
      let coverUrl = "";

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: session.user.id,
          name: businessData.name,
          slug: slug,
          description: businessData.description,
          category_id: businessData.categoryId || null,
          city_id: businessData.cityId || null,
          whatsapp: businessData.whatsApp,
          phone: businessData.phone,
          address: businessData.address,
          instagram: businessData.instagram,
          website: businessData.website,
          logo_url: logoUrl,
          cover_url: coverUrl,
          is_published: true,
        })
        .select()
        .single();
      
      if (businessError) throw businessError;
      
      console.log("[DEBUG] Business saved with ID:", business.id);

      if (businessData.logoFile && business) {
        logoUrl = await uploadBusinessImage(businessData.logoFile, business.id, "logo");
        await supabase.from("businesses").update({ logo_url: logoUrl }).eq("id", business.id);
        
        await supabase.from("business_images").insert({
          business_id: business.id,
          url: logoUrl,
          type: "logo",
          order_index: 0,
        });
      }

      if (businessData.coverFile && business) {
        coverUrl = await uploadBusinessImage(businessData.coverFile, business.id, "cover");
        await supabase.from("businesses").update({ cover_url: coverUrl }).eq("id", business.id);
        
        await supabase.from("business_images").insert({
          business_id: business.id,
          url: coverUrl,
          type: "cover",
          order_index: 1,
        });
      }

      if (business) {
        for (let i = 0; i < businessData.galleryFiles.length; i++) {
          const file = businessData.galleryFiles[i];
          if (file) {
            const url = await uploadBusinessImage(file, business.id, "gallery");
            await supabase.from("business_images").insert({
              business_id: business.id,
              url: url,
              type: "gallery",
              order_index: i + 2,
            });
          }
        }
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("[DEBUG] Error creating business:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-display text-[#C8A96B]">VitrinePro</span>
            <span className="text-sm text-[#E5E7EB]">Passo {step} de 4</span>
          </div>
        </div>
      </header>

      <div className="bg-[#E5E7EB] h-1">
        <div 
          className="h-full bg-[#C8A96B] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-12">
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-3xl text-[#0F172A] text-center mb-8">
              O que você quer fazer?
            </h1>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => handlePurposeSelect("list")}
                className="bg-white p-8 rounded-xl border-2 border-[#E5E7EB] hover:border-[#C8A96B] transition-colors text-left group"
              >
                <div className="text-4xl mb-4">🏪</div>
                <h3 className="font-semibold text-[#0F172A] text-xl mb-2">Listar meu negócio</h3>
                <p className="text-[#1F2937]">Criar perfil e aparecer para novos clientes</p>
              </button>
              
              <button
                onClick={() => handlePurposeSelect("find")}
                className="bg-white p-8 rounded-xl border-2 border-[#E5E7EB] hover:border-[#C8A96B] transition-colors text-left group"
              >
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-semibold text-[#0F172A] text-xl mb-2">Encontrar serviços</h3>
                <p className="text-[#1F2937]">Buscar negócios e profissionais</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-3xl text-[#0F172A] text-center mb-8">
              Qual é a categoria do seu negócio?
            </h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="bg-white p-6 rounded-xl border-2 border-[#E5E7EB] hover:border-[#C8A96B] hover:shadow-lg transition-all text-left flex items-center gap-4"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="font-medium text-[#0F172A]">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xl mx-auto">
            <h1 className="font-display text-3xl text-[#0F172A] text-center mb-8">
              Onde você está localizado?
            </h1>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => { setSelectedCountry("Portugal"); setCitySearch(""); }}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  selectedCountry === "Portugal" 
                    ? "bg-[#0F172A] text-white" 
                    : "bg-white border border-[#E5E7EB] text-[#0F172A] hover:border-[#C8A96B]"
                }`}
              >
                Portugal
              </button>
              <button
                onClick={() => { setSelectedCountry("Brasil"); setCitySearch(""); }}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  selectedCountry === "Brasil" 
                    ? "bg-[#0F172A] text-white" 
                    : "bg-white border border-[#E5E7EB] text-[#0F172A] hover:border-[#C8A96B]"
                }`}
              >
                Brasil
              </button>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                value={citySearch}
                onChange={handleCitySearch}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`Buscar cidade em ${selectedCountry}...`}
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
              />
              
              {showSuggestions && citySearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelect(city.id, city.name)}
                        className="w-full px-4 py-3 text-left hover:bg-[#FAF7F2] transition-colors"
                      >
                        <span className="font-medium text-[#0F172A]">{city.name}</span>
                      </button>
                    ))
                  ) : null}
                  {citySearch.trim() && (
                    <button
                      onClick={handleCustomCity}
                      className="w-full px-4 py-3 text-left border-t border-[#E5E7EB] hover:bg-[#FAF7F2] transition-colors"
                    >
                      <span className="text-[#C8A96B] font-medium">+ Adicionar &quot;{citySearch}&quot;</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-[#1F2937] mb-3">Cidades populares:</p>
              <div className="flex flex-wrap gap-2">
                {cities.filter(c => c.country === selectedCountry).slice(0, 6).map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.id, city.name)}
                    className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full text-sm text-[#0F172A] hover:border-[#C8A96B] transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-xl mx-auto">
            <h1 className="font-display text-3xl text-[#0F172A] text-center mb-8">
              Complete seu perfil
            </h1>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Logo do negócio</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🏪</span>
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg text-sm text-[#0F172A] hover:border-[#C8A96B]">
                    Upload Logo
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Imagem de capa</label>
                <div className="relative h-32 rounded-xl bg-[#E5E7EB] overflow-hidden">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#1F2937]">
                      Clique para adicionar imagem de capa
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Galeria (3 fotos)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="relative h-24 rounded-lg bg-[#E5E7EB] overflow-hidden">
                      {galleryPreviews[i] ? (
                        <img src={galleryPreviews[i]} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#1F2937] text-2xl">
                          +
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "gallery", i)} className="hidden" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nome do negócio *</label>
                <input
                  type="text"
                  value={businessData.name}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  value={businessData.whatsApp}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, whatsApp: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="+351 999 999 999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Telefone</label>
                <input
                  type="tel"
                  value={businessData.phone || ""}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="+351 999 999 999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Morada</label>
                <input
                  type="text"
                  value={businessData.address || ""}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="Av. da Liberdade, 100, Lisboa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Instagram</label>
                <input
                  type="text"
                  value={businessData.instagram || ""}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, instagram: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="@seuinstagram"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Website</label>
                <input
                  type="text"
                  value={businessData.website || ""}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B]"
                  placeholder="https://seusite.pt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Descrição</label>
                <textarea
                  value={businessData.description}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] resize-none"
                  placeholder="Descreva brevemente seu negócio..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !businessData.name || !businessData.whatsApp}
                className="w-full py-4 bg-[#C8A96B] text-[#0F172A] rounded-lg font-semibold hover:bg-[#D4BB82] transition-colors disabled:opacity-50"
              >
                {loading ? "A criar..." : "Criar meu negócio"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}