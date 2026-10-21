"use client";

/**
 * components/landing/FaqMockup.tsx
 *
 * FAQ da nova landing (mockup aprovado): as 4 perguntas do mockup,
 * com respostas REAIS — reutilizadas/adaptadas da FAQ atual do site
 * (FAQ_ITEMS em app/page.tsx), sem inventar nada:
 *  1. "Preciso de saber programar?" — resposta atual, verbatim.
 *  2. "Serve para qualquer tipo de negócio?" — composta a partir das
 *     respostas atuais "Serve para restaurante? / salão de beleza? /
 *     loja?", que afirmam exatamente estes setores.
 *  3. "Posso usar no Instagram e WhatsApp?" — fusão das respostas
 *     atuais "Posso usar no Instagram?" e "Posso divulgar no
 *     WhatsApp?".
 *  4. "Posso cancelar quando quiser?" — resposta atual "Posso
 *     cancelar?", verbatim.
 * O JSON-LD FAQPage acompanha exatamente as 4 perguntas mostradas.
 * No mockup mobile a FAQ fica de fora — daí o hidden md:block.
 */

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Preciso de saber programar?",
    a: "Não. A VitrinePro foi criada para qualquer pessoa. Sem código, sem técnicos, sem complicações. Em poucos minutos o seu negócio está online.",
  },
  {
    q: "Serve para qualquer tipo de negócio?",
    a: "Sim. Restaurantes, salões de beleza, lojas, barbearias e prestadores de serviços — qualquer negócio local pode ter a sua Montra com produtos, serviços, preços, fotografias e horários.",
  },
  {
    q: "Posso usar no Instagram e WhatsApp?",
    a: "Sim. O link da sua Montra é perfeito para colocar na bio do Instagram e fica pronto para partilhar em grupos, conversas e status do WhatsApp. Os clientes acedem diretamente à vitrine, com produtos, serviços e botão de contacto.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, a qualquer momento. Sem contratos, sem fidelizações. Se cancelar, o seu negócio fica no plano Grátis — nunca perde os dados.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqMockup() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="hidden md:block py-24 border-t border-[#C8A96B]/[0.12] relative z-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-[1320px] mx-auto px-10 text-center animate-fade-in-up">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C8A96B]/[0.22] bg-[#C8A96B]/[0.06] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8A96B]">
          FAQ
        </span>
        <h2 className="font-display font-bold text-[clamp(34px,3.6vw,52px)] leading-[1.1] mt-[18px] mb-3.5 text-[#F7F4EE]">
          Perguntas <span className="text-[#E6CB8C]">frequentes.</span>
        </h2>

        <div className="max-w-[860px] mx-auto mt-11 grid gap-3 text-left">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="rounded-[14px] border border-[#C8A96B]/[0.22] bg-[#101A33]/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 font-semibold text-[15.5px] text-[#F7F4EE] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <span className="text-[#C8A96B] text-lg leading-none flex-shrink-0">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#A9B1C3] leading-relaxed border-t border-white/5 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
