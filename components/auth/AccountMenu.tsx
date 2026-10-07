"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/SupabaseAuthContext";
import { getBusinessCount, isMerchant } from "@/lib/account";

/**
 * AccountMenu — identificação discreta da sessão autenticada (padrão SaaS).
 *
 * - `compact`: só avatar (sem nome/e-mail no header) — para a landing.
 * - Dropdown: Minha Conta, Favoritos, Explorar, Criar minha Montra
 *   (consumidor) ou Gerir minhas Montras (comerciante), Trocar de conta,
 *   Sair.
 * - Regra de produto: ter business é capacidade adicional da mesma conta;
 *   sem "tipo de conta" rígido.
 * - Logout usa reload real (window.location.href): mata qualquer estado
 *   SPA stale e força o middleware a revalidar a sessão.
 * - Nunca expõe user_id/UUID nem dados de outra conta.
 */
export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [businessCount, setBusinessCount] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const email = user?.email ?? "";
  const displayName = profile?.display_name || user?.user_metadata?.full_name || "";
  const initial = (displayName || email).charAt(0).toUpperCase() || "?";

  // Conta businesses para decidir consumidor vs comerciante (leve, só conta).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/app/lib/supabase");
        const n = await getBusinessCount(supabase, user.id);
        if (!cancelled) setBusinessCount(n);
      } catch {
        if (!cancelled) setBusinessCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fecha ao clicar fora ou com Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  if (!user) return null;

  const doSignOut = async (target: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
    } finally {
      setOpen(false);
      // Reload real (não router.push): garante cookies limpos, middleware
      // revalidado e zero estado stale — a sessão anterior morre aqui.
      window.location.href = target;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu da conta"
        className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full border border-white/10 hover:border-[#C8A96B]/50 bg-white/5 hover:bg-white/10 transition-colors max-w-[180px] sm:max-w-[240px]"
      >
        <span
          aria-hidden="true"
          className="w-8 h-8 flex-shrink-0 rounded-full bg-[#C8A96B] text-[#0F172A] font-bold text-sm flex items-center justify-center"
        >
          {initial}
        </span>
        {!compact && (
          <span className="hidden sm:block text-xs text-slate-200 truncate">
            {displayName || email}
          </span>
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl shadow-black/50 overflow-hidden z-50"
        >
          {/* Identificação da sessão */}
          <div className="px-4 py-3.5 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Sessão</p>
            {displayName && (
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            )}
            <p className="text-xs text-[#C8A96B] truncate" title={email}>
              {email}
            </p>
          </div>

          <nav className="py-1.5">
            <Link
              href="/conta"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              Minha Conta
            </Link>
            <Link
              href="/favoritos"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              ❤️ Favoritos
            </Link>
            <Link
              href="/explorar"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
            >
              🔍 Explorar
            </Link>
            {businessCount !== null &&
              (isMerchant(businessCount) ? (
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition-colors"
                >
                  🏪 Gerir minhas Montras
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-semibold text-[#C8A96B] hover:bg-white/5 hover:text-[#D4BB82] transition-colors"
                >
                  ＋ Criar minha Montra
                </Link>
              ))}
            <button
              role="menuitem"
              disabled={busy}
              onClick={() => doSignOut("/login")}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
            >
              Trocar de conta
            </button>
            <button
              role="menuitem"
              disabled={busy}
              onClick={() => doSignOut("/")}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors border-t border-white/5 mt-1 pt-3 disabled:opacity-50"
            >
              {busy ? "A sair…" : "Sair"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
