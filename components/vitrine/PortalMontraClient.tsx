"use client";
/**
 * components/vitrine/PortalMontraClient.tsx — montra multiloja do Portal
 * de Ofertas. Identidade própria (preto + laranja), distinta das montras
 * de serviços/produtos digitais.
 *
 * Os produtos vêm do feed do Portal (fonte principal). Cliques em
 * produtos de afiliado vão DIRETO para a loja (link verbatim do feed,
 * rel="sponsored") — nunca passam pelo checkout da VitrinePro.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { PortalProduct } from "@/lib/portal";

interface Props {
  business: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    city: string | null;
  };
  products: PortalProduct[];
  categories: string[];
  portalUrl: string;
  integrationEnabled: boolean;
}

function track(businessId: string, eventType: string) {
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, event_type: eventType }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // métricas nunca bloqueiam
  }
}

function fmtPrice(v: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} €`;
  }
}

function ProductCard({ p, businessId }: { p: PortalProduct; businessId: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10">
      <div className="relative aspect-[4/3] bg-zinc-800">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-zinc-800 to-black px-4 text-center">
            <span className="text-3xl font-black text-orange-500">%</span>
            <span className="line-clamp-2 text-xs font-medium text-zinc-400">{p.category}</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {p.dealOfDay && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-black">Oferta do dia</span>
          )}
          {p.featured && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-black">Destaque</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
          {p.store.label}
          {p.kind === "afiliado" ? " · afiliado" : ""}
        </span>
        <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-white">{p.name}</h3>
        {p.promoPrice != null ? (
          <p className="text-base font-bold text-orange-400">
            {fmtPrice(p.promoPrice, p.currency)}{" "}
            {p.price != null && <span className="text-sm font-normal text-zinc-500 line-through">{fmtPrice(p.price, p.currency)}</span>}
          </p>
        ) : p.price != null ? (
          <p className="text-base font-bold text-orange-400">{fmtPrice(p.price, p.currency)}</p>
        ) : (
          <p className="text-xs text-zinc-500">Preço e disponibilidade na loja</p>
        )}
        <a
          href={p.buyUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => track(businessId, "portal_product_click")}
          className="mt-auto inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400"
        >
          Ver oferta
        </a>
      </div>
    </article>
  );
}

export default function PortalMontraClient({ business, products, categories, portalUrl, integrationEnabled }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    track(business.id, "portal_montra_view");
  }, [business.id]);

  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 8), [products]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "Todas" && p.category !== category) return false;
      if (q && !`${p.name} ${p.category} ${p.store.label}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, category]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Capa */}
      <header className="relative overflow-hidden">
        {business.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/40 via-black to-black" />
        )}
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 md:py-16">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoUrl} alt={business.name} className="h-14 w-14 rounded-2xl bg-white object-contain p-1" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-black">P</span>
            )}
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Portal de <span className="text-orange-500">Ofertas</span>
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
            {business.description ||
              "As melhores ofertas de várias lojas num só lugar, atualizadas todos os dias."}
          </p>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(business.id, "portal_external_click")}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
          >
            Explorar todas as ofertas ↗
          </a>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Esta montra contém links de afiliados: ao comprar através deles, podemos receber uma comissão
            sem qualquer custo extra para si. Os preços e a disponibilidade são confirmados na loja de origem.
          </p>
        </div>
      </header>

      {!integrationEnabled ? (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-lg font-semibold">As ofertas estão a ser preparadas.</p>
          <p className="mt-2 text-sm text-zinc-400">Volte em breve — a seleção é atualizada todos os dias no Portal.</p>
        </section>
      ) : (
        <>
          {/* Destaques */}
          {featured.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-10">
              <h2 className="mb-4 text-xl font-bold">Em destaque</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
                {featured.map((p) => (
                  <div key={p.externalId} className="w-64 shrink-0">
                    <ProductCard p={p} businessId={business.id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pesquisa + categorias */}
          <section className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold">Todas as ofertas</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar ofertas…"
                className="w-full max-w-sm rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-orange-500"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Todas", ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    category === c ? "bg-orange-500 text-black" : "bg-zinc-900 text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-800"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-400">Sem ofertas para esta pesquisa.</p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((p) => (
                  <ProductCard key={p.externalId} p={p} businessId={business.id} />
                ))}
              </div>
            )}
            <p className="mt-8 text-center text-xs text-zinc-500">
              {products.length} ofertas sincronizadas do Portal de Ofertas · a compra conclui-se sempre na loja de origem.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
