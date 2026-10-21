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
 * Cartão real da hero = Cantinho da Lu (regra de reconciliação):
 * nome, setor, cidade e produtos/preços REAIS, e o cartão inteiro liga
 * à Montra pública verdadeira dela (confirmada no sitemap live).
 * A fotografia de capa é ilustrativa — a mesma já aprovada na branch
 * feat/hero-ajuste (carrossel) — porque a capa real não é incorporável
 * de forma fiável (a og:image da página dela é a imagem institucional).
 * Sem ratings nem estatísticas inventadas.
 *
 * As imagens do "laptop" (grelha do Explorar) e dos cartões flutuantes
 * mobile são as fotografias REAIS de Montras publicadas que o próprio
 * mockup aprovado usa (capas/produtos servidos do storage público da
 * plataforma) — elementos decorativos, sem alegações associadas.
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { WaveText } from "@/components/ui/wave-text";
import { useGlobeGate } from "./useGlobeGate";

const GlobeBackground = dynamic(
  () => import("@/components/ui/globe-hero").then((m) => ({ default: m.GlobeBackground })),
  { ssr: false }
);

const CANTINHO_URL = "https://vitrinepro.digital/vitrine/cantinho-da-lu-1780338635504";
const CANTINHO_COVER = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80";

// Fotografias reais de Montras publicadas usadas no mockup aprovado.
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

const MICROPROOFS = ["Rápido e fácil", "Sem cartão de crédito", "Comece hoje"];

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,169,107,0.4)] w-full lg:w-auto";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-2.5 px-[30px] py-4 rounded-[14px] font-bold text-[15px] text-[#F7F4EE] bg-white/[0.03] border border-white/[0.22] transition-all duration-300 hover:border-[#C8A96B] w-full lg:w-auto";

/** Telefone da stage desktop: a Montra real do Cantinho da Lu. */
function CantinhoPhone() {
  return (
    <a
      href={CANTINHO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ver a Montra real do Cantinho da Lu"
      className="absolute right-[4%] top-[30%] w-[25%] block bg-[#05080f] border-[7px] border-[#1b2440] rounded-[30px] overflow-hidden shadow-[0_40px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(200,169,107,0.18)] [transform:perspective(1500px)_rotateY(-14deg)_rotateZ(3deg)]"
    >
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[36%] h-3 rounded-lg bg-[#05080f] z-[3]" />
      <div className="relative aspect-[1/1.05] bg-cover bg-center" style={{ backgroundImage: `url(${CANTINHO_COVER})` }}>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#C8A96B] text-[#0A0D14] text-[9px] font-bold tracking-wide">
          ✓ Exemplo real
        </span>
      </div>
      <div className="p-3 bg-[#0c1428]">
        <p className="text-xs font-bold text-[#F7F4EE]">Cantinho da Lu</p>
        <p className="text-[9.5px] text-[#A9B1C3] mt-1">Lanches e Salgados · Águeda</p>
        <div className="mt-2 space-y-1 text-[9.5px]">
          <p className="flex justify-between gap-2">
            <span className="text-[#d3d9e6]">Coxinha no Cone</span>
            <span className="text-[#E6CB8C] font-bold">€3,00</span>
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-[#d3d9e6]">Coxinha c/ Catupiry</span>
            <span className="text-[#E6CB8C] font-bold">€2,50</span>
          </p>
        </div>
        <div className="flex gap-1.5 mt-2.5" aria-hidden="true">
          <span className="flex-1 text-center text-[9.5px] font-semibold py-[7px] rounded-lg bg-[#1fa855] text-white">WhatsApp</span>
          <span className="flex-1 text-center text-[9.5px] py-[7px] rounded-lg bg-white/[0.08] text-[#F7F4EE]">Ver Montra</span>
        </div>
      </div>
    </a>
  );
}

/** Laptop da stage desktop: grelha do Explorar com fotos reais (decorativo). */
function ExplorarLaptop() {
  const cards = [
    { img: IMG_NEGOCIO_REAL, label: "Negócio real" },
    { img: IMG_PRODUTO_1, label: "Produto" },
    { img: IMG_PRODUTO_2, label: "Produto" },
  ];
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-6%] top-1/2 w-[62%] bg-[#05080f] border-[7px] border-b-[12px] border-[#1b2440] rounded-[14px] shadow-[0_40px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(200,169,107,0.18)] [transform:perspective(1500px)_rotateY(-16deg)_rotateX(5deg)]"
    >
      <div className="flex gap-[5px] px-2 py-1.5 bg-[#0b1224]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#3a4568]" />
        <span className="w-[7px] h-[7px] rounded-full bg-[#3a4568]" />
        <span className="w-[7px] h-[7px] rounded-full bg-[#3a4568]" />
      </div>
      <div className="p-2.5 bg-gradient-to-b from-[#0f1830] to-[#0a1020]">
        <div className="px-3 py-2 rounded-[9px] bg-white/[0.06] text-[10px] text-[#A9B1C3] mb-2.5">
          🔍 Pesquise negócios, serviços, produtos…
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cards.map((c) => (
            <div
              key={c.label + c.img}
              className="relative aspect-[3/4] rounded-[10px] bg-cover bg-center flex items-end overflow-hidden"
              style={{ backgroundImage: `url(${c.img}), linear-gradient(135deg,#2a3355,#15203d)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070B14]/90" />
              <span className="relative z-[2] text-[10px] font-semibold p-2">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

        {/* ── Stage desktop: GLOBO REAL + dispositivos ── */}
        <div className="relative hidden lg:block w-full max-w-[760px] ml-auto aspect-[1/1.02] animate-fade-in-up delay-200">
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
              montado onde o mockup desenha o seu .globe3d. */}
          <div aria-hidden="true" className="absolute" style={{ inset: "-16% -34% -6% -8%" }}>
            {globeOn && <GlobeBackground />}
          </div>
          <ExplorarLaptop />
          <CantinhoPhone />
        </div>
      </div>
    </section>
  );
}
