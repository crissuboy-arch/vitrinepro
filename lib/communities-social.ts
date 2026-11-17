/**
 * lib/communities-social.ts — Comunidades sociais (camada social).
 *
 * Distinto de lib/communities.ts (países de origem do Explorar).
 * Aqui: sessão, nome público seguro e verificações de adesão.
 *
 * Privacidade: o nome público vem dos metadados do utilizador
 * (name/full_name) ou cai para "Membro VitrinePro". Emails e
 * telefones NUNCA são lidos para apresentação nem expostos.
 */
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/admin-auth";
import { isMissingTableError } from "@/lib/gestor-auth";

export { isMissingTableError };

export function communitiesNotReadyResponse() {
  return NextResponse.json(
    { error: "Comunidades ainda não estão ativas. Aplica primeiro a migration 20261117000027." },
    { status: 503 }
  );
}

export interface SessionUser {
  id: string;
  displayName: string;
}

/** Utilizador autenticado (sessão cookie) + nome público seguro. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const raw = typeof meta.name === "string" ? meta.name : typeof meta.full_name === "string" ? meta.full_name : "";
    const displayName = raw.trim().slice(0, 60) || "Membro VitrinePro";
    return { id: user.id, displayName };
  } catch {
    return null;
  }
}

type Svc = NonNullable<ReturnType<typeof getServiceClient>>;
export function svc(): Svc | null {
  return getServiceClient();
}

export async function getCommunityBySlug(client: Svc, slug: string) {
  const { data, error } = await client
    .from("social_communities")
    .select("id, slug, name, icon, color, description, is_active, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function isMember(client: Svc, communityId: string, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Contagens públicas de uma comunidade (membros + publicações visíveis). */
export async function communityCounts(client: Svc, communityId: string): Promise<{ members: number; posts: number }> {
  const [m, p] = await Promise.all([
    client.from("community_members").select("user_id", { count: "exact", head: true }).eq("community_id", communityId),
    client
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityId)
      .eq("status", "visible"),
  ]);
  return { members: m.count ?? 0, posts: p.count ?? 0 };
}

/** Controlo de spam simples: limites de tamanho e ritmo por utilizador. */
export const COMMUNITY_LIMITS = {
  postMaxChars: 2000,
  commentMaxChars: 1000,
  minSecondsBetweenPosts: 20,
};

export async function lastPostAt(client: Svc, userId: string): Promise<Date | null> {
  const { data } = await client
    .from("community_posts")
    .select("created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? new Date(data.created_at as string) : null;
}
