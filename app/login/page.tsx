/* eslint-disable */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/SupabaseAuthContext";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff } from "lucide-react";

function getReadableError(message: string): string {
  if (!message) return "Ocorreu um erro. Tenta novamente.";
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials"))
    return "Email ou senha incorretos. Verifica os teus dados.";
  if (message.includes("Email not confirmed"))
    return "Email ainda não confirmado. Verifica a tua caixa de entrada (e spam).";
  if (message.includes("User already registered"))
    return "Este email já está registado. Clica em 'Entrar'.";
  if (message.includes("Password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (message.includes("Unable to validate email address"))
    return "Endereço de email inválido.";
  if (message.includes("too many requests") || message.includes("rate limit"))
    return "Demasiadas tentativas. Aguarda uns momentos e tenta novamente.";
  if (message.includes("network") || message.includes("fetch"))
    return "Erro de ligação. Verifica a tua internet e tenta novamente.";
  return message;
}

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorRef = useRef<HTMLDivElement>(null);

  const showError = (msg: string) => {
    setError(getReadableError(msg));
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const plan = searchParams.get("plan");
  const nextPath = searchParams.get("next");

  const handleGoogleLogin = async () => {
    if (!googleEnabled) {
      showError("Login com Google não está configurado. Use email/senha.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    try {
      const params = new URLSearchParams();
      if (plan) params.set("plan", plan);
      if (nextPath) params.set("next", nextPath);
      const queryString = params.toString();
      const redirectUrl = queryString
        ? `${window.location.origin}/auth/callback?${queryString}`
        : `${window.location.origin}/auth/callback`;
      await signInWithGoogle(redirectUrl);
    } catch (err: any) {
      console.error("[LOGIN] Google error:", err);
      if (err.message?.includes("provider is not enabled")) {
        setGoogleEnabled(false);
        showError("Login com Google não está configurado. Use email/senha.");
      } else {
        showError(err.message || "Erro ao fazer login com Google.");
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

    if (!email.trim() || !password.trim()) {
      showError("Preenche o email e a senha.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signupError } = await supabase.auth.signUp({ email, password });
        if (signupError) throw signupError;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email,
            display_name: email.split("@")[0],
            plan: "free",
          });
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: biz } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).maybeSingle();
          
          let target = nextPath || (biz ? "/dashboard" : "/onboarding");
          const params = new URLSearchParams();
          if (plan) params.set("plan", plan);
          
          const redirectUrl = params.toString() ? `${target}?${params.toString()}` : target;
          router.push(redirectUrl);
        } else {
          setSuccess("✅ Conta criada! Verifica o teu email para confirmar e depois faz login.");
          setIsSignUp(false);
        }
      } else {
        // Login
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) throw loginError;

        // Small delay for session cookie to be set
        await new Promise((r) => setTimeout(r, 300));

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: biz } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).maybeSingle();
          
          let target = nextPath || (biz ? "/dashboard" : "/onboarding");
          const params = new URLSearchParams();
          if (plan) params.set("plan", plan);
          
          const redirectUrl = params.toString() ? `${target}?${params.toString()}` : target;
          router.push(redirectUrl);
        } else {
          showError("Não foi possível iniciar sessão. Tenta novamente.");
        }
      }
    } catch (err: any) {
      console.error("[LOGIN] Auth error:", err);
      showError(err.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <Link href="/" className="block text-center mb-8">
            <img src="/logo-vitrinepro.png" alt="VitrinePro" className="h-16 mx-auto object-contain bg-transparent" />
          </Link>

          <h1 className="text-2xl font-display text-[#0F172A] text-center mb-2">
            {isSignUp ? "Criar conta" : "Entrar"}
          </h1>
          <p className="text-[#1F2937] text-center mb-8">
            {isSignUp 
              ? "Junte-se a milhares de negócios em Portugal" 
              : "Bem-vindo de volta"}
          </p>

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
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0F172A] mb-1">
                Senha{isSignUp && <span className="text-xs text-gray-400 font-normal ml-1">(mínimo 6 caracteres)</span>}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full pl-4 pr-12 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors text-[#0F172A]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C8A96B] transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error/Success — perto do botão para ser sempre visível */}
            {error && (
              <div
                ref={errorRef}
                className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2"
              >
                <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold hover:bg-[#D4BB82] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                  A processar...
                </>
              ) : (
                isSignUp ? "Criar conta" : "Entrar →"
              )}
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