"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "../context/SupabaseAuthContext";

function RefPopupContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    // If the user is logged in, do not display the popup
    if (user) return;

    const ref = searchParams.get("ref");
    if (!ref) return;

    // Check if the popup was already shown to this visitor
    const alreadyShown = localStorage.getItem("vitrinepro_ref_popup_shown");
    if (alreadyShown === "true") return;

    // Fetch the referring business name
    fetch(`/api/business-by-slug?slug=${encodeURIComponent(ref)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setBusinessName(data.name);
          
          // Trigger display after 2 seconds
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 2000);

          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch referral business info:", err);
      });
  }, [searchParams, user]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("vitrinepro_ref_popup_shown", "true");
  };

  const handleRegister = () => {
    localStorage.setItem("vitrinepro_ref_popup_shown", "true");
    window.location.href = "/register";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-[#C8A96B] rounded-2xl p-6 max-w-[380px] w-full relative shadow-2xl animate-fade-in text-center">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-full bg-[#C8A96B]/10 flex items-center justify-center mx-auto mb-4 border border-[#C8A96B]/25">
          <span className="text-[#C8A96B] text-xl font-bold">⚡</span>
        </div>

        {/* Content */}
        <h3 className="text-white font-bold text-lg mb-3">
          Viu a vitrine de {businessName}?
        </h3>
        <p className="text-slate-300 text-sm mb-6 font-light leading-relaxed">
          Crie a sua gratuitamente em 5 minutos e simplifique a sua presença online.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            className="w-full bg-[#C8A96B] hover:bg-[#b09359] text-[#0F172A] font-bold py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 duration-200 text-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            Criar minha vitrine grátis →
          </button>
          
          <Link
            href="/#como-funciona"
            onClick={handleClose}
            className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 text-sm block text-center cursor-pointer"
          >
            Ver como funciona
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RefPopup() {
  return (
    <Suspense fallback={null}>
      <RefPopupContent />
    </Suspense>
  );
}
