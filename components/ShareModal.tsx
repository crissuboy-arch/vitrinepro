"use client";

import { useState } from "react";
import {
  qrImageUrl,
  copyToClipboard,
  whatsappShareUrl,
  facebookShareUrl,
  recordShare,
  downloadQr,
} from "@/lib/share";

export default function ShareModal({
  url,
  title,
  businessId,
  onClose,
}: {
  url: string;
  title: string;
  businessId?: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function onCopy() {
    const ok = await copyToClipboard(url);
    flash(ok ? "Link copiado!" : "Não foi possível copiar.");
    if (businessId) recordShare(businessId, "link");
  }

  function onWhatsapp() {
    window.open(whatsappShareUrl(url, title), "_blank");
    if (businessId) recordShare(businessId, "whatsapp");
  }

  function onFacebook() {
    window.open(facebookShareUrl(url), "_blank", "width=600,height=500");
    if (businessId) recordShare(businessId, "facebook");
  }

  async function onInstagram() {
    await copyToClipboard(url);
    flash("Link copiado! Cola no teu story.");
    if (businessId) recordShare(businessId, "instagram");
    window.open("https://instagram.com", "_blank");
  }

  const rows: { icon: string; label: string; onClick: () => void }[] = [
    { icon: "📋", label: "Copiar link", onClick: onCopy },
    { icon: "💬", label: "WhatsApp", onClick: onWhatsapp },
    { icon: "📘", label: "Facebook", onClick: onFacebook },
    { icon: "📸", label: "Instagram", onClick: onInstagram },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Partilhar</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-2">
          {rows.map((r) => (
            <button
              key={r.label}
              onClick={r.onClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="text-xl">{r.icon}</span>
              <span className="text-sm font-semibold text-white">{r.label}</span>
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3">
            <img src={qrImageUrl(url, 200)} alt="QR Code da vitrine" width={180} height={180} />
            <button
              onClick={() => downloadQr(url)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0a0d14] text-[#C8A96B] hover:bg-[#1a2235] transition-colors"
            >
              ⬇ Descarregar QR Code
            </button>
          </div>
        </div>

        {toast && (
          <div className="mx-6 mb-5 -mt-2 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
