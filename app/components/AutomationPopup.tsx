"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "../context/SupabaseAuthContext";

interface AutomationPopupProps {
  plan: string | null | undefined;
  businessName: string;
}

export default function AutomationPopup({ plan, businessName }: AutomationPopupProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show for 'pro' or 'business' plan stores
    const isProOrBusiness = plan === "pro" || plan === "business";
    if (!isProOrBusiness) return;

    // Do not show if the user is already logged in
    if (user) return;

    // Check sessionStorage to ensure it doesn't repeat in the same session
    const alreadyShown = sessionStorage.getItem("vitrinepro_automation_popup_shown");
    if (alreadyShown === "true") return;

    // Trigger display after 35 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 35000);

    return () => clearTimeout(timer);
  }, [plan, user]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("vitrinepro_automation_popup_shown", "true");
  };

  const handleCreate = () => {
    sessionStorage.setItem("vitrinepro_automation_popup_shown", "true");
    window.location.href = "/register";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-[320px] w-full bg-[#0F172A] border border-[#C8A96B] rounded-2xl p-5 shadow-[0_8px_30px_rgba(200,169,107,0.25)] animate-fade-in font-sans">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Badge */}
      <div className="inline-block bg-[#C8A96B]/15 text-[#C8A96B] border border-[#C8A96B]/20 text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
        ⚡ Powered by VitrinePro
      </div>

      {/* Title */}
      <h4 className="text-white font-bold text-sm mb-3">
        Quer uma vitrine como esta?
      </h4>

      {/* Feature List */}
      <ul className="space-y-2 mb-4 text-left">
        <li className="flex items-start gap-2 text-slate-300 text-xs font-light">
          <Check className="w-4 h-4 text-[#C8A96B] flex-shrink-0 mt-0.5" />
          <span>Chatbot IA responde clientes 24h</span>
        </li>
        <li className="flex items-start gap-2 text-slate-300 text-xs font-light">
          <Check className="w-4 h-4 text-[#C8A96B] flex-shrink-0 mt-0.5" />
          <span>Aparece no Google automaticamente</span>
        </li>
        <li className="flex items-start gap-2 text-slate-300 text-xs font-light">
          <Check className="w-4 h-4 text-[#C8A96B] flex-shrink-0 mt-0.5" />
          <span>WhatsApp direto dos clientes</span>
        </li>
        <li className="flex items-start gap-2 text-slate-300 text-xs font-light">
          <Check className="w-4 h-4 text-[#C8A96B] flex-shrink-0 mt-0.5" />
          <span>Pronto em 5 minutos</span>
        </li>
      </ul>

      {/* CTA Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={handleCreate}
          className="w-full bg-[#C8A96B] hover:bg-[#b09359] text-[#0F172A] font-bold py-2 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 duration-200 text-xs text-center block cursor-pointer"
        >
          Criar grátis agora →
        </button>

        <a
          href="https://vitrinepro.pt/#planos"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-slate-400 hover:text-white transition-colors text-[10px] text-center block font-medium underline"
        >
          Ver planos
        </a>
      </div>
    </div>
  );
}
