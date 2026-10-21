"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/SupabaseAuthContext";

const STORAGE_KEY = "vitrinepro_lead_v1";
const DELAY_MS = 7000;

// LIMPEZA DE REPETIÇÕES (21/10/2026): a lista de tipos de negócio
// que o formulário trazia foi removida — era uma 4.ª apresentação
// de categorias na mesma página. O lead passa a ser gravado sem
// tipo de negócio (a coluna continua a existir na tabela).

export default function LeadCapturePopup() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [user]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      await supabase.from("leads").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim() || null,
        business_type: null,
        source: "popup_homepage",
      });
      setDone(true);
      localStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => setShow(false), 3500);
    } catch (err) {
      console.error("[LEAD POPUP]", err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-[#0F172A] border border-[#C8A96B]/30 rounded-t-2xl sm:rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden">
        {/* Gold top stripe */}
        <div className="h-1 bg-gradient-to-r from-[#C8A96B] via-[#E8C980] to-[#C8A96B]" />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-1"
          aria-label="Fechar popup"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="text-white font-bold text-xl font-display">Obrigada!</h3>
            <p className="text-slate-400 text-sm">Entraremos em contacto em breve.</p>
            <div className="w-8 h-1 bg-[#C8A96B] rounded mx-auto" />
          </div>
        ) : (
          <>
            {/* Header — curto (limpeza de repetições 21/10/2026):
                sem repetir a proposta da página nem o CTA principal. */}
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-white font-bold text-xl font-display leading-tight">
                Crie a sua <span className="text-[#C8A96B]">vitrine grátis</span>
              </h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Deixe os seus dados e entramos em contacto em breve.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-2.5">
              <input
                type="text"
                placeholder="O seu nome *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#C8A96B]/60 transition-colors"
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#C8A96B]/60 transition-colors"
              />
              <input
                type="tel"
                placeholder="WhatsApp (ex: +351 912 345 678)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                autoComplete="tel"
                className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#C8A96B]/60 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold text-sm hover:bg-[#D4BB82] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-[#0F172A]/50 border-t-[#0F172A] rounded-full animate-spin" />
                ) : (
                  "Enviar pedido →"
                )}
              </button>

              <p className="text-[10px] text-slate-600 text-center pt-1">
                Sem spam. Dados protegidos. Pode cancelar a qualquer momento.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
