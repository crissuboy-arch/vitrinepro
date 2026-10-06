/**
 * components/NovidadesFeed.tsx — A6.5 "Novidades na Vitrine"
 *
 * Feed público (mobile-first) de novidades reais de business_posts,
 * renderizado em /explorar.
 *
 * FILTRO (no SELECT + segunda passada pura em lib/novidades.ts):
 *   is_active=true
 *   AND (starts_at IS NULL OR starts_at <= now())
 *   AND (expires_at IS NULL OR expires_at > now())
 *   AND businesses.published=true
 * Ordenação: mais recentes primeiro.
 *
 * DEGRADAÇÃO GRACIOSA: a migration 20261006000013 pode ainda não estar
 * aplicada. Se o SELECT com as colunas novas falhar, tenta o SELECT
 * legado; se também falhar, a secção esconde-se em vez de crashar.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import {
  filterNovidadesFeed,
  isMissingColumnError,
  novidadeCtaHref,
  novidadeCtaLabel,
  novidadeTypeLabel,
  type NovidadeRow,
} from "@/lib/novidades";
import {
  trackNovidadeView,
  trackNovidadeClick,
  trackNovidadeSave,
} from "@/app/lib/analytics";

const FULL_SELECT =
  "id,business_id,type,title,content,image_url,price,starts_at,expires_at,is_active,product_id,cta_type,cta_target,created_at,businesses!inner(name,slug,published)";
const LEGACY_SELECT =
  "id,business_id,type,title,content,image_url,created_at,businesses!inner(name,slug,published)";
const FEED_LIMIT = 20;

function savedKey(id: string) {
  return `vp_novidade_saved_${id}`;
}

function NovidadeCard({ post }: { post: NovidadeRow }) {
  const cardRef = useRef<HTMLElement>(null);
  const viewedRef = useRef(false);
  const slug = post.businesses?.slug ?? null;
  const ctaHref = novidadeCtaHref(post, slug);
  // "Guardar" é estado local do dispositivo (localStorage) — sem backend,
  // sem dados inventados. Inicializador lazy: sem setState dentro de efeito.
  const [saved, setSaved] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(savedKey(post.id)) === "1";
    } catch {
      return false;
    }
  });

  // novidade_view: dispara uma vez quando o card entra no viewport.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      if (!viewedRef.current) {
        viewedRef.current = true;
        trackNovidadeView(post.business_id);
      }
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackNovidadeView(post.business_id);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.business_id]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    try {
      if (next) window.localStorage.setItem(savedKey(post.id), "1");
      else window.localStorage.removeItem(savedKey(post.id));
    } catch {
      // segue sem persistir
    }
    if (next) trackNovidadeSave(post.business_id);
  };

  return (
    <article
      ref={cardRef}
      className="snap-start shrink-0 w-[240px] md:w-[280px] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
    >
      {post.image_url ? (
        <div className="relative aspect-[4/3] bg-gray-950">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0F172A]/90 border border-[#C8A96B]/40 text-[#C8A96B] text-[10px] font-bold">
            {novidadeTypeLabel(post.type)}
          </span>
        </div>
      ) : (
        <div className="px-3 pt-3">
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#C8A96B]/40 text-[#C8A96B] text-[10px] font-bold">
            {novidadeTypeLabel(post.type)}
          </span>
        </div>
      )}

      <div className="p-3 flex flex-col gap-1.5 flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
          {post.title}
        </h4>
        <p className="text-[11px] text-gray-500 truncate">
          {post.businesses?.name ?? "Montra"}
        </p>
        {post.price !== null && post.price !== undefined && (
          <p className="text-sm font-bold text-[#C8A96B]">
            €{Number(post.price).toFixed(2)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {ctaHref ? (
            <Link
              href={ctaHref}
              onClick={() => trackNovidadeClick(post.business_id)}
              className="flex-grow text-center px-3 py-2 bg-[#C8A96B] hover:bg-[#D4BB82] text-[#0F172A] text-xs font-bold rounded-lg transition-colors"
            >
              {novidadeCtaLabel(post)}
            </Link>
          ) : slug ? (
            <Link
              href={`/vitrine/${slug}`}
              onClick={() => trackNovidadeClick(post.business_id)}
              className="flex-grow text-center px-3 py-2 border border-[#C8A96B]/50 text-[#C8A96B] hover:bg-[#C8A96B]/10 text-xs font-bold rounded-lg transition-colors"
            >
              Ver Montra
            </Link>
          ) : null}
          <button
            type="button"
            onClick={toggleSave}
            aria-pressed={saved}
            title={saved ? "Guardada" : "Guardar"}
            className={`px-2.5 py-2 rounded-lg text-xs border transition-colors ${
              saved
                ? "bg-[#C8A96B]/20 border-[#C8A96B]/50 text-[#C8A96B]"
                : "border-gray-700 text-gray-400 hover:border-[#C8A96B] hover:text-[#C8A96B]"
            }`}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NovidadesFeed() {
  // null = ainda a carregar; [] = sem dados ou funcionalidade indisponível.
  const [posts, setPosts] = useState<NovidadeRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const nowIso = new Date().toISOString();
      // NOTA: o .select() vem sempre antes dos filtros — o query builder
      // do supabase-js só expõe .eq/.or depois do select (tsc).
      const fullQuery = () =>
        supabase
          .from("business_posts")
          .select(FULL_SELECT)
          .eq("is_active", true)
          .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
          .eq("businesses.published", true)
          .order("created_at", { ascending: false })
          .limit(FEED_LIMIT);
      const legacyQuery = () =>
        supabase
          .from("business_posts")
          .select(LEGACY_SELECT)
          .eq("businesses.published", true)
          .order("created_at", { ascending: false })
          .limit(FEED_LIMIT);

      // 1. Tentativa completa (migration aplicada).
      try {
        const res = await fullQuery();
        if (res.error) throw res.error;
        if (!cancelled) setPosts(filterNovidadesFeed((res.data ?? []) as NovidadeRow[]));
        return;
      } catch (err: unknown) {
        if (!isMissingColumnError(err)) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[NOVIDADES] feed load falhou:", msg);
          if (!cancelled) setPosts([]);
          return;
        }
        // 2. Recuo legado: migration ainda não aplicada — só colunas base.
        try {
          const legacy = await legacyQuery();
          if (legacy.error) throw legacy.error;
          if (!cancelled) setPosts(filterNovidadesFeed((legacy.data ?? []) as NovidadeRow[]));
        } catch (legacyErr: unknown) {
          console.error("[NOVIDADES] feed legado falhou:", legacyErr);
          if (!cancelled) setPosts([]);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Esconde a secção enquanto carrega sem dados ou quando indisponível/vazia.
  if (!posts || posts.length === 0) return null;

  return (
    <section className="space-y-4 min-w-0" aria-label="Novidades na Vitrine">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-display font-semibold text-lg text-white">
          📰 Novidades na Vitrine
        </h3>
      </div>
      {/* Carrossel mobile-first: o scroll fica contido neste contentor
          (overflow-x-auto) — nunca gera overflow horizontal na página. */}
      <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 pb-1 w-max max-w-none">
          {posts.map((post) => (
            <NovidadeCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
