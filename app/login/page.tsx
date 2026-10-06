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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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