/**
 * components/landing/MarqueeMockup.tsx
 *
 * RESTAURO (Correção Visual da Landing, 21/10/2026): faixa marquee de
 * categorias da landing original (f142170), restaurada com a
 * implementação EXATA dessa versão — o componente
 * `components/ui/marquee.tsx` (inalterado), as classes
 * `.animate-marquee`/`.animate-marquee-reverse` do globals.css e os
 * dados/pills da antiga `StatsSection` (categorias1/categorias2 e o
 * CategoryPill, copiados verbatim).
 *
 * Os KPIs com count-up da StatsSection original NÃO voltam: os números
 * (2500+ negócios, 12000+ clientes…) eram estatísticas inventadas,
 * removidas de propósito no redesign — a landing atual não mostra
 * estatísticas inventadas. Só o efeito marquee (categorias, sem
 * números) é restaurado.
 */

import { Marquee } from "@/components/ui/marquee";

const categorias1 = [
  { emoji: "✂️", label: "Barbearias" },
  { emoji: "🍽️", label: "Restaurantes" },
  { emoji: "💆", label: "Estética" },
  { emoji: "🔧", label: "Oficinas" },
  { emoji: "👗", label: "Moda & Roupa" },
  { emoji: "🦷", label: "Clínicas" },
  { emoji: "🏋️", label: "Ginásios" },
  { emoji: "📸", label: "Fotógrafos" },
  { emoji: "🎂", label: "Pastelarias" },
  { emoji: "🏠", label: "Imobiliárias" },
  { emoji: "🐾", label: "Pet Shops" },
  { emoji: "💈", label: "Cabeleireiros" },
  { emoji: "🌿", label: "Farmácias" },
  { emoji: "🎓", label: "Explicadores" },
  { emoji: "🚗", label: "Automóvel" },
  { emoji: "🧹", label: "Limpeza" },
];

const categorias2 = [
  { emoji: "🍕", label: "Pizzarias" },
  { emoji: "🧴", label: "Perfumarias" },
  { emoji: "⚽", label: "Desporto" },
  { emoji: "🎸", label: "Música" },
  { emoji: "📚", label: "Livrarias" },
  { emoji: "🌸", label: "Floristas" },
  { emoji: "🍦", label: "Gelatarias" },
  { emoji: "🔑", label: "Chaveiros" },
  { emoji: "🧵", label: "Costura" },
  { emoji: "🎨", label: "Arte & Design" },
  { emoji: "🏊", label: "Piscinas" },
  { emoji: "🚿", label: "Canalizadores" },
  { emoji: "🌮", label: "Comida Rápida" },
  { emoji: "🏗️", label: "Construção" },
  { emoji: "💻", label: "Tecnologia" },
  { emoji: "🏡", label: "Decoração" },
];

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

export default function MarqueeMockup() {
  return (
    <div className="relative z-10 border-t border-[#C8A96B]/[0.12] py-2 overflow-hidden">
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
  );
}
