/* eslint-disable */
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Insere o teu endereço de email.");
      return;
    }

    setStatus("loading");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      // Always show success to prevent email enumeration
      setStatus("sent");
    } catch (err: any) {
      console.error("[FORGOT-PASSWORD]", err);
      if (err.message?.includes("rate limit") || err.message?.includes("too many")) {
        setError("Demasiadas tentativas. Aguarda alguns minutos e tenta novamente.");
      } else {
        setError("Erro ao enviar email. Verifica a tua ligação e tenta novamente.");
      }
      setStatus("idle");
    }
  };

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

          {status === "sent" ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-display text-[#0F172A]">Email enviado!</h1>
              <p className="text-[#1F2937] text-sm leading-relaxed">
                Se existe uma conta com o email <span className="font-medium text-[#0F172A]">{email}</span>,
                receberás um link para criar uma nova senha.
              </p>
              <p className="text-[#6B7280] text-xs">
                Não encontras o email? Verifica a pasta de spam ou lixo.
              </p>
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => { setStatus("idle"); setEmail(""); }}
                  className="w-full py-3 border border-[#E5E7EB] text-[#0F172A] rounded-xl font-medium hover:border-[#C8A96B] transition-colors text-sm"
                >
                  Tentar com outro email
                </button>
                <Link
                  href="/login"
                  className="block w-full py-3 text-center text-[#C8A96B] font-medium hover:underline text-sm"
                >
                  Voltar ao login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display text-[#0F172A] text-center mb-2">
                Recuperar senha
              </h1>
              <p className="text-[#1F2937] text-center text-sm mb-8">
                Insere o teu email e enviamos um link para criar uma nova senha.
              </p>

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
                    autoComplete="email"
                    autoFocus
                    className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#C8A96B] transition-colors text-[#0F172A]"
                    placeholder="seu@email.com"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
                    <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 bg-[#C8A96B] text-[#0F172A] rounded-xl font-bold hover:bg-[#D4BB82] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </button>
              </form>

              <p className="text-center text-[#1F2937] text-sm mt-6">
                Lembras-te da senha?{" "}
                <Link href="/login" className="text-[#C8A96B] font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </>
          )}
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
