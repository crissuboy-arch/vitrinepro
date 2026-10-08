"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { trackSignUp } from "@/app/lib/analytics";
import { pixelCompleteRegistration } from "@/app/lib/meta-pixel";
import { resolvePostAuthTarget } from "@/lib/auth-redirect";

/**
 * Sign-in "fresco": ocorreu há menos de 2 minutos.
 * Usado para NUNCA decidir o destino com uma sessão antiga quando
 * o callback carrega com ?code= (retorno do OAuth): nesse caso a
 * sessão pré-existente é stale por definição.
 */
function isFreshSignIn(user: { last_sign_in_at?: string } | null | undefined): boolean {
  const ts = user?.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN;
  return Number.isFinite(ts) && Date.now() - ts < 120_000;
}

async function fetchIsAdmin(): Promise<boolean> {
  try {
    const r = await fetch("/api/auth/is-admin");
    if (!r.ok) return false;
    const j = await r.json();
    return j?.isAdmin === true;
  } catch {
    return false;
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let redirected = false;
    let cancelled = false;
    let subscription: { unsubscribe(): void } | null = null;

    const finishRedirect = async (userId: string) => {
      if (redirected || cancelled) return;
      redirected = true;

      try {
        // A2.5: count-safe check (maybeSingle throws on 2+ businesses).
        const [bizRes, isAdmin] = await Promise.all([
          supabase.from("businesses").select("id").eq("user_id", userId).limit(1),
          fetchIsAdmin(), // veredito server-side — nunca só o email do frontend
        ]);
        const existingRows = (bizRes as { data?: { id: string }[] }).data;
        const hasBusiness = (existingRows?.length ?? 0) > 0;

        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get("plan");
        const nextPath = urlParams.get("next");

        if (!hasBusiness && !isAdmin) {
          trackSignUp("google");
          pixelCompleteRegistration();
        }
        // next validado (só interno seguro); admin → /admin; merchant → /dashboard;
        // consumidor → /explorar (nunca onboarding forçado).
        const target = resolvePostAuthTarget({ nextPath, hasBusiness, isAdmin });
        const redirectParams = new URLSearchParams();
        if (plan) redirectParams.set("plan", plan);

        const finalUrl = redirectParams.toString()
          ? `${target}?${redirectParams.toString()}`
          : target;

        router.push(finalUrl);
      } catch {
        router.push("/dashboard");
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get("code");
    const oauthError = urlParams.get("error");

    // Utilizador negou o consentimento no Google (ou erro do provider):
    // não há sessão nova — volta ao login, sem usar sessão antiga.
    if (oauthError) {
      const desc = urlParams.get("error_description");
      // Adiado: setState síncrono no corpo do efeito causa renders em cascata.
      queueMicrotask(() => {
        if (!cancelled) setError(desc || "Autenticação cancelada.");
      });
      const t = setTimeout(() => {
        if (!cancelled) router.push("/login");
      }, 2500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const run = async () => {
      if (oauthCode) {
        // ── Retorno fresco do OAuth (fluxo PKCE) ──────────────────────
        // 1) Troca explícita do código: aguarda a CONCLUSÃO REAL do code
        //    exchange e usa a sessão resultante. Se o auto-detect do
        //    cliente já trocou, esta chamada falha e caímos no passo 2.
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode);
          if (!cancelled && !redirected && !error && data.session?.user) {
            await finishRedirect(data.session.user.id);
            return;
          }
        } catch {
          /* passo 2 cobre */
        }

        // 2) Sessão atual só vale se for um sign-in fresco (a troca pode
        //    já ter concluído via auto-detect). Sessão antiga = ignorada.
        if (!cancelled && !redirected) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && isFreshSignIn(session.user)) {
            await finishRedirect(session.user.id);
            return;
          }
        }

        // 3) Troca ainda em curso: aguarda o SIGNED_IN fresco (ignora
        //    INITIAL_SESSION / sessão antiga).
        if (!cancelled && !redirected) {
          const {
            data: { subscription: sub },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user && isFreshSignIn(session.user)) {
              sub.unsubscribe();
              await finishRedirect(session.user.id);
            } else if (event === "SIGNED_OUT") {
              sub.unsubscribe();
              if (!cancelled) router.push("/login");
            }
          });
          subscription = sub;
        }
      } else {
        // ── Sem código: navegação direta / sessão já estabelecida ──────
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (
            (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
            session?.user
          ) {
            sub.unsubscribe();
            await finishRedirect(session.user.id);
          } else if (event === "SIGNED_OUT") {
            sub.unsubscribe();
            if (!cancelled) router.push("/login");
          }
        });
        subscription = sub;

        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (cancelled || redirected) return;
          if (session?.user) {
            sub.unsubscribe();
            await finishRedirect(session.user.id);
          }
        });
      }
    };

    run();

    // Timeout fallback — se nada resolveu em 8s, volta ao login.
    const timeout = setTimeout(() => {
      if (!redirected && !cancelled) {
        setError("Tempo esgotado ao verificar sessão.");
        setTimeout(() => {
          if (!cancelled) router.push("/login");
        }, 2000);
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-4xl">❌</p>
          <p className="text-red-600">{error}</p>
          <p className="text-[#1F2937] text-sm">A redirecionar para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#0F172A] text-sm">A verificar sessão...</p>
      </div>
    </div>
  );
}
