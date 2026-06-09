/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import ChatWidget from "./components/ChatWidget";
import RefPopup from "./components/RefPopup";
import LeadCapturePopup from "./components/LeadCapturePopup";

// Google Fonts
import { Playfair_Display, DM_Sans } from "next/font/google";

// Landing components
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import BusinessTypesSection from "@/components/landing/BusinessTypesSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import VideoSection from "@/components/landing/VideoSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import StepsSection from "@/components/landing/StepsSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import CatalogSection from "@/components/landing/CatalogSection";
import MarketplaceSection from "@/components/landing/MarketplaceSection";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
});

// Testimonials interface
interface MockTestimonial {
  name: string;
  role: string;
  city: string;
  text: string;
  avatarLetter: string;
  avatarColor: string;
}

const mockSocialTestimonials: MockTestimonial[] = [
  {
    name: "Rui Barbosa",
    role: "Barbeiro Proprietário",
    city: "Porto",
    text: "O VitrinePro transformou o meu negócio. Os clientes agora vêem a tabela de preços antes de marcar e o botão do WhatsApp facilitou tudo. Excelente investimento!",
    avatarLetter: "R",
    avatarColor: "bg-blue-600"
  },
  {
    name: "Marta Fonseca",
    role: "Cake Designer",
    city: "Lisboa",
    text: "Antes eu perdia horas enviando fotos de bolos pelo WhatsApp. Agora, envio o meu link da VitrinePro e o cliente escolhe logo o sabor e tamanho. Recomendo muito!",
    avatarLetter: "M",
    avatarColor: "bg-pink-600"
  },
  {
    name: "Carlos Ferreira",
    role: "Eletricista de Emergência",
    city: "Braga",
    text: "Para serviços rápidos de eletricidade, os clientes precisam de ver a morada e ligar rápido. O mapa integrado e o botão de chamada trouxeram-me 5 novos clientes esta semana.",
    avatarLetter: "C",
    avatarColor: "bg-yellow-600"
  },
  {
    name: "Sofia Guedes",
    role: "Esteticista",
    city: "Faro",
    text: "Tentei fazer um site em WordPress e desisti porque era muito complexo. Com a VitrinePro configurei tudo sozinha em 5 minutos e ficou lindo no telemóvel.",
    avatarLetter: "S",
    avatarColor: "bg-purple-600"
  },
  {
    name: "Vítor Mendes",
    role: "Restaurante Central",
    city: "Coimbra",
    text: "O menu com fotos e preços aumentou os nossos pedidos pelo WhatsApp em mais de 50%. A simplicidade de mudar o prato do dia pelo telemóvel é imbatível.",
    avatarLetter: "V",
    avatarColor: "bg-green-600"
  },
  {
    name: "Beatriz Santos",
    role: "Loja de Roupa Local",
    city: "Funchal",
    text: "Coloquei o link na bio do meu Instagram e as mensagens de 'qual o preço?' diminuíram 90%. As pessoas clicam, vêem a galeria e compram diretamente.",
    avatarLetter: "B",
    avatarColor: "bg-red-600"
  }
];

// Example mock showcase interface
interface ExampleItem {
  id: string;
  tabLabel: string;
  name: string;
  category: string;
  city: string;
  icon: string;
  bgUrl: string;
  description: string;
  rating: string;
  products: { emoji: string; name: string; price: string; desc: string }[];
}

const exampleShowcase: ExampleItem[] = [
  {
    id: "restaurante",
    tabLabel: "🍔 Restaurante",
    name: "Hambúrguer Gourmet Art",
    category: "Restaurantes & Snack-bars",
    city: "Porto",
    icon: "🍔",
    bgUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop",
    description: "Hambúrgueres artesanais de carne maturada cozinhados no carvão. Pão brioche artesanal e ingredientes locais frescos.",
    rating: "4.9",
    products: [
      { emoji: "🍔", name: "Hambúrguer Bacon Cheddar", price: "€10.90", desc: "Carne 150g, bacon crocante, muito cheddar derretido e molho barbecue." },
      { emoji: "🍟", name: "Batatas Rústicas com Ervas", price: "€3.50", desc: "Batatas fritas com casca, alecrim fresco e maionese de alho caseira." }
    ]
  },
  {
    id: "barbearia",
    tabLabel: "💈 Barbearia",
    name: "Corte Fino Barber Club",
    category: "Beleza e Estilo",
    city: "Lisboa",
    icon: "💈",
    bgUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=200&fit=crop",
    description: "Espaço premium masculino focado em cortes de cabelo modernos, design de barba clássico à navalha e rituais com toalha quente.",
    rating: "4.9",
    products: [
      { emoji: "💇‍♂️", name: "Corte de Cabelo Clássico", price: "€18.00", desc: "Corte personalizado tesoura/máquina, finalização com pomada e massagem capilar." },
      { emoji: "🧔", name: "Barba Real à Navalha", price: "€12.00", desc: "Design completo feito à lâmina com espuma morna e hidratação de óleos premium." }
    ]
  },
  {
    id: "canalizador",
    tabLabel: "🔧 Canalizador",
    name: "Canalizações Rápidas Silva",
    category: "Serviços Domésticos",
    city: "Coimbra",
    icon: "🔧",
    bgUrl: "https://images.unsplash.com/photo-1581578731548-cda95f956d08?w=400&h=200&fit=crop",
    description: "Serviços profissionais urgentes e reparações gerais de canalização, fugas de água e desentupimentos 24/7.",
    rating: "4.8",
    products: [
      { emoji: "🚿", name: "Detecção de Fugas de Água", price: "€45.00", desc: "Varredura acústica ou visual para encontrar fugas ocultas em tubagens." },
      { emoji: "🛠️", name: "Desentupimento de Esgotos", price: "€60.00", desc: "Desobstrução rápida de pias, sanitas e ralos principais com máquina elétrica." }
    ]
  },
  {
    id: "eletricista",
    tabLabel: "⚡ Eletricista",
    name: "VoltMaster Soluções Elétricas",
    category: "Serviços Gerais",
    city: "Braga",
    icon: "⚡",
    bgUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=200&fit=crop",
    description: "Instalações elétricas profissionais, quadros de luz, manutenção de curto-circuitos e iluminação LED inteligente.",
    rating: "4.9",
    products: [
      { emoji: "🔌", name: "Manutenção de Curto-Circuito", price: "€50.00", desc: "Resolução rápida de problemas e quedas constantes de disjuntores." },
      { emoji: "💡", name: "Instalação de Fitas LED", price: "€30.00", desc: "Aplicação e ligação de calhas e fitas de iluminação inteligente indireta." }
    ]
  },
  {
    id: "pastelaria",
    tabLabel: "🍰 Pastelaria",
    name: "Doce Segredo Atelier",
    category: "Alimentação & Doces",
    city: "Faro",
    icon: "🍰",
    bgUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=200&fit=crop",
    description: "Bolos de aniversário temáticos sob encomenda, cupcakes decorados e doces finos para casamentos e batizados.",
    rating: "5.0",
    products: [
      { emoji: "🎂", name: "Bolo de Aniversário Red Velvet", price: "€35.00", desc: "Massa aveludada, recheio de creme mascarpone e frutos vermelhos frescos (aprox. 1.5kg)." },
      { emoji: "🧁", name: "Caixa 6 Cupcakes Temáticos", price: "€15.00", desc: "Cupcakes decorados com buttercream e decorações em pasta de açúcar." }
    ]
  },
  {
    id: "loja-local",
    tabLabel: "🛍️ Loja Local",
    name: "Boutique Elegance Moda",
    category: "Moda & Vestuário",
    city: "Funchal",
    icon: "🛍️",
    bgUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=200&fit=crop",
    description: "Roupa feminina moderna, acessórios elegantes e atendimento personalizado com entregas rápidas para todo o país.",
    rating: "4.7",
    products: [
      { emoji: "👗", name: "Vestido Floral Primavera", price: "€39.90", desc: "Vestido midi leve, estampa floral exclusiva com amarração nas costas. Disponível S a L." },
      { emoji: "👜", name: "Mala de Ombro Couro Ecológico", price: "€24.90", desc: "Mala transversal compacta com detalhes dourados e alça ajustável confortável." }
    ]
  }
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  
  // Results animation states
  const [contactsCount, setContactsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [clicksCount, setClicksCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [communityCounts, setCommunityCounts] = useState({
    brasileira: 0,
    angolana: 0,
    "cabo-verdiana": 0,
    francesa: 0,
  });

  // Carousel example state
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  // FAQ open/close state array
  const [faqOpenStates, setFaqOpenStates] = useState<boolean[]>(new Array(10).fill(false));

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Fetch active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setActiveSession(session);
    });

    // Fetch counts for communities
    const fetchCommunityCounts = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("country")
          .eq("published", true);

        if (data) {
          const counts = {
            brasileira: 0,
            angolana: 0,
            "cabo-verdiana": 0,
            francesa: 0,
          };
          data.forEach((b: any) => {
            const country = b.country?.toLowerCase() || "";
            if (country.includes("brasil") || country.includes("brasileir")) {
              counts.brasileira++;
            } else if (country.includes("angola") || country.includes("angolan")) {
              counts.angolana++;
            } else if (country.includes("cabo verde") || country.includes("caboverde") || country.includes("cabo-verdian")) {
              counts["cabo-verdiana"]++;
            } else if (country.includes("fran") || country.includes("france") || country.includes("frances")) {
              counts.francesa++;
            }
          });
          setCommunityCounts(counts);
        }
      } catch (err) {
        console.error("Error fetching community counts:", err);
      }
    };

    fetchCommunityCounts();

    // Run simple count-up results animations
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setContactsCount(Math.min(Math.floor((300 / steps) * step), 300));
      setOrdersCount(Math.min(Math.floor((47 / steps) * step), 47));
      setClicksCount(Math.min(Math.floor((82 / steps) * step), 82));
      setVisitsCount(Math.min(Math.floor((65 / steps) * step), 65));
      
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    const nextStates = [...faqOpenStates];
    nextStates[index] = !nextStates[index];
    setFaqOpenStates(nextStates);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/explorar?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleCadastrarClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login?mode=signup");
        return;
      }
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      router.push(existingBusiness ? "/dashboard" : "/onboarding");
    } catch {
      router.push("/login?mode=signup");
    }
  };

  // Called by PlansSection with the chosen planId
  const handleSelectPlan = async (planId: string) => {
    console.log("[PLANS] Selected plan:", planId);
    if (planId === "free") {
      router.push("/login?mode=signup");
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
      const { data: biz, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (bizError) throw bizError;

      if (!biz) {
        console.log("[PLANS] No business found, redirecting to onboarding with plan:", planId);
        router.push(`/onboarding?plan=${planId}`);
        return;
      }

      console.log("[PLANS] Business found:", biz.id, "Redirecting to Stripe checkout...");
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, businessId: biz.id }),
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

  const activeExample = exampleShowcase[selectedExampleIndex];

  return (
    <div className={`${playfair.variable} ${dmSans.variable} font-sans min-h-screen bg-[#0F172A] text-slate-100 flex flex-col select-none selection:bg-[#C8A96B] selection:text-[#0F172A] overflow-x-hidden`}>
      
      {/* Stripe-like Ambient Radial Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-tr from-[#C8A96B]/5 to-[#0A1226]/40 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-20%] w-[90vw] h-[90vw] sm:w-[70vw] sm:h-[70vw] rounded-full bg-gradient-to-br from-blue-900/10 to-[#0A1226]/50 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[15%] left-[-20%] w-[90vw] h-[90vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-tr from-[#C8A96B]/3 to-[#0F172A]/50 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-[#C8A96B]/5 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Navbar Header */}
      <Navbar onCadastrar={handleCadastrarClick} />

      {/* SECÇÃO 1 — HERO */}
      <HeroSection onCadastrar={handleCadastrarClick} />
      <StatsSection />
      <BusinessTypesSection />

      {/* SEÇÃO COMUNIDADES */}
      <section className="py-16 md:py-24 bg-[#090E1A] border-b border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto px-4 space-y-12 animate-fade-in-up">
          
          <div className="text-center lg:text-left space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/5 border border-[#C8A96B]/15 rounded-full uppercase tracking-widest">
              🌍 Integração & Negócios
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white tracking-tight">
              A sua comunidade em Portugal
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm md:text-base font-light max-w-2xl leading-relaxed">
              Descubra, consuma e apoie os negócios criados por empreendedores de diferentes nacionalidades que enriquecem a economia local portuguesa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Link
              href="/explorar?comunidade=brasileira"
              className="group bg-[#0F172A]/85 hover:bg-[#0F172A] border border-white/5 hover:border-[#C8A96B]/35 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-350 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-3xl shadow-inner">🇧🇷</div>
                <div>
                  <h3 className="font-display font-bold text-white text-base group-hover:text-[#C8A96B] transition-colors">Comunidade Brasileira</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light mt-1.5">Serviços de estética, gastronomia típica e comércio dinâmico.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#C8A96B]">
                <span>{communityCounts.brasileira} {communityCounts.brasileira === 1 ? "negócio" : "negócios"}</span>
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">Explorar →</span>
              </div>
            </Link>

            <Link
              href="/explorar?comunidade=angolana"
              className="group bg-[#0F172A]/85 hover:bg-[#0F172A] border border-white/5 hover:border-[#C8A96B]/35 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-350 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-3xl shadow-inner">🇦🇴</div>
                <div>
                  <h3 className="font-display font-bold text-white text-base group-hover:text-[#C8A96B] transition-colors">Comunidade Angolana</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light mt-1.5">Gastronomia tradicional angolana, cultura e serviços locais.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#C8A96B]">
                <span>{communityCounts.angolana} {communityCounts.angolana === 1 ? "negócio" : "negócios"}</span>
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">Explorar →</span>
              </div>
            </Link>

            <Link
              href="/explorar?comunidade=cabo-verdiana"
              className="group bg-[#0F172A]/85 hover:bg-[#0F172A] border border-white/5 hover:border-[#C8A96B]/35 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-350 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-3xl shadow-inner">🇨🇻</div>
                <div>
                  <h3 className="font-display font-bold text-white text-base group-hover:text-[#C8A96B] transition-colors">Comunidade Cabo-Verdiana</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light mt-1.5">Música, barbearias premium e especialidades crioulas únicas.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#C8A96B]">
                <span>{communityCounts["cabo-verdiana"]} {communityCounts["cabo-verdiana"] === 1 ? "negócio" : "negócios"}</span>
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">Explorar →</span>
              </div>
            </Link>

            <Link
              href="/explorar?comunidade=francesa"
              className="group bg-[#0F172A]/85 hover:bg-[#0F172A] border border-white/5 hover:border-[#C8A96B]/35 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-350 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-800/10 flex items-center justify-center text-3xl shadow-inner">🇫🇷</div>
                <div>
                  <h3 className="font-display font-bold text-white text-base group-hover:text-[#C8A96B] transition-colors">Comunidade Francesa</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light mt-1.5">Moda refinada, cafés, consultoria e produtos de especialidade.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#C8A96B]">
                <span>{communityCounts.francesa} {communityCounts.francesa === 1 ? "negócio" : "negócios"}</span>
                <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">Explorar →</span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      <ProblemSection />
      <SolutionSection />
      <ShowcaseSection />
      <CatalogSection onCadastrar={handleCadastrarClick} />
      <MarketplaceSection />
      <VideoSection />
      <ComparisonSection />
      <StepsSection />
      <SocialProofBar />
      <PlansSection onSelectPlan={handleSelectPlan} />
      <TestimonialsSection />

      <section id="faq" className="py-24 md:py-32 bg-[#0A0D14] border-b border-white/5 relative z-10">
        <div className="max-w-3xl mx-auto px-4 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest bg-[#C9A96E]/5 px-3 py-1.5 rounded-full border border-[#C9A96E]/15">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-[#F5F0E8] leading-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-[#A9B1C3] text-sm font-light">
              Tudo o que precisa de saber antes de começar.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { q: "Preciso saber programar?", a: "Não. A VitrinePro foi criada para qualquer pessoa. Sem código, sem técnicos, sem complicações. Em poucos minutos o seu negócio está online." },
              { q: "Posso usar no Instagram?", a: "Sim. O link da sua vitrine é perfeito para colocar na bio do Instagram. Em vez de posts com preços por DM, o cliente vê tudo organizado num único link." },
              { q: "Posso divulgar no WhatsApp?", a: "Sim. O link fica pronto para partilhar em grupos, conversas e status do WhatsApp. Os clientes acedem diretamente à vitrine com produtos, serviços e botão de contacto." },
              { q: "Serve para restaurante?", a: "Perfeitamente. Crie o menu com fotos, preços e descrições. Os clientes consultam antes de ligar e pedem diretamente pelo WhatsApp." },
              { q: "Serve para salão de beleza?", a: "Sim. Publique os serviços com preços, galeria de trabalhos realizados, avaliações de clientes e horários. Os clientes marcam pelo WhatsApp." },
              { q: "Serve para loja?", a: "Sim. Qualquer negócio local pode ter uma vitrine: lojas de roupa, artesanato, produtos personalizados, mercearias, lojas de informática, etc." },
              { q: "Tem plano grátis?", a: "Sim. O plano Grátis é para sempre e inclui vitrine com link público, até 3 produtos, botão WhatsApp, horários e localização. Upgrade quando quiser." },
              { q: "Posso cancelar?", a: "Sim, a qualquer momento. Sem contratos, sem fidelizações. Se cancelar, o seu negócio fica no plano Grátis — nunca perde os dados." },
              { q: "Posso editar depois?", a: "Sempre. O dashboard permite editar produtos, fotos, preços, descrições, horários e contactos em segundos. As alterações ficam visíveis de imediato." },
              { q: "O catálogo PDF está incluído?", a: "O catálogo PDF está disponível nos planos Pro (€12/mês) e Business (€29/mês). Gera um PDF elegante dos seus produtos em segundos, pronto para enviar pelo WhatsApp." },
            ].map((item, i) => (
              <div key={i} className="bg-[#0F172A]/50 border border-white/5 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-5 py-4 text-left font-semibold text-[#F5F0E8] flex items-center justify-between text-xs sm:text-sm cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span>{i + 1}. {item.q}</span>
                  <span className="text-[#C9A96E] text-lg font-bold flex-shrink-0 ml-4">{faqOpenStates[i] ? "−" : "+"}</span>
                </button>
                {faqOpenStates[i] && (
                  <div className="px-5 pb-5 text-xs text-[#A9B1C3] leading-relaxed font-light border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCTASection onCadastrar={handleCadastrarClick} />

      <footer className="py-16 bg-[#030610] border-t border-white/5 text-slate-500 text-xs z-10">
        <div className="max-w-6xl mx-auto px-4 space-y-6 text-center">
          <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-12 mx-auto object-contain bg-transparent" />
          <p className="text-slate-400 font-light max-w-md mx-auto">
            A ferramenta SaaS definitiva para simplificar a presença online de pequenos negócios e profissionais liberais.
          </p>

          {/* Navigation links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <Link href="/businesses" className="hover:text-[#C8A96B] transition-colors">Marketplace</Link>
            <Link href="/pricing" className="hover:text-[#C8A96B] transition-colors">Planos</Link>
            <Link href="/explorar" className="hover:text-[#C8A96B] transition-colors">Explorar</Link>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <Link href="/politica-privacidade" className="hover:text-[#C8A96B] transition-colors">Política de Privacidade</Link>
            <Link href="/termos-de-servico" className="hover:text-[#C8A96B] transition-colors">Termos de Serviço</Link>
          </div>

          <p className="text-[10px] text-slate-700 pt-2">
            © 2026 VitrinePro · Portugal · Todos os direitos reservados
          </p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
      <RefPopup />
      <LeadCapturePopup />

    </div>
  );
}