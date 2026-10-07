"use client";

/**
 * SavePromptModal — A6.5 Parte B
 *
 * Modal amigável para o visitante NÃO autenticado que clica "Guardar"
 * (numa Montra, produto ou novidade). Em vez de um redirect seco para
 * /login, explica o valor e oferece as duas portas de entrada — ambas
 * voltam ao contexto de onde o utilizador veio (?next=).
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface SavePromptModalProps {
  open: boolean;
  onClose: () => void;
  /** Destino de volta após login/signup (ex.: "/vitrine/slug" ou "/explorar"). */
  next: string;
}

export default function SavePromptModal({ open, onClose, next }: SavePromptModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const encoded = encodeURIComponent(next);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Diálogo: mobile = bottom-sheet · desktop = centrado */}
      <div className="fixed inset-0 z-[91] flex items-end justify-center sm:items-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guardar na Vitrine"
          className="pointer-events-auto w-full sm:max-w-sm bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-6 text-center"
        >
          <div className="text-4xl mb-3" aria-hidden="true">🔖</div>
          <h2 className="text-lg font-bold text-white mb-2">
            Guarde o que encontrar na Vitrine
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Crie uma conta gratuita para guardar negócios, produtos e novidades.
          </p>
          <div className="space-y-2.5">
            <Link
              href={`/login?mode=signup&next=${encoded}`}
              className="block w-full py-3 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] rounded-xl font-bold text-sm transition-colors"
            >
              CRIAR CONTA GRÁTIS
            </Link>
            <Link
              href={`/login?next=${encoded}`}
              className="block w-full py-3 border border-slate-600 hover:border-[#C8A96B] text-slate-200 hover:text-[#C8A96B] rounded-xl font-bold text-sm transition-colors"
            >
              JÁ TENHO CONTA
            </Link>
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-300 pt-1 cursor-pointer"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
