'use client'

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 2500, suffix: "+", label: "Negócios online", icon: "🏪" },
  { value: 12000, suffix: "+", label: "Clientes atendidos", icon: "👥" },
  { value: 50, suffix: "+", label: "Cidades cobertas", icon: "📍" },
  { value: 5, suffix: " min", label: "Para estar online", icon: "⚡" },
];

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
    <div className="flex flex-col items-center text-center space-y-2 group">
      <span className="text-3xl mb-1">{icon}</span>
      <div className="font-display font-black text-[42px] leading-none text-white">
        {count.toLocaleString("pt-PT")}<span className="text-[#C8A96B]">{suffix}</span>
      </div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest font-sans">{label}</p>
    </div>
  );
}

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
    <section ref={ref} className="py-16 bg-[#0C1322] border-b border-white/5 relative z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
