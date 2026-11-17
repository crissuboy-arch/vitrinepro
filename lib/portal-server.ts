/**
 * lib/portal-server.ts — Integração Portal de Ofertas (só servidor).
 *
 * Lê portal_settings / portal_sync_runs com service role e degrada com
 * elegância enquanto a migration 20261117000029 não for aplicada
 * (ready:false — nada público muda).
 */
import { getServiceClient } from "@/lib/admin-auth";
import { fetchPortalFeed, type PortalFeedResult } from "@/lib/portal";

export interface PortalSettings {
  enabled: boolean;
  categories: string[];
  featuredIds: string[];
  portalUrl: string;
  updatedAt: string | null;
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  enabled: false,
  categories: [],
  featuredIds: [],
  portalUrl: "https://portal-de-ofertapt.vercel.app",
  updatedAt: null,
};

export function isPortalTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = (error.message || "").toLowerCase();
  return (
    (msg.includes("portal_settings") || msg.includes("portal_sync_runs") || msg.includes("business_kind")) &&
    (msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("not found"))
  );
}

export async function getPortalSettings(): Promise<{ ready: boolean; settings: PortalSettings }> {
  const svc = getServiceClient();
  if (!svc) return { ready: false, settings: DEFAULT_PORTAL_SETTINGS };
  const { data, error } = await svc.from("portal_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return { ready: false, settings: DEFAULT_PORTAL_SETTINGS };
  return {
    ready: true,
    settings: {
      enabled: data.enabled === true,
      categories: Array.isArray(data.categories) ? data.categories : [],
      featuredIds: Array.isArray(data.featured_ids) ? data.featured_ids : [],
      portalUrl: typeof data.portal_url === "string" && data.portal_url ? data.portal_url : DEFAULT_PORTAL_SETTINGS.portalUrl,
      updatedAt: data.updated_at ?? null,
    },
  };
}

export interface PortalBusiness {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  published: boolean;
  userId: string;
}

/** A montra multiloja do Portal (a primeira com business_kind próprio). */
export async function getPortalBusiness(): Promise<PortalBusiness | null> {
  const svc = getServiceClient();
  if (!svc) return null;
  const { data, error } = await svc
    .from("businesses")
    .select("id, slug, name, description, logo_url, cover_url, published, is_published, user_id")
    .eq("business_kind", "multiloja_afiliados")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    logoUrl: data.logo_url,
    coverUrl: data.cover_url,
    published: data.published === true || data.is_published === true,
    userId: data.user_id,
  };
}

export interface PortalSyncRun {
  id: string;
  status: string;
  total: number | null;
  destaques: number | null;
  error: string | null;
  sourceUrl: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export async function getLatestSyncRun(): Promise<PortalSyncRun | null> {
  const svc = getServiceClient();
  if (!svc) return null;
  const { data, error } = await svc
    .from("portal_sync_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    status: data.status,
    total: data.total,
    destaques: data.destaques,
    error: data.error,
    sourceUrl: data.source_url,
    createdAt: data.created_at,
    finishedAt: data.finished_at,
  };
}

/** Executa uma sincronização: lê o feed, valida e regista a corrida. */
export async function runPortalSync(): Promise<{ run: PortalSyncRun | null; feed: PortalFeedResult }> {
  const feed = await fetchPortalFeed();
  const svc = getServiceClient();
  if (!svc) return { run: null, feed };
  const { data } = await svc
    .from("portal_sync_runs")
    .insert({
      status: feed.error ? "erro" : "ok",
      source_url: process.env.PORTAL_FEED_URL || "https://portal-de-ofertapt.vercel.app/produtos.json",
      total: feed.error ? null : feed.products.length,
      destaques: feed.error ? null : feed.products.filter((p) => p.featured).length,
      error: feed.error,
      finished_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (!data) return { run: null, feed };
  return {
    run: {
      id: data.id,
      status: data.status,
      total: data.total,
      destaques: data.destaques,
      error: data.error,
      sourceUrl: data.source_url,
      createdAt: data.created_at,
      finishedAt: data.finished_at,
    },
    feed,
  };
}
