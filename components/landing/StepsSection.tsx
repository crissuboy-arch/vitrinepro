export default function StepsSection() {
  const steps = [
    {
      num: "01",
      title: "Cadastre o seu negócio",
      desc: "Preencha os dados básicos sobre a sua empresa: nome, categoria, cidade e contactos principais."
    },
    {
      num: "02",
      title: "Adicione logo e imagens",
      desc: "Faça upload do seu logótipo, imagem de capa e fotos para a galeria em poucos segundos."
    },
    {
      num: "03",
      title: "Publique produtos e serviços",
      desc: "Adicione o seu catálogo de produtos ou serviços com fotos, descrições detalhadas e preços visíveis."
    },
    {
      num: "04",
      title: "Conecte as redes sociais",
      desc: "Vincule os seus canais: WhatsApp, Instagram, Facebook, TikTok, YouTube e LinkedIn."
    },
    {
      num: "05",
      title: "Partilhe o seu link",
      desc: "Divulgue o seu link exclusivo e otimizado para o Google (exemplo: vitrinepro.pt/vitrine/o-seu-negocio)."
    },
    {
      num: "06",
      title: "Receba contactos pelo WhatsApp",
      desc: "Os clientes visitam a sua vitrine e entram em contacto direto pelo WhatsApp para fechar negócio."
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-[#0C1322] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4 space-y-20">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15">
            Fluxo Simples
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight">
            Pronto em 6 passos simples
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-xl mx-auto">
            Sem complicações ou códigos. Veja como colocar o seu negócio online hoje.
          </p>
        </div>

        {/* Steps Stack */}
        <div className="space-y-16">
          {steps.map((s, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <div 
                key={idx} 
                className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                
                {/* Large Background Watermark Number */}
                <div 
                  className={`absolute top-0 -translate-y-8 font-display font-bold text-[120px] text-[#C8A96B] opacity-[0.06] select-none pointer-events-none ${
                    isEven ? "right-0 md:right-8" : "left-0 md:left-8"
                  }`}
                >
                  {s.num}
                </div>

                {/* Text Content Block */}
                <div 
                  className={`relative z-10 space-y-3 md:col-span-8 ${
                    isEven ? "md:col-start-6 md:text-right md:flex md:flex-col md:items-end" : "md:col-start-2"
                  }`}
                >
                  <span className="inline-block px-3 py-1 text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 rounded-full uppercase tracking-wider">
                    Passo {s.num}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white font-sans">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light font-sans max-w-xl">
                    {s.desc}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
