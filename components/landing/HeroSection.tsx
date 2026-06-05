import Link from "next/link";
import LogoHero3D from "../LogoHero3D";
import HeroCards from "./HeroCards";

interface HeroSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function HeroSection({ onCadastrar }: HeroSectionProps) {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[#0F172A] border-b border-[#C8A96B]/25 z-10">
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(200,169,107,0.15) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10">

        {/* ── Headline centrada no topo ── */}
        <div className="text-center mb-12 space-y-5 animate-fade-in-up">

          {/* Badge pill */}
          <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C8A96B] bg-[#C8A96B]/5 rounded-full uppercase tracking-widest border border-[#C8A96B]/15 shadow-sm">
            ✦ Mais de 2.500 negócios online em Portugal
          </span>

          {/* H1 */}
          <h1 className="text-[36px] sm:text-[52px] md:text-[68px] font-bold font-display text-white leading-[1.06] tracking-tight">
            O próximo cliente está<br />
            a procurar por si{" "}
            <span className="text-[#C8A96B] italic">agora.</span>
          </h1>

          {/* Sub */}
          <p className="text-[#94A3B8] text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed font-sans">
            Crie a sua vitrine profissional em menos de 5 minutos.<br className="hidden md:block" />
            Sem programadores. Sem complicações. Com chatbot incluído.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onCadastrar}
              className="w-full sm:w-auto px-9 py-4 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl shadow-[0_8px_30px_rgba(200,169,107,0.25)] active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
            >
              Criar Minha Vitrine Agora — Grátis
            </button>
            <Link
              href="/vitrine/demo"
              className="w-full sm:w-auto px-9 py-4 bg-transparent hover:bg-white/5 text-white font-semibold rounded-xl border border-white/20 hover:border-[#C8A96B]/50 text-center transition-all text-sm"
            >
              Ver exemplo ao vivo →
            </Link>
          </div>

          {/* Trust seals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1">
            {["Sem cartão de crédito", "Sem programadores", "Online em 5 minutos"].map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                <span className="text-[#C8A96B] text-sm">✓</span> {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Grid: V logo + phone mockup ── */}
        <div className="grid lg:grid-cols-12 gap-10 items-center">

          {/* V 3D — menor, coluna esquerda */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6 animate-fade-in-up">
            <LogoHero3D />
            <div className="text-center space-y-1">
              <p className="text-white font-display font-bold text-2xl tracking-wide">
                <span className="text-white">Vitrine</span><span className="text-[#C8A96B]">Pro</span>
              </p>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-sans">
                O seu negócio. Visto. Escolhido. Lembrado.
              </p>
            </div>
          </div>

          {/* Phone mockup — coluna direita */}
          <div className="lg:col-span-7 flex justify-center items-center relative animate-fade-in-up">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#C8A96B]/8 blur-[90px] pointer-events-none" />
            <div className="relative z-10 w-full flex justify-center">
              <HeroCards />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
