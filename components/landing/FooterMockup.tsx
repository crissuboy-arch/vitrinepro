/**
 * components/landing/FooterMockup.tsx
 *
 * Rodapé institucional da nova landing (mockup aprovado): logótipo +
 * frase, navegação com as rotas reais já usadas no rodapé atual
 * (Marketplace → /businesses, Planos → /pricing, Explorar → /explorar,
 * Política de Privacidade, Termos de Serviço) e a linha legal com os
 * direitos reservados + "Desenvolvido pela Ofensiva Criativa" —
 * EXATAMENTE o padrão já implementado na branch feat/hero-ajuste
 * (dourado suave #C9A96E/80 só no nome). Só a landing usa este
 * rodapé; os rodapés das outras páginas ficam intocados.
 */

import Link from "next/link";

const NAV = [
  { label: "Marketplace", href: "/businesses" },
  { label: "Planos", href: "/pricing" },
  { label: "Explorar", href: "/explorar" },
  { label: "Política de Privacidade", href: "/politica-privacidade" },
  { label: "Termos de Serviço", href: "/termos-de-servico" },
];

export default function FooterMockup() {
  return (
    <footer className="pt-8 pb-[26px] lg:pt-14 lg:pb-[34px] border-t border-[#C8A96B]/[0.22] bg-[#050810] relative z-10">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-6 lg:gap-10 text-center lg:text-left text-sm text-[#A9B1C3]">
          <div>
            <span className="font-display font-bold text-2xl text-[#F7F4EE]">
              <span className="text-[#C8A96B]">V</span>itrine<span className="text-[#C8A96B]">Pro</span>
            </span>
            <p className="mt-2.5 max-w-[300px]">Negócios locais, mais perto de si.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-[26px] gap-y-2" aria-label="Rodapé">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-[#E6CB8C] transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-[34px] pt-[22px] border-t border-white/[0.06] flex flex-col lg:flex-row items-center lg:justify-between gap-2.5 text-center lg:text-left text-xs text-[#A9B1C3]/80">
          <span>© 2026 VitrinePro · Portugal · Todos os direitos reservados.</span>
          <span>
            Desenvolvido pela <span className="text-[#C9A96E]/80 font-medium">Ofensiva Criativa</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
