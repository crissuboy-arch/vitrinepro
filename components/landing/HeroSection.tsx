import Link from "next/link";
import LogoHero3D from "../LogoHero3D";
import HeroCards from "./HeroCards";

interface HeroSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function HeroSection({ onCadastrar }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[#0F172A] border-b border-[#C8A96B]/25 z-10">
      {/* radial-gradient dots background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(200, 169, 107, 0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-16 items-center relative z-10">

        {/* Left Column: Hero Text */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in-up">

          {/* 3D Logo */}
          <LogoHero3D />

          {/* Badge Pill */}
          <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C8A96B] bg-[#C8A96B]/5 rounded-full uppercase tracking-widest border border-[#C8A96B]/15 shadow-sm">
            ✦ Mais de 2.500 negócios online
          </span>
          
          {/* Headline H1 */}
          <h1 className="text-[38px] md:text-[64px] font-bold font-display text-white leading-[1.08] tracking-tight max-w-2xl">
            O próximo cliente está<br />
            a procurar por si<br />
            <span className="text-[#C8A96B] italic font-display">agora.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-[#94A3B8] text-base md:text-lg max-w-xl font-light leading-relaxed font-sans">
            Crie o seu mini-site profissional em menos de 5 minutos. Sem programadores. Sem complicações. Com chatbot incluído.
          </p>
          
          {/* CTAs */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={onCadastrar}
              className="w-full sm:w-auto px-8 py-4.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl shadow-xl shadow-[#C8A96B]/10 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              Criar minha vitrine grátis →
            </button>
            <Link
              href="/vitrine/demo"
              className="w-full sm:w-auto px-8 py-4.5 bg-transparent hover:bg-white/5 text-white font-bold rounded-xl border border-[#C8A96B] text-center transition-all text-xs tracking-wider uppercase"
            >
              Ver exemplo ao vivo
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-[11px] font-semibold tracking-wider text-slate-400 pt-2 uppercase font-sans">
            <span className="flex items-center gap-1.5"><span className="text-[#C8A96B]">✓</span> Grátis para começar</span>
            <span className="flex items-center gap-1.5"><span className="text-[#C8A96B]">✓</span> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><span className="text-[#C8A96B]">✓</span> Online em 5 minutos</span>
          </div>
        </div>

        {/* Right Column: Rotating Client Cards */}
        <div className="lg:col-span-5 flex justify-center items-center relative animate-fade-in-up delay-200 px-4 lg:px-0">

          {/* Radial gold glow behind cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#C8A96B]/10 blur-[80px] pointer-events-none z-0" />

          <div className="relative z-10 w-full">
            <HeroCards />
          </div>

        </div>

      </div>
    </section>
  );
}
