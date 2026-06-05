/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

interface FavoriteBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  slug: string;
  logo_url?: string;
  cover_url?: string;
  plan?: string;
  rating_average?: number;
  owner_origin_country?: string;
  description?: string;
  favorite_id: string;
}

export default function FavoritosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login?next=/favoritos"); return; }
      setUser(session.user);

      const { data } = await supabase
        .from("favorites")
        .select("id, business_id, businesses(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setFavorites(
          data.map((f: any) => ({
            ...f.businesses,
            favorite_id: f.id,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [mounted]);

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorites").delete().eq("id", favoriteId);
    setFavorites(prev => prev.filter(f => f.favorite_id !== favoriteId));
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-[#0F172A]/80 backdrop-blur border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            ← Dashboard
          </Link>
          <Link href="/" className="font-display font-bold text-[#C8A96B] text-xl">VitrinePro</Link>
          <Link href="/explorar" className="text-xs text-[#C8A96B] border border-[#C8A96B]/30 px-3 py-1.5 rounded-lg hover:bg-[#C8A96B]/10 transition-colors">
            Explorar
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
            ❤️ Meus Favoritos
          </h1>
          <p className="text-slate-400 text-sm">
            {favorites.length > 0
              ? `${favorites.length} negócio${favorites.length !== 1 ? "s" : ""} guardado${favorites.length !== 1 ? "s" : ""}`
              : "Ainda não guardaste nenhum negócio."}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 space-y-6 bg-[#1E293B]/30 border border-white/5 rounded-2xl">
            <span className="text-6xl block">❤️</span>
            <div className="space-y-2">
              <p className="text-white font-bold text-lg">Ainda não tens favoritos</p>
              <p className="text-slate-400 text-sm">Ao visitar uma vitrine, clica em ❤️ para guardar.</p>
            </div>
            <Link
              href="/explorar"
              className="inline-block px-6 py-3 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-xl active:scale-95 transition-all"
            >
              Explorar negócios →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((biz) => (
              <div key={biz.favorite_id} className="group bg-[#0F172A]/60 border border-white/5 hover:border-[#C8A96B]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 relative">
                {/* Remove button */}
                <button
                  onClick={() => removeFavorite(biz.favorite_id)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-[#0F172A]/80 border border-red-500/30 text-red-400 hover:bg-red-900/40 rounded-full text-xs transition-colors"
                  aria-label="Remover dos favoritos"
                  title="Remover"
                >
                  ✕
                </button>

                <Link href={`/vitrine/${biz.slug}`}>
                  {/* Cover */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    {biz.cover_url ? (
                      <img src={biz.cover_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center text-4xl">🏪</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />
                    <span className="absolute top-3 left-3 text-base">❤️</span>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                        {biz.logo_url ? <img src={biz.logo_url} alt="" className="w-full h-full object-cover" /> : "🏪"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-[#C8A96B] transition-colors">{biz.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate">{biz.category} · 📍 {biz.city}</p>
                      </div>
                    </div>

                    {biz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-light">{biz.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                      <span className="text-[#C8A96B] font-bold">★ {biz.rating_average?.toFixed(1) || "5.0"}</span>
                      <span className="text-slate-400 group-hover:text-[#C8A96B] font-semibold transition-colors text-[10px]">Ver vitrine →</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
