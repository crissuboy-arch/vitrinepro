"use client";

import { useState } from "react";
import ShareModal from "@/components/ShareModal";
import { copyToClipboard, recordShare } from "@/lib/share";

export default function ShareButton({
  url,
  title,
  businessId,
  variant = "header",
  className = "",
  onShared,
}: {
  url: string;
  title: string;
  businessId?: string;
  variant?: "header" | "card";
  className?: string;
  onShared?: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareIcon = (
    <svg viewBox="0 0 24 24" width={variant === "card" ? 16 : 18} height={variant === "card" ? 16 : 18} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );

  if (variant === "card") {
    // Quick copy with transient confirmation — used on marketplace cards.
    async function onClick(e: React.MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      const ok = await copyToClipboard(url);
      if (businessId) recordShare(businessId, "link");
      if (onShared) onShared(ok ? "Link copiado!" : "Não foi possível copiar.");
      else {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    }
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Partilhar"
        className={`inline-flex items-center justify-center rounded-full bg-black/50 backdrop-blur text-gray-200 hover:text-[#C8A96B] hover:bg-black/70 transition-colors w-8 h-8 ${className}`}
      >
        {copied ? <span className="text-[10px] font-bold">✓</span> : shareIcon}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-[#C8A96B]/40 hover:text-[#C8A96B] transition-colors ${className}`}
      >
        {shareIcon}
        <span className="text-xs font-bold">Partilhar</span>
      </button>
      {open && <ShareModal url={url} title={title} businessId={businessId} onClose={() => setOpen(false)} />}
    </>
  );
}
