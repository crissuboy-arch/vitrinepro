"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Review } from "@/types/review";

const GOLD = "#C8A96B";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span style={{ fontSize: size }} className="inline-flex leading-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rounded ? GOLD : "#334155" }}>★</span>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function AvaliacoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!biz) { setHasBusiness(false); setLoading(false); return; }

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      const list = (data as Review[]) || [];
      setReviews(list);
      setReplyDraft(Object.fromEntries(list.map((r) => [r.id, r.owner_reply || ""])));
      setLoading(false);
    })();
  }, [router]);

  async function saveReply(id: string) {
    const text = (replyDraft[id] || "").trim();
    setSavingId(id);
    const { error } = await supabase
      .from("reviews")
      .update({ owner_reply: text || null, owner_reply_at: text ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      showToast("Erro ao guardar a resposta.");
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, owner_reply: text || null } : r)));
      showToast("Resposta guardada.");
    }
    setSavingId(null);
  }

  const total = reviews.length;
  const average = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline">← Voltar ao dashboard</Link>

        <div className="flex items-end justify-between mt-4 mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Avaliações</h1>
            <p className="text-gray-400 text-sm mt-1">Gere e responde às avaliações dos teus clientes.</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <div className="text-3xl font-bold">{average.toFixed(1)} <span className="text-base font-normal text-gray-400">/ 5</span></div>
              <div><Stars value={average} size={16} /></div>
              <div className="text-xs text-gray-400">{total} avaliaç{total === 1 ? "ão" : "ões"}</div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : !hasBusiness ? (
          <p className="text-gray-400">Ainda não tens um negócio. Cria a tua vitrine primeiro.</p>
        ) : total === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🌟</div>
            <p className="text-gray-300">Ainda não recebeste avaliações.</p>
            <p className="text-gray-500 text-sm mt-1">Partilha a tua vitrine para começar a recebê-las.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{r.author_name}</span>
                      {r.verified && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-950/50 border border-emerald-900 rounded px-1.5 py-0.5">Verificado</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">{formatDate(r.created_at)}</div>
                  </div>
                  <Stars value={r.rating} />
                </div>

                {r.comment && <p className="text-gray-300 text-sm mt-3 leading-relaxed">{r.comment}</p>}

                {r.photo_url && (
                  <img src={r.photo_url} alt="Foto da avaliação" className="mt-3 max-h-52 rounded-lg border border-gray-800 object-cover" />
                )}

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <label className="block text-xs font-medium text-gray-400 mb-1">A tua resposta</label>
                  <textarea
                    value={replyDraft[r.id] ?? ""}
                    onChange={(e) => setReplyDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    rows={2}
                    placeholder="Responde publicamente a esta avaliação..."
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A96B] outline-none resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => saveReply(r.id)}
                      disabled={savingId === r.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0a0d14] transition-colors disabled:opacity-60"
                    >
                      {savingId === r.id ? "A guardar..." : "Guardar resposta"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-emerald-600 text-white px-5 py-3 rounded-lg font-semibold text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
