"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const features = [
  {
    icon: "🏆",
    title: "Vitrine Premium Exclusiva",
    desc: "Design profissional com capa, logo, cores da marca e bio completa. A sua loja digital mais bonita que qualquer concorrente.",
  },
  {
    icon: "🔝",
    title: "1.º Lugar no Diretório",
    desc: "O seu negócio aparece sempre no topo das pesquisas dentro da plataforma. Visibilidade máxima garantida.",
  },
  {
    icon: "🔍",
    title: "SEO Local no Google",
    desc: "Páginas otimizadas para 'Melhores [serviço] em [cidade]'. Apareça no Google quando clientes pesquisam o que você oferece.",
  },
  {
    icon: "💬",
    title: "Botão WhatsApp Inteligente",
    desc: "Botão flutuante que abre o WhatsApp com mensagem pré-preenchida. Cliente clica, você recebe o pedido imediatamente.",
  },
  {
    icon: "🖼️",
    title: "Portfólio Digital Ilimitado",
    desc: "Galeria de fotos ilimitada para mostrar o seu trabalho. Antes/depois, produtos, espaço — tudo com apresentação premium.",
  },
  {
    icon: "📦",
    title: "Catálogo de Produtos e Serviços",
    desc: "Apresente todos os seus produtos e serviços com fotos, preços e descrições. O cliente compra sem precisar perguntar.",
  },
  {
    icon: "⭐",
    title: "Depoimentos de Clientes",
    desc: "Secção de avaliações visível com estrelas e comentários. Prova social que converte visitantes em clientes.",
  },
  {
    icon: "🔗",
    title: "Link Público para Partilhar",
    desc: "URL limpo e memorável (vitrinepro.pt/o-seu-negocio) para colocar no Instagram, WhatsApp, cartão de visita e emails.",
  },
  {
    icon: "📊",
    title: "Analytics Detalhado",
    desc: "Veja quantas pessoas visitaram, clicaram no WhatsApp e viram os seus produtos. Decida com dados reais.",
  },
  {
    icon: "🤖",
    title: "Chatbot IA 24/7",
    desc: "Assistente virtual com IA Claude responde clientes automaticamente fora do horário. Nunca perca um lead.",
  },
  {
    icon: "🌍",
    title: "Multi-localização",
    desc: "Gerencie múltiplos pontos de serviço a partir de um único painel. Ideal para negócios com várias moradas.",
  },
  {
    icon: "📱",
    title: "QR Code & NFC — Em breve",
    desc: "Cartão físico com QR Code que abre a sua vitrine. Clientes apontam o telemóvel e já vêem tudo.",
    soon: true,
  },
];

const steps = [
  { n: "1", title: "Crie a sua conta", desc: "Registo gratuito em 30 segundos. Nenhum cartão necessário para começar." },
  { n: "2", title: "Configure a vitrine", desc: "Adicione logo, descrição, produtos e fotos pelo painel simples e intuitivo." },
  { n: "3", title: "Partilhe o link", desc: "Cole o link no Instagram, WhatsApp e Google My Business. Clientes chegam até si." },
];

const faqs = [
  { q: "O plano Business inclui tudo do Premium?", a: "Sim. O Business inclui todas as funcionalidades do Premium e adiciona destaque máximo, chatbot IA avançado, multi-localização, relatório mensal e suporte prioritário." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem fidelização. Se cancelar, o seu negócio fica ativo no plano gratuito sem perder o perfil." },
  { q: "Como funciona o pagamento?", a: "O pagamento é mensal (€29,90/mês) ou anual com desconto. Processado com segurança pelo Stripe com cartão de crédito." },
  { q: "Em quanto tempo fica ativo?", a: "Imediatamente após o pagamento o plano é ativado automaticamente. Sem espera, sem aprovação manual." },
  { q: "O link público funciona sem app?", a: "Sim. A sua vitrine é uma página web responsiva. Abre no telemóvel, tablet e computador sem instalar nada." },
];

export default function PlanoBusiness() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ctaLoading, setCtaLoading] = useState(false);

  const handleCta = async () => {
    setCtaLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login?mode=signup&plan=business");
        return;
      }
      const { data: biz } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!biz) {
        router.push("/onboarding?plan=business");
        return;
      }
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "business", businessId: biz.id }),
      });
      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else router.push("/dashboard");
    } catch {
      router.push("/login?mode=signup&plan=business");
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">

      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
              Ver todos os planos
            </Link>
            <button
              onClick={handleCta}
              disabled={ctaLoading}
              className="px-5 py-2.5 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold text-sm hover:bg-[#D4BB82] transition-colors disabled:opacity-70"
            >
              {ctaLoading ? "..." : "Activar Business"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background radials */}
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] max-w-3xl rounded-full bg-[#C8A96B]/5 blur-[100px] pointer-events-none" />
        <div className="absolute top-[10%] right-[-15%] w-[60vw] h-[60vw] max-w-2xl rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A96B]/10 border border-[#C8A96B]/20 rounded-full text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest mb-6">
            <span>👑</span> Plano Business — €29,90/mês
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6">
            O seu negócio no<br />
            <span className="text-[#C8A96B]">topo do Google</span><br />
            e no bolso dos clientes
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Vitrine premium com SEO local, portfólio ilimitado, chatbot IA 24/7, WhatsApp integrado e link público para partilhar com qualquer cliente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCta}
              disabled={ctaLoading}
              className="px-8 py-4 bg-[#C8A96B] text-[#0F172A] rounded-2xl font-bold text-base hover:bg-[#D4BB82] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-[#C8A96B]/20"
            >
              {ctaLoading ? "A processar..." : "Activar Plano Business →"}
            </button>
            <Link
              href="/explorar"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-medium text-base hover:bg-white/10 transition-colors"
            >
              Ver exemplos de vitrines
            </Link>
          </div>

          <p className="text-slate-500 text-xs mt-6">
            Sem fidelização · Cancele quando quiser · Ativação imediata
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/5 bg-white/3">
        <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { n: "1.000+", l: "negócios activos" },
            { n: "33", l: "cidades portuguesas" },
            { n: "4.9★", l: "avaliação média" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-bold text-[#C8A96B] font-display">{s.n}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest bg-[#C8A96B]/5 px-3 py-1.5 rounded-full border border-[#C8A96B]/15 inline-block mb-4">
            Tudo incluído
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            O que a sua vitrine Business inclui
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto font-light">
            12 funcionalidades premium para que o seu negócio apareça, encante e converta clientes todos os dias.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`relative bg-[#0F172A] border rounded-2xl p-5 hover:border-[#C8A96B]/40 transition-all duration-300 hover:-translate-y-0.5 ${
                f.soon ? "border-white/5 opacity-70" : "border-white/8"
              }`}
            >
              {f.soon && (
                <span className="absolute top-4 right-4 text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 px-2 py-0.5 rounded-full border border-[#C8A96B]/20 uppercase tracking-wider">
                  Em breve
                </span>
              )}
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1.5">{f.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-light">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Link público destaque */}
      <section className="bg-gradient-to-r from-[#C8A96B]/10 to-transparent border-y border-[#C8A96B]/15 py-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <span className="text-[10px] font-bold text-[#C8A96B] uppercase tracking-widest">Link público</span>
            <h2 className="text-3xl font-bold font-display leading-tight">
              Um link para enviar a<br />qualquer cliente
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed font-light max-w-md">
              O seu endereço público <strong className="text-white">vitrinepro.pt/o-seu-negocio</strong> funciona como o seu site completo. Cole no Instagram, WhatsApp, TikTok, cartão de visita, Google e onde quiser.
            </p>
            <ul className="space-y-2 text-sm">
              {["Carrega em menos de 2 segundos", "Otimizado para telemóvel", "Funciona offline (PWA)", "Partilhável via QR Code (em breve)"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-slate-300">
                  <span className="text-[#C8A96B] text-xs">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock link card */}
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <p className="text-xs text-slate-500 mb-2">O seu link público</p>
            <div className="flex items-center gap-2 bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3">
              <span className="text-[#C8A96B] text-xs">🔗</span>
              <span className="text-white text-sm font-mono">vitrinepro.pt/o-seu-negocio</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {["📱 WhatsApp", "📷 Instagram", "📧 Email"].map((t) => (
                <div key={t} className="bg-[#0F172A] border border-white/5 rounded-lg py-2 text-slate-400">{t}</div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-3">Cole em qualquer plataforma</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-display">Começa em 3 minutos</h2>
          <p className="text-slate-400 text-sm mt-2 font-light">Sem técnicos. Sem código. Sem complicação.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#C8A96B]/10 border border-[#C8A96B]/20 flex items-center justify-center mx-auto">
                <span className="text-[#C8A96B] font-bold text-lg font-display">{s.n}</span>
              </div>
              <h3 className="font-bold text-white text-sm">{s.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QR Code / NFC Teaser */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/8 rounded-3xl p-8 text-center space-y-4">
          <div className="text-4xl">📱</div>
          <span className="inline-block text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 border border-[#C8A96B]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Em breve — QR Code & NFC
          </span>
          <h3 className="text-xl font-bold font-display">Cartão físico com tecnologia digital</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed font-light">
            Receba um cartão elegante com QR Code e chip NFC. O cliente aponta o telemóvel e a sua vitrine abre instantaneamente. Sem digitar URLs.
          </p>
          <div className="flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="text-[#C8A96B]">✓</span> Compatível com iOS e Android</span>
            <span className="flex items-center gap-1"><span className="text-[#C8A96B]">✓</span> Design personalizado</span>
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-[#1E293B] border-2 border-[#C8A96B]/50 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-[#C8A96B]/10">
          <span className="inline-block text-[9px] font-bold text-[#C8A96B] bg-[#C8A96B]/10 border border-[#C8A96B]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Plano Business
          </span>
          <div className="space-y-1">
            <div className="text-5xl font-bold font-display text-white">€29<span className="text-2xl text-slate-400">,90</span></div>
            <div className="text-slate-400 text-sm">/mês · cancele quando quiser</div>
          </div>
          <ul className="text-left space-y-2 text-sm">
            {["Tudo do plano Premium incluído", "1.º lugar garantido nas pesquisas", "Chatbot IA Claude avançado", "Multi-localização", "Suporte prioritário por email", "Relatório mensal de desempenho"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-slate-300">
                <span className="text-[#C8A96B] flex-shrink-0 mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleCta}
            disabled={ctaLoading}
            className="w-full py-4 bg-[#C8A96B] text-[#0F172A] rounded-2xl font-bold text-base hover:bg-[#D4BB82] active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg"
          >
            {ctaLoading ? "A processar..." : "Activar Plano Business →"}
          </button>
          <p className="text-[10px] text-slate-500">30 dias de garantia de devolução · Ativação imediata</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold font-display text-center mb-8">Perguntas frequentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#0F172A] border border-white/8 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
              >
                <span className="font-medium text-white text-sm">{faq.q}</span>
                <span className={`text-[#C8A96B] text-xl flex-shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed font-light border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-t from-[#C8A96B]/10 to-transparent border-t border-[#C8A96B]/15 py-20 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
          Pronto para crescer?
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed font-light">
          Junte-se a mais de 1.000 negócios em Portugal que já têm a sua vitrine digital com VitrinePro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCta}
            disabled={ctaLoading}
            className="px-8 py-4 bg-[#C8A96B] text-[#0F172A] rounded-2xl font-bold hover:bg-[#D4BB82] transition-colors disabled:opacity-70"
          >
            {ctaLoading ? "A processar..." : "Activar Business agora →"}
          </button>
          <Link
            href="/pricing"
            className="px-8 py-4 border border-white/15 text-white rounded-2xl font-medium hover:bg-white/5 transition-colors text-sm"
          >
            Comparar todos os planos
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-10 mx-auto object-contain" />
          <p>© 2026 VitrinePro. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Preços</Link>
            <Link href="/explorar" className="hover:text-white transition-colors">Explorar</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
