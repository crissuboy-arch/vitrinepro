/* eslint-disable */
/**
 * app/components/FeedCards.tsx — Cards do feed visual do /explorar
 *
 * Princípio: IMAGEM NATURAL como protagonista. Nada de janelas de altura
 * fixa (96×96, 140px, 4:3) nem object-cover forçado sobre proporção errada.
 *
 * FeedImage: o container recebe o aspect-ratio REAL da imagem (medido no
 * onLoadingComplete; default 4/5 até medir). Com o container no ratio certo,
 * o `fill` + `object-cover` NÃO corta nada — só preenche. Sem CLS grave:
 * o ratio default evita shift total e a correção é pontual por imagem.
 *
 * O enquadramento manual da Montra (ImageFramingEditor, x/y/zoom) NÃO é
 * aplicado aqui — no Explorar a imagem é natural. Na Montra continua igual.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SaveToCollection from "./SaveToCollection";
import { formatPriceEUR, postBadge } from "@/lib/feed";
import { novidadeCtaHref, novidadeCtaLabel } from "@/lib/novidades";

/** sizes para o feed masonry: 2 col mobile, 3 tablet, 4 desktop */
const FEED_SIZES = "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw";

export function FeedImage({
  src,
  alt,
  sizes = FEED_SIZES,
  eager = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  eager?: boolean;
}) {
  // Ratio default 4/5 até medir o natural — evita CLS total; corrige depois.
  const [ratio, setRatio] = useState("4 / 5");
  return (
    <div className="relative w-full overflow-hidden bg-slate-900" style={{ aspectRatio: ratio }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : undefined}
        priority={eager}
        className="object-cover"
        onLoadingComplete={(img) => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
          }
        }}
      />
    </div>
  );
}

function SaveButton({ productId, businessId }: { productId?: string; businessId?: string }) {
  return (
    <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
      <SaveToCollection
        itemRef={productId ? { productId } : { businessId }}
        loginNext="/explorar"
        label="♡"
      />
    </div>
  );
}

/** Card de PRODUTO: [imagem natural] nome, preço, montra, ♡ */
export function FeedProductCard({ item, eager = false }: { item: any; eager?: boolean }) {
  const p = item.data;
  const biz = item.business;
  const price = formatPriceEUR(p.price);
  return (
    <div className="relative break-inside-avoid rounded-2xl overflow-hidden bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 transition-colors">
      <Link href={`/vitrine/${biz?.slug || ""}`} className="block">
        {p.image_url ? (
          <FeedImage src={p.image_url} alt={p.name} eager={eager} />
        ) : (
          <div className="w-full aspect-[4/5] bg-slate-900 flex items-center justify-center text-4xl">🛍️</div>
        )}
        <div className="p-3">
          <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{p.name}</h4>
          {price && <p className="text-[#C8A96B] font-bold text-sm mt-1">{price}</p>}
          {biz?.name && <p className="text-slate-400 text-xs mt-1 truncate">{biz.name}</p>}
        </div>
      </Link>
      <SaveButton productId={p.id} />
    </div>
  );
}

/** Card de NEGÓCIO: [cover natural] nome, categoria/localidade */
export function FeedBusinessCard({ item, eager = false }: { item: any; eager?: boolean }) {
  const b = item.data;
  const meta = [b.category, b.city].filter(Boolean).join(" • ");
  return (
    <div className="relative break-inside-avoid rounded-2xl overflow-hidden bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 transition-colors">
      <Link href={`/vitrine/${b.slug}`} className="block">
        {b.cover ? (
          <FeedImage src={b.cover} alt={`Capa de ${b.name}`} eager={eager} />
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-4xl">
            {b.logo && !String(b.logo).startsWith("http") ? b.logo : "🏪"}
          </div>
        )}
        <div className="p-3">
          <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{b.name}</h4>
          {meta && <p className="text-slate-400 text-xs mt-1 truncate">{meta}</p>}
        </div>
      </Link>
      <SaveButton businessId={b.id} />
    </div>
  );
}

/** Card de NOVIDADE: badge + [imagem natural] título, preço, montra, CTA discreto */
export function FeedPostCard({ item, eager = false }: { item: any; eager?: boolean }) {
  const post = item.data;
  const biz = item.business;
  const price = formatPriceEUR(post.price);
  const href = novidadeCtaHref(post, biz?.slug) || (biz?.slug ? `/vitrine/${biz.slug}` : "/explorar");
  const ctaLabel = (() => {
    try {
      return novidadeCtaLabel(post);
    } catch {
      return "Ver Montra";
    }
  })();
  const inner = (
    <>
      {post.image_url ? (
        <FeedImage src={post.image_url} alt={post.title} eager={eager} />
      ) : (
        <div className="w-full aspect-[4/5] bg-slate-900 flex items-center justify-center text-4xl">✨</div>
      )}
      <div className="p-3">
        <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#C8A96B]/15 border border-[#C8A96B]/30 text-[#C8A96B] uppercase tracking-wider">
          {postBadge(post.type)}
        </span>
        <h4 className="font-bold text-white text-sm leading-tight line-clamp-2 mt-2">{post.title}</h4>
        {price && <p className="text-[#C8A96B] font-bold text-sm mt-1">{price}</p>}
        {biz?.name && <p className="text-slate-400 text-xs mt-1 truncate">{biz.name}</p>}
        <span className="inline-block mt-2 text-xs font-semibold text-[#C8A96B]">→ {ctaLabel}</span>
      </div>
    </>
  );
  return (
    <div className="relative break-inside-avoid rounded-2xl overflow-hidden bg-[#0F172A]/40 border border-gray-800 hover:border-[#C8A96B]/50 transition-colors">
      <Link href={href} className="block">
        {inner}
      </Link>
    </div>
  );
}

/** Dispatcher: escolhe o card pelo tipo do item */
export function FeedCard({ item, eager = false }: { item: any; eager?: boolean }) {
  if (item.kind === "product") return <FeedProductCard item={item} eager={eager} />;
  if (item.kind === "post") return <FeedPostCard item={item} eager={eager} />;
  return <FeedBusinessCard item={item} eager={eager} />;
}
