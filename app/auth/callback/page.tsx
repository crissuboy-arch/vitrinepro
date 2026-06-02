/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verificando login...");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[AUTH_CALLBACK] Session error:", sessionError);
          setError("Erro ao verificar sessão");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }
        
        if (session?.user) {
          console.log("[AUTH_CALLBACK] User logged in:", session.user.id);
          
          const { data: existingBusiness, error: bizError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (bizError) {
            console.error("[AUTH_CALLBACK] Business query error:", bizError);
          }
          
          // Extract parameters from the callback URL
          const urlParams = new URLSearchParams(window.location.search);
          const plan = urlParams.get("plan");
          const nextPath = urlParams.get("next");

          let target = nextPath || (existingBusiness ? "/dashboard" : "/onboarding");
          const redirectParams = new URLSearchParams();
          if (plan) redirectParams.set("plan", plan);
          
          const finalUrl = redirectParams.toString() ? `${target}?${redirectParams.toString()}` : target;

          if (existingBusiness) {
            console.log("[AUTH_CALLBACK] User has business, redirecting to", finalUrl);
            router.push(finalUrl);
          } else {
            console.log("[AUTH_CALLBACK] User has no business, redirecting to", finalUrl);
            router.push(finalUrl);
          }
        } else {
          console.log("[AUTH_CALLBACK] No session, redirecting to login");
          router.push("/login");
        }
      } catch (error: any) {
        console.error("[AUTH_CALLBACK] Error:", error);
        setError("Erro ao processar login");
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const plan = urlParams.get("plan");
          const nextPath = urlParams.get("next");
          const redirectParams = new URLSearchParams();
          if (plan) redirectParams.set("plan", plan);
          if (nextPath) redirectParams.set("next", nextPath);
          const redirectUrl = redirectParams.toString() ? `/login?${redirectParams.toString()}` : "/login";
          router.push(redirectUrl);
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-[#1F2937]">A redirecionar para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">⏳</div>
        <p className="text-[#0F172A]">{status}</p>
      </div>
    </div>
  );
}