"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import { trackWhatsAppClick } from "@/app/lib/analytics";

interface SocialBarProps {
  businessId: string;
  businessName: string;
  businessSlug: string;
  initialLikeCount?: number;
  initialFavoriteCount?: number;
  initialShareCount?: number;
  initialViewCount?: number;
  initialIsLiked?: boolean;
  initialIsFavorited?: boolean;
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export default function SocialBar({
  businessId,
  businessName,
  businessSlug,
  initialLikeCount = 0,
  initialFavoriteCount = 0,
  initialShareCount = 0,
  initialViewCount = 0,
  initialIsLiked = false,
  initialIsFavorited = false,
}: SocialBarProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [favCount, setFavCount] = useState(initialFavoriteCount);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [viewCount] = useState(initialViewCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const vitrineUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/vitrine/${businessSlug}`
      : `https://vitrinepro.pt/vitrine/${businessSlug}`;

  // Fetch fresh counts + user status on mount
  useEffect(() => {
    fetch(`/api/social?business_id=${businessId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setLikeCount(data.like_count ?? 0);
          setFavCount(data.favorite_count ?? 0);
          setShareCount(data.share_count ?? 0);
          setIsLiked(data.is_liked ?? false);
          setIsFavorited(data.is_favorited ?? false);
        }
      })
      .catch(() => {});
  }, [businessId]);

  // Close share menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Toggle Like ─────────────────────────────────────────────────
  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      window.location.href = `/login?next=/vitrine/${businessSlug}`;
      setLikeLoading(false);
      return;
    }

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);

    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ business_id: businessId, action: "toggle_like" }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback on error
        setIsLiked(wasLiked);
        setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
      } else {
        // Sync with server value
        setLikeCount(data.like_count ?? likeCount);
        setIsLiked(data.liked ?? !wasLiked);
      }
    } catch {
      setIsLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Toggle Favorite ──────────────────────────────────────────────
  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      window.location.href = `/login?next=/vitrine/${businessSlug}`;
      setFavLoading(false);
      return;
    }

    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);
    setFavCount((c) => wasFavorited ? Math.max(0, c - 1) : c + 1);

    try {
      if (wasFavorited) {
        const { data: existing } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("business_id", businessId)
          .maybeSingle();
        if (existing) await supabase.from("favorites").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: session.user.id, business_id: businessId });
      }
    } catch {
      setIsFavorited(wasFavorited);
      setFavCount((c) => wasFavorited ? c + 1 : Math.max(0, c - 1));
    } finally {
      setFavLoading(false);
    }
  };

  // ── Share ────────────────────────────────────────────────────────
  const recordShare = (platform: string) => {
    setShareCount((c) => c + 1);
    fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, action: "record_share", platform }),
    }).catch(() => {});
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(vitrineUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      prompt("Copie este link:", vitrineUrl);
    }
    recordShare("link");
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Encontrei este negócio no VitrinePro: *${businessName}*\n${vitrineUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    recordShare("whatsapp");
    setShowShareMenu(false);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: businessName, url: vitrineUrl }).catch(() => {});
      recordShare("native");
      setShowShareMenu(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      {/* Counters row */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {fmt(viewCount)} visitas
        </span>
        <span className="flex items-center gap-1">
          ❤️ {fmt(likeCount)}
        </span>
        <span className="flex items-center gap-1">
          🔖 {fmt(favCount)}
        </span>
        <span className="flex items-center gap-1">
          📤 {fmt(shareCount)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
            isLiked
              ? "bg-red-500/15 border-red-500/40 text-red-400"
              : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-red-500/30 hover:text-red-400"
          }`}
        >
          <span className="text-lg leading-none">{isLiked ? "❤️" : "🤍"}</span>
          <span>{isLiked ? "Curtido" : "Curtir"}</span>
        </button>

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
            isFavorited
              ? "bg-[#C8A96B]/15 border-[#C8A96B]/40 text-[#C8A96B]"
              : "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-[#C8A96B]/30 hover:text-[#C8A96B]"
          }`}
        >
          <span className="text-lg leading-none">{isFavorited ? "🔖" : "📌"}</span>
          <span>{isFavorited ? "Guardado" : "Guardar"}</span>
        </button>

        {/* Share */}
        <div className="relative" ref={shareRef}>
          <button
            onClick={() => setShowShareMenu((s) => !s)}
            className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400 hover:border-blue-500/30 hover:text-blue-400 text-xs font-semibold transition-all"
          >
            <span className="text-lg leading-none">📤</span>
            <span>Partilhar</span>
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl w-52 overflow-hidden z-50">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span>{shareCopied ? "✅" : "🔗"}</span>
                {shareCopied ? "Link copiado!" : "Copiar link"}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors border-t border-slate-800"
              >
                <span>💬</span> Partilhar no WhatsApp
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors border-t border-slate-800"
                >
                  <span>⬆️</span> Mais opções
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
