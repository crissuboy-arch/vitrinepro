"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/SupabaseAuthContext";
import { supabase } from "@/app/lib/supabase";
import AccountMenu from "@/components/auth/AccountMenu";

/**
 * /conta — Gestão da conta (padrão conceitual Pinterest, visual próprio).
 *
 * Separa CONTA (pessoa autenticada) de MONTRA (negócio).
 * Só usa campos que existem no modelo: profiles.display_name, user.email,
 * user.email_confirmed_at, profiles.plan. Sem telefone/país (não existem
 * na conta) e sem nenhum campo novo no banco.
 */
export default function ContaPage() {
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/conta");
  }, [loading, user, router]);

  // Nome inicial derivado do perfil/sessão (sem setState em efeito).
  const fallbackName = profile?.display_name || (user?.email ? user.email.split("@")[0] : "");
  const shownName = name ?? fallbackName;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#C8A96B] animate-pulse">A carregar…</div>
      </div>
    );
  }

  const email = user.email ?? "";
  const emailConfirmed = !!user.email_confirmed_at;
  const plan = profile?.plan ?? "free";

  const saveName = async () => {
    const trimmed = shownName.trim();
    if (!trimmed) {
      setNameMsg("Escreve o teu nome.");
      return;
    }
    setSavingName(true);
    setNameMsg(null);
    try {
      await updateProfile({ display_name: trimmed });
      setNameMsg("Nome atualizado.");
    } catch {
      setNameMsg("Não foi possível guardar. Tenta novamente.");
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (pw1.length < 6) {
      setPwMsg({ ok: false, text: "A palavra-passe precisa de pelo menos 6 caracteres." });
      return;
    }
    if (pw1 !== pw2) {
      setPwMsg({ ok: false, text: "As palavras-passe não coincidem." });
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPw1("");
      setPw2("");
      setPwMsg({ ok: true, text: "Palavra-passe alterada com sucesso." });
    } catch {
      setPwMsg({ ok: false, text: "Não foi possível alterar. Tenta novamente." });
    } finally {
      setSavingPw(false);
    }
  };

  const doSignOut = async (target: string) => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // Reload real: mata estado stale e força revalidação da sessão.
      window.location.href = target;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Minhas Montras
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-10 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Gestão da conta</h1>
          <p className="text-sm text-gray-400 mt-2">
            A tua conta (pessoa) — separada das tuas Montras (negócios).
          </p>
        </div>

        {/* A TUA CONTA */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#C8A96B]">A tua conta</h2>

          <div>
            <label htmlFor="acc-name" className="block text-sm text-gray-300 mb-2">Nome</label>
            <div className="flex gap-2">
              <input
                id="acc-name"
                value={shownName}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-0 bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#C8A96B]/60 focus:outline-none"
                placeholder="O teu nome"
                maxLength={80}
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {savingName ? "…" : "Guardar"}
              </button>
            </div>
            {nameMsg && <p className="text-xs text-gray-400 mt-2">{nameMsg}</p>}
          </div>

          <div>
            <p className="text-sm text-gray-300 mb-2">
              E-mail <span className="ml-1 text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 rounded px-1.5 py-0.5">privado</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-white truncate">{email}</p>
              <span
                className={`text-[10px] uppercase tracking-widest rounded-full px-2.5 py-1 ${
                  emailConfirmed
                    ? "bg-emerald-950/50 border border-emerald-800 text-emerald-400"
                    : "bg-amber-950/50 border border-amber-800 text-amber-400"
                }`}
              >
                {emailConfirmed ? "Confirmado" : "Pendente"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-300 mb-2">Alterar palavra-passe</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                placeholder="Nova palavra-passe"
                autoComplete="new-password"
                className="bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#C8A96B]/60 focus:outline-none"
              />
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repetir palavra-passe"
                autoComplete="new-password"
                className="bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#C8A96B]/60 focus:outline-none"
              />
            </div>
            <button
              onClick={changePassword}
              disabled={savingPw}
              className="mt-2 px-4 py-2.5 border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B]/10 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {savingPw ? "A alterar…" : "Alterar palavra-passe"}
            </button>
            {pwMsg && (
              <p className={`text-xs mt-2 ${pwMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{pwMsg.text}</p>
            )}
          </div>
        </section>

        {/* GESTÃO */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#C8A96B]">Gestão</h2>

          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 hover:border-[#C8A96B]/40 hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-sm font-semibold">Minhas Montras</span>
            <span className="text-gray-500">→</span>
          </Link>

          <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10">
            <div>
              <p className="text-sm font-semibold">Plano atual: <span className="text-[#C8A96B] capitalize">{plan}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Faturação e upgrades</p>
            </div>
            <Link
              href="/plano-business"
              className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg uppercase tracking-wider transition-colors flex-shrink-0"
            >
              Ver planos
            </Link>
          </div>
        </section>

        {/* SESSÃO */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#C8A96B]">Sessão</h2>
          <p className="text-xs text-gray-500 truncate">Com sessão iniciada como {email}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => doSignOut("/login")}
              disabled={signingOut}
              className="flex-1 px-4 py-3 border border-white/15 hover:border-[#C8A96B]/50 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Trocar de conta
            </button>
            <button
              onClick={() => doSignOut("/")}
              disabled={signingOut}
              className="flex-1 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {signingOut ? "A sair…" : "Sair"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
