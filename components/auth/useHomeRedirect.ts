/**
 * components/auth/useHomeRedirect.ts — correção definitiva da navegação.
 *
 * Utilizadores AUTENTICADOS nunca devem ver a landing comercial (`/`)
 * nem o formulário de login (`/login`): são redirecionados para a sua
 * home por tipo de conta (admin → /admin, merchant → /dashboard,
 * consumidor → /explorar).
 *
 * Retorna `true` quando se confirmou que NÃO há sessão (visitante pode
 * ficar na página). Retorna `false` enquanto verifica ou quando vai
 * redirecionar — a página deve renderizar um loader neutro (nunca a
 * landing) para evitar flash.
 *
 * Segurança:
 * - Só redireciona com sessão CONFIRMADA (getSession resolvido).
 * - Veredito admin sempre server-side (GET /api/auth/is-admin).
 * - Sem loops: /admin, /dashboard e /explorar não devolvem autenticados
 *   para `/` nem `/login`.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { resolvePostAuthTarget, fetchIsAdminClient } from "@/lib/auth-redirect";

export function useHomeRedirect(opts?: { nextPath?: string | null }): boolean {
  const router = useRouter();
  const [stayAllowed, setStayAllowed] = useState(false);
  const nextPath = opts?.nextPath ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        // Sem sessão confirmada → visitante: fica na página.
        if (!session?.user) {
          setStayAllowed(true);
          return;
        }
        // Sessão confirmada → resolve destino por tipo de conta.
        const [{ data: bizRows }, isAdmin] = await Promise.all([
          supabase.from("businesses").select("id").eq("user_id", session.user.id).limit(1),
          fetchIsAdminClient(),
        ]);
        if (cancelled) return;
        const target = resolvePostAuthTarget({
          nextPath,
          hasBusiness: (bizRows?.length ?? 0) > 0,
          isAdmin,
        });
        router.replace(target);
      } catch (err) {
        // Falha de rede/verificação: não prender o utilizador num loader.
        // Sem sessão confirmada, o destino seguro é ficar na página.
        console.error("[NAV] useHomeRedirect falhou:", err);
        if (!cancelled) setStayAllowed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // nextPath é estável por navegação; router é estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPath]);

  return stayAllowed;
}
