import Link from "next/link";
import dynamic from "next/dynamic";
import { HeroCarrossel } from "@/components/ui/hero-carrossel";

const GlobeBackground = dynamic(
  () => import("@/components/ui/globe-hero").then((m) => ({ default: m.GlobeBackground })),
  { ssr: false }
);

interface HeroSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

const MICROPROOFS = [
  { icon: "⚡", label: "Online em minutos" },
  { icon: "💳", label: "Sem cartão de crédito" },
  { icon: "👨‍💻", label: "Sem programadores" },
  { icon: "📱", label: "Link pronto para Instagram" },
];

export default function HeroSection({ onCadastrar }: HeroSectionProps) {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[#0A0D14] border-b border-[#C9A96E]/20 z-10">
      {/* Globe — decorative background, pointer-events none */}
      <GlobeBackground />

      {/* Radial gold glow behind globe */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "50%",
      }} />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(rgba(201,169,110,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#C9A96E]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center space-y-6 animate-fade-in-up">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/8 rounded-full uppercase tracking-widest border border-[#C9A96E]/15 shadow-sm">
            ✦ Vitrine profissional para negócios em Portugal
          </span>

          {/* H1 */}
          <h1 className="text-[34px] sm:text-[50px] md:text-[64px] font-bold font-display text-[#F5F0E8] leading-[1.06] tracking-tight max-w-4xl mx-auto">
            Se o seu negócio não for encontrado online,{" "}
            <span className="text-[#C9A96E] italic">o cliente compra ao concorrente.</span>
          </h1>

          {/* Sub */}
          <p className="text-[#A9B1C3] text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Crie uma vitrine profissional em poucos minutos com produtos, serviços, WhatsApp, avaliações, catálogo PDF e link pronto para divulgar no Instagram.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onCadastrar}
              className="w-full sm:w-auto px-9 py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl shadow-[0_8px_30px_rgba(201,169,110,0.28)] active:scale-95 transition-all text-sm tracking-wide cursor-pointer"
            >
              Criar minha vitrine grátis →
            </button>
            <Link
              href="/businesses"
              className="w-full sm:w-auto px-9 py-4 bg-transparent hover:bg-white/5 text-[#F5F0E8] font-semibold rounded-xl border border-white/15 hover:border-[#C9A96E]/40 text-center transition-all text-sm"
            >
              Ver exemplo ao vivo
            </Link>
          </div>

          {/* Microproofs */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-2">
            {MICROPROOFS.map((m) => (
              <span key={m.label} className="flex items-center gap-2 text-[11px] font-semibold text-[#A9B1C3] uppercase tracking-wider">
                <span className="text-[#C9A96E]">{m.icon}</span>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Vitrine carrossel ── */}
        <div className="mt-16">
          <HeroCarrossel />
        </div>
      </div>
    </section>
  );
}
