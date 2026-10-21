/**
 * components/landing/FinalCtaMockup.tsx
 *
 * CTA final da nova landing (mockup aprovado).
 *
 * LIMPEZA DE REPETIÇÕES (21/10/2026):
 *  - O segundo mount do globo real que o mockup desenhava nesta
 *    secção (.fglobe) foi removido — o globo fica só na hero, a
 *    girar. A secção mantém os gradientes/brilho de fundo.
 *  - O título final deixou de ecoar o H1: passa a uma chamada
 *    distinta e curta.
 *  - A menção ao cartão de crédito saiu daqui — a frase vive num
 *    único sítio da página, a secção de Planos.
 */

import Link from "next/link";
import { WaveText } from "@/components/ui/wave-text";

export default function FinalCtaMockup() {
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

      <div className="relative z-[2] max-w-[1320px] mx-auto px-5 lg:px-10">
        <div className="max-w-[640px] mx-auto lg:mx-0 text-center lg:text-left animate-fade-in-up">
          <h2 className="font-display font-bold text-[29px] lg:text-[clamp(34px,3.6vw,52px)] leading-[1.12] lg:leading-[1.1] text-[#F7F4EE]">
            Dê a conhecer <span className="text-[#E6CB8C]">o seu negócio.</span>
          </h2>
          <p className="text-[#A9B1C3] text-[14.5px] lg:text-[17px] leading-[1.6] mt-2.5 lg:mt-0 lg:mb-7 mb-5">
            Comece no plano Grátis.
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
