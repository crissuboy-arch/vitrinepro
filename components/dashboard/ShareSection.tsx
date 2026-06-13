"use client";

import { useState } from "react";
import {
  vitrineUrl,
  qrImageUrl,
  copyToClipboard,
  whatsappShareUrl,
  facebookShareUrl,
  downloadQr,
} from "@/lib/share";

export default function ShareSection({
  slug,
  name,
}: {
  slug: string;
  businessId?: string;
  name: string;
}) {
  const url = vitrineUrl(slug);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function onCopy() {
    const ok = await copyToClipboard(url);
    flash(ok ? "Link copiado!" : "Não foi possível copiar.");
  }

  async function onInstagram() {
    await copyToClipboard(url);
    flash("Link copiado! Cola no teu story.");
    window.open("https://instagram.com", "_blank");
  }

  const buttons: { icon: string; label: string; onClick: () => void }[] = [
    { icon: "📋", label: "Copiar link", onClick: onCopy },
    { icon: "💬", label: "WhatsApp", onClick: () => window.open(whatsappShareUrl(url, name), "_blank") },
    { icon: "📘", label: "Facebook", onClick: () => window.open(facebookShareUrl(url), "_blank", "width=600,height=500") },
    { icon: "📸", label: "Instagram", onClick: onInstagram },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">↗ Partilhar a minha vitrine</h3>

      <div className="grid sm:grid-cols-[180px_1fr] gap-6 items-start">
        {/* QR */}
        <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3">
          <img src={qrImageUrl(url, 200)} alt="QR Code da vitrine" width={160} height={160} />
          <button
            onClick={() => downloadQr(url, `qrcode-${slug}.png`)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0a0d14] text-[#C8A96B] hover:bg-[#1a2235] transition-colors w-full"
          >
            ⬇ Descarregar QR Code
          </button>
        </div>

        {/* Buttons + URL */}
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Coloca este QR Code nos teus cartões e flyers — qualquer pessoa o lê com a câmara.</p>

          <div className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-300 truncate flex-1">{url}</span>
            <button onClick={onCopy} className="text-xs font-bold text-[#C8A96B] hover:underline whitespace-nowrap">Copiar</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {buttons.map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-left transition-colors"
              >
                <span>{b.icon}</span>
                <span className="text-xs font-semibold text-white">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="mt-4 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
          {toast}
        </div>
      )}
    </div>
  );
}
