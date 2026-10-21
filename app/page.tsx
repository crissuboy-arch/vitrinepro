/* eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useHomeRedirect } from "@/components/auth/useHomeRedirect";

// Overlay widgets are non-critical — lazy-load them so they stay out of the initial bundle.
const ChatWidget = dynamic(() => import("./components/ChatWidget"), { ssr: false });
const RefPopup = dynamic(() => import("./components/RefPopup"), { ssr: false });
const LeadCapturePopup = dynamic(() => import("./components/LeadCapturePopup"), { ssr: false });

// Fontes: a página NÃO instancia fontes próprias (correção mobile
// 21/10/2026). O layout (app/layout.tsx) já expõe --font-playfair e
// --font-inter em <html>; o --font-dmsans daqui nunca foi referenciado
// por nenhuma classe/CSS (font-sans resolve para Inter via @theme em
// globals.css) e o Playfair local duplicava o do layout — os dois
// woff2 extra eram peso morto medido no Lighthouse.
import { BUSINESS_CHECKOUT_ENABLED, normalizePlan } from "@/lib/plans";

// Landing components — nova landing dos mockups aprovados (21/10/2026).
// As secções antigas (DiscoverySearch como secção, StatsSection,
// BusinessTypesSection, ShowcaseSection, SolutionSection,
// MarketplaceSection, VideoSection, VideoCtaSection, ComparisonSection,
// CatalogSection/CatalogFlipbook, HeroCarrossel, PlansSection,
// FinalCTASection, Navbar e HeroSection anteriores) deixam de ser
// renderizadas aqui — o código delas NÃO é apagado, só a composição
// desta página muda.
import NavMockup from "@/components/landing/NavMockup";
import HeroMockup from "@/components/landing/HeroMockup";
import DiscoverMockup from "@/components/landing/DiscoverMockup";
import SectorsMockup from "@/components/landing/SectorsMockup";
import { ProblemMockup, FeaturesMockup, StepsMockup } from "@/components/landing/InfoMockup";
import PlansMockup from "@/components/landing/PlansMockup";
import FaqMockup from "@/components/landing/FaqMockup";
import FinalCtaMockup from "@/components/landing/FinalCtaMockup";
import FooterMockup from "@/components/landing/FooterMockup";

export default function HomePage() {
  // Correção definitiva da navegação: utilizadores autenticados nunca
  // veem a landing comercial — são redirecionados para a sua home
  // (admin → /admin, merchant → /dashboard, consumidor → /explorar).
  // Enquanto verifica (ou vai redirecionar), NÃO renderiza a landing
  // para evitar flash.
  const visitorStay = useHomeRedirect();

  const router = useRouter();

  // Called by PlansMockup with the chosen planId — fluxo de checkout
  // existente, INALTERADO (Stripe intocado).
  const handleSelectPlan = async (planId: string) => {
    console.log("[PLANS] Selected plan:", planId);
    if (planId === "free") {
      router.push("/login?mode=signup");
      return;
    }

    // Launch gate: Business is not purchasable in phase 1 (CTA is disabled
    // in PlansMockup; this guards any residual call).
    if (normalizePlan(planId) === "business" && !BUSINESS_CHECKOUT_ENABLED) {
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        console.log("[PLANS] No session, redirecting to signup with plan:", planId);
        router.push(`/login?mode=signup&plan=${planId}`);
        return;
      }

      console.log("[PLANS] Active session found for user:", session.user.id);
      const { data: bizRows, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1);

      if (bizError) throw bizError;

      if (!bizRows || bizRows.length === 0) {
        console.log("[PLANS] No business found, redirecting to onboarding with plan:", planId);
        router.push(`/onboarding?plan=${planId}`);
        return;
      }

      console.log("[PLANS] Business found:", bizRows[0].id, "Redirecting to Stripe checkout...");
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, businessId: bizRows[0].id }),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "(sem corpo)");
        console.error("[PLANS] Checkout API error:", resp.status, body);
        throw new Error(`HTTP error ${resp.status}: ${body}`);
      }

      const data = await resp.json();
      if (data.url) {
        console.log("[PLANS] Redirecting to Stripe url:", data.url);
        window.location.href = data.url;
      } else {
        console.log("[PLANS] No checkout url in response, redirecting to dashboard");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("[PLANS] Error handling plan selection:", err);
      // Fallback redirect to login with plan
      router.push(`/login?mode=signup&plan=${planId}`);
    }
  };

  // Sem sessão confirmada → visitante: mostra a landing.
  // Com sessão (a verificar ou a redirecionar) → loader neutro, nunca a landing.
  if (!visitorStay) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" width={800} height={216} priority className="h-10 w-auto object-contain opacity-80" />
          <div className="w-8 h-8 border-2 border-[#C8A96B]/30 border-t-[#C8A96B] rounded-full animate-spin" aria-label="A carregar" />
        </div>
      </div>
    );
  }

  return (
    <div className={`font-sans relative min-h-screen bg-[#070B14] text-[#F7F4EE] flex flex-col select-none selection:bg-[#C8A96B] selection:text-[#0A0D14] overflow-x-hidden`}>

      {/* Stripe-like Ambient Radial Mesh Gradients — restaurados da
          landing original (f142170) na Correção Visual de 21/10/2026:
          os brilhos ambientes que o redesign tinha retirado.
          CORREÇÃO MOBILE (21/10/2026): os 4 glows vivem agora dentro
          de um contentor decorativo absolute inset-0 overflow-hidden
          que os recorta exatamente na caixa da página. Sem isto, o
          glow bottom-[-10%] (=-10% da altura da página inteira)
          estendia-se 515–707px para lá do fim do footer — a causa
          provada do espaço vazio pós-footer no Safari/iOS (bissecção
          no diagnóstico: escondê-lo removia −516px exatos a 390px).
          As classes/posições de cada glow NÃO mudam: a parte visível
          de cada brilho fica pixel-igual; só é recortada a parte que
          caía fora da página e gerava scroll fantasma. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-tr from-[#C8A96B]/5 to-[#0A1226]/40 blur-[130px] pointer-events-none z-0" />
        <div className="absolute top-[20%] right-[-20%] w-[90vw] h-[90vw] sm:w-[70vw] sm:h-[70vw] rounded-full bg-gradient-to-br from-blue-900/10 to-[#0A1226]/50 blur-[160px] pointer-events-none z-0" />
        <div className="absolute bottom-[15%] left-[-20%] w-[90vw] h-[90vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-tr from-[#C8A96B]/3 to-[#0F172A]/50 blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#C8A96B]/5 to-transparent blur-[120px] pointer-events-none z-0" />
      </div>

      {/* Navbar (mockup) */}
      <NavMockup />

      <main className="flex-1 flex flex-col">
        {/* 1ª dobra — hero com o GLOBO REAL da plataforma */}
        <HeroMockup />

        {/* Pesquisa real (a barra continua a pesquisar → /explorar?q=) */}
        <DiscoverMockup />

        {/* LIMPEZA DE REPETIÇÕES (21/10/2026): as categorias passam a
            ser apresentadas UMA vez nesta zona — os cartões de setor
            da secção seguinte. A faixa marquee de categorias e a linha
            de chips que aqui estavam saem da composição (o código dos
            componentes NÃO é apagado, só deixam de ser renderizados
            aqui — mesmo padrão das secções antigas). */}

        {/* Negócios reais · Todos os setores (+ faixa de factos;
            demonstração do exemplo real Cantinho da Lu com o mockup
            do telemóvel aprovado) */}
        <SectorsMockup />

        {/* Problema (fora em ecrãs pequenos, como no mockup mobile) */}
        <ProblemMockup />

        {/* Funcionalidades */}
        <FeaturesMockup />

        {/* Como funciona (fora em ecrãs pequenos) */}
        <StepsMockup />

        {/* Planos verificados contra lib/plans.ts */}
        <PlansMockup onSelectPlan={handleSelectPlan} />

        {/* FAQ — 4 perguntas do mockup (fora em ecrãs pequenos) */}
        <FaqMockup />

        {/* CTA final com o globo real */}
        <FinalCtaMockup />
      </main>

      {/* Rodapé institucional (mockup) */}
      <FooterMockup />

      {/* Chat Widget */}
      <ChatWidget />
      <RefPopup />
      <LeadCapturePopup />

    </div>
  );
}
