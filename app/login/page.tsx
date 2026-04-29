"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/SupabaseAuthContext";
import { supabase } from "../lib/supabase";

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if Google provider is enabled
    const checkGoogleProvider = async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: 'https://dummy-url.com' }
        });
        // If we get here without error, Google is enabled
      } catch (err: any) {
        if (err.message?.includes("provider is not enabled") || err.message?.includes("unsupported_provider")) {
          setGoogleEnabled(false);
        }
      }
    };
    checkGoogleProvider();
  }, []);

  const handleGoogleLogin = async () => {
    if (!googleEnabled) {
      setError("Login com Google não está configurado. Use email/senha.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("[LOGIN] Google error:", err);
      if (err.message?.includes("provider is not enabled")) {
        setGoogleEnabled(false);
        setError("Login com Google não está configurado. Use email/senha.");
      } else {
        setError("Erro ao fazer login com Google. Tente novamente.");
      }
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      console.log("[LOGIN] Attempting auth...", { isSignUp, email: email.substring(0, 3) + "***" });
      
      if (isSignUp) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        console.log("[LOGIN] Signup result:", { user: data.user?.id, error: signupError?.message });
        if (signupError) throw signupError;

        // Create profile immediately
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email,
            display_name: email.split("@")[0],
            plan: "free",
          });
        }

        // Check if user is immediately confirmed (or confirmation disabled)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in - check for business
          const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          
          if (existingBusiness) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          // Email confirmation required - show success message
          setSuccess("Conta criada! Verifique seu email para confirmar e depois faça login.");
          setIsSignUp(false);
          return;
        }
      } else {
        // Login flow
        await signInWithEmail(email, password);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[LOGIN] Session after login:", session?.user?.id);
        
        if (session?.user) {
          const { data: existingBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          
          if (existingBusiness) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          setError("Email ou senha incorretos");
        }
      }
    } catch (err: any) {
      console.error("[LOGIN] Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <Link href="/" className="block text-center mb-8">
            <span className="text-3xl font-display text-[#C8A96B]">VitrinePro</span>
          </Link>

          <h1 className="text-2xl font-display text-[#0F172A] text-center mb-2">
            {isSignUp ? "Criar conta" : "Entrar"}
          </h1>
          <p className="text-[#1F2937] text-center mb-8">
            {isSignUp 
              ? "Junte-se a milhares de negócios em Portugal" 
              : "Bem-vindo de volta"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {googleEnabled && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-3 bg-white border-2 border-[#E5E7EB] text-[#1F2937] rounded-lg font-medium flex items-center justify-center gap-3 mb-4 hover:border-[#C8A96B] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "A processar..." : "Continuar com Google"}
            </button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#1F2937]">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8A96B] text-[#0F172A] rounded-lg font-semibold hover:bg-[#D4BB82] transition-colors disabled:opacity-50"
            >
              {loading ? "A processar..." : isSignUp ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[#1F2937] text-sm mt-6">
            {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#C8A96B] font-medium hover:underline"
            >
              {isSignUp ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>

        <p className="text-center text-[#1F2937] text-sm mt-6">
          <Link href="/" className="hover:text-[#C8A96B]">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#0F172A]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}