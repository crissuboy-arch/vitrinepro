/**
 * lib/communities-core.ts — lógica PURA das comunidades sociais
 * (sem dependências de servidor; seguro para cliente e testes).
 */

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

export interface CommentRow {
  id: string;
  parent_id: string | null;
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
