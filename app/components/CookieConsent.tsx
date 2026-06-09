"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CONSENT_EVENT } from "./GoogleAnalytics";

const STORAGE_KEY = "vp_cookie_consent";

interface CookiePrefs {
  essential: true;         // always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePrefs;
  } catch {
    return null;
  }
}

function savePrefs(prefs: Omit<CookiePrefs, "essential" | "timestamp">): CookiePrefs {
  const full: CookiePrefs = {
    essential: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
  return full;
}

// ─── Preferences Modal ────────────────────────────────────────────────────────
function PreferencesModal({
  initial,
  onSave,
  onClose,
}: {
  initial: { analytics: boolean; marketing: boolean };
  onSave: (prefs: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [marketing, setMarketing] = useState(initial.marketing);

  const categories = [
    {
      id: "essential" as const,
      label: "Estritamente Necessários",
      desc: "Cookies indispensáveis para o funcionamento da plataforma: autenticação (sessão de login) e prevenção de fraude no checkout. Não podem ser desativados.",
      locked: true,
      value: true,
    },
    {
      id: "analytics" as const,
      label: "Análise e Performance",
      desc: "Permitem-nos medir a audiência e melhorar a experiência da plataforma (ex.: páginas mais visitadas, erros). Os dados são anónimos ou pseudónimos.",
      locked: false,
      value: analytics,
      onChange: setAnalytics,
    },
    {
      id: "marketing" as const,
      label: "Marketing e Publicidade",
      desc: "Utilizados para apresentar anúncios relevantes para os seus interesses e medir a eficácia de campanhas. Partilhados com parceiros de publicidade.",
      locked: false,
      value: marketing,
      onChange: setMarketing,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999]">
      <div className="bg-[#0F172A] border border-[#C8A96B]/30 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-display font-semibold text-white">Preferências de Cookies</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                cat.locked
                  ? "border-gray-800 bg-gray-900/40"
                  : cat.value
                  ? "border-[#C8A96B]/30 bg-[#C8A96B]/5"
                  : "border-gray-800 bg-gray-900/20"
              }`}
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{cat.label}</p>
                  {cat.locked && (
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                      Sempre ativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{cat.desc}</p>
              </div>

              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={cat.value}
                disabled={cat.locked}
                onClick={() => !cat.locked && cat.onChange?.(!cat.value)}
                className={`flex-shrink-0 relative w-10 h-6 rounded-full transition-colors mt-0.5 ${
                  cat.locked
                    ? "bg-gray-700 cursor-not-allowed"
                    : cat.value
                    ? "bg-[#C8A96B] cursor-pointer"
                    : "bg-gray-700 cursor-pointer"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    cat.value ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onSave({ analytics: true, marketing: true })}
            className="flex-1 py-2.5 border border-[#C8A96B]/40 text-[#C8A96B] text-sm font-medium rounded-xl hover:bg-[#C8A96B]/10 transition-colors"
          >
            Aceitar todos
          </button>
          <button
            onClick={() => onSave({ analytics, marketing })}
            className="flex-1 py-2.5 bg-[#C8A96B] text-[#0F172A] text-sm font-bold rounded-xl hover:bg-[#D4BB82] transition-colors"
          >
            Guardar preferências
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Banner ──────────────────────────────────────────────────────────────
export default function CookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null | "loading">("loading");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const handleAcceptAll = () => {
    setPrefs(savePrefs({ analytics: true, marketing: true }));
  };

  const handleDeclineAll = () => {
    setPrefs(savePrefs({ analytics: false, marketing: false }));
  };

  const handleSavePrefs = (p: { analytics: boolean; marketing: boolean }) => {
    setPrefs(savePrefs(p));
    setShowModal(false);
  };

  // Still hydrating — render nothing to avoid flash
  if (prefs === "loading") return null;

  // Consent already given — show a small "Gerir cookies" link at bottom-left
  if (prefs !== null) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-4 left-4 z-40 text-[10px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2 bg-transparent"
          aria-label="Gerir preferências de cookies"
        >
          Gerir cookies
        </button>

        {showModal && (
          <PreferencesModal
            initial={{ analytics: prefs.analytics, marketing: prefs.marketing }}
            onSave={handleSavePrefs}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // No consent yet — show banner
  return (
    <>
      <div
        role="dialog"
        aria-label="Consentimento de cookies"
        className="fixed bottom-0 left-0 right-0 z-[9998] p-4 sm:p-6"
      >
        <div className="max-w-4xl mx-auto bg-[#0F172A] border border-[#C8A96B]/25 rounded-2xl shadow-2xl shadow-black/40 px-5 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Text */}
            <div className="flex-grow min-w-0">
              <p className="text-sm font-semibold text-white mb-1">
                Este site utiliza cookies 🍪
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento da plataforma e, com o seu consentimento, cookies opcionais para análise e marketing. Veja a nossa{" "}
                <Link href="/politica-privacidade#10" className="text-[#C8A96B] hover:underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-xs text-gray-400 border border-gray-700 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
              >
                Preferências
              </button>
              <button
                onClick={handleDeclineAll}
                className="px-4 py-2 text-xs text-gray-300 border border-gray-700 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
              >
                Recusar
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-bold bg-[#C8A96B] text-[#0F172A] rounded-xl hover:bg-[#D4BB82] transition-colors"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <PreferencesModal
          initial={{ analytics: false, marketing: false }}
          onSave={handleSavePrefs}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
