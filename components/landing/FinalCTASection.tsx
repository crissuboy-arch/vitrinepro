interface FinalCTASectionProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function FinalCTASection({ onCadastrar }: FinalCTASectionProps) {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden bg-gradient-to-tr from-[#0F172A] via-[#0F172A] to-[#1A1505] text-center border-t border-white/5 font-sans z-10">
      {/* soft gold glow radial overlay */}
      <div className="absolute inset-0 bg-[#C8A96B]/5 pointer-events-none z-0"></div>
      
      <div className="max-w-3xl mx-auto px-4 space-y-8 relative z-10">
        <h2 className="text-3.5xl md:text-[52px] font-bold font-display text-white leading-[1.1] tracking-tight">
          O próximo cliente pode estar<br />
          a procurar por si agora.
        </h2>
        
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
          Crie a sua vitrine em menos de 5 minutos e comece a receber pedidos ainda hoje.
        </p>
        
        <div className="pt-4">
          <button
            onClick={onCadastrar}
            className="px-10 py-5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#C8A96B]/15 active:scale-95 cursor-pointer"
          >
            CRIAR MINHA VITRINE AGORA
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none pt-2">
          RÁPIDO EM 5 MINUTOS · SEM CARTÃO DE CRÉDITO
        </p>
      </div>
    </section>
  );
}
