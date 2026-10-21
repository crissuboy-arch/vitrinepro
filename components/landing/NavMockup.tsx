"use client";

/**
 * components/landing/NavMockup.tsx
 *
 * Navbar da nova landing (mockups aprovados 21/10/2026):
 * logótipo tipográfico Playfair + menu Explorar/Planos/Para Negócios/
 * Como Funciona, Entrar → /login e Criar Montra Grátis → /register
 * (a rota /register redireciona para /login?mode=signup — mesmo fluxo
 * de registo existente). Em mobile: barra com logótipo + menu hambúrguer.
 */

import { useState } from "react";
import Link from "next/link";

const MENU = [
  { label: "Explorar", href: "/explorar" },
  { label: "Planos", href: "#planos" },
  { label: "Para Negócios", href: "#setores" },
  { label: "Como Funciona", href: "#como" },
];

function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="inline-block" aria-label="VitrinePro — página inicial">
      <span className={`font-display font-bold ${small ? "text-[25px]" : "text-[30px]"} leading-none text-[#F7F4EE]`}>
        <span className="text-[#C8A96B]">V</span>itrine<span className="text-[#C8A96B]">Pro</span>
      </span>
      {!small && (
        <small className="block font-sans text-[8px] font-medium tracking-[0.28em] text-[#A9B1C3] mt-0.5">
          NEGÓCIOS À SUA VOLTA
        </small>
      )}
    </Link>
  );
}

export default function NavMockup() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10">
        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-between h-[88px]">
          <Logo />
          <nav className="flex gap-[34px] text-sm font-medium text-[#dfe3ee]" aria-label="Navegação principal">
            {MENU.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-[#E6CB8C] transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-[22px] text-sm font-medium">
            <Link href="#descobrir" aria-label="Pesquisar negócios" className="hover:text-[#E6CB8C] transition-colors">
              🔍
            </Link>
            <Link href="/login" className="hover:text-[#E6CB8C] transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B] shadow-[0_10px_36px_rgba(200,169,107,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,169,107,0.4)]"
            >
              Criar Montra Grátis
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between py-4">
            <Logo small />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className="w-[42px] h-[42px] rounded-xl border border-[#C8A96B]/25 grid place-items-center text-lg text-[#E6CB8C] cursor-pointer"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
          {open && (
            <nav
              className="rounded-2xl border border-[#C8A96B]/25 bg-[#0B1224]/95 backdrop-blur px-5 py-4 flex flex-col gap-1 text-[15px] font-medium shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              aria-label="Navegação principal"
            >
              {MENU.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 border-b border-white/5 last:border-0 hover:text-[#E6CB8C] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 hover:text-[#E6CB8C] transition-colors">
                Entrar
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-sm text-[#0A0D14] bg-gradient-to-b from-[#E3C98B] to-[#C8A96B]"
              >
                Criar Montra Grátis
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
