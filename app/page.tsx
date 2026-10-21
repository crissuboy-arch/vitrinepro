/* eslint-disable */
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import dynamic from "next/dynamic";
import { useHomeRedirect } from "@/components/auth/useHomeRedirect";

// Overlay widgets are non-critical — lazy-load them so they stay out of the initial bundle.
const ChatWidget = dynamic(() => import("./components/ChatWidget"), { ssr: false });
const RefPopup = dynamic(() => import("./components/RefPopup"), { ssr: false });
const LeadCapturePopup = dynamic(() => import("./components/LeadCapturePopup"), { ssr: false });

// Google Fonts
import { Playfair_Display, DM_Sans } from "next/font/google";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
});

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
          <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain opacity-80" />
          <div className="w-8 h-8 border-2 border-[#C8A96B]/30 border-t-[#C8A96B] rounded-full animate-spin" aria-label="A carregar" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${playfair.variable} ${dmSans.variable} font-sans relative min-h-screen bg-[#070B14] text-[#F7F4EE] flex flex-col select-none selection:bg-[#C8A96B] selection:text-[#0A0D14] overflow-x-hidden`}>

      {/* Navbar (mockup) */}
      <NavMockup />

      <main className="flex-1 flex flex-col">
        {/* 1ª dobra — hero com o GLOBO REAL da plataforma */}
        <HeroMockup />

        {/* Pesquisa real + categorias */}
        <DiscoverMockup />

        {/* Negócios reais · Todos os setores (+ faixa de factos;
            destaque mobile do exemplo real Cantinho da Lu) */}
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
