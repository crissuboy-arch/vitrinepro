"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/SupabaseAuthContext";
import { supabase } from "../lib/supabase";
import { AnimatedBanner } from "../components/ConversionWidgets";

function PaywallModal({ isOpen, onClose, feature }: { isOpen: boolean; onClose: () => void; feature: string }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#1F2937]">✕</button>
        
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="font-display text-2xl text-[#0F172A]">
            Ative o plano Pro
          </h2>
        </div>
        
        <p className="text-[#1F2937] text-center mb-6">
          Para {feature}, você precisa do plano Pro. Isso ajuda você aTer mais clientes e visibilidade.
        </p>
        
        <div className="bg-[#FAF7F2] rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-[#0F172A]">Pro</span>
            <span className="text-2xl font-display text-[#0F172A]">€29.90<span className="text-sm font-normal">/mês</span></span>
          </div>
          <ul className="text-sm text-[#1F2937] space-y-2">
            <li className="flex items-center gap-2">★ Destaque no topo</li>
            <li className="flex items-center gap-2">★ Badge Premium</li>
            <li className="flex items-center gap-2">★ Mais visualizações</li>
          </ul>
        </div>
        
        <button className="w-full py-4 bg-[#C8A96B] text-[#0F172A] rounded-lg font-semibold hover:bg-[#D4BB82] transition-colors mb-3">
          Ativar Pro
        </button>
        
        <button onClick={onClose} className="w-full py-3 text-[#1F2937] text-sm">
          Mais tarde
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editing, setEditing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    city: "",
    country: "Portugal",
    description: "",
    whatsApp: "",
    phone: "",
    logo: "",
    cover: "",
    gallery: [] as string[],
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [myBusiness, setMyBusiness] = useState<any>(null);
  
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (!mounted || !user) return;
    
    const loadData = async () => {
      try {
        const [bizRes, catsRes, citiesRes] = await Promise.all([
          supabase
            .from('businesses')
            .select(`
              *,
              categories(name, id),
              cities(name, id, country)
            `)
            .eq('user_id', user.id)
            .single(),
          supabase.from('categories').select('id, name').eq('is_active', true).order('order_index'),
          supabase.from('cities').select('id, name, country').eq('is_active', true),
        ]);

        if (bizRes.data) {
          console.log("[DEBUG] Dashboard loaded business:", bizRes.data.id);
          setMyBusiness(bizRes.data);
          setEditForm({
            name: bizRes.data.name || "",
            category: bizRes.data.categories?.id || "",
            city: bizRes.data.cities?.id || "",
            country: bizRes.data.cities?.country || "Portugal",
            description: bizRes.data.description || "",
            whatsApp: bizRes.data.whatsapp || "",
            phone: bizRes.data.phone || "",
            logo: bizRes.data.logo_url || "",
            cover: bizRes.data.cover_url || "",
            gallery: [],
          });
        }

        if (catsRes.data) setCategories(catsRes.data);
        if (citiesRes.data) setCities(citiesRes.data);
      } catch (error) {
        console.error("[DEBUG] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, mounted]);

  const handleSave = async () => {
    if (!user || !myBusiness?.id) return;
    
    try {
      console.log("[DEBUG] Updating business in Supabase:", editForm);
      
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: editForm.name,
          category_id: editForm.category || null,
          city_id: editForm.city || null,
          description: editForm.description,
          whatsapp: editForm.whatsApp,
          phone: editForm.phone,
          logo_url: editForm.logo,
          cover_url: editForm.cover,
        })
        .eq('id', myBusiness.id)
        .select(`
          *,
          categories(name),
          cities(name)
        `)
        .single();
      
      if (error) throw error;
      
      console.log("[DEBUG] Business updated:", data.id);
      setMyBusiness(data);
      setEditing(false);
    } catch (error) {
      console.error("[DEBUG] Error updating business:", error);
    }
  };

  const handleActivatePro = (feature: string) => {
    setPaywallFeature(feature);
    setShowPaywall(true);
  };

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-[#0F172A]">A carregar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AnimatedBanner />
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-display text-[#C8A96B]">VitrinePro</Link>
            <div className="flex items-center gap-4">
              {user?.user_metadata?.avatar_url && (
                <Image src={user.user_metadata.avatar_url as string} alt={user.user_metadata.full_name as string || ""} width={36} height={36} className="rounded-full" />
              )}
              <button onClick={() => signOut()} className="text-[#E5E7EB] hover:text-white">Sair</button>
            </div>
          </div>
        </div>
      </header>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature={paywallFeature} />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-[#0F172A]">Olá, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Empresário"}</h1>
              <p className="text-[#1F2937]">Gestão do seu negócio</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-2xl font-display text-[#0F172A]">0</div>
            <div className="text-sm text-[#1F2937]">Visualizações</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-2xl font-display text-[#0F172A]">0</div>
            <div className="text-sm text-[#1F2937]">Contactos</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-2xl font-display text-[#0F172A]">0</div>
            <div className="text-sm text-[#1F2937]">Mensagens</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-2xl font-display text-[#0F172A]">0</div>
            <div className="text-sm text-[#1F2937]">Avaliações</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!myBusiness ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
                <div className="text-5xl mb-4">🏪</div>
                <h2 className="font-display text-xl text-[#0F172A] mb-2">Você ainda não cadastrou um negócio</h2>
                <p className="text-[#1F2937] mb-6">Comece agora e apareça para novos clientes!</p>
                <Link href="/onboarding" className="px-6 py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-medium hover:bg-[#D4BB82]">
                  Cadastrar agora
                </Link>
              </div>
            ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-[#0F172A]">Meu negócio</h2>
                <button onClick={() => setEditing(!editing)} className="text-[#C8A96B] font-medium text-sm">
                  {editing ? "Cancelar" : "Editar"}
                </button>
              </div>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Nome</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Categoria</label>
                    <select 
                      value={editForm.category} 
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg"
                    >
                      <option value="">Selecionar...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Cidade</label>
                    <select 
                      value={editForm.city} 
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg"
                    >
                      <option value="">Selecionar...</option>
                      {cities.filter(c => c.country === editForm.country).map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Descrição</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg" />
                  </div>
                  <button onClick={handleSave} className="w-full py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-medium">Guardar alterações</button>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-[#0F172A] text-lg mb-2">{myBusiness?.name}</h3>
                  <p className="text-[#1F2937] mb-4">{myBusiness?.description || "Sem descrição"}</p>
                  <div className="flex items-center gap-4 text-sm text-[#1F2937]">
                    <span>📱 {myBusiness?.whatsApp}</span>
                  </div>
                  {myBusiness?.id !== undefined && (
                    <div className="flex gap-3 mt-4">
                      <Link href={`/business/${myBusiness.id}`} className="text-[#C8A96B] font-medium">
                        Ver perfil público →
                      </Link>
                      <button onClick={() => setEditing(true)} className="text-[#1F2937] font-medium hover:text-[#C8A96B]">
                        | Editar negócio →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="font-display text-xl text-[#0F172A] mb-4">Visibilidade</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-lg">
                  <div>
                    <div className="font-medium text-[#0F172A]">Aparecer no topo</div>
                    <div className="text-sm text-[#1F2937]">Seja o primeiro da lista</div>
                  </div>
                  <button onClick={() => handleActivatePro("aparecer no topo")} className="px-4 py-2 bg-[#0F172A] text-white rounded-lg font-medium text-sm">Ativar</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-lg">
                  <div>
                    <div className="font-medium text-[#0F172A]">Badge Premium</div>
                    <div className="text-sm text-[#1F2937]">Destaque especial</div>
                  </div>
                  <button onClick={() => handleActivatePro("obter badge Premium")} className="px-4 py-2 bg-[#0F172A] text-white rounded-lg font-medium text-sm">Ativar</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="font-display text-xl text-[#0F172A] mb-4">Mensagens</h2>
              <p className="text-[#1F2937] text-center py-8">Nenhuma mensagem ainda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}