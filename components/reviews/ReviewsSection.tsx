"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { uploadReviewPhoto } from "@/lib/supabase-storage";
import type { Review } from "@/types/review";

const GOLD = "#C8A96B";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

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

export default function ReviewsSection({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (active) {
        setReviews((data as Review[]) || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [businessId]);

  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-56 bg-slate-800/60 rounded animate-pulse" />
        <div className="h-28 bg-slate-900/40 border border-slate-800/80 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-2xl font-bold font-display text-white flex items-center gap-2">
          <span>⭐</span> O que dizem os clientes
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0a0d14] transition-colors whitespace-nowrap"
        >
          Escrever Avaliação
        </button>
      </div>

      {total === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🌟</div>
          <p className="text-slate-300 text-sm mb-4">Ainda não há avaliações. Sê o primeiro a avaliar {businessName}!</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0a0d14] transition-colors"
          >
            Escrever a primeira avaliação
          </button>
        </div>
      ) : (
        <>
          {/* Summary: average + distribution */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 grid sm:grid-cols-[180px_1fr] gap-6 items-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-white font-display">{average.toFixed(1)}</div>
              <div className="mt-1"><Stars value={average} size={18} /></div>
              <div className="text-xs text-slate-400 mt-1">{total} avaliaç{total === 1 ? "ão" : "ões"}</div>
            </div>
            <div className="space-y-1.5">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 w-6 whitespace-nowrap">{d.star}★</span>
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: GOLD }} />
                  </div>
                  <span className="text-slate-500 w-10 text-right">{Math.round(d.pct)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review list */}
          <div className="grid md:grid-cols-2 gap-5">
            {reviews.map((r) => (
              <div key={r.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-display truncate">{r.author_name}</span>
                      {r.verified && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-950/50 border border-emerald-900 rounded px-1.5 py-0.5">
                          Verificado
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{formatDate(r.created_at)}</div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-slate-300 text-xs leading-relaxed font-light">{r.comment}</p>}
                {r.photo_url && (
                  <img src={r.photo_url} alt="Foto da avaliação" className="w-full max-h-48 object-cover rounded-lg border border-slate-800" />
                )}
                {r.owner_reply && (
                  <div className="mt-2 pl-3 border-l-2 border-[#C8A96B]/40 bg-slate-950/40 rounded-r-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#C8A96B] mb-1">Resposta de {businessName}</div>
                    <p className="text-slate-300 text-xs leading-relaxed font-light">{r.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <WriteReviewModal
          businessId={businessId}
          onClose={() => setShowModal(false)}
          onSubmitted={(review) => {
            setReviews((prev) => [review, ...prev]);
            setShowModal(false);
            showToast("Obrigado! A tua avaliação foi publicada.");
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-emerald-600 text-white px-5 py-3 rounded-lg font-semibold text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Write review modal ───────────────────────────────────────────────────────

function WriteReviewModal({
  businessId,
  onClose,
  onSubmitted,
}: {
  businessId: string;
  onClose: () => void;
  onSubmitted: (review: Review) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) {
      setError("Foto inválida. Usa JPG, PNG, WebP ou GIF.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Foto demasiado grande (máx. 5 MB).");
      return;
    }
    setError(null);
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Indica o teu nome."); return; }
    if (rating < 1) { setError("Escolhe uma classificação de 1 a 5 estrelas."); return; }
    if (comment.trim().length < 10) { setError("O comentário deve ter pelo menos 10 caracteres."); return; }

    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        try {
          photoUrl = await uploadReviewPhoto(photo, businessId);
        } catch {
          // Non-fatal: submit the review without the photo.
          photoUrl = null;
        }
      }

      const { data, error: insErr } = await supabase
        .from("reviews")
        .insert({
          business_id: businessId,
          author_name: name.trim(),
          reviewer_email: email.trim() || null,
          rating,
          comment: comment.trim(),
          photo_url: photoUrl,
          is_approved: true,
          verified: false,
        })
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);
      onSubmitted(data as Review);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao publicar a avaliação.";
      if (/column|reviewer_email|photo_url|verified/i.test(msg)) {
        setError("Aplica a migration 009_reviews_enhance no Supabase para ativar as avaliações.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Escrever Avaliação</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">O teu nome *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A96B] outline-none"
              placeholder="Ex.: Maria Silva"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email (opcional, não é mostrado)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A96B] outline-none"
              placeholder="email@exemplo.pt"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Classificação *</label>
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  className="text-3xl leading-none transition-transform hover:scale-110"
                  style={{ color: (hover || rating) >= s ? GOLD : "#334155" }}
                  aria-label={`${s} estrela${s > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Comentário * (mín. 10 caracteres)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A96B] outline-none resize-none"
              placeholder="Conta a tua experiência..."
            />
            <div className="text-[10px] text-slate-500 mt-1 text-right">{comment.trim().length}/10</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Foto (opcional)</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Pré-visualização" className="w-full max-h-40 object-cover rounded-lg border border-slate-800" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 text-sm"
                >×</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-slate-700 hover:border-[#C8A96B] rounded-lg cursor-pointer text-xs text-slate-400 transition-colors">
                📷 Adicionar foto
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0a0d14] transition-colors disabled:opacity-60"
            style={{ minWidth: 130 }}
          >
            {submitting ? "A publicar..." : "Publicar Avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}
