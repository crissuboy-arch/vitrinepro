"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, MessageSquare } from "lucide-react";

const INITIAL_QUESTIONS = [
  {
    question: "Como funciona?",
    answer:
      "A VitrinePro é uma vitrine digital para negócios locais em Portugal. Você cadastra o seu negócio, ele fica visível para todos que procuram serviços na sua região, e você recebe contatos de clientes interessados no WhatsApp.",
  },
  {
    question: "Quanto custa?",
    answer:
      "Temos três planos flexíveis:\n- **Grátis**: €0/mês\n- **Pro**: €12/mês\n- **Business**: €29/mês\n\nPode começar gratuitamente e fazer upgrade a qualquer momento no seu painel.",
  },
  {
    question: "Como cadastrar meu negócio?",
    answer:
      "É muito fácil! Clique em 'Criar minha vitrine grátis' no topo da página, preencha os dados (nome, categoria, fotos, WhatsApp) e publique. O seu perfil fica online em menos de 5 minutos!",
  },
  {
    question: "Preciso ter site?",
    answer:
      "Não! A VitrinePro fornece o mini-site pronto e hospedado de forma segura nos nossos servidores. Você não precisa gastar com domínio ou alojamento.",
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual da VitrinePro. Posso ajudar-te a entender como funciona a nossa plataforma. Qual é a tua dúvida?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleQuestionClick = (question: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessageText }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageText,
          history: messages,
          business: {
            name: "VitrinePro",
            whatsApp: "351912345678",
            phone: "não disponível",
            email: "suporte@vitrinepro.pt",
            address: "Lisboa, Portugal",
            opening_hours: [],
            products: [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao comunicar com o servidor.");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Não consegui obter uma resposta." },
      ]);
    } catch (error) {
      console.error("[WIDGET CHAT] Error sending message:", error);
      // Keyword fallback local matching if the API route itself has failed/offline
      const cleanMsg = userMessageText.toLowerCase();
      let reply = "";
      if (cleanMsg.includes("como funciona") || cleanMsg.includes("o que é") || cleanMsg.includes("plataforma")) {
        reply = "A VitrinePro é uma plataforma e diretório que permite a negócios e profissionais locais em Portugal criarem um mini-site profissional em menos de 5 minutos, ajudando-os a atrair mais clientes sem complicações técnicas.";
      } else if (cleanMsg.includes("quanto custa") || cleanMsg.includes("preço") || cleanMsg.includes("valor") || cleanMsg.includes("plano") || cleanMsg.includes("custo")) {
        reply = "Temos três planos disponíveis:\n\n1. **Grátis**: €0/mês - Vitrine básica, até 3 produtos, links e presença no diretório.\n2. **Pro**: €12/mês - Produtos ilimitados, Chatbot IA 24h, domínio próprio e otimização SEO.\n3. **Business**: €29/mês - Loja online com pagamentos integrados.\n\nPode começar grátis e fazer upgrade quando quiser!";
      } else if (cleanMsg.includes("diferença") || cleanMsg.includes("diferenca") || cleanMsg.includes("comparar")) {
        reply = "O plano Grátis (€0) oferece o básico com 3 produtos. O plano Pro (€12) traz produtos ilimitados, Chatbot IA 24h, domínio próprio e destaque nas buscas. O plano Business (€29) adiciona loja online com pagamentos e destaque máximo no topo.";
      } else if (cleanMsg.includes("cadastrar") || cleanMsg.includes("criar") || cleanMsg.includes("começar") || cleanMsg.includes("registo") || cleanMsg.includes("registrar")) {
        reply = "Para começar, basta clicar no botão 'Criar minha vitrine grátis' no topo da página. O processo leva menos de 5 minutos: preencha as informações básicas do seu negócio, faça upload de fotos e publique!";
      } else if (cleanMsg.includes("diretório") || cleanMsg.includes("diretorio") || cleanMsg.includes("explorar") || cleanMsg.includes("aparecer")) {
        reply = "Ao publicar o seu negócio na VitrinePro, ele é incluído automaticamente no nosso diretório público de buscas. Clientes na sua região podem encontrá-lo por categoria, cidade ou palavra-chave.";
      } else if (cleanMsg.includes("whatsapp") || cleanMsg.includes("receber clientes") || cleanMsg.includes("contacto")) {
        reply = "Os clientes navegam pelo seu catálogo na VitrinePro e entram em contacto direto com o seu negócio pelo WhatsApp para fechar pedidos ou marcar horários. Não cobramos nenhuma taxa ou comissão sobre as suas vendas!";
      } else if (cleanMsg.includes("site") || cleanMsg.includes("alojamento") || cleanMsg.includes("hospedagem")) {
        reply = "Não precisa de ter site próprio ou alojamento! A VitrinePro fornece o mini-site pronto e alojado de forma segura nos nossos servidores.";
      } else if (cleanMsg.includes("serve") || cleanMsg.includes("café") || cleanMsg.includes("manicure") || cleanMsg.includes("restaurante") || cleanMsg.includes("tatuador") || cleanMsg.includes("loja") || cleanMsg.includes("serviço") || cleanMsg.includes("infoproduto")) {
        reply = "Sim! A VitrinePro serve perfeitamente para cafés, manicures, esteticistas, restaurantes, tatuadores, eletricistas, prestadores de serviço em geral, lojas físicas/online e infoprodutores.";
      } else if (cleanMsg.includes("gratuito") || cleanMsg.includes("plano grátis")) {
        reply = "O plano Grátis custa €0/mês e é grátis para sempre! Permite expor até 3 produtos no catálogo, incluir botões de contacto (WhatsApp/Telefone) e aparecer nas pesquisas do nosso diretório.";
      } else if (cleanMsg.includes("upgrade") || cleanMsg.includes("mudar de plano")) {
        reply = "Pode fazer upgrade a qualquer momento a partir das configurações do seu Dashboard no painel de utilizador. Basta clicar no botão 'Upgrade para Pro' ou escolher o plano ideal para si.";
      } else {
        reply = "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] rounded-full shadow-[0_8px_30px_rgba(200,169,107,0.35)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group"
        aria-label="Abrir chat da VitrinePro"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
        ) : (
          <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[320px] h-[480px] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border-t-4 border-t-[#C8A96B] font-sans">
          {/* Header */}
          <div className="bg-[#0b1326] px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/logo-vitrinepro.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display leading-tight">VitrinePro</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[9px] text-slate-400 font-medium">Assistente de Suporte</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1 rounded-md transition-colors"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Panel */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 border border-[#C8A96B]/25 text-slate-100 rounded-tr-none"
                      : "bg-[#0b1326]/60 border border-slate-800/50 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className="w-6 h-6 rounded-full bg-[#C8A96B]/15 text-[#C8A96B] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <div className="bg-[#0b1326]/60 border border-slate-800/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96B]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (Atalhos) */}
          <div className="px-4 py-3 border-t border-slate-800/80 bg-[#0b1326]/40 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perguntas Frequentes:</p>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(item.question, item.answer)}
                  className="px-2.5 py-1 bg-slate-900/50 border border-slate-800 hover:border-[#C8A96B] rounded-full text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="px-4 pb-2 pt-1.5 bg-[#0b1326]/40">
            <a
              href="https://wa.me/351912345678"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-[#25D366]/10"
            >
              💬 Falar no WhatsApp
            </a>
          </div>

          {/* Input Panel */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-800/80 bg-[#0b1326] flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escreva a sua dúvida..."
              disabled={loading}
              className="flex-grow bg-[#0F172A] border border-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#C8A96B]/60 placeholder-slate-500 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}