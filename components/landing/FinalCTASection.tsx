import Link from "next/link";
import { WaveText } from "@/components/ui/wave-text";

interface FinalCTASectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function FinalCTASection({ onCadastrar }: FinalCTASectionProps) {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden bg-gradient-to-tr from-[#0A0D14] via-[#0A0D14] to-[#1A1505] text-center border-t border-white/5 z-10">
      <div className="absolute inset-0 bg-[#C9A96E]/4 pointer-events-none z-0" />
      {/* Double glow for stronger effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C9A96E]/10 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[180px] bg-[#C9A96E]/8 blur-[60px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 space-y-8 relative z-10">
        <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/8 rounded-full uppercase tracking-widest border border-[#C9A96E]/20">
          ✦ Comece hoje · É grátis
        </span>

        <h2 className="text-[32px] md:text-[52px] font-bold font-display text-[#F5F0E8] leading-[1.1] tracking-tight">
          O próximo cliente já está a procurar<br className="hidden md:block" />{" "}
          <span className="text-[#C9A96E] italic">pelo seu negócio.</span>
        </h2>

        <p className="text-[#A9B1C3] text-sm md:text-lg max-w-xl mx-auto font-light leading-relaxed">
          Não deixe que ele encontre a concorrência primeiro.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onCadastrar}
            className="w-full sm:w-auto px-10 py-5 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_8px_30px_rgba(201,169,110,0.2)] hover:shadow-[0_12px_50px_rgba(201,169,110,0.55)] active:scale-95 cursor-pointer"
          >
            <WaveText text="Criar minha vitrine grátis →" />
          </button>
          <Link
            href="/businesses"
            className="w-full sm:w-auto px-10 py-5 border border-white/15 hover:border-[#C9A96E]/40 text-[#F5F0E8] hover:text-[#C9A96E] font-semibold rounded-xl text-xs uppercase tracking-widest transition-all duration-300 text-center"
          >
            <WaveText text="Ver exemplo ao vivo" />
          </Link>
        </div>

        <p className="text-[10px] text-[#A9B1C3]/50 font-semibold uppercase tracking-widest pt-2">
          Online em minutos · Sem cartão de crédito · Sem programadores
        </p>
      </div>
    </section>
  );
}
