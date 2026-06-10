"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WaveText } from "@/components/ui/wave-text";

interface NavbarProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

const NAV_LINKS = [
  { href: "#solucao", label: "Funcionalidades" },
  { href: "#planos", label: "Planos" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar({ onCadastrar }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0F172A]/90 backdrop-blur-md border-b border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0" onClick={closeMenu}>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", fontWeight: 700 }}>
              <span style={{ color: "#FFFFFF" }}>Vitrine</span>
              <span style={{ color: "#C8A96B" }}>Pro</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-slate-300">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right: CTA + hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCadastrar}
              className="hidden sm:flex px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-[10px] font-bold rounded-lg uppercase tracking-widest active:scale-95 transition-all shadow-[0_4px_20px_rgba(200,169,107,0.15)] cursor-pointer"
            >
              <WaveText text="Criar vitrine grátis" />
            </button>

            {/* Hamburger icon — mobile only */}
            <button
              onClick={() => setIsMenuOpen((o) => !o)}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-lg border border-white/10 hover:border-[#C8A96B]/50 transition-colors flex-shrink-0"
            >
              <span
                className="block w-5 h-px bg-white transition-all duration-250"
                style={{ transform: isMenuOpen ? "translateY(6px) rotate(45deg)" : "none" }}
              />
              <span
                className="block w-5 h-px bg-white transition-all duration-250"
                style={{ opacity: isMenuOpen ? 0 : 1 }}
              />
              <span
                className="block w-5 h-px bg-white transition-all duration-250"
                style={{ transform: isMenuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 bg-[#0a0d14] border-l border-white/8 shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMenuOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", fontWeight: 700 }}>
            <span style={{ color: "#FFFFFF" }}>Vitrine</span>
            <span style={{ color: "#C8A96B" }}>Pro</span>
          </span>
          <button
            onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              className="px-4 py-3.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-xl transition-all uppercase tracking-widest"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA at bottom */}
        <div className="px-6 pb-8 pt-4 border-t border-white/5">
          <button
            onClick={(e) => { closeMenu(); onCadastrar(e); }}
            className="w-full py-4 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-xl text-sm uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-[0_4px_20px_rgba(200,169,107,0.2)]"
          >
            Criar vitrine grátis
          </button>
          <p className="text-center text-[11px] text-slate-600 mt-3">Sem cartão · Online em minutos</p>
        </div>
      </div>
    </>
  );
}
