"use client";

/**
 * components/landing/HeroMockup.tsx
 *
 * Hero da nova landing (mockups aprovados 21/10/2026), com a ORDEM
 * EXPRESSA da Cristiane: onde o mockup desenha o seu globo, monta o
 * GLOBO REAL da página atual — components/ui/globe-hero.tsx
 * (GlobeBackground, Three.js) com a rotação e os efeitos existentes,
 * acompanhado do glow radial e do dot grid da hero atual. Nada de
 * globo desenhado à parte, nada de imagem estática, sem bibliotecas
 * novas. Animações de entrada existentes (animate-fade-in-up, WaveText
 * nos CTAs) mantidas.
 *
 * CORREÇÃO VISUAL (21/10/2026, tarde): o portátil e o telefone
 * desenhados que ficavam SOBRE a zona do globo foram retirados da
 * hero — o globo volta a ser o único protagonista da lateral direita,
 * inteiro e visível (composição copy-à-esquerda + globo-sozinho
 * aprovada na branch feat/hero-ajuste). O papel de demonstração da
 * Montra passa para a 2.ª dobra (SectorsMockup), com o mockup do
 * telemóvel aprovado pela Cristiane.
 *
 * Os cartões flutuantes da stage mobile são as fotografias REAIS de
 * Montras publicadas que o próprio mockup aprovado usa (capas/produtos
 * servidos do storage público da plataforma) — elementos decorativos,
 * sem alegações associadas. Sem ratings nem estatísticas inventadas.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { WaveText } from "@/components/ui/wave-text";
import { useGlobeGate } from "./useGlobeGate";

const GlobeBackground = dynamic(
  () => import("@/components/ui/globe-hero").then((m) => ({ default: m.GlobeBackground })),
  { ssr: false }
);

// Fotografias reais de Montras publicadas usadas no mockup aprovado (stage mobile).
const IMG_NEGOCIO_REAL =
  "https://ryxbmsmheysdhnhzpbug.supabase.co/storage/v1/object/public/vitrine-covers/acfe72de-7a3b-4a3e-94cf-520acbc8f10f/1791465946097-yxaez94.jpg";
const IMG_PRODUTO_1 =
  "https://ryxbmsmheysdhnhzpbug.supabase.co/storage/v1/object/public/vitrine-products/799d3bc3-d63c-425a-815a-07493055542e/1791219143784-xnd4nik.jpg";
const IMG_PRODUTO_2 =
  "https://ryxbmsmheysdhnhzpbug.supabase.co/storage/v1/object/public/vitrine-products/799d3bc3-d63c-425a-815a-07493055542e/1791218889597-7nshgyt.jpg";
const IMG_CAPA_MONTRA =
  "https://ryxbmsmheysdhnhzpbug.supabase.co/storage/v1/object/public/vitrine-covers/799d3bc3-d63c-425a-815a-07493055542e/1791218741536-rih7nxe.png";

const BENEFITS = [
  { icon: "▦", desktop: "Montra digital profissional", mobile: "Montra digital profissional" },
  { icon: "◎", desktop: "Seja encontrado por pessoas perto de si", mobile: "Seja encontrado perto de si" },
  { icon: "✆", desktop: "Contactos diretos por WhatsApp", mobile: "Contactos por WhatsApp" },
];

// Limpeza de repetições (21/10/2026): a frase do cartão de crédito
// passa a viver num único sítio da página — a secção de Planos.
const MICROPROOFS = ["Rápido e fácil", "Comece hoje"];

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,169,107,0.4)] w-full lg:w-auto";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#F7F4EE] bg-white/[0.03] border border-white/[0.22] transition-all duration-300 hover:border-[#C8A96B] w-full lg:w-auto";

export default function HeroMockup() {
  const globeOn = useGlobeGate();

  return (
    <section
      className="relative flex items-center overflow-hidden pt-[104px] pb-[60px] lg:pt-[122px] lg:min-h-[min(calc(100vh-34px),860px)]"
      style={{
        background:
          "radial-gradient(1200px 700px at 78% 40%, #12224a 0%, #0B1224 45%, #070B14 100%)",
      }}
    >
      {/* Dot grid da hero atual (decorativo) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage: "radial-gradient(rgba(200,169,107,0.16) 1.2px, transparent 1.2px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(90deg, transparent 0, #000 60%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 60%)",
        }}
      />

      <div className="relative z-[2] w-full max-w-[1320px] mx-auto px-5 lg:px-10 grid lg:grid-cols-[1.02fr_1fr] gap-5 items-center">
        {/* ── Coluna de copy ── */}
        <div className="text-center lg:text-left animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A96B]/[0.22] bg-[#C8A96B]/[0.06] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A96B]">
            ✦ Negócios locais em Portugal
          </span>

          <h1 className="font-display font-extrabold text-[38px] leading-[1.06] lg:text-[clamp(48px,5.4vw,80px)] lg:leading-[1.03] tracking-[-0.01em] mt-[26px] mb-6 text-[#F7F4EE]">
            Para qualquer negócio, <span className="text-[#E6CB8C]">a sua montra digital.</span>
          </h1>

          <p className="text-[15.5px] lg:text-[19px] leading-[1.6] text-[#d3d9e6] max-w-[560px] mx-auto lg:mx-0">
            <span className="lg:hidden">
              Do restaurante ao salão, da loja ao serviço. Crie a sua Montra, apresente produtos e serviços e chegue a novos clientes em Portugal.
            </span>
            <span className="hidden lg:inline">
              Do restaurante ao salão, da loja ao serviço. Crie a sua Montra, apresente produtos e serviços, receba contactos e chegue a novos clientes em Portugal.
            </span>
          </p>

          {/* Stage mobile: glow + fotos reais flutuantes. O globo WebGL
              NÃO monta em mobile (gate desktop-only mantido) — o glow
              radial e o dot grid preservam o visual da dobra. */}
          <div aria-hidden="true" className="relative lg:hidden w-[108%] -ml-[4%] aspect-square mt-1.5 -mb-2">
            <div
              className="absolute rounded-full"
              style={{
                inset: "-4%",
                background:
                  "radial-gradient(circle, rgba(230,203,140,0.22) 0%, rgba(200,169,107,0.07) 40%, transparent 68%)",
              }}
            />
            <div className="absolute inset-[6%] rounded-full border border-[#C8A96B]/15" />
            <div
              className="absolute left-[2%] top-[46%] w-[26%] aspect-[9/16] rounded-[20px] border-[5px] border-[#1b2440] bg-cover bg-center shadow-[0_24px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(200,169,107,0.2)]"
              style={{ backgroundImage: `url(${IMG_CAPA_MONTRA}), linear-gradient(135deg,#2a3355,#15203d)` }}
            />
            <div className="absolute right-[2%] top-1/2 w-[30%] grid gap-1.5">
              <div
                className="aspect-[4/3] rounded-xl border-[3px] border-[#1b2440] bg-cover bg-center shadow-[0_18px_36px_rgba(0,0,0,0.6)]"
                style={{ backgroundImage: `url(${IMG_NEGOCIO_REAL}), linear-gradient(135deg,#2a3355,#15203d)` }}
              />
              <div
                className="aspect-[4/3] rounded-xl border-[3px] border-[#1b2440] bg-cover bg-center shadow-[0_18px_36px_rgba(0,0,0,0.6)]"
                style={{ backgroundImage: `url(${IMG_PRODUTO_1}), linear-gradient(135deg,#2a3355,#15203d)` }}
              />
            </div>
          </div>

          {/* Benefícios */}
          <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-[34px] my-5 lg:mt-[34px] lg:mb-9">
            {BENEFITS.map((b) => (
              <div key={b.icon} className="flex flex-col items-center lg:items-start gap-2 lg:gap-3 text-[11.5px] lg:text-sm leading-[1.35] lg:leading-[1.4] text-[#e8ebf3] lg:max-w-[150px]">
                <span className="w-11 h-11 lg:w-[54px] lg:h-[54px] rounded-full border border-[#C8A96B] grid place-items-center text-[#C8A96B] text-lg lg:text-[22px] bg-[#C8A96B]/[0.07]">
                  {b.icon}
                </span>
                <span className="lg:hidden">{b.mobile}</span>
                <span className="hidden lg:inline">{b.desktop}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:flex-wrap">
            <Link href="/register" className={BTN_PRIMARY}>
              <WaveText text="Criar Montra Grátis →" />
            </Link>
            <Link href="/explorar" className={BTN_GHOST}>
              <WaveText text="Explorar Negócios" />
            </Link>
          </div>

          {/* Microproofs */}
          <div className="flex justify-center lg:justify-start flex-wrap gap-x-[26px] gap-y-2 mt-4 lg:mt-[22px] text-[11.5px] lg:text-[13px] text-[#A9B1C3]">
            {MICROPROOFS.map((m) => (
              <span key={m}>
                <span className="text-[#C8A96B] font-bold mr-2">✓</span>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stage desktop: GLOBO REAL sozinho, protagonista da lateral
            direita (correção visual 21/10/2026 — os dispositivos
            desenhados que o cobriam saíram da hero; a demonstração da
            Montra vive agora na 2.ª dobra). ── */}
        <div className="relative hidden lg:block w-full max-w-[720px] ml-auto aspect-square animate-fade-in-up delay-200">
          <div
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              inset: "-10%",
              background:
                "radial-gradient(circle, rgba(230,203,140,0.30) 0%, rgba(200,169,107,0.10) 40%, transparent 68%)",
            }}
          />
          {/* O globo verdadeiro da plataforma (Three.js, globe-hero.tsx),
              inteiro e visível, sem nada por cima. */}
          {globeOn && <GlobeBackground />}
        </div>
      </div>
    </section>
  );
}
