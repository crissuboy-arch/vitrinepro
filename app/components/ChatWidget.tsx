"use client";

import { useState } from "react";

const INITIAL_QUESTIONS = [
  {
    question: "Como funciona?",
    answer:
      "A VitrinePro é uma vitrine digital para negócios locais. Você cadastra seu negócio, ele fica visível para todos que procuram serviços na sua região, e você recebe contatos de clientes interessados. Simples assim!",
  },
  {
    question: "Quanto custa?",
    answer:
      'Temos dois planos: o plano Grátis com perfil básico e visibilidade padrão, e o Premium por R$29/mês com destaque no topo, badge Premium e mais recursos. Você pode começar GRÁTIS e upgrade quando quiser!',
  },
  {
    question: "Como cadastrar meu negócio?",
    answer:
      'É muito fácil! Clique em "Cadastrar meu negócio grátis", preencha os dados (nome, categoria, fotos, WhatsApp), e pronto. Seu perfil já fica visível na mesma hora. Sem burocracia, sem复杂的 formulários.',
  },
  {
    question: "Quero mais clientes",
    answer:
      'Para ter mais clientes, indicamos o plano Premium (R$29/mês). Ele coloca seu negócio no topo da lista, adiciona badge Premium, e dá mais visibilidade. Many negócios veem 60%+ maiscliques!',
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual da VitrinePro. Posso te ajudar a entender como funcionam para negócio. Qual é sua dúvida?",
    },
  ]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleQuestionClick = (question: string, answer: string) => {
    setSelectedQuestion(question);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);
  };

  const handleStartChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleStartChat}
        className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white p-4 rounded-full shadow-xl hover:bg-[#1F2937] transition-all group"
        aria-label="Abrir chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.026 3 11c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C8A96B] rounded-full flex items-center justify-center">
                <span className="text-[#0F172A] font-bold text-lg">V</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">VitrinePro</h3>
                <p className="text-[#E5E7EB] text-xs">Sempre online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#E5E7EB] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[#0F172A] text-white rounded-br-md"
                      : "bg-[#E5E7EB] text-[#0F172A] rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="border-t border-[#E5E7EB] p-4 bg-[#FAF7F2]">
            <p className="text-xs text-[#1F2937] mb-3">Perguntas frequentes:</p>
            <div className="flex flex-wrap gap-2">
              {INITIAL_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(item.question, item.answer)}
                  className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full text-xs text-[#1F2937] hover:border-[#C8A96B] hover:text-[#0F172A] transition-all"
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="border-t border-[#E5E7EB] p-4">
            <a
              href="https://wa.me/351SEUNUMERO"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#20BD5A] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.572.13-.756.149-.174.297-.347.446-.521.151-.174.198-.298.297-.496.099-.198.05-.371-.025-.52-.075-.149-.66-1.43-.9-1.957-.239-.527-.478-.545-.66-.558-.149-.015-.322-.024-.492-.024-.17 0-.471.074-.717.371-.245.297-.836.99-.836 1.712 0 .722.836 1.958 1.958 2.096.37.1.721.149 1.025.173.473.037.905.03 1.274-.02.297-.04.69-.173.99-.371.099-.074.571-.347.648-.695.075-.348.075-.647.05-.723-.074-.149-.272-.347-.446-.521zM12.295 20.03c-.299-.099-1.759-.866-1.759-1.967 0-.472.265-.693.371-.796.105-.104.232-.248.371-.372.149-.099.297-.198.397-.347.099-.149.05-.297-.025-.422-.074-.124-.149-.272-.297-.446-.149-.174-.297-.347-.595-.595-.298-.248-.626.149-.789.371-.149.198-.52.645-.595.744-.074.1-.224.149-.372.099-.149-.05-.471-.173-.896-.595-.424-.422-.708-.94-.793-1.098-.085-.159-.015-.346.049-.495.099-.224.297-.372.495-.52.198-.174.372-.298.52-.496.149-.149.198-.298.273-.471.074-.174.025-.372-.025-.495-.099-.224-.298-.645-.42-.881-.124-.236-.224-.223-.372-.372-.149-.149-.31-.297-.396-.446-.085-.149-.074-.272.074-.372.149-.099.372-.099.595-.099.224 0 .496.025.695.297.198.272.688.99.75 1.064.062.074.249.124.422.099.172-.025.471-.173.793-.521.322-.348.534-.776.534-.932 0-.155-.074-.372-.149-.495l-.075-.124c.149-.149.198-.347.297-.521.099-.174.273-.372.149-.744-.124-.372-.348-.685-.495-.744-.149-.062-.272-.074-.371-.025-.099.05-.223.099-.372.149-.149.05-.273.05-.347.074-.074.025-.124.025-.173.025-.099-.025-.223-.074-.372-.124-.149-.05-.273-.025-.372-.025.149-.05.322-.099.446-.149.124-.05.223-.074.297-.099.372-.124.595-.149.744-.149.149 0 .347.025.496.099.149.074.272.149.372.272.099.124.173.272.248.372.074.1.149.174.198.273.049.099.074.173.074.272-.025.124-.124.273-.198.372-.074.099-.173.174-.272.248-.099.074-.198.149-.322.248-.124.099-.272.173-.421.248-.149.074-.321.149-.541.248-.22.099-.447.173-.632.247-.185.074-.342.173-.49.322-.149.149-.248.321-.322.495z" />
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}