/* eslint-disable */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/SupabaseAuthContext";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { trackSignUp } from "@/app/lib/analytics";
import { pixelLead, pixelCompleteRegistration } from "@/app/lib/meta-pixel";
import { resolvePostAuthTarget } from "@/lib/auth-redirect";

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
  const searchParams = useSearchParams();
  // A6.5 fix (iPhone smoke): modo inicial lido de forma SÍNCRONA do URL.
  // Antes, isSignUp nascia false e só virava true no useEffect após o
  // primeiro render — no iPhone o utilizador via o formulário de LOGIN
  // ("Entrar"/"Bem-vindo de volta") antes de o efeito correr.
  const [isSignUp, setIsSignUp] = useState(() => searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("message") === "password-updated") {
      setSuccess("✅ Senha atualizada com sucesso! Entra com a tua nova senha.");
    }
  }, [searchParams]);

  const showError = (msg: string) => {
    setError(getReadableError(msg));
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const plan = searchParams.get("plan");
  const nextPath = searchParams.get("next");

  // Google OAuth: redireciona para o Google via Supabase Auth.
  // O redirectTo preserva next/plan para o /auth/callback resolver o destino
  // (next vence; merchant → dashboard; consumidor → /explorar, nunca onboarding forçado).
  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextPath) params.set("next", nextPath);
      if (plan) params.set("plan", plan);
      const redirectTo = `${window.location.origin}/auth/callback${params.toString() ? `?${params.toString()}` : ""}`;
      await signInWithGoogle(redirectTo);
      // signInWithOAuth redireciona o browser — não há retorno aqui.
    } catch (err: any) {
      console.error("[LOGIN] Google OAuth error:", err);
      showError(err.message || "Não foi possível entrar com Google.");
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
          trackSignUp("email");
          pixelLead();
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          pixelCompleteRegistration();
          const { data: bizRows } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).limit(1);
          const hasBusiness = (bizRows?.length ?? 0) > 0;

          let target = resolvePostAuthTarget({ nextPath, hasBusiness }); // A6.5 Parte A — intenção: next vence; merchant → dashboard; consumidor → /explorar
          const params = new URLSearchParams();
          if (plan) params.set("plan", plan);

          const redirectUrl = params.toString() ? `${target}?${params.toString()}` : target;
          router.push(redirectUrl);
        } else {
          setSuccess("✅ Conta criada! Verifica o teu email para confirmar e depois faz login.");
          setIsSignUp(false);
        }
      } else {
        // Login — use session from result directly, no fragile delay needed
        const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) throw loginError;

        if (session?.user) {
          const { data: bizRows } = await supabase.from("businesses").select("id").eq("user_id", session.user.id).limit(1);
          const hasBusiness = (bizRows?.length ?? 0) > 0;

          let target = resolvePostAuthTarget({ nextPath, hasBusiness }); // A6.5 Parte A — intenção: next vence; merchant → dashboard; consumidor → /explorar
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

  // A6.5 Parte A — intenção de entrada ("Tenho um negócio" chega com next=/onboarding)
  const isBusinessIntent = nextPath === "/onboarding";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* A6.5 Parte A — entrada por intenção, na própria página /login (navbar intocada).
            Os dois cards usam o MESMO /login: só mudam mode/next. */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            href="/login?mode=signup"
            className="block bg-white rounded-2xl border-2 border-[#E5E7EB] hover:border-[#C8A96B] p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-bold text-[#0F172A] text-sm">Quero descobrir</div>
            <p className="text-xs text-[#1F2937] mt-1 leading-snug">
              Conta gratuita para encontrar e guardar coisas perto de você
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-[#0F172A] bg-[#C8A96B] rounded-lg px-3 py-2">
              CRIAR CONTA GRÁTIS
            </span>
          </Link>
          <Link
            href="/login?mode=signup&next=/onboarding"
            className="block bg-white rounded-2xl border-2 border-[#E5E7EB] hover:border-[#C8A96B] p-4 text-left transition-colors"
          >
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-bold text-[#0F172A] text-sm">Tenho um negócio</div>
            <p className="text-xs text-[#1F2937] mt-1 leading-snug">
              Crie sua Montra
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-[#C8A96B] border border-[#C8A96B] rounded-lg px-3 py-2">
              CADASTRAR MEU NEGÓCIO
            </span>
          </Link>
        </div>

        {isBusinessIntent && (
          <p className="text-center text-sm text-[#1F2937] mb-4 bg-[#C8A96B]/15 border border-[#C8A96B]/40 rounded-xl px-4 py-2.5">
            🏪 Vai criar a sua Montra — entre ou crie conta para continuar.
          </p>
        )}

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

            {!isSignUp && (
              <div className="flex justify-end -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#C8A96B] hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            )}

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

          {/* Divisor */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#1F2937]">ou</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Google OAuth (provider habilitado no Supabase Auth) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3.5 bg-white border-2 border-[#E5E7EB] text-[#0F172A] rounded-xl font-bold hover:border-[#C8A96B] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                A redirecionar...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Continuar com Google
              </>
            )}
          </button>

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