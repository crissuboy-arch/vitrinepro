"use client";

/**
 * components/home/HomeDiscoverySections.tsx — homepage:
 *   - RadarHighlight: faixa de descoberta com acessos rápidos
 *     (Radar, Promoções, Orçamentos, Comunidades).
 *   - DailyTopicsSection: "Assunto do Dia" — só assuntos PUBLICADOS
 *     e aprovados (GET /api/daily-topics); sem assuntos, a secção
 *     não aparece (nunca conteúdo fictício).
 */
import { useEffect, useState } from "react";
import Link from "next/link";

export function RadarHighlight() {
  const items = [
    { href: "/radar", icon: "📡", title: "Radar Local", text: "Promoções, novidades e negócios perto de ti, em tempo real." },
    { href: "/promocoes", icon: "⚡", title: "Promoções Flash", text: "As melhores ofertas ativas das montras da tua cidade." },
    { href: "/orcamentos", icon: "🧾", title: "Pedidos de Orçamento", text: "Publica o que precisas e recebe respostas de profissionais locais." },
    { href: "/comunidades", icon: "👥", title: "Comunidades", text: "Conversa, dicas e apoio entre quem empreende em Portugal." },
  ];
  return (
    <section className="py-16 md:py-24 bg-[#090E1A] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/5 border border-[#C8A96B]/15 rounded-full uppercase tracking-widest">
            Descoberta local
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">A tua cidade está a mexer</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Entra para descobrir negócios, apanhar promoções, pedir orçamentos e acompanhar o que acontece perto de ti.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="group bg-[#0B1120] border border-white/10 hover:border-[#C8A96B]/60 rounded-2xl p-6 space-y-2 transition-colors"
            >
              <span className="text-3xl">{it.icon}</span>
              <h3 className="font-display text-lg font-bold text-white group-hover:text-[#D4BB82] transition-colors">{it.title}</h3>
              <p className="text-sm text-gray-300">{it.text}</p>
              <span className="inline-block text-sm font-semibold text-[#D4BB82]">Abrir →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

interface Topic {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  city: string | null;
  category: string | null;
  is_pinned: boolean;
}

export function DailyTopicsSection() {
  const [topics, setTopics] = useState<Topic[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/daily-topics");
        if (!res.ok) return;
        const data = await res.json();
        setTopics((data.topics ?? []).slice(0, 3));
      } catch {
        // sem assuntos — a secção simplesmente não aparece
      }
    })();
  }, []);

  if (topics.length === 0) return null;
  return (
    <section className="py-16 md:py-24 bg-[#0A0D14] border-b border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/5 border border-[#C8A96B]/15 rounded-full uppercase tracking-widest">
            📰 Assunto do Dia
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">O que se fala hoje</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => (
            <article key={t.id} className="bg-[#0B1120] border border-[#C8A96B]/30 rounded-2xl p-6 space-y-2">
              <div className="text-[11px] font-bold text-[#D4BB82] uppercase tracking-wide">
                {t.is_pinned ? "📌 " : ""}
                {[t.city, t.category].filter(Boolean).join(" · ")}
              </div>
              <h3 className="font-bold text-white text-lg leading-snug">{t.title}</h3>
              {t.summary && <p className="text-sm text-gray-300 line-clamp-3">{t.summary}</p>}
              {t.source_url && (
                <a href={t.source_url} target="_blank" rel="noreferrer" className="text-xs text-[#D4BB82] underline">
                  Fonte: {t.source_name || "ver fonte"} ↗
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="text-center">
          <Link href="/radar" className="text-sm font-semibold text-[#D4BB82] hover:text-[#C8A96B]">
            Ver mais no Radar Local →
          </Link>
        </div>
      </div>
    </section>
  );
}
