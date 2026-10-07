"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/SupabaseAuthContext";
import { supabase } from "@/app/lib/supabase";
import AccountMenu from "@/components/auth/AccountMenu";
import { getBusinessCount, isMerchant } from "@/lib/account";

/**
 * /conta — Minha Conta (hub do consumidor).
 *
 * Regra de produto: a mesma conta serve para consumidor e comerciante.
 * Consumidor (0 businesses): perfil, Favoritos, Coleções, Explorar,
 * Criar minha Montra, Sair, Excluir conta.
 * Comerciante (≥1): tudo isso + Gerir minhas Montras.
 *
 * Só usa campos que existem no modelo. Sem "tipo de conta" rígido.
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

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  // Consumidor vs comerciante (contagem leve de businesses).
  const [businessCount, setBusinessCount] = useState<number | null>(null);

  // Exclusão de conta (só consumidor 0 businesses; confirmação forte).
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/conta");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const n = await getBusinessCount(supabase, user.id);
      if (!cancelled) setBusinessCount(n);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const changeEmail = async () => {
    setEmailMsg(null);
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailMsg({ ok: false, text: "Escreve um e-mail válido." });
      return;
    }
    if (trimmed === email.toLowerCase()) {
      setEmailMsg({ ok: false, text: "Esse já é o teu e-mail atual." });
      return;
    }
    setSavingEmail(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setNewEmail("");
      // Se a troca foi imediata, o e-mail da sessão já é o novo.
      if (data.user?.email?.toLowerCase() === trimmed) {
        setEmailMsg({ ok: true, text: "E-mail alterado com sucesso." });
      } else {
        setEmailMsg({
          ok: true,
          text: "Enviámos um link de confirmação para o novo e-mail. Clica nele para concluir a troca.",
        });
      }
    } catch {
      setEmailMsg({ ok: false, text: "Não foi possível alterar. Tenta novamente." });
    } finally {
      setSavingEmail(false);
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

  // Exclusão de conta — server-side, confirmação forte (e-mail exato).
  // Só consumidor com 0 businesses; comerciante precisa resolver as
  // Montras primeiro (sem destruição comercial automática).
  const doDeleteAccount = async () => {
    setDeleteMsg(null);
    const typed = deleteConfirm.trim().toLowerCase();
    if (typed !== email.toLowerCase()) {
      setDeleteMsg({ ok: false, text: "Escreve o teu e-mail exatamente como está acima para confirmar." });
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: typed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Não foi possível excluir a conta.");
      }
      // Conta excluída no servidor — sai e vai para a home.
      try {
        await signOut();
      } finally {
        window.location.href = "/";
      }
    } catch (e: any) {
      setDeleteMsg({ ok: false, text: e?.message || "Não foi possível excluir a conta. Tenta novamente." });
    } finally {
      setDeleting(false);
    }
  };

  const merchant = businessCount !== null && isMerchant(businessCount);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/explorar" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Explorar
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-10 space-y-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Minha Conta</h1>
          <p className="text-sm text-gray-400 mt-2">
            A tua área pessoal — Favoritos, Coleções e dados da conta.
          </p>
        </div>

        {/* NAVEGAÇÃO DO CONSUMIDOR */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#C8A96B]">A minha área</h2>

          <Link
            href="/favoritos"
            className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 hover:border-[#C8A96B]/40 hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-sm font-semibold">❤️ Favoritos e Coleções</span>
            <span className="text-gray-500">→</span>
          </Link>

          <Link
            href="/explorar"
            className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/10 hover:border-[#C8A96B]/40 hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-sm font-semibold">🔍 Explorar</span>
            <span className="text-gray-500">→</span>
          </Link>

          {businessCount !== null &&
            (merchant ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-[#C8A96B]/30 bg-[#C8A96B]/5 hover:bg-[#C8A96B]/10 transition-colors"
              >
                <span className="text-sm font-semibold text-[#C8A96B]">🏪 Gerir minhas Montras</span>
                <span className="text-[#C8A96B]">→</span>
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] transition-colors"
              >
                <span className="text-sm font-bold">＋ Criar minha Montra — é grátis</span>
                <span>→</span>
              </Link>
            ))}
        </section>

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
            <p className="text-sm text-gray-300 mb-2">Alterar e-mail</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Novo e-mail"
                autoComplete="email"
                maxLength={120}
                className="flex-1 min-w-0 bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#C8A96B]/60 focus:outline-none"
              />
              <button
                onClick={changeEmail}
                disabled={savingEmail}
                className="px-4 py-2.5 border border-[#C8A96B]/40 text-[#C8A96B] hover:bg-[#C8A96B]/10 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {savingEmail ? "A alterar…" : "Alterar e-mail"}
              </button>
            </div>
            {emailMsg && (
              <p className={`text-xs mt-2 ${emailMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{emailMsg.text}</p>
            )}
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

        {/* ZONA DE PERIGO — exclusão de conta */}
        <section className="rounded-2xl border border-red-900/50 bg-red-950/10 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">Zona de perigo</h2>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2.5 border border-red-900 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors"
            >
              Excluir minha conta
            </button>
          ) : businessCount !== null && merchant ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                A tua conta tem {businessCount} {businessCount === 1 ? "Montra ativa" : "Montras ativas"}.
                Por segurança, não excluímos contas com negócios automaticamente.
              </p>
              <p className="text-xs text-gray-500">
                Para encerrar a conta, primeiro remove ou transfere as tuas Montras em{" "}
                <Link href="/dashboard" className="text-[#C8A96B] hover:underline">Gerir minhas Montras</Link>,
                ou fala connosco.
              </p>
              <button
                onClick={() => setShowDelete(false)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                ← Voltar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Isto apaga permanentemente a tua conta, Favoritos e Coleções. Não há como desfazer.
              </p>
              <p className="text-xs text-gray-500">
                Para confirmar, escreve o teu e-mail: <span className="text-gray-300">{email}</span>
              </p>
              <input
                type="email"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Escreve o teu e-mail para confirmar"
                autoComplete="off"
                className="w-full bg-[#0F172A] border border-red-900/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
              />
              {deleteMsg && (
                <p className={`text-xs ${deleteMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{deleteMsg.text}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  disabled={deleting}
                  className="px-4 py-2.5 border border-white/15 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={doDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2.5 bg-red-900 hover:bg-red-800 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? "A excluir…" : "Excluir permanentemente"}
                </button>
              </div>
            </div>
          )}
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
