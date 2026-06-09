"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/app/lib/supabase";

const PAGE_SIZE = 24;

interface MarketplaceGridProps {
  initialProducts: any[];
  initialHasMore: boolean;
  categorySlug: string;
}

async function fetchMoreProducts(categorySlug: string, offset: number) {
  let query = supabase
    .from("products")
    .select(
      "*, businesses!inner(id, name, slug, published, plan, logo_url, category_id, city, is_verified_store)"
    )
    .eq("businesses.published", true);

  if (categorySlug && categorySlug !== "todas") {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (cat) {
      query = query.eq("businesses.category_id", cat.id);
    }
  }

  const { data, error } = await query
    .order("order_index", { ascending: true })
    .range(offset, offset + PAGE_SIZE);

  if (error) throw error;
  const rows = data || [];
  return { products: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export default function MarketplaceGrid({
  initialProducts,
  initialHasMore,
  categorySlug,
}: MarketplaceGridProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    setLoading(true);
    try {
      const { products: more, hasMore: nextHasMore } = await fetchMoreProducts(
        categorySlug,
        products.length
      );
      setProducts((prev) => [...prev, ...more]);
      setHasMore(nextHasMore);
    } catch (err) {
      console.error("Erro ao carregar mais produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl space-y-6">
        <span className="text-5xl block">🛍️</span>
        <div className="space-y-2 px-6">
          <h4 className="text-lg font-bold text-white font-display">Sem produtos nesta categoria</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Ainda não existem produtos nesta categoria. Visite novamente mais tarde!
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-xl transition-all active:scale-95"
          >
            Anunciar Meus Produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => {
          const isDigital = prod.type === "digital";
          return (
            <Link
              key={prod.id}
              href={`/produto/${prod.slug || prod.id}`}
              className="bg-slate-900/40 border border-slate-800 hover:border-[#C8A96B]/50 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {prod.image_url ? (
                    <Image
                      src={prod.image_url}
                      alt={prod.name}
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-slate-700 flex flex-col items-center gap-1">
                      <span className="text-5xl">📦</span>
                    </div>
                  )}
                  {isDigital ? (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase tracking-wider shadow">
                      💻 Digital
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-orange-600 text-white text-[9px] font-bold rounded uppercase tracking-wider shadow">
                      🛍️ Físico
                    </span>
                  )}
                  {prod.price !== null && (
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-lg shadow-lg">
                      €{prod.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex gap-2 items-center text-[10px] text-slate-500">
                    <span>Loja:</span>
                    <span className="text-slate-350 hover:underline">{prod.businesses?.name}</span>
                    {prod.businesses?.is_verified_store && (
                      <span className="text-[#C8A96B]">✓</span>
                    )}
                  </div>
                  <h4 className="font-display text-base font-bold text-white group-hover:text-[#C8A96B] transition-colors leading-tight">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {prod.description || "Consulte o nosso catálogo para mais informações."}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mt-3">
                <span className="text-slate-500">📍 {prod.businesses?.city || "Portugal"}</span>
                <span className="text-[#C8A96B] font-bold group-hover:underline">Ver Detalhes →</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-3 border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B]/10 text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
                A carregar...
              </>
            ) : (
              "Carregar mais"
            )}
          </button>
        </div>
      )}

      {!hasMore && products.length >= PAGE_SIZE && (
        <p className="text-center text-xs text-slate-600 pt-2">Todos os produtos foram carregados.</p>
      )}
    </div>
  );
}
