"use client";

/**
 * /radar — Radar Local: centro de descoberta da VitrinePro.
 *
 * Agrega, sem duplicar dados, o que já existe na plataforma:
 *   - Promoções Vitrine Flash ativas (lib/promotions)
 *   - Pedidos de Orçamento aprovados (GET /api/quotes, Fase 2)
 *   - Novidades reais dos comerciantes (business_posts)
 *   - Negócios publicados (destaque por plano/avaliação + recentes)
 *   - Assunto do Dia aprovado (GET /api/daily-topics, quando existir)
 *
 * Público, sem login. Filtros: pesquisa, cidade, categoria.
 * Preferências de cidade/categoria guardadas no navegador
 * (localStorage) — nunca localização precisa.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { withVisibilityFallback } from "@/lib/visibility";
import { loadPromotions, filterPromotions, discountPercent, type PromotionRow } from "@/lib/promotions";
import { formatPriceEUR, postBadge } from "@/lib/feed";

interface Biz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  plan: string | null;
  rating_average: number | null;
  rating_count: number | null;
  created_at: string;
  published_at: string | null;
}

interface Post {
  id: string;
  type: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  businesses: { name: string; slug: string; city: string | null; category: string | null; whatsapp: string | null; logo_url: string | null; published: boolean } | null;
}

interface Quote {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  created_at: string;
}

interface Topic {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  city: string | null;
  category: string | null;
  is_pinned: boolean;
}

const PREFS_KEY = "vp-radar-prefs";

function track(businessId: string | undefined, event: string) {
  if (!businessId) return;
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, event }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // métricas nunca bloqueiam a navegação
  }
}

async function share(title: string, url: string) {
  const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  try {
    if (navigator.share) {
      await navigator.share({ title, url: full });
      return;
    }
    await navigator.clipboard.writeText(full);
    alert("Ligação copiada!");
  } catch {
    // utilizador cancelou a partilha
  }
}

function waLink(whatsapp: string | null): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

const planRank = (p: string | null) => (p === "business" ? 3 : p === "pro" ? 2 : 1);

export default function RadarPage() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  // Preferências guardadas localmente (cidade/categoria).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as { city?: string; category?: string };
        if (prefs.city) setCity(prefs.city);
        if (prefs.category) setCategory(prefs.category);
      }
    } catch {
      // sem prefs guardadas
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ city, category }));
    } catch {
      // armazenamento indisponível
    }
  }, [city, category]);

  useEffect(() => {
    (async () => {
      try {
        const [bizRes, promos, postsRes, catsRes, citiesRes, quotesRes, topicsRes] = await Promise.all([
          withVisibilityFallback(
            () =>
              supabase
                .from("businesses")
                .select("id, name, slug, description, category, city, logo_url, cover_url, whatsapp, plan, rating_average, rating_count, created_at, published_at")
                .eq("published", true)
                .eq("show_in_explore", true)
                .order("created_at", { ascending: false })
                .limit(120),
            () =>
              supabase
                .from("businesses")
                .select("id, name, slug, description, category, city, logo_url, cover_url, whatsapp, plan, rating_average, rating_count, created_at, published_at")
                .eq("published", true)
                .order("created_at", { ascending: false })
                .limit(120)
          ),
          loadPromotions(supabase as never).catch(() => [] as PromotionRow[]),
          supabase
            .from("business_posts")
            .select("id, type, title, content, image_url, created_at, businesses(name, slug, city, category, whatsapp, logo_url, published)")
            .eq("is_active", true)
            .neq("type", "promocao")
            .order("created_at", { ascending: false })
            .limit(60),
          supabase.from("categories").select("name").eq("is_active", true).order("name"),
          supabase.from("cities").select("name").eq("is_active", true).order("name"),
          fetch("/api/quotes").then((r) => (r.ok ? r.json() : { quotes: [] })).catch(() => ({ quotes: [] })),
          fetch("/api/daily-topics").then((r) => (r.ok ? r.json() : { topics: [] })).catch(() => ({ topics: [] })),
        ]);
        if (bizRes.data) setBusinesses(bizRes.data as Biz[]);
        setPromotions(promos);
        if (postsRes.data) {
          setPosts((postsRes.data as unknown as Post[]).filter((p) => p.businesses?.published));
        }
        if (catsRes.data) setCategories(catsRes.data.map((c) => c.name as string));
        if (citiesRes.data) setCities(citiesRes.data.map((c) => c.name as string));
        setQuotes((quotesRes.quotes ?? []) as Quote[]);
        setTopics((topicsRes.topics ?? []) as Topic[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const matchText = (hay: (string | null | undefined)[]) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return hay.some((h) => (h ?? "").toLowerCase().includes(q));
  };
  const matchCity = (c: string | null | undefined) => !city || (c ?? "") === city;
  const matchCat = (c: string | null | undefined) => !category || (c ?? "").toLowerCase().includes(category.toLowerCase());

  const visiblePromos = useMemo(
    () =>
      filterPromotions(promotions, { city: city || null, category: category || null, validity: "todas" }).filter((p) =>
        matchText([p.title, p.businesses?.name])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promotions, city, category, search]
  );

  const visiblePosts = useMemo(
    () => posts.filter((p) => matchCity(p.businesses?.city) && matchCat(p.businesses?.category) && matchText([p.title, p.content, p.businesses?.name])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, city, category, search]
  );

  const visibleQuotes = useMemo(
    () => quotes.filter((q) => matchCity(q.city) && matchCat(q.category) && matchText([q.title, q.description])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotes, city, category, search]
  );

  const visibleTopics = useMemo(
    () => topics.filter((t) => matchCity(t.city) && matchCat(t.category) && matchText([t.title, t.summary])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topics, city, category, search]
  );

  const featured = useMemo(() => {
    const list = businesses.filter((b) => matchCity(b.city) && matchCat(b.category) && matchText([b.name, b.description]));
    return [...list].sort(
      (a, b) =>
        planRank(b.plan) - planRank(a.plan) ||
        (b.rating_average ?? 0) - (a.rating_average ?? 0) ||
        +new Date(b.created_at) - +new Date(a.created_at)
    );
  }, [businesses, city, category, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = useMemo(() => featured.slice(0, 8), [featured]);

  const cardImg = "w-full h-40 object-cover bg-slate-800";

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-horizontal-transparent.png" alt="VitrinePro" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/explorar" className="text-gray-200 hover:text-white">Explorar</Link>
            <Link href="/promocoes" className="text-gray-200 hover:text-white">Promoções</Link>
            <Link href="/orcamentos" className="text-gray-200 hover:text-white">Orçamentos</Link>
            <Link href="/comunidades" className="text-gray-200 hover:text-white">Comunidades</Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-12">
        <section className="text-center space-y-3">
          <span className="inline-block px-3 py-1 bg-[#C8A96B] text-[#0F172A] text-xs font-bold rounded-full">📡 RADAR LOCAL</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">O que está a acontecer perto de ti</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Promoções ativas, novidades dos comerciantes, pedidos de orçamento e negócios novos — tudo o que se mexe na tua cidade, num só sítio.
          </p>
          <div className="max-w-xl mx-auto pt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar negócios, promoções, novidades…"
              className="w-full px-4 py-3 bg-[#0B1120] border border-gray-700 rounded-xl text-white placeholder:text-gray-400 focus:border-[#C8A96B] outline-none"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white focus:border-[#C8A96B] outline-none">
              <option value="">Todas as cidades</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-[#0B1120] border border-gray-700 rounded-lg text-sm text-white focus:border-[#C8A96B] outline-none">
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {(city || category || search) && (
              <button
                onClick={() => { setCity(""); setCategory(""); setSearch(""); }}
                className="px-3 py-2 border border-gray-700 text-gray-200 hover:text-white text-sm rounded-lg"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        {loading && <p className="text-center text-gray-300 py-16">A carregar o Radar…</p>}

        {!loading && visibleTopics.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">📰 Assunto do Dia</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTopics.map((t) => (
                <article key={t.id} className="bg-[#0B1120] border border-[#C8A96B]/40 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4BB82] uppercase tracking-wide">
                    {t.is_pinned && <span>📌 Fixado</span>}
                    {[t.city, t.category].filter(Boolean).join(" · ")}
                  </div>
                  <h3 className="font-bold text-lg leading-snug">{t.title}</h3>
                  {t.summary && <p className="text-sm text-gray-300 line-clamp-3">{t.summary}</p>}
                  {t.source_url && (
                    <a href={t.source_url} target="_blank" rel="noreferrer" className="text-xs text-[#D4BB82] hover:text-[#C8A96B] underline">
                      Fonte: {t.source_name || "ver fonte"} ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">⚡ Promoções Flash ativas</h2>
              <Link href="/promocoes" className="text-sm text-[#D4BB82] hover:text-[#C8A96B]">Ver todas →</Link>
            </div>
            {visiblePromos.length === 0 ? (
              <p className="text-gray-300 text-sm">Sem promoções ativas para estes filtros neste momento.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visiblePromos.slice(0, 8).map((p) => {
                  const biz = p.businesses;
                  const wa = waLink(biz?.whatsapp ?? null);
                  const disc = discountPercent(p.price, p.original_price);
                  return (
                    <article key={p.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.title} className={cardImg} />
                      ) : (
                        <div className={`${cardImg} flex items-center justify-center text-4xl`}>⚡</div>
                      )}
                      <div className="p-4 space-y-2 flex flex-col flex-grow">
                        {disc && <span className="self-start px-2 py-0.5 bg-[#C8A96B] text-[#0F172A] text-[11px] font-bold rounded-full">-{disc}%</span>}
                        <h3 className="font-bold leading-snug">{p.title}</h3>
                        <p className="text-xs text-gray-300">{biz?.name} · {biz?.city}</p>
                        <div className="text-sm">
                          {formatPriceEUR(p.price) && <span className="font-bold text-[#D4BB82]">{formatPriceEUR(p.price)}</span>}
                          {formatPriceEUR(p.original_price) && <span className="text-gray-400 line-through ml-2">{formatPriceEUR(p.original_price)}</span>}
                        </div>
                        <div className="mt-auto flex gap-2 pt-2">
                          {biz?.slug && (
                            <Link
                              href={`/vitrine/${biz.slug}`}
                              onClick={() => track(p.business_id, "promotion_click")}
                              className="flex-grow text-center px-3 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg"
                            >
                              Ver montra
                            </Link>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" onClick={() => track(p.business_id, "whatsapp_click")} className="px-3 py-2 border border-gray-700 rounded-lg text-xs" aria-label="WhatsApp">
                              💬
                            </a>
                          )}
                          <button onClick={() => share(p.title, biz?.slug ? `/vitrine/${biz.slug}` : "/promocoes")} className="px-3 py-2 border border-gray-700 rounded-lg text-xs" aria-label="Partilhar">
                            ↗
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!loading && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">🧾 Pedidos de Orçamento aprovados</h2>
              <Link href="/orcamentos" className="text-sm text-[#D4BB82] hover:text-[#C8A96B]">Ver todos →</Link>
            </div>
            {visibleQuotes.length === 0 ? (
              <p className="text-gray-300 text-sm">Sem pedidos aprovados para estes filtros. <Link href="/pedir-orcamento" className="text-[#D4BB82] underline">Publica o teu pedido</Link>.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleQuotes.slice(0, 6).map((q) => (
                  <Link key={q.id} href="/orcamentos" className="bg-[#0B1120] border border-gray-800 hover:border-[#C8A96B]/50 rounded-2xl p-5 space-y-2 transition-colors">
                    <div className="text-[11px] font-bold text-[#D4BB82] uppercase tracking-wide">{[q.category, q.city].filter(Boolean).join(" · ")}</div>
                    <h3 className="font-bold leading-snug">{q.title || "Pedido de orçamento"}</h3>
                    {q.description && <p className="text-sm text-gray-300 line-clamp-2">{q.description}</p>}
                    <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString("pt-PT")}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">📣 Novidades dos comerciantes</h2>
            {visiblePosts.length === 0 ? (
              <p className="text-gray-300 text-sm">Sem novidades para estes filtros neste momento.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visiblePosts.slice(0, 6).map((p) => (
                  <article key={p.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.title} className={cardImg} />
                    )}
                    <div className="p-4 space-y-2 flex flex-col flex-grow">
                      <span className="self-start px-2 py-0.5 bg-white/10 text-[11px] font-bold rounded-full">{postBadge(p.type)}</span>
                      <h3 className="font-bold leading-snug">{p.title}</h3>
                      {p.content && <p className="text-sm text-gray-300 line-clamp-2">{p.content}</p>}
                      <p className="text-xs text-gray-400">{p.businesses?.name} · {p.businesses?.city}</p>
                      {p.businesses?.slug && (
                        <Link href={`/vitrine/${p.businesses.slug}`} className="mt-auto text-sm text-[#D4BB82] hover:text-[#C8A96B] font-semibold pt-1">
                          Ver montra →
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-4">🏆 Negócios em destaque e recentes</h2>
            {recent.length === 0 ? (
              <p className="text-gray-300 text-sm">Sem negócios para estes filtros.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recent.map((b) => {
                  const wa = waLink(b.whatsapp);
                  return (
                    <article key={b.id} className="bg-[#0B1120] border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                      {b.cover_url || b.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url || b.logo_url || ""} alt={b.name} className={cardImg} />
                      ) : (
                        <div className={`${cardImg} flex items-center justify-center text-4xl`}>🏪</div>
                      )}
                      <div className="p-4 space-y-2 flex flex-col flex-grow">
                        <h3 className="font-bold leading-snug">{b.name}</h3>
                        <p className="text-xs text-gray-300">{[b.category, b.city].filter(Boolean).join(" · ")}</p>
                        {b.rating_average ? (
                          <p className="text-xs text-[#D4BB82]">★ {b.rating_average.toFixed(1)} ({b.rating_count ?? 0})</p>
                        ) : null}
                        <div className="mt-auto flex gap-2 pt-2">
                          <Link
                            href={`/vitrine/${b.slug}`}
                            onClick={() => track(b.id, "business_result_click")}
                            className="flex-grow text-center px-3 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg"
                          >
                            Ver montra
                          </Link>
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" onClick={() => track(b.id, "whatsapp_click")} className="px-3 py-2 border border-gray-700 rounded-lg text-xs" aria-label="WhatsApp">
                              💬
                            </a>
                          )}
                          <button onClick={() => share(b.name, `/vitrine/${b.slug}`)} className="px-3 py-2 border border-gray-700 rounded-lg text-xs" aria-label="Partilhar">
                            ↗
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-400 text-xs">
        Radar Local · VitrinePro — descoberta de negócios locais em Portugal
      </footer>
    </div>
  );
}
