"use client";

/**
 * components/landing/FinalCtaMockup.tsx
 *
 * CTA final da nova landing (mockup aprovado). O mockup monta o
 * globo uma segunda vez nesta secção (.fglobe) — aqui monta o GLOBO
 * REAL da plataforma (GlobeBackground, globe-hero.tsx), com o mesmo
 * gate desktop-only da hero. Em mobile, como no mockup mobile, fica
 * só o gradiente radial.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { WaveText } from "@/components/ui/wave-text";
import { useGlobeGate } from "./useGlobeGate";

const GlobeBackground = dynamic(
  () => import("@/components/ui/globe-hero").then((m) => ({ default: m.GlobeBackground })),
  { ssr: false }
);

export default function FinalCtaMockup() {
  const globeOn = useGlobeGate();

  return (
    <section className="relative overflow-hidden py-[50px] lg:py-[110px] border-t border-[#C8A96B]/[0.12]">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(500px 260px at 50% 100%, #12224a 0%, #070B14 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none hidden lg:block"
        style={{
          background:
            "radial-gradient(900px 400px at 80% 50%, #12224a 0%, #070B14 70%)",
        }}
      />
      {/* Segundo mount do globo real (posição .fglobe do mockup) */}
      <div aria-hidden="true" className="absolute hidden lg:block right-[-8%] top-[-40%] w-[62%] aspect-square opacity-95 pointer-events-none">
        {globeOn && <GlobeBackground />}
      </div>

      <div className="relative z-[2] max-w-[1320px] mx-auto px-5 lg:px-10">
        <div className="max-w-[640px] mx-auto lg:mx-0 text-center lg:text-left">
          <h2 className="font-display font-bold text-[29px] lg:text-[clamp(34px,3.6vw,52px)] leading-[1.12] lg:leading-[1.1] text-[#F7F4EE]">
            Crie a sua montra digital e <span className="text-[#E6CB8C]">dê a conhecer o seu negócio.</span>
          </h2>
          <p className="text-[#A9B1C3] text-[14.5px] lg:text-[17px] leading-[1.6] mt-2.5 lg:mt-0 lg:mb-7 mb-5">
            <span className="lg:hidden">Plano Grátis, sem cartão de crédito.</span>
            <span className="hidden lg:inline">Comece no plano Grátis, sem cartão de crédito.</span>
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,169,107,0.4)] w-full sm:w-auto"
          >
            <WaveText text="Criar Montra Grátis →" />
          </Link>
        </div>
      </div>
    </section>
  );
}
