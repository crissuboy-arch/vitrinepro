/**
 * components/promotions/PromotionCard.tsx — FASE 1 "Vitrine Flash"
 *
 * Cartão público de uma promoção (business_posts type='promocao'):
 * imagem, desconto, preço original riscado + preço promocional,
 * contador regressivo (quando há expires_at), WhatsApp, partilha
 * e ligação à Montra. Métricas: promotion_view (1× ao entrar no
 * viewport) e promotion_click (WhatsApp / Ver Montra).
 *
 * Visual alinhado com os cartões existentes (NovidadesFeed): fundo
 * escuro, dourado #C8A96B, rounded-2xl. Não altera a identidade atual.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { discountPercent, type PromotionRow } from "@/lib/promotions";
import { formatPriceEUR } from "@/lib/feed";
import { buildVitrineUrl } from "@/lib/vitrine-share";
import { trackPromotionView, trackPromotionClick } from "@/app/lib/analytics";

/** Texto curto do tempo restante (a precisão de segundos vive no Countdown). */
export function remainingLabel(expiresAt: string, now: Date = new Date()): string | null {
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "Terminada";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Termina em ${days}d ${hours}h`;
  if (hours > 0) return `Termina em ${hours}h ${minutes}m`;
  return `Termina em ${minutes}m`;
}

/** Contador regressivo: atualiza a cada 30s (a cada 1s na última hora). */
export function PromotionCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => setNow(new Date());
    const fast = end - Date.now() < 60 * 60 * 1000;
    const id = setInterval(tick, fast ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const label =
    ms < 60 * 60 * 1000
      ? `⏳ ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `⏳ ${remainingLabel(expiresAt, now)}`;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-[10px] font-bold">
      {label}
    </span>
  );
}

export default function PromotionCard({ promotion }: { promotion: PromotionRow }) {
  const cardRef = useRef<HTMLElement>(null);
  const viewedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  const biz = promotion.businesses ?? null;
  const slug = biz?.slug ?? null;
  const discount = discountPercent(promotion.original_price, promotion.price);
  const promoPrice = formatPriceEUR(promotion.price);
  const originalPrice = formatPriceEUR(promotion.original_price);
  const whatsappDigits = (biz?.whatsapp ?? "").replace(/\D/g, "");
  const vitrineUrl = slug ? buildVitrineUrl(slug) : null;

  // promotion_view: dispara uma vez quando o cartão entra no viewport.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      if (!viewedRef.current) {
        viewedRef.current = true;
        trackPromotionView(promotion.business_id);
      }
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackPromotionView(promotion.business_id);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [promotion.business_id]);

  const handleShare = async () => {
    if (!vitrineUrl) return;
    const shareData = {
      title: `${promotion.title} — ${biz?.name ?? "VitrinePro"}`,
      text: `${promotion.title}${promoPrice ? ` por ${promoPrice}` : ""} em ${biz?.name ?? "VitrinePro"}`,
      url: vitrineUrl,
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("share indisponível");
    } catch {
      try {
        await navigator.clipboard.writeText(vitrineUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // sem clipboard — ignora silenciosamente
      }
    }
  };

  return (
    <article
      ref={cardRef}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col hover:border-[#C8A96B]/40 transition-colors"
    >
      <div className="relative aspect-[4/3] bg-gray-950">
        {promotion.image_url ? (
          <img
            src={promotion.image_url}
            alt={promotion.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏷️</div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0F172A]/90 border border-[#C8A96B]/40 text-[#C8A96B] text-[10px] font-bold">
          🏷️ PROMOÇÃO
        </span>
        {discount !== null && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#C8A96B] text-[#0F172A] text-[11px] font-black">
            −{discount}%
          </span>
        )}
        {promotion.expires_at && (
          <span className="absolute bottom-2 left-2">
            <PromotionCountdown expiresAt={promotion.expires_at} />
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1.5 flex-grow min-w-0">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
          {promotion.title}
        </h3>
        <p className="text-[11px] text-gray-500 truncate">
          {biz?.name ?? "Montra"}
          {biz?.city ? ` · ${biz.city}` : ""}
          {biz?.category ? ` · ${biz.category}` : ""}
        </p>
        {promotion.content && (
          <p className="text-xs text-gray-400 line-clamp-2">{promotion.content}</p>
        )}

        {(promoPrice || originalPrice) && (
          <p className="flex items-baseline gap-2 mt-1">
            {originalPrice && discount !== null && (
              <span className="text-xs text-gray-500 line-through">{originalPrice}</span>
            )}
            {promoPrice && (
              <span className="text-base font-black text-[#C8A96B]">{promoPrice}</span>
            )}
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          {whatsappDigits ? (
            <a
              href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                `Olá! Vi a promoção "${promotion.title}" na VitrinePro e quero saber mais.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPromotionClick(promotion.business_id)}
              className="flex-grow text-center px-3 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold rounded-lg transition-colors"
            >
              WhatsApp
            </a>
          ) : slug ? (
            <Link
              href={`/vitrine/${slug}`}
              onClick={() => trackPromotionClick(promotion.business_id)}
              className="flex-grow text-center px-3 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg transition-colors"
            >
              Ver Montra
            </Link>
          ) : null}
          {slug && whatsappDigits ? (
            <Link
              href={`/vitrine/${slug}`}
              onClick={() => trackPromotionClick(promotion.business_id)}
              className="text-center px-3 py-2 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 text-xs font-bold rounded-lg transition-colors"
            >
              Montra
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleShare}
            title="Partilhar promoção"
            className="px-2.5 py-2 rounded-lg text-xs border border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
          >
            {copied ? "✓" : "↗"}
          </button>
        </div>
        {copied && <p className="text-[10px] text-[#C8A96B]">Link copiado!</p>}
      </div>
    </article>
  );
}
