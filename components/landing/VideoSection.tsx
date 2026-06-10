'use client'

import { useState } from "react";
import { Typewriter } from "@/components/ui/typewriter";

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);

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
          {!playing ? (
            <div
              className="relative aspect-video bg-gradient-to-br from-[#0F172A] via-[#1A1505] to-[#0A0D14] flex items-center justify-center cursor-pointer group"
              onClick={() => setPlaying(true)}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(rgba(201,169,110,0.3) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Fake step sequence — decorative, hidden on small screens */}
              <div className="absolute inset-0 items-center justify-center pointer-events-none hidden sm:flex">
                <div className="grid grid-cols-5 gap-3 opacity-15 px-8">
                  {["🔑 Registo", "🏪 Negócio", "🛍️ Produtos", "📱 Partilha", "🎉 Clientes"].map((s) => (
                    <div key={s} className="bg-white/10 rounded-xl p-3 text-center text-xs text-white/60 font-medium">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Play button */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-[0_0_50px_rgba(201,169,110,0.5)] group-hover:scale-110 group-hover:shadow-[0_0_70px_rgba(201,169,110,0.6)] transition-all duration-300">
                  <svg className="w-8 h-8 fill-[#0A0D14] ml-1" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[#F5F0E8] font-bold text-sm">Ver demonstração</p>
                  <p className="text-[#A9B1C3] text-xs mt-0.5">Do cadastro ao link pronto · Sem som necessário</p>
                </div>
              </div>

              <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
                ≈ 1 min
              </span>
            </div>
          ) : (
            <div className="aspect-video bg-black flex items-center justify-center">
              <p className="text-[#A9B1C3] text-sm">
                Vídeo demonstrativo em breve.{" "}
                <button onClick={() => setPlaying(false)} className="text-[#C9A96E] underline">
                  Fechar
                </button>
              </p>
            </div>
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
