"use client";

/**
 * /gestor — Painel da Gestora de Montras.
 * A gestora (convidada por email pela proprietária) gere aqui as
 * montras que lhe foram atribuídas ou que criou: editar dados,
 * capas (URL), produtos, rascunhos de publicações, promoções e
 * publicar/despublicar montras. Sem acesso a pagamentos, contas de
 * clientes nem administração da plataforma.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Biz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_url: string | null;
  published: boolean;
  plan: string | null;
  created_at: string;
}

const inputCls =
  "w-full px-3 py-2.5 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-400 focus:border-[#C8A96B] outline-none";
const labelCls = "block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5";
const btnGold =
  "px-4 py-2.5 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-sm font-bold rounded-lg transition-colors disabled:opacity-50";
const btnGhost =
  "px-3 py-2 border border-gray-700 text-gray-200 hover:text-white hover:border-[#C8A96B]/50 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50";

export default function GestorPage() {
  const [state, setState] = useState<"loading" | "none" | "revoked" | "ready" | "notready">("loading");
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Biz>>({});
  const [createForm, setCreateForm] = useState({ name: "", category: "", city: "", description: "", whatsapp: "", phone: "", email: "" });
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", image_url: "" });
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [promoForm, setPromoForm] = useState({ title: "", price: "", original_price: "", expires_at: "" });
  const [busy, setBusy] = useState(false);

  const loadBusinesses = useCallback(async () => {
    const res = await fetch("/api/gestor/businesses");
    if (res.status === 503) {
      setState("notready");
      return;
    }
    if (res.status === 403) {
      setState("none");
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao carregar.");
    setBusinesses(data.businesses ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Aceitar o convite (se existir) com a sessão atual e carregar.
        const res = await fetch("/api/gestor/accept", { method: "POST" });
        if (res.status === 503) {
          setState("notready");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data.status === "revoked") {
          setState("revoked");
          return;
        }
        if (data.status === "none") {
          // Pode já estar ativa via chave/sessão anterior — tenta listar.
          await loadBusinesses();
          return;
        }
        await loadBusinesses();
      } catch {
        setState("none");
      }
    })();
  }, [loadBusinesses]);

  async function run(fn: () => Promise<Response>, okMsg: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A operação falhou.");
      setNotice(okMsg);
      await loadBusinesses();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "A operação falhou.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createBusiness() {
    const data = await run(
      () =>
        fetch("/api/gestor/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createForm),
        }),
      "Montra criada em rascunho. Abre-a abaixo para completar e publicar."
    );
    if (data?.business) {
      setCreateForm({ name: "", category: "", city: "", description: "", whatsapp: "", phone: "", email: "" });
      setOpenId(data.business.id);
    }
  }

  async function saveBusiness(b: Biz) {
    await run(
      () =>
        fetch(`/api/gestor/businesses/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }),
      "Alterações guardadas."
    );
    setDraft({});
  }

  async function togglePublish(b: Biz) {
    await run(
      () =>
        fetch(`/api/gestor/businesses/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !b.published }),
        }),
      b.published ? "Montra despublicada (fica em rascunho)." : "Montra publicada — já aparece no Explorar."
    );
  }

  async function addProduct(b: Biz) {
    const data = await run(
      () =>
        fetch(`/api/gestor/businesses/${b.id}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productForm.name,
            description: productForm.description || null,
            price: productForm.price ? Number(productForm.price) : null,
            image_url: productForm.image_url || null,
          }),
        }),
      "Produto adicionado."
    );
    if (data) setProductForm({ name: "", price: "", description: "", image_url: "" });
  }

  async function addPost(b: Biz) {
    const data = await run(
      () =>
        fetch(`/api/gestor/businesses/${b.id}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: postForm.title, content: postForm.content || null }),
        }),
      "Rascunho de publicação guardado (não está visível ao público)."
    );
    if (data) setPostForm({ title: "", content: "" });
  }

  async function addPromo(b: Biz) {
    const data = await run(
      () =>
        fetch(`/api/gestor/businesses/${b.id}/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: promoForm.title,
            price: promoForm.price ? Number(promoForm.price) : null,
            original_price: promoForm.original_price ? Number(promoForm.original_price) : null,
            expires_at: promoForm.expires_at || null,
          }),
        }),
      "Promoção criada na Vitrine Flash."
    );
    if (data) setPromoForm({ title: "", price: "", original_price: "", expires_at: "" });
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 bg-[#C8A96B] text-[#0F172A] text-xs rounded-full font-bold">Gestora de Montras</span>
            <Link href="/" className="text-gray-200 hover:text-white text-sm">
              Início
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel da Gestora</h1>
          <p className="text-gray-300 text-sm mt-1">
            As montras que te foram atribuídas ou que criaste. As tuas ações ficam registadas.
          </p>
        </div>

        {state === "loading" && <p className="text-gray-300">A carregar…</p>}
        {state === "notready" && (
          <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6 text-gray-200">
            O Gestor de Montras ainda está a ser ativado pela proprietária. Tenta novamente mais tarde.
          </div>
        )}
        {state === "none" && (
          <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6 text-gray-200">
            Não tens um convite ativo de Gestora de Montras para esta conta. Se foste convidada, entra com o email do
            convite; se o convite ainda não chegou, pede à proprietária que o crie no painel de administração (tab «Equipa»).
          </div>
        )}
        {state === "revoked" && (
          <div className="bg-[#0B1120] border border-red-900 rounded-2xl p-6 text-red-200">
            O teu acesso de gestora foi revogado. Fala com a proprietária se achas que é um engano.
          </div>
        )}

        {state === "ready" && (
          <>
            {error && <p className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3">{error}</p>}
            {notice && <p className="text-sm text-emerald-200 bg-emerald-950/50 border border-emerald-900 rounded-lg px-4 py-3">{notice}</p>}

            <section className="bg-[#0B1120] border border-gray-800 rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold mb-4">Criar montra (rascunho)</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome *</label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inputCls} placeholder="Nome da empresa" />
                </div>
                <div>
                  <label className={labelCls}>Categoria</label>
                  <input value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} className={inputCls} placeholder="Ex.: Beleza" />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className={inputCls} placeholder="Ex.: Águeda" />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input value={createForm.whatsapp} onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })} className={inputCls} placeholder="+351 ..." />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Descrição comercial</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} rows={3} placeholder="Texto de apresentação da empresa…" />
                </div>
              </div>
              <button onClick={createBusiness} disabled={busy || !createForm.name.trim()} className={`${btnGold} mt-4`}>
                Criar montra em rascunho
              </button>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">As minhas montras ({businesses.length})</h2>
              {businesses.length === 0 && <p className="text-gray-300 text-sm">Ainda não tens montras atribuídas. Cria a primeira acima ou pede uma atribuição à proprietária.</p>}
              {businesses.map((b) => (
                <div key={b.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setOpenId(openId === b.id ? null : b.id);
                      setDraft({});
                    }}
                    className="w-full flex flex-wrap items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-bold">{b.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${b.published ? "bg-emerald-900 text-emerald-100" : "bg-gray-800 text-gray-200"}`}>
                      {b.published ? "Publicada" : "Rascunho"}
                    </span>
                    <span className="text-xs text-gray-300">
                      {[b.category, b.city].filter(Boolean).join(" · ") || "sem categoria/cidade"}
                    </span>
                    <span className="ml-auto text-xs text-gray-300">/vitrine/{b.slug}</span>
                  </button>

                  {openId === b.id && (
                    <div className="px-6 pb-6 space-y-6 border-t border-gray-800 pt-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {(
                          [
                            ["name", "Nome"],
                            ["category", "Categoria"],
                            ["city", "Cidade"],
                            ["address", "Morada"],
                            ["phone", "Telefone"],
                            ["whatsapp", "WhatsApp"],
                            ["email", "Email"],
                            ["website", "Website"],
                            ["instagram", "Instagram"],
                            ["logo_url", "Logótipo (URL)"],
                            ["cover_url", "Capa (URL)"],
                          ] as [keyof Biz, string][]
                        ).map(([field, label]) => (
                          <div key={field}>
                            <label className={labelCls}>{label}</label>
                            <input
                              defaultValue={(b[field] as string) ?? ""}
                              onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Descrição comercial</label>
                          <textarea
                            defaultValue={b.description ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                            className={inputCls}
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => saveBusiness(b)} disabled={busy} className={btnGold}>
                          Guardar alterações
                        </button>
                        <button onClick={() => togglePublish(b)} disabled={busy} className={btnGhost}>
                          {b.published ? "Despublicar" : "Publicar montra"}
                        </button>
                        <Link href={`/vitrine/${b.slug}`} target="_blank" className="px-3 py-2 text-xs font-semibold text-[#D4BB82] hover:text-[#C8A96B] underline">
                          Ver página pública ↗
                        </Link>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-2">
                          <h3 className="text-sm font-bold">Adicionar produto</h3>
                          <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className={inputCls} placeholder="Nome *" />
                          <input value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className={inputCls} placeholder="Preço (€)" type="number" min="0" step="0.01" />
                          <input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} className={inputCls} placeholder="Imagem (URL)" />
                          <button onClick={() => addProduct(b)} disabled={busy || !productForm.name.trim()} className={btnGhost}>
                            Adicionar
                          </button>
                        </div>
                        <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-2">
                          <h3 className="text-sm font-bold">Preparar publicação (rascunho)</h3>
                          <input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} className={inputCls} placeholder="Título *" />
                          <textarea value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} className={inputCls} rows={2} placeholder="Texto…" />
                          <button onClick={() => addPost(b)} disabled={busy || !postForm.title.trim()} className={btnGhost}>
                            Guardar rascunho
                          </button>
                        </div>
                        <div className="bg-[#0F172A] border border-gray-800 rounded-xl p-4 space-y-2">
                          <h3 className="text-sm font-bold">Criar promoção (Vitrine Flash)</h3>
                          <input value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} className={inputCls} placeholder="Título *" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={promoForm.price} onChange={(e) => setPromoForm({ ...promoForm, price: e.target.value })} className={inputCls} placeholder="Preço (€)" type="number" min="0" step="0.01" />
                            <input value={promoForm.original_price} onChange={(e) => setPromoForm({ ...promoForm, original_price: e.target.value })} className={inputCls} placeholder="Preço original (€)" type="number" min="0" step="0.01" />
                          </div>
                          <input value={promoForm.expires_at} onChange={(e) => setPromoForm({ ...promoForm, expires_at: e.target.value })} className={inputCls} type="datetime-local" />
                          <button onClick={() => addPromo(b)} disabled={busy || !promoForm.title.trim()} className={btnGhost}>
                            Criar promoção
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
