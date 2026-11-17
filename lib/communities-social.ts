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

/* ── Rede social (030): perfis, notificações, respostas ───────────── */

export interface CommunityProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
}

export const PROFILE_LIMITS = { displayName: 60, bio: 280, city: 60 };

/** Valida/normaliza o input do perfil. Devolve erro ou o perfil limpo. */
export function validateProfileInput(
  body: Record<string, unknown>,
  fallbackName: string,
): { ok: true; value: { displayName: string; avatarUrl: string | null; bio: string | null; city: string | null } } | { ok: false; error: string } {
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const displayName = clean(body.display_name, PROFILE_LIMITS.displayName) || fallbackName;
  const bio = clean(body.bio, PROFILE_LIMITS.bio) || null;
  const city = clean(body.city, PROFILE_LIMITS.city) || null;
  let avatarUrl: string | null = null;
  if (typeof body.avatar_url === "string" && body.avatar_url.trim()) {
    const u = body.avatar_url.trim();
    if (!/^https:\/\//.test(u) || u.length > 500) return { ok: false, error: "Fotografia inválida." };
    avatarUrl = u;
  }
  return { ok: true, value: { displayName, avatarUrl, bio, city } };
}

export async function getProfile(client: Svc, userId: string): Promise<CommunityProfile | null> {
  const { data, error } = await client
    .from("community_profiles")
    .select("user_id, display_name, avatar_url, bio, city")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return { userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url, bio: data.bio, city: data.city };
}

/** Perfis de vários utilizadores de uma vez (avatares do feed/membros). */
export async function getProfilesMap(client: Svc, userIds: string[]): Promise<Map<string, CommunityProfile>> {
  const map = new Map<string, CommunityProfile>();
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return map;
  const { data, error } = await client
    .from("community_profiles")
    .select("user_id, display_name, avatar_url, bio, city")
    .in("user_id", unique);
  if (error) {
    if (isMissingTableError(error)) return map;
    throw error;
  }
  for (const row of data ?? []) {
    map.set(row.user_id, { userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_url, bio: row.bio, city: row.city });
  }
  return map;
}

/** Nome público efetivo: perfil > metadados da conta. */
export async function effectiveDisplayName(client: Svc, user: SessionUser): Promise<string> {
  const profile = await getProfile(client, user.id).catch(() => null);
  return profile?.displayName || user.displayName;
}

export type NotificationType = "comment" | "reply" | "reaction";

/** Cria uma notificação (best-effort; nunca notifica o próprio autor). */
export async function notify(
  client: Svc,
  input: { recipientId: string; actor: SessionUser; type: NotificationType; communityId: string; postId: string; commentId?: string | null },
): Promise<void> {
  if (input.recipientId === input.actor.id) return;
  try {
    await client.from("community_notifications").insert({
      user_id: input.recipientId,
      actor_id: input.actor.id,
      actor_name: input.actor.displayName,
      type: input.type,
      community_id: input.communityId,
      post_id: input.postId,
      comment_id: input.commentId ?? null,
    });
  } catch {
    // notificações nunca bloqueiam a ação principal
  }
}

export interface CommentRow {
  id: string;
  parent_id: string | null;
  [key: string]: unknown;
}

/** Agrupa comentários: raízes com as suas respostas (1 nível). */
export function buildCommentTree<T extends CommentRow>(comments: T[]): (T & { replies: T[] })[] {
  const roots: (T & { replies: T[] })[] = [];
  const byId = new Map<string, T & { replies: T[] }>();
  for (const c of comments) {
    const node = { ...c, replies: [] as T[] };
    byId.set(c.id, node);
    if (!c.parent_id) roots.push(node);
  }
  for (const c of comments) {
    if (c.parent_id) {
      const parent = byId.get(c.parent_id);
      if (parent) parent.replies.push(c);
      else roots.push({ ...c, replies: [] });
    }
  }
  return roots;
}

/** Texto-padrão da publicação de boas-vindas fixada (admin). */
export const WELCOME_POST_CONTENT =
  "És novo por aqui? Apresenta-te! 👋\n\nConta-nos quem és, de que cidade és e o que fazes. Esta comunidade é um espaço para partilhar, ajudar e crescer em conjunto — a tua apresentação é o primeiro passo.";
