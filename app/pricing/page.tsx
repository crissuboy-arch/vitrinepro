"use client";

import Link from "next/link";
import { useState } from "react";

interface Plan {
  name: string;
  planId?: string;
  price: { monthly: number; yearly: number };
  description: string;
  color: string;
  badge: string | null;
  cta: string;
  ctaStyle: string;
  features: { text: string; included: boolean }[];
}

const plans: Plan[] = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Para quem quer começar a marcar presença online.",
    color: "border-[#E5E7EB]",
    badge: null,
    cta: "Começar grátis",
    ctaStyle: "bg-white border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white",
    features: [
      { text: "1 negócio no diretório", included: true },
      { text: "Perfil básico com contactos", included: true },
      { text: "Aparece na pesquisa", included: true },
      { text: "WhatsApp e telefone", included: true },
      { text: "Galeria de fotos (até 3)", included: true },
      { text: "Destaque no topo", included: false },
      { text: "Badge Premium", included: false },
      { text: "Instagram e LinkedIn", included: false },
      { text: "Galeria completa (10 fotos)", included: false },
      { text: "Estatísticas detalhadas", included: false },
    ],
  },
  {
    name: "Premium",
    planId: "premium",
    price: { monthly: 12, yearly: 120 },
    description: "Para negócios que querem mais visibilidade, chatbot IA e clientes.",
    color: "border-[#C8A96B]",
    badge: "Mais popular",
    cta: "Activar Premium",
    ctaStyle: "bg-[#C8A96B] text-[#0F172A] hover:bg-[#D4BB82]",
    features: [
      { text: "1 negócio no diretório", included: true },
      { text: "Perfil completo com todos os contactos", included: true },
      { text: "Aparece no topo da pesquisa ✦", included: true },
      { text: "Chatbot IA 24h na página pública", included: true },
      { text: "Galeria de fotos ilimitada", included: true },
      { text: "Analytics de visitas e cliques", included: true },
      { text: "Badge Premium dourado", included: true },
      { text: "Instagram, LinkedIn e redes sociais", included: true },
      { text: "SEO optimizado para Google", included: true },
      { text: "Domínio personalizado", included: false },
    ],
  },
  {
    name: "Business",
    planId: "business",
    price: { monthly: 29.90, yearly: 299 },
    description: "Para negócios estabelecidos que querem máxima exposição.",
    color: "border-[#0F172A]",
    badge: "Completo",
    cta: "Activar Business",
    ctaStyle: "bg-[#0F172A] text-white hover:bg-[#1F2937]",
    features: [
      { text: "Tudo do Premium +", included: true },
      { text: "1.º lugar garantido na pesquisa", included: true },
      { text: "Chatbot IA avançado com IA Claude", included: true },
      { text: "Destaque máximo no marketplace", included: true },
      { text: "Relatório mensal de desempenho", included: true },
      { text: "Mini-site com domínio próprio", included: true },
      { text: "Suporte prioritário por email", included: true },
      { text: "Multi-localização", included: true },
      { text: "Análise de concorrência", included: false },
      { text: "Integração com Google My Business", included: false },
    ],
  },
];

const faqs = [
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Os planos pagos podem ser cancelados a qualquer momento. Continuará ativo até ao final do período já pago.",
  },
  {
    q: "O que acontece ao meu negócio se cancelar?",
    a: "O seu negócio permanece no diretório no plano Free. Perde as funcionalidades Pro/Premium mas não perde o perfil.",
  },
  {
    q: "Posso mudar de plano?",
    a: "Sim. Pode fazer upgrade ou downgrade a qualquer momento. A diferença de valor é calculada proporcionalmente.",
  },
  {
    q: "Como funciona o pagamento anual?",
    a: "O pagamento anual oferece 2 meses grátis. É cobrado uma vez por ano e pode ser cancelado antes da renovação.",
  },
  {
    q: "Aceitam que meios de pagamento?",
    a: "Aceitamos cartões de crédito/débito (Visa, Mastercard, MB Way) e transferência bancária.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-[#1F2937]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#E5E7EB] hover:text-white text-sm transition-colors">Dashboard</Link>
            <Link href="/login" className="px-4 py-2 bg-[#C8A96B] text-[#0F172A] rounded-lg text-sm font-medium hover:bg-[#D4BB82] transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-16 px-4">
        <h1 className="font-display text-4xl md:text-5xl text-[#0F172A] mb-4">
          Planos simples e transparentes
        </h1>
        <p className="text-[#1F2937] text-lg max-w-xl mx-auto mb-8">
          Escolha o plano certo para o seu negócio. Comece grátis e faça upgrade quando precisar.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl p-1.5">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${billing === "monthly" ? "bg-[#0F172A] text-white" : "text-[#1F2937] hover:text-[#0F172A]"}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${billing === "yearly" ? "bg-[#0F172A] text-white" : "text-[#1F2937] hover:text-[#0F172A]"}`}
          >
            Anual
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${billing === "yearly" ? "bg-[#C8A96B] text-[#0F172A]" : "bg-[#FAF7F2] text-[#C8A96B] border border-[#C8A96B]"}`}>
              2 meses grátis
            </span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = billing === "monthly" ? plan.price.monthly : plan.price.yearly;
            const perMonth = billing === "yearly" && plan.price.yearly > 0
              ? (plan.price.yearly / 12).toFixed(2)
              : null;

            return (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl border-2 ${plan.color} p-8 flex flex-col relative ${plan.name === "Pro" ? "shadow-xl" : ""}`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-full uppercase tracking-wide">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h2 className="font-display text-2xl text-[#0F172A] mb-1">{plan.name}</h2>
                  <p className="text-[#1F2937] text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {price === 0 ? (
                    <div className="text-4xl font-display text-[#0F172A]">Grátis</div>
                  ) : (
                    <>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-display text-[#0F172A]">€{price}</span>
                        <span className="text-[#1F2937] text-sm mb-1">/{billing === "monthly" ? "mês" : "ano"}</span>
                      </div>
                      {perMonth && (
                        <p className="text-[#9CA3AF] text-sm mt-0.5">≈ €{perMonth}/mês</p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 mt-0.5 ${f.included ? "text-green-500" : "text-[#E5E7EB]"}`}>
                        {f.included ? "✓" : "✗"}
                      </span>
                      <span className={`text-sm ${f.included ? "text-[#0F172A]" : "text-[#9CA3AF]"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.name === "Free"
                      ? "/login"
                      : `/login?next=/dashboard&plan=${plan.planId || plan.name.toLowerCase()}`
                  }
                  className={`block w-full py-3.5 rounded-xl font-semibold text-center text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Money back */}
        <p className="text-center text-[#1F2937] text-sm mt-8">
          🔒 30 dias de garantia de devolução do dinheiro em todos os planos pagos.
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="bg-white border-y border-[#E5E7EB] py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl text-[#0F172A] text-center mb-10">Comparação detalhada</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 text-[#0F172A] font-medium w-1/2">Funcionalidade</th>
                  <th className="text-center py-3 px-4 text-[#0F172A] font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-[#C8A96B] font-display text-base">Pro</th>
                  <th className="text-center py-3 px-4 text-[#0F172A] font-display text-base">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  ["Negócio no diretório", "✓", "✓", "✓"],
                  ["Foto de perfil e capa", "✓", "✓", "✓"],
                  ["Contactos (tel, WhatsApp)", "✓", "✓", "✓"],
                  ["Instagram e LinkedIn", "✗", "✓", "✓"],
                  ["Website próprio", "✗", "✓", "✓"],
                  ["Galeria de fotos", "3 fotos", "10 fotos", "10 fotos"],
                  ["Destaque no topo", "✗", "✓", "✓ (1.º lugar)"],
                  ["Badge Premium", "✗", "✓", "✓"],
                  ["Avaliações de clientes", "✓", "✓", "✓"],
                  ["Mapa de localização", "✓", "✓", "✓"],
                  ["Estatísticas", "✗", "Básicas", "Avançadas"],
                  ["Domínio personalizado", "✗", "✗", "✓"],
                  ["Suporte prioritário", "✗", "✗", "✓"],
                ].map(([feature, free, pro, premium], i) => (
                  <tr key={i} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-4 text-[#0F172A]">{feature}</td>
                    <td className={`py-3 px-4 text-center ${free === "✗" ? "text-[#E5E7EB]" : "text-green-600"}`}>{free}</td>
                    <td className={`py-3 px-4 text-center ${pro === "✗" ? "text-[#E5E7EB]" : "text-[#C8A96B] font-medium"}`}>{pro}</td>
                    <td className={`py-3 px-4 text-center ${premium === "✗" ? "text-[#E5E7EB]" : "text-[#0F172A] font-medium"}`}>{premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <h2 className="font-display text-3xl text-[#0F172A] text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#FAF7F2] transition-colors"
              >
                <span className="font-medium text-[#0F172A] text-sm">{faq.q}</span>
                <span className={`text-[#C8A96B] transition-transform text-lg flex-shrink-0 ml-4 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5">
                  <p className="text-[#1F2937] text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F172A] py-16 text-center px-4">
        <h2 className="font-display text-3xl text-white mb-4">Pronto para crescer?</h2>
        <p className="text-[#E5E7EB] mb-8 max-w-md mx-auto">
          Junte-se a centenas de negócios que já usam o VitrinePro para chegar a mais clientes.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#C8A96B] text-[#0F172A] rounded-xl font-semibold hover:bg-[#D4BB82] transition-colors"
          >
            Começar grátis
          </Link>
          <Link
            href="/explorar"
            className="px-8 py-3.5 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-[#0F172A] transition-colors"
          >
            Ver negócios
          </Link>
        </div>
      </section>

      <footer className="bg-[#0F172A] border-t border-[#1F2937] py-8">
        <div className="container mx-auto px-4 text-center text-xs text-[#9CA3AF]">
          <p>© 2025 VitrinePro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
