"use client";
/**
 * components/home/OfertasDestaque.tsx — secção "Ofertas em destaque"
 * da homepage: carrossel misto e justo com produtos reais do Portal de
 * Ofertas e promoções Flash ativas dos comerciantes da VitrinePro.
 *
 * - Reprodução automática suave (5s) com pausa em hover/toque/foco.
 * - Navegação manual (setas + pontos).
 * - Produtos de afiliado abrem a loja de origem (nova aba no desktop,
 *   rel="sponsored"); nunca passam pelo checkout da VitrinePro.
 * - Sem itens reais, a secção não renderiza (nada fictício).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface PortalItem {
  source: "portal";
  product: {
    externalId: string;
    name: string;
    category: string;
    imageUrl: string | null;
    store: { label: string; affiliate: boolean };
    kind: "afiliado" | "proprio";
    price: number | null;
    promoPrice: number | null;
    currency: string;
    buyUrl: string;
    featured: boolean;
    dealOfDay: boolean;
  };
}
interface PromoItem {
  source: "vitrine";
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  businessName: string | null;
  businessSlug: string | null;
  businessId: string | null;
}
type Item = PortalItem | PromoItem;

function track(businessId: string | null, eventType: string) {
  if (!businessId) return;
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

function eur(v: number) {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export default function OfertasDestaque() {
  const [items, setItems] = useState<Item[]>([]);
  const [portal, setPortal] = useState<{ businessId: string; businessSlug: string; portalUrl: string } | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/portal/highlights")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!alive) return;
        setItems(Array.isArray(d.items) ? d.items : []);
        setPortal(d.portal ?? null);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const perView = 4;
  const pages = Math.max(1, Math.ceil(items.length / perView));
  const goTo = useCallback(
    (p: number) => {
      const next = ((p % pages) + pages) % pages;
      setIndex(next);
      trackRef.current?.scrollTo({ left: next * (trackRef.current.clientWidth || 0), behavior: "smooth" });
    },
    [pages],
  );

  useEffect(() => {
    if (paused || items.length <= perView) return;
    const t = setInterval(() => goTo(index + 1), 5000);
    return () => clearInterval(t);
  }, [paused, index, items.length, goTo]);

  if (items.length === 0) return null;

  return (
    <section
      className="relative z-10 border-b border-white/5 bg-[#0A0D14] py-16 md:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Ofertas em destaque"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Ofertas em <span className="text-orange-500">destaque</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Do Portal de Ofertas e dos comerciantes da VitrinePro, atualizadas todos os dias.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Ofertas anteriores"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              ←
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Ofertas seguintes"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              →
            </button>
          </div>
        </div>

        <div ref={trackRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) =>
            item.source === "portal" ? (
              <article
                key={item.product.externalId}
                className="flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 md:w-[calc(25%-12px)]"
              >
                <div className="relative aspect-[4/3] bg-zinc-800">
                  {item.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                      <span className="text-3xl font-black text-orange-500">%</span>
                    </div>
                  )}
                  {item.product.dealOfDay && (
                    <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-black">
                      Oferta do dia
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                    {item.product.store.label}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.product.name}</h3>
                  {item.product.promoPrice != null ? (
                    <p className="text-sm font-bold text-orange-400">{eur(item.product.promoPrice)}</p>
                  ) : item.product.price != null ? (
                    <p className="text-sm font-bold text-orange-400">{eur(item.product.price)}</p>
                  ) : (
                    <p className="text-xs text-zinc-500">Preço na loja</p>
                  )}
                  <a
                    href={item.product.buyUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    onClick={() => track(portal?.businessId ?? null, "portal_product_click")}
                    className="mt-auto inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-orange-400"
                  >
                    Ver oferta
                  </a>
                </div>
              </article>
            ) : (
              <article
                key={item.id}
                className="flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 md:w-[calc(25%-12px)]"
              >
                <div className="relative aspect-[4/3] bg-zinc-800">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#103B78] to-black">
                      <span className="text-3xl font-black text-[#D4AF37]">%</span>
                    </div>
                  )}
                  {item.discount != null && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[11px] font-bold text-black">
                      −{item.discount}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                    {item.businessName || "VitrinePro"}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.title}</h3>
                  {item.price != null ? (
                    <p className="text-sm font-bold text-[#D4AF37]">
                      {eur(item.price)}{" "}
                      {item.originalPrice != null && (
                        <span className="font-normal text-zinc-500 line-through">{eur(item.originalPrice)}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">Ver condições na montra</p>
                  )}
                  {item.businessSlug ? (
                    <Link
                      href={`/vitrine/${item.businessSlug}`}
                      onClick={() => track(item.businessId, "promotion_click")}
                      className="mt-auto inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
                    >
                      Ver oferta
                    </Link>
                  ) : (
                    <span className="mt-auto inline-flex items-center justify-center rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-zinc-500">
                      Ver oferta
                    </span>
                  )}
                </div>
              </article>
            ),
          )}
        </div>

        {pages > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: pages }).map((_, p) => (
              <button
                key={p}
                onClick={() => goTo(p)}
                aria-label={`Página ${p + 1} de ofertas`}
                className={`h-2 rounded-full transition-all ${p === index ? "w-6 bg-orange-500" : "w-2 bg-white/20"}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            Algumas ofertas contêm links de afiliados — podemos receber uma comissão sem custo extra para si.
            Cliques não são vendas confirmadas.
          </p>
          {portal ? (
            <a
              href={portal.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(portal.businessId, "portal_external_click")}
              className="text-sm font-bold text-orange-400 hover:text-orange-300"
            >
              Explorar todas as ofertas no Portal ↗
            </a>
          ) : (
            <Link href="/promocoes" className="text-sm font-bold text-orange-400 hover:text-orange-300">
              Ver todas as promoções →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
