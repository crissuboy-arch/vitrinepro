'use client'

import { useRef, useState } from "react";
import { Typewriter } from "@/components/ui/typewriter";

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const startPlayback = () => {
    setPlaying(true);
    videoRef.current?.play().catch(() => undefined);
  };

  return (
    <section className="py-24 md:py-32 bg-[#08090F] border-b border-white/5 relative z-10">
      <div className="max-w-4xl mx-auto px-4 space-y-12">

        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
            Veja em ação
          </span>
          <h2 style={{
            fontFamily: "serif",
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 700,
            color: "#f5f0e8",
            lineHeight: 1.2,
            textAlign: "center",
          }}>
            Veja como criar a sua vitrine{" "}
            <br />
            em menos de{" "}
            <span style={{ color: "#c9a96e", fontStyle: "italic" }}>
              <Typewriter
                words={["1 minuto.", "5 passos.", "segundos.", "instantes."]}
                speed={80}
                delayBetweenWords={2000}
                cursor={true}
                cursorChar="|"
              />
            </span>
          </h2>
          <p className="text-[#A9B1C3] text-sm md:text-base font-light max-w-xl mx-auto">
            Do cadastro ao link pronto para colocar no Instagram.
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-[#C9A96E]/20 shadow-[0_0_80px_rgba(201,169,110,0.08)]">
          <video
            ref={videoRef}
            className="block aspect-video w-full bg-black object-cover"
            poster="/video-demo-vitrinepro-poster.jpg"
            controls={playing}
            playsInline
            preload="metadata"
            onEnded={() => setPlaying(false)}
            aria-label="Vídeo de demonstração da VitrinePro"
          >
            <source src="/video-demo-vitrinepro.mp4" type="video/mp4" />
            O seu navegador não suporta vídeo HTML5.
          </video>

          {!playing && (
            <button
              type="button"
              onClick={startPlayback}
              className="group absolute inset-0 flex items-center justify-center cursor-pointer"
              aria-label="Ver demonstração da VitrinePro"
            >
              {/* Background pattern */}
              <span
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(rgba(201,169,110,0.3) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Play button */}
              <span className="relative z-10 flex flex-col items-center gap-4">
                <span className="w-20 h-20 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-[0_0_50px_rgba(201,169,110,0.5)] group-hover:scale-110 group-hover:shadow-[0_0_70px_rgba(201,169,110,0.6)] transition-all duration-300">
                  <svg className="w-8 h-8 fill-[#0A0D14] ml-1" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-center">
                  <span className="block text-[#F5F0E8] font-bold text-sm">Ver demonstração</span>
                  <span className="block text-[#A9B1C3] text-xs mt-0.5">Do cadastro ao link pronto · Sem som necessário</span>
                </span>
              </span>

              <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
                ≈ 1 min
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold text-[#A9B1C3] uppercase tracking-wider">
          {["Sem cartão de crédito", "Sem contrato", "Cancela quando quiseres"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="text-[#C9A96E]">✓</span> {t}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
