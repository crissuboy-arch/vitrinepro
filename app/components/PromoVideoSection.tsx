"use client";

/**
 * components/vitrine/PromoVideoSection.tsx — Vídeo promocional da Montra
 *
 * Regras de exibição (brief da dona):
 *   - Sem vídeo válido configurado → não renderiza nada (null). A página
 *     pública nunca mostra uma secção vazia, um erro ou um buraco.
 *   - Vídeo VERTICAL 9:16, responsivo (largura total até 400 px, centrado).
 *   - NUNCA arranca sozinho, nunca com som automático: antes do clique
 *     só existe a miniatura (leve) + botão Play. O elemento <video> só é
 *     montado depois do clique, por isso o ficheiro pesado nunca carrega
 *     com a página (nem com preload).
 *   - Botão abaixo do vídeo só quando o destino é um URL https válido;
 *     abre em nova aba (é uma página de vendas externa à Montra).
 *
 * Usa <img>/<a> simples (não next/image): a miniatura pode ser uma URL
 * externa ou do Storage, e o componente tem de renderizar fora do Next
 * (testes de renderização) sem configuração de domínios.
 */

import { useState } from "react";
import {
  shouldShowPromoVideo,
  shouldShowPromoButton,
  promoButtonText,
  type PromoVideoConfig,
} from "@/lib/promo-video";

interface PromoVideoSectionProps {
  promoVideo: PromoVideoConfig | null | undefined;
}

export default function PromoVideoSection({ promoVideo }: PromoVideoSectionProps) {
  const [playing, setPlaying] = useState(false);

  if (!shouldShowPromoVideo(promoVideo)) {
    return null;
  }

  const videoUrl = promoVideo!.videoUrl as string;
  const showButton = shouldShowPromoButton(promoVideo);

  return (
    <section aria-label="Vídeo promocional" className="space-y-4">
      <h2 className="text-2xl font-bold font-display text-white border-b border-slate-800 pb-3 flex items-center gap-2">
        <span>🎬</span> Vídeo Promocional
      </h2>

      <div className="mx-auto w-full max-w-[400px]">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80">
          {!playing ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label="Ver vídeo promocional"
              className="group absolute inset-0 h-full w-full cursor-pointer"
            >
              {promoVideo!.thumbnailUrl ? (
                <img
                  src={promoVideo!.thumbnailUrl}
                  alt="Miniatura do vídeo promocional"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#C8A96B]/30 via-slate-900 to-slate-950"
                >
                  <span className="text-6xl">🎬</span>
                  <span className="text-sm font-semibold text-slate-300">
                    Vídeo promocional
                  </span>
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C8A96B] text-3xl text-[#0F172A] shadow-xl transition-transform group-hover:scale-105 group-active:scale-95">
                  ▶
                </span>
              </span>
            </button>
          ) : (
            <video
              src={videoUrl}
              controls
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full bg-black"
            />
          )}
        </div>
      </div>

      {showButton && (
        <div className="flex justify-center">
          <a
            href={promoVideo!.buttonUrl as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl transition-all shadow-lg active:scale-95"
          >
            {promoButtonText(promoVideo)}
          </a>
        </div>
      )}
    </section>
  );
}
