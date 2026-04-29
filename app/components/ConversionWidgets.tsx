"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const bannerMessages = [
  { icon: "🚀", text: "Cadastre seu negócio grátis em minutos", href: "/login" },
  { icon: "🔥", text: "50% OFF no primeiro ano do plano Pro", href: "/dashboard" },
  { icon: "⭐", text: "Apareça no topo e receba mais clientes", href: "/dashboard" },
  { icon: "💼", text: "Destaque premium para negócios locais", href: "/dashboard" },
  { icon: "📅", text: "Tenha sua agenda digital para salões de beleza com LumiAgenda", href: "#" },
  { icon: "✨", text: "LumiAgenda: organize atendimentos, clientes e horários em um só lugar", href: "#" },
  { icon: "🛍️", text: "Em breve: produtos digitais e ferramentas para vender mais", href: "#" },
  { icon: "⚡", text: "Venda mais com a VitrinePro e com a LumiAgenda", href: "#" },
];

export function AnimatedBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const currentMessage = bannerMessages[currentIndex];

  return (
    <div 
      className="bg-gradient-to-r from-[#0F172A] via-[#1F2937] to-[#0F172A] text-white py-2.5 overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <Link 
            href={currentMessage.href}
            className="flex items-center gap-3 group"
          >
            <span className="text-lg">{currentMessage.icon}</span>
            <span className="font-medium text-sm md:text-base text-center transition-all duration-300 group-hover:text-[#C8A96B]">
              {currentMessage.text}
            </span>
            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#C8A96B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="flex justify-center gap-1.5 mt-2">
          {bannerMessages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex ? "bg-[#C8A96B] w-4" : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to message ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConversionWidgets() {
  return null;
}
