"use client";

// A10.5c — DIAGNÓSTICO TEMPORÁRIO.
// Boundary de erro do segmento /dashboard. Sem ele, um erro client-side ao
// entrar em "Gerenciar Montra" cai no global-error genérico do Next.js
// ("This page couldn't load") sem revelar a causa. Aqui mostramos a MENSAGEM
// do erro (texto de exceção JavaScript — sem dados pessoais/credenciais)
// para diagnóstico, com opção de tentar de novo.
// Doc: node_modules/next/dist/docs — error.js (Next 16): erros de Client
// Components mostram a mensagem original em produção.

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD ERROR BOUNDARY]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-display font-bold text-[#C8A96B]">
          O painel encontrou um erro
        </h2>
        <p className="text-sm text-gray-400">
          Diagnóstico temporário — a mensagem abaixo é o erro real. Partilha
          esta mensagem para correção imediata:
        </p>
        <pre className="text-xs bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-words text-red-300">
          {error?.message || "(sem mensagem)"}
        </pre>
        {error?.digest && (
          <p className="text-xs text-gray-500">Digest: {error.digest}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] font-bold rounded-lg text-sm transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
          >
            Voltar às Minhas Montras
          </Link>
        </div>
      </div>
    </div>
  );
}
