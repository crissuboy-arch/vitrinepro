"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Review } from "@/types/review";

const GOLD = "#C8A96B";

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span style={{ fontSize: size }} className="inline-flex leading-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rounded ? GOLD : "#334155" }}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsCard({ businessId }: { businessId: string; businessName?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      setReviews((data as Review[]) || []);
      setLoading(false);
    })();
  }, [businessId]);

  const total = reviews.length;
  const average = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const last3 = reviews.slice(0, 3);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">⭐ Avaliações</h3>
        <Link
          href="/dashboard/avaliacoes"
          className="text-xs font-bold text-[#C8A96B] hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {loading ? (
        <div className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
      ) : total === 0 ? (
        <p className="text-sm text-gray-400">Ainda não recebeste avaliações. Partilha a tua vitrine para começar a recebê-las.</p>
      ) : (
        <div className="grid sm:grid-cols-[150px_1fr] gap-6 items-start">
          <div className="text-center sm:border-r border-gray-800 sm:pr-6">
            <div className="text-4xl font-bold text-white">{average.toFixed(1)}</div>
            <div className="mt-1"><Stars value={average} size={16} /></div>
            <div className="text-xs text-gray-400 mt-1">{total} avaliaç{total === 1 ? "ão" : "ões"}</div>
          </div>
          <div className="space-y-3">
            {last3.map((r) => (
              <div key={r.id} className="border-b border-gray-800/60 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white truncate">{r.author_name}</span>
                  <Stars value={r.rating} size={11} />
                </div>
                {r.comment && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
