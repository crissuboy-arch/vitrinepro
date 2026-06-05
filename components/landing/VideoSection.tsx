'use client'

import { useState } from "react";

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-24 md:py-32 bg-[#090E1A] border-b border-white/5 relative z-10">
      <div className="max-w-4xl mx-auto px-4 space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Veja em acção
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Online em 5 minutos
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Veja como criar e publicar a sua vitrine num único vídeo de 30 segundos.
          </p>
        </div>

        {/* Video player container */}
        <div className="relative rounded-2xl overflow-hidden border border-[#C8A96B]/20 shadow-[0_0_60px_rgba(200,169,107,0.1)]">
          {!playing ? (
            /* Thumbnail / placeholder */
            <div
              className="relative aspect-video bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0C1322] flex items-center justify-center cursor-pointer group"
              onClick={() => setPlaying(true)}
            >
              {/* Fake screenshot preview */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full grid grid-cols-3 gap-2 p-8 pointer-events-none">
                  {["☕","💅","💈","🍽️","💪","🔧"].map((e, i) => (
                    <div key={i} className="bg-white/5 rounded-xl flex items-center justify-center text-3xl aspect-video">{e}</div>
                  ))}
                </div>
              </div>

              {/* Play button */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#C8A96B] flex items-center justify-center shadow-[0_0_40px_rgba(200,169,107,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 fill-[#0F172A] ml-1" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm">Ver demonstração</p>
                  <p className="text-slate-400 text-xs mt-0.5">30 segundos · Sem som necessário</p>
                </div>
              </div>

              {/* Duration badge */}
              <span className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                0:30
              </span>
            </div>
          ) : (
            /* Embedded video — replace src with real video URL */
            <div className="aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="VitrinePro demo"
                allow="autoplay; fullscreen"
              />
            </div>
          )}
        </div>

        {/* Micro trust row below video */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {["Sem cartão de crédito", "Sem contrato", "Cancela quando quiseres"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="text-[#C8A96B]">✓</span> {t}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
