"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WaveText } from "@/components/ui/wave-text";

interface NavbarProps {
  onCadastrar: (e: React.MouseEvent) => void;
}

export default function Navbar({ onCadastrar }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0F172A]/70 backdrop-blur-md border-b border-white/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700 }}>
            <span style={{ color: '#FFFFFF' }}>Vitrine</span>
            <span style={{ color: '#C8A96B' }}>Pro</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-slate-300">
          <a href="#solucao" className="hover:text-white transition-colors">
            Funcionalidades
          </a>
          <a href="#planos" className="hover:text-white transition-colors">
            Planos
          </a>
          <a href="#depoimentos" className="hover:text-white transition-colors">
            Depoimentos
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onCadastrar}
            className="px-5 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-[10px] font-bold rounded-lg uppercase tracking-widest active:scale-95 transition-all shadow-[0_4px_20px_rgba(200,169,107,0.15)] cursor-pointer"
          >
            <WaveText text="Criar vitrine grátis" />
          </button>
        </div>
      </div>
    </header>
  );
}
