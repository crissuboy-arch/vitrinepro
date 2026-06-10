import Link from "next/link";

interface VideoCtaSectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function VideoCtaSection({ onCadastrar }: VideoCtaSectionProps) {
  return (
    <section className="py-20 bg-[#06080f] border-b border-white/5 relative z-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[200px] bg-[#C9A96E]/7 blur-[90px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 text-center space-y-7 relative z-10">
        <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/8 rounded-full uppercase tracking-widest border border-[#C9A96E]/20">
          ✦ Comece agora · É grátis
        </span>

        <h2 className="text-2xl md:text-[38px] font-bold font-display text-[#F5F0E8] leading-tight tracking-tight">
          Pronto para criar a sua vitrine em{" "}
          <span className="text-[#C9A96E] italic">menos de 5 minutos?</span>
        </h2>

        <p className="text-[#A9B1C3] text-sm md:text-base font-light leading-loose">
          Sem programadores.&ensp;·&ensp;Sem cartão de crédito.&ensp;·&ensp;Sem complicações.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
          <button
            onClick={onCadastrar}
            className="w-full sm:w-auto px-9 py-4 bg-[#C9A96E] hover:bg-[#D4BB82] text-[#0A0D14] font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_8px_24px_rgba(201,169,110,0.15)] hover:shadow-[0_12px_40px_rgba(201,169,110,0.45)] active:scale-95 cursor-pointer"
          >
            Criar minha vitrine grátis →
          </button>
          <Link
            href="/businesses"
            className="w-full sm:w-auto px-9 py-4 border border-white/15 hover:border-[#C9A96E]/40 text-[#F5F0E8] hover:text-[#C9A96E] font-semibold rounded-xl text-xs uppercase tracking-widest transition-all duration-300 text-center"
          >
            Ver exemplo ao vivo
          </Link>
        </div>
      </div>
    </section>
  );
}
