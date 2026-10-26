"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewcomerCandidate } from "@/lib/newcomer-notice";

/**
 * ExploreNewcomerNotice — Notificação de novidade do /explorar.
 *
 * Apresentação pura: recebe a novidade já selecionada (ou null) e avisa o
 * pai quando é descartada (X, auto-fechar aos 8 s, ou clique na Montra),
 * para o pai marcar o id como visto e não voltar a mostrá-lo.
 *
 * Em fluxo (nunca fixed/absolute): empurra o conteúdo para baixo, nunca
 * cobre filtros, botões ou navegação. Sem novidade → não renderiza nada.
 */

interface ExploreNewcomerNoticeProps {
  newcomer: NewcomerCandidate | null;
  onDismissed: (id: string) => void;
}

const AUTO_CLOSE_MS = 8000;

export default function ExploreNewcomerNotice({
  newcomer,
  onDismissed,
}: ExploreNewcomerNoticeProps) {
  const [entered, setEntered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Animação de entrada suave (slide/fade) sem keyframes: começa
  // invisível e transita para visível após a montagem.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-fechar aos 8 s (marca visto via onDismissed; o handler do pai é
  // estável via useCallback, por isso o timer não se re-cria à toa).
  useEffect(() => {
    if (!newcomer || dismissed) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      onDismissed(newcomer.id);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [newcomer, dismissed, onDismissed]);

  if (!newcomer || dismissed) return null;

  const handleClose = () => {
    setDismissed(true);
    onDismissed(newcomer.id);
  };

  const handleClick = () => {
    // Clicou para conhecer a Montra: conta como vista.
    onDismissed(newcomer.id);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full rounded-2xl border border-[#C8A96B]/40 bg-[#0F172A] shadow-[0_8px_30px_rgba(0,0,0,0.35)] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 transition-all duration-500 ${
        entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <Link
        href={`/vitrine/${newcomer.slug}`}
        onClick={handleClick}
        className="flex-1 min-w-0 text-left text-white hover:text-[#C8A96B] transition-colors"
      >
        <span className="text-xs sm:text-sm leading-relaxed">
          🎉 <strong className="text-[#C8A96B]">{newcomer.name}</strong>{" "}
          acabou de chegar à VitrinePro! Conheça esta Montra.
        </span>
      </Link>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar notificação"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white hover:border-[#C8A96B]/60 transition-all cursor-pointer text-sm leading-none"
      >
        ✕
      </button>
    </div>
  );
}
