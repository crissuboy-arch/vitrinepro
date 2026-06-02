"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
}

interface BusinessChatWidgetProps {
  business: {
    name: string;
    whatsApp?: string;
    whatsapp?: string;
    phone?: string;
    email?: string;
    address?: string;
    opening_hours?: OpeningHour[];
  };
  products: Product[];
}

export default function BusinessChatWidget({ business, products }: BusinessChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Directly initialize messages to avoid calling setState synchronously inside an effect
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content: `Olá! Sou o assistente virtual do negócio **${business.name || "comercial"}**. Como posso ajudar? Pergunte-me sobre os nossos produtos, horários de funcionamento ou contactos!`,
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const whatsappNumber = business.whatsApp || business.whatsapp || "";
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    
    // Add user message to state
    const updatedMessages = [...messages, { role: "user", content: userMessageText } as Message];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageText,
          history: messages, // Send context history
          business: {
            name: business.name,
            whatsApp: business.whatsApp,
            phone: business.phone,
            email: business.email,
            address: business.address,
            opening_hours: business.opening_hours,
            products: products,
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Posso te orientar melhor pelo WhatsApp. Queres que eu te encaminhe?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] rounded-full shadow-[0_8px_30px_rgba(200,169,107,0.35)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group"
        title="Fale com o nosso assistente"
        aria-label="Abrir chat do assistente virtual"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
        ) : (
          <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-40 w-[320px] h-[450px] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border-t-4 border-t-[#C8A96B] font-sans">
          
          {/* Header */}
          <div className="bg-[#0b1326] px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/logo-vitrinepro.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display leading-tight">{business.name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[9px] text-slate-400 font-medium">Assistente Virtual</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1 rounded-md transition-colors"
              aria-label="Fechar janela de chat"
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

            {/* Loading / Typing Indicator */}
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

          {/* WhatsApp CTA */}
          {whatsappUrl && (
            <div className="px-4 pb-2 pt-1.5 bg-[#0b1326]/40">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-[#25D366]/10"
              >
                💬 Falar no WhatsApp
              </a>
            </div>
          )}

          {/* Input Panel */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-800/80 bg-[#0b1326] flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escreva a sua pergunta..."
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
