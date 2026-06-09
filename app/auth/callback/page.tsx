/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { trackSignUp } from "@/app/lib/analytics";
import { pixelCompleteRegistration } from "@/app/lib/meta-pixel";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let redirected = false;

    const doRedirect = async (userId: string) => {
      if (redirected) return;
      redirected = true;

      try {
        const { data: existingBusiness } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get("plan");
        const nextPath = urlParams.get("next");

        if (!existingBusiness) {
          trackSignUp("google");
          pixelCompleteRegistration();
        }
        const target = nextPath || (existingBusiness ? "/dashboard" : "/onboarding");
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

    // onAuthStateChange catches PKCE code exchange completion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          session?.user
        ) {
          subscription.unsubscribe();
          await doRedirect(session.user.id);
        } else if (event === "SIGNED_OUT") {
          subscription.unsubscribe();
          router.push("/login");
        }
      }
    );

    // Also check immediately in case session is already established
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        subscription.unsubscribe();
        await doRedirect(session.user.id);
      }
    });

    // Timeout fallback — if nothing resolved in 8s, go to login
    const timeout = setTimeout(() => {
      if (!redirected) {
        setError("Tempo esgotado ao verificar sessão.");
        setTimeout(() => router.push("/login"), 2000);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
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
