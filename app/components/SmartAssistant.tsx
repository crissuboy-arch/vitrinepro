"use client";

import { useState } from "react";

type Step = 
  | "greeting"
  | "country"
  | "business_type"
  | "problem"
  | "solution"
  | "offer"
  | "objection"
  | "payment"
  | "success";

interface FlowState {
  country: string;
  businessType: string;
  problem: string;
  objection: string;
  plan: string;
}

const PLANS = [
  {
    id: "free",
    name: "Fundador Grátis",
    price: "€0",
    period: "para sempre",
    features: ["Perfil básico", "Visibilidade padrão", "WhatsApp"],
    cta: "Quero-grátis",
    badge: "Vagas limitadas",
  },
  {
    id: "pro",
    name: "Pro",
    price: "€29",
    period: "/mês",
    features: ["Destaque no topo", "Badge Pro", "Mais fotos", "Estatísticas"],
    cta: "Quero Pro",
    popular: true,
  },
  {
    id: "top",
    name: "Top",
    price: "€59",
    period: "/mês",
    features: ["1º lugar garantido", "Banner destacados", "API acesso", "Suporte prioritário"],
    cta: "Quero Top",
  },
];

const OBJECTIONS = [
  { id: "no_money", label: "Não tenho dinheiro", response: "Entendo. O plano Fundador é 100% gratuito. Você só paga se quiser upgrade depois." },
  { id: "think", label: "Vou pensar", response: "Sem problema. Mas as vagas de fundador estão acabando. Melhor garantir agora do que perder a chance." },
  { id: "instagram", label: "Já tenho Instagram", response: "Instagram é bom, mas as pessoas buscam no Google. A VitrinePro te coloca onde os clientes te procuram." },
  { id: "not_tech", label: "Não sei usar tecnologia", response: "É super simples. Você preencha os dados e pronto. A gente faz tudo por você." },
];

export default function SmartAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("greeting");
  const [flowData, setFlowData] = useState<FlowState>({
    country: "",
    businessType: "",
    problem: "",
    objection: "",
    plan: "",
  });
  const [selectedObjection, setSelectedObjection] = useState<string>("");
  const [isQualified, setIsQualified] = useState(false);

  const resetFlow = () => {
    setCurrentStep("greeting");
    setFlowData({ country: "", businessType: "", problem: "", objection: "", plan: "" });
    setSelectedObjection("");
    setIsQualified(false);
  };

  const handleStart = () => {
    setIsOpen(true);
    setCurrentStep("country");
  };

  const handleCountrySelect = (country: string) => {
    setFlowData((prev) => ({ ...prev, country }));
    setCurrentStep("business_type");
  };

  const handleBusinessTypeSelect = (type: string) => {
    setFlowData((prev) => ({ ...prev, businessType: type }));
    setCurrentStep("problem");
  };

  const handleProblemSelect = (problem: string) => {
    setFlowData((prev) => ({ ...prev, problem }));
    setCurrentStep("solution");
  };

  const handleObjection = (objId: string) => {
    setSelectedObjection(objId);
    setFlowData((prev) => ({ ...prev, objection: objId }));
    setCurrentStep("objection");
  };

  const handlePlanSelect = (planId: string) => {
    setFlowData((prev) => ({ ...prev, plan: planId }));
    if (planId === "free") {
      setIsQualified(true);
      setCurrentStep("success");
    } else {
      setCurrentStep("payment");
    }
  };

  const handleWhatsAppCTA = () => {
    const message = encodeURIComponent(
      `Olá! Quero assinar o plano ${flowData.plan || 'Pro'} da VitrinePro.\n\nMeu negócio: ${flowData.businessType}\nProblema: ${flowData.problem}`
    );
    window.open(`https://wa.me/55SEUNUMERO?text=${message}`, "_blank");
  };

  const getPaymentLink = () => {
    const planId = flowData.plan;
    if (planId === "pro") {
      return "https://checkout.stripe.com/c/p/plan_pro";
    }
    if (planId === "top") {
      return "https://checkout.stripe.com/c/p/plan_top";
    }
    return "#";
  };

  const renderStep = () => {
    switch (currentStep) {
      case "greeting":
        return (
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Assistente VitrinePro</h3>
            <p className="text-slate-400 text-sm mb-5">
              Vou te ajudar a colocar seu negócio na frente de novos clientes. Leva segundos!
            </p>
            <button
              onClick={() => setCurrentStep("country")}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
            >
              Começar agora
            </button>
          </div>
        );

      case "country":
        return (
          <div>
            <p className="text-slate-300 text-sm mb-3">Em qual país você trabalha?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCountrySelect("Portugal")}
                className="py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                🇵🇹 Portugal
              </button>
              <button
                onClick={() => handleCountrySelect("Brasil")}
                className="py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                🇧🇷 Brasil
              </button>
            </div>
          </div>
        );

      case "business_type":
        return (
          <div>
            <p className="text-slate-300 text-sm mb-3">Qual é o seu negócio?</p>
            <div className="space-y-2">
              {[
                { id: "beleza", label: "💅 Beleza/Estética" },
                { id: "barbearia", label: "✂️ Barbearia" },
                { id: "salão", label: "💇 Salão" },
                { id: "pet", label: "🐕 Pet Shop" },
                { id: "restaurante", label: "🍽️ Restaurante" },
                { id: "outro", label: "📋 Outro" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleBusinessTypeSelect(type.label)}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-left"
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "problem":
        return (
          <div>
            <p className="text-slate-300 text-sm mb-3">Qual é seu maior desafio?</p>
            <div className="space-y-2">
              <button
                onClick={() => handleProblemSelect("falta clientes")}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-left"
              >
                😟 Falta de clientes
              </button>
              <button
                onClick={() => handleProblemSelect("pouca visibilidade")}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-left"
              >
                👁️ Pouca visibilidade
              </button>
              <button
                onClick={() => handleProblemSelect("só indicações")}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-left"
              >
                📢 Só depende de indicações
              </button>
              <button
                onClick={() => handleProblemSelect("desorganizado")}
                className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors text-left"
              >
                📅 Agenda desorganizada
              </button>
            </div>
          </div>
        );

      case "solution":
        return (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-slate-300 text-sm">
                <span className="text-amber-400">{flowData.businessType}</span> em {flowData.country} com{" "}
                <span className="text-white">{flowData.problem}</span>.
              </p>
              <p className="text-slate-400 text-xs mt-2">
                A VitrinePro te coloca visível para quem busca seu serviço. Clientes te encontram e falam direto via WhatsApp.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
              <p className="text-amber-400 text-xs font-medium">
                ⚡ Vagas de fundador limitadas!
              </p>
            </div>

            <button
              onClick={() => setCurrentStep("offer")}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
            >
              Ver planos e preços
            </button>
          </div>
        );

      case "offer":
        return (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm text-center mb-2">Escolha seu plano:</p>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-3 rounded-lg border transition-all ${
                  plan.popular
                    ? "bg-amber-500/10 border-amber-500"
                    : "bg-slate-800 border-slate-700 hover:border-amber-500"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 bg-amber-500 text-slate-900 text-xs font-semibold rounded">
                    Mais popular
                  </span>
                )}
                {plan.badge && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded">
                    {plan.badge}
                  </span>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{plan.name}</span>
                  <span className="text-amber-400 font-bold">
                    {plan.price}
                    <span className="text-slate-400 text-xs">{plan.period}</span>
                  </span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1 mb-2">
                  {plan.features.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    plan.popular
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}

            <button
              onClick={() => handleObjection("")}
              className="w-full py-2 text-slate-500 text-xs hover:text-slate-300 transition-colors"
            >
              Tem alguma dúvida?
            </button>
          </div>
        );

      case "objection":
        return (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-white text-sm">
                {OBJECTIONS.find((o) => o.id === flowData.objection)?.response ||
                  "Entendo. Posso te ajudar a decidir. Qual é sua dúvida?"}
              </p>
            </div>

            <p className="text-slate-400 text-xs">Ainda tem dúvidas?</p>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIONS.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => handleObjection(obj.id)}
                  className="py-2 bg-slate-800 text-slate-400 text-xs rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {obj.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentStep("offer")}
              className="w-full py-2 text-slate-300 text-sm hover:text-white transition-colors"
            >
              ← Voltar aos planos
            </button>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.572.13-.756.149-.174.297-.347.446-.521.151-.174.198-.298.297-.496.099-.198.05-.371-.025-.52-.075-.149-.66-1.43-.9-1.957-.239-.527-.478-.545-.66-.558-.149-.015-.322-.024-.492-.024-.17 0-.471.074-.717.371-.245.297-.836.99-.836 1.712 0 .722.836 1.958 1.958 2.096.37.1.721.149 1.025.173.473.037.905.03 1.274-.02.297-.04.69-.173.99-.371.099-.074.571-.347.648-.695.075-.348.075-.647.05-.723-.074-.149-.272-.347-.446-.521z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">
                Escolha como pagar
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                Pagamento seguro via Stripe
              </p>
            </div>

            <a
              href={getPaymentLink()}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h16v12H5.17L4 17.17V4m0-2c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H5.17L4 6.83V4m1 5v3h2v-3H5m4 0v3h2v-3H9m4 0v3h2v-3h-2m4 0v3h2v-3h-2" />
              </svg>
              Pagar agora ({PLANS.find((p) => p.id === flowData.plan)?.price}/mês)
            </a>

            <button
              onClick={handleWhatsAppCTA}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors"
            >
              Falar no WhatsApp
            </button>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-white font-semibold mb-2">
              Perfeito!
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Seu cadastro foi iniciado. Complete para ativar seu perfil.
            </p>
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  `Olá! Acabei de me cadastrar no plano Fundador Grátis.\n\nMeu negócio: ${flowData.businessType}`
                );
                window.open(`https://wa.me/55SEUNUMERO?text=${message}`, "_blank");
              }}
              className="w-full py-3 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
            >
              Finalizar cadastro
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleStart}
        className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 border border-amber-500/30"
        aria-label="Abrir assistente"
      >
        <span className="text-lg">💬</span>
        <span className="font-medium hidden md:inline">Falar com especialista</span>
        <span className="md:hidden font-medium text-sm">Chat</span>
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Assistente VitrinePro</h3>
                <p className="text-green-400 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                resetFlow();
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">{renderStep()}</div>
        </div>
      )}
    </>
  );
}