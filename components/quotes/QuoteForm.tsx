/**
 * components/quotes/QuoteForm.tsx — Fase 2.
 * Formulário público de pedido de orçamento (SEM conta).
 *
 * - Categorias e cidades vêm das tabelas reais (categories/cities).
 * - Honeypot invisível ("website") contra bots — a API também valida.
 * - Consentimento RGPD obrigatório, com link para a política atual.
 * - No sucesso, mostra UMA vez o link privado de acompanhamento
 *   (o token nunca fica guardado do nosso lado em claro).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

interface Option {
  name: string;
}

export default function QuoteForm() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [form, setForm] = useState({
    category: "",
    city: "",
    title: "",
    description: "",
    name: "",
    email: "",
    phone: "",
    consent: false,
    website: "", // honeypot
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    (async () => {
      const [catRes, cityRes] = await Promise.all([
        supabase.from("categories").select("name").eq("is_active", true).order("order_index").order("name"),
        supabase.from("cities").select("name").eq("is_active", true).order("order_index").order("name"),
      ]);
      if (catRes.data) setCategories(catRes.data as Option[]);
      if (cityRes.data) setCities(cityRes.data as Option[]);
    })();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrors([]);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.ready === false) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Não foi possível registar o pedido.");
        if (Array.isArray(data.errors)) setErrors(data.errors);
        return;
      }
      if (data.trackingUrl) {
        setTrackingUrl(data.trackingUrl as string);
      } else {
        setError("Resposta inesperada do servidor. Tenta novamente.");
      }
    } catch {
      setError("Falha de ligação. Verifica a internet e tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-400 focus:border-[#C8A96B] outline-none";
  const labelClass = "block text-xs font-bold text-gray-300 mb-1.5";

  if (unavailable) {
    return (
      <div className="bg-[#0F172A] border border-gray-800 rounded-2xl p-6 text-center space-y-2">
        <p className="text-2xl">🛠️</p>
        <h3 className="font-display font-semibold text-[#F5F0E8]">Pedidos de orçamento a chegar</h3>
        <p className="text-sm text-[#A9B1C3] font-light">
          Esta funcionalidade está a ser ativada. Volta dentro de dias — ou fala já com os negócios no{" "}
          <Link href="/explorar" className="text-[#C8A96B] hover:underline">Explorar</Link>.
        </p>
      </div>
    );
  }

  if (trackingUrl) {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${trackingUrl}` : trackingUrl;
    return (
      <div className="bg-[#0F172A] border border-[#C8A96B]/40 rounded-2xl p-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-3xl">✅</p>
          <h3 className="font-display font-semibold text-[#F5F0E8] text-lg">Pedido recebido!</h3>
          <p className="text-sm text-[#A9B1C3] font-light">
            O teu pedido vai ser revisto pela nossa equipa antes de ficar visível para os profissionais.
            Guarda este link privado para acompanhares as respostas:
          </p>
        </div>
        <div className="flex gap-2">
          <input readOnly value={fullUrl} className={`${inputClass} text-xs`} onFocus={(e) => e.target.select()} />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(fullUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {}
            }}
            className="px-4 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg whitespace-nowrap transition-colors"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
        <p className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          ⚠️ Este link é a única forma de acompanhares o pedido e veres quem respondeu — não o partilhes.
          Os teus contactos nunca aparecem publicamente: só são mostrados a um profissional se ACEITARES o interesse dele.
        </p>
        <div className="text-center">
          <Link href="/orcamentos" className="text-sm text-[#C8A96B] hover:underline">Ver pedidos publicados →</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-[#0F172A] border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="q-category">Categoria do serviço *</label>
          <select id="q-category" required value={form.category} onChange={set("category")} className={inputClass}>
            <option value="">Escolher…</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="q-city">Cidade *</label>
          <select id="q-city" required value={form.city} onChange={set("city")} className={inputClass}>
            <option value="">Escolher…</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="q-title">O que precisas? *</label>
        <input id="q-title" required minLength={5} maxLength={120} value={form.title} onChange={set("title")} placeholder="Ex.: Preciso de um canalizador para uma fuga na cozinha" className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="q-description">Descreve o pedido *</label>
        <textarea id="q-description" required minLength={20} maxLength={2000} rows={4} value={form.description} onChange={set("description")} placeholder="Detalhes úteis: o que é, quando precisas, tamanho/quantidade, preferências…" className={inputClass} />
        <p className="text-[11px] text-gray-400 mt-1">Não incluas dados pessoais na descrição — ela fica visível para os profissionais depois da moderação.</p>
      </div>

      <div className="border-t border-gray-800 pt-4 space-y-4">
        <p className="text-xs font-bold text-gray-300">Os teus contactos <span className="font-normal text-gray-400">(nunca públicos — ver nota abaixo)</span></p>
        <div>
          <label className={labelClass} htmlFor="q-name">Nome *</label>
          <input id="q-name" required minLength={2} maxLength={80} value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="q-email">Email</label>
            <input id="q-email" type="email" maxLength={120} value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
          </div>
          <div>
            <label className={labelClass} htmlFor="q-phone">Telefone / WhatsApp</label>
            <input id="q-phone" type="tel" maxLength={20} value={form.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" />
          </div>
        </div>
        <p className="text-[11px] text-gray-400">Indica pelo menos um contacto. Ele só é mostrado a um profissional se aceitares o interesse dele na tua página de acompanhamento.</p>
      </div>

      {/* Honeypot anti-spam: invisível para humanos. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed cursor-pointer">
        <input type="checkbox" required checked={form.consent} onChange={set("consent")} className="mt-0.5 accent-[#C8A96B]" />
        <span>
          Aceito que os dados deste pedido sejam tratados para o pôr em contacto com profissionais,
          conforme a <Link href="/politica-privacidade" className="text-[#C8A96B] hover:underline" target="_blank">Política de Privacidade</Link>.
          O pedido é revisto antes de publicado e expira ao fim de 30 dias. *
        </span>
      </label>

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
      {errors.length > 1 && (
        <ul className="text-xs text-red-300/80 list-disc pl-5 space-y-0.5">
          {errors.map((e) => (<li key={e}>{e}</li>))}
        </ul>
      )}

      <button type="submit" disabled={submitting} className="w-full py-3 bg-[#C8A96B] hover:bg-[#D4BB82] disabled:opacity-50 text-[#0F172A] text-sm font-bold rounded-lg transition-colors">
        {submitting ? "A enviar…" : "Publicar pedido (grátis)"}
      </button>
      <p className="text-[11px] text-gray-400 text-center">Sem conta e sem custos. O pedido só fica visível depois de aprovado pela nossa equipa.</p>
    </form>
  );
}
