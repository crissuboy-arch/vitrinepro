"use client"

import { useEffect, useRef, useState } from "react";
import { Marquee } from "@/components/ui/marquee";

// ─── KPI data ────────────────────────────────────────────────────────────────

const STATS = [
  { value: 2500,  suffix: "+",   label: "Negócios online",    icon: "🏪" },
  { value: 12000, suffix: "+",   label: "Clientes atendidos", icon: "👥" },
  { value: 50,    suffix: "+",   label: "Cidades cobertas",   icon: "📍" },
  { value: 5,     suffix: " min",label: "Para estar online",  icon: "⚡" },
];

// ─── Marquee data ─────────────────────────────────────────────────────────────

const categorias1 = [
  { emoji: "✂️",  label: "Barbearias" },
  { emoji: "🍽️", label: "Restaurantes" },
  { emoji: "💆",  label: "Estética" },
  { emoji: "🔧",  label: "Oficinas" },
  { emoji: "👗",  label: "Moda & Roupa" },
  { emoji: "🦷",  label: "Clínicas" },
  { emoji: "🏋️", label: "Ginásios" },
  { emoji: "📸",  label: "Fotógrafos" },
  { emoji: "🎂",  label: "Pastelarias" },
  { emoji: "🏠",  label: "Imobiliárias" },
  { emoji: "🐾",  label: "Pet Shops" },
  { emoji: "💈",  label: "Cabeleireiros" },
  { emoji: "🌿",  label: "Farmácias" },
  { emoji: "🎓",  label: "Explicadores" },
  { emoji: "🚗",  label: "Automóvel" },
  { emoji: "🧹",  label: "Limpeza" },
];

const categorias2 = [
  { emoji: "🍕",  label: "Pizzarias" },
  { emoji: "🧴",  label: "Perfumarias" },
  { emoji: "⚽",  label: "Desporto" },
  { emoji: "🎸",  label: "Música" },
  { emoji: "📚",  label: "Livrarias" },
  { emoji: "🌸",  label: "Floristas" },
  { emoji: "🍦",  label: "Gelatarias" },
  { emoji: "🔑",  label: "Chaveiros" },
  { emoji: "🧵",  label: "Costura" },
  { emoji: "🎨",  label: "Arte & Design" },
  { emoji: "🏊",  label: "Piscinas" },
  { emoji: "🚿",  label: "Canalizadores" },
  { emoji: "🌮",  label: "Comida Rápida" },
  { emoji: "🏗️", label: "Construção" },
  { emoji: "💻",  label: "Tecnologia" },
  { emoji: "🏡",  label: "Decoração" },
];

// ─── Components ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatCard({ value, suffix, label, icon, active }: typeof STATS[0] & { active: boolean }) {
  const count = useCountUp(value, 1600, active);
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <span className="text-3xl mb-1">{icon}</span>
      <div className="font-display font-black text-[42px] leading-none text-white">
        {count.toLocaleString("pt-PT")}<span className="text-[#C8A96B]">{suffix}</span>
      </div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest font-sans">{label}</p>
    </div>
  );
}

function CategoryPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div
      className="flex items-center gap-2 mx-3 px-4 py-2 rounded-full border border-white/8 bg-white/3 whitespace-nowrap select-none"
      style={{ fontSize: 13, color: "#c9b99a" }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#0C1322] border-b border-white/5 relative z-10 overflow-hidden">
      {/* KPIs */}
      <div ref={ref} className="py-16 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/5 mx-0" />

      {/* Marquees */}
      <div className="py-6 space-y-1">
        <Marquee speed={35} direction="left" pauseOnHover>
          {categorias1.map((c) => (
            <CategoryPill key={c.label} emoji={c.emoji} label={c.label} />
          ))}
        </Marquee>

        <Marquee speed={28} direction="right" pauseOnHover>
          {categorias2.map((c) => (
            <CategoryPill key={c.label} emoji={c.emoji} label={c.label} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
