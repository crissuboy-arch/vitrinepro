/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

type Status = "loading" | "ready" | "submitting" | "success" | "expired";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const isReadyRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasCode = Boolean(params.get("code"));
    const hasRecoveryType = params.get("type") === "recovery";

    // If the URL has no recovery signals at all, show expired immediately
    if (!hasCode && !hasRecoveryType) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        // Only accept an existing session on this page if URL had recovery params
        // (e.g. user refreshed after exchange). Without params, treat as invalid.
        setStatus("expired");
      });
      return;
    }

    // Subscribe before checking session to avoid the race where the event fires
    // between getSession() call and the subscription being set up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (!isReadyRef.current) {
          isReadyRef.current = true;
          setStatus("ready");
        }
      }
    });

    // Fallback: PKCE exchange may complete before our subscription was ready
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isReadyRef.current) {
        isReadyRef.current = true;
        setStatus("ready");
      }
    });

    // Timeout: if no recovery session after 8s the link is expired
    const timeout = setTimeout(() => {
      if (!isReadyRef.current) {
        setStatus("expired");
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Auto-redirect to login after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/login?message=password-updated");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem. Verifica e tenta novamente.");
      return;
    }

    setStatus("submitting");

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      setStatus("success");
    } catch (err: any) {
      console.error("[RESET-PASSWORD]", err);
      const msg = err.message || "";
      if (msg.includes("same password") || msg.includes("different from")) {
        setError("A nova senha deve ser diferente da anterior.");
      } else if (msg.includes("weak") || msg.includes("Password should")) {
        setError("A senha é demasiado fraca. Usa pelo menos 6 caracteres.");
      } else {
        setError("Erro ao atualizar a senha. O link pode ter expirado.");
      }
      setStatus("ready");
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#C8A96B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#0F172A] text-sm">A verificar link de recuperação...</p>
        </div>
      </div>
    );
  }

  // ─── Expired / Invalid ───────────────────────────────────────────────────────
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-[#0F172A]">Link inválido</h1>
            <p className="text-[#1F2937] text-sm leading-relaxed">
              Este link de recuperação é inválido ou já expirou.<br />
              Os links são válidos por 24 horas.
            </p>
            <div className="pt-2 space-y-2">
              <Link
                href="/forgot-password"
                className="block w-full py-3 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold hover:bg-[#D4BB82] transition-all text-center text-sm"
              >
                Solicitar novo link
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 text-center text-[#1F2937] text-sm hover:text-[#C8A96B] transition-colors"
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ─────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-[#0F172A]">Senha atualizada!</h1>
            <p className="text-[#1F2937] text-sm">
              A tua senha foi alterada com sucesso.<br />
              A redirecionar para o login...
            </p>
            <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Form (ready | submitting) ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <Link href="/" className="block text-center mb-8">
            <img
              src="/logo-vitrinepro.png"
              alt="VitrinePro"
              className="h-16 mx-auto object-contain"
            />
          </Link>

          <h1 className="text-2xl font-display text-[#0F172A] text-center mb-2">
            Nova senha
          </h1>
          <p className="text-[#1F2937] text-center text-sm mb-8">
            Escolhe uma nova senha para a tua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Nova senha
                <span className="text-xs text-gray-400 font-normal ml-1">(mínimo 6 caracteres)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                  autoComplete="new-password"
                  className="w-full pl-4 pr-12 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors text-[#0F172A]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C8A96B] transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-4 pr-12 py-3 bg-[#FAF7F2] rounded-lg border transition-colors focus:outline-none text-[#0F172A]"
                  style={{
                    borderColor: confirm && confirm !== password ? "#FCA5A5" : confirm && confirm === password ? "#86EFAC" : "#E5E7EB",
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C8A96B] transition-colors focus:outline-none cursor-pointer p-1"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="text-red-500 text-xs mt-1">As senhas não coincidem.</p>
              )}
              {confirm && confirm === password && (
                <p className="text-green-500 text-xs mt-1">As senhas coincidem.</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3.5 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold hover:bg-[#D4BB82] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "submitting" ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                  A guardar...
                </>
              ) : (
                "Guardar nova senha"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#1F2937] text-sm mt-6">
          <Link href="/login" className="hover:text-[#C8A96B]">
            ← Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
