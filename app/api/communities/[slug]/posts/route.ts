/**
 * POST /api/communities/[slug]/posts — publicar na comunidade.
 * Exige login + adesão. Anti-spam: tamanho máximo e intervalo
 * mínimo entre publicações do mesmo autor.
 */
import { NextResponse } from "next/server";
import {
  svc,
  getCommunityBySlug,
  getSessionUser,
  isMember,
  lastPostAt,
  COMMUNITY_LIMITS,
  communitiesNotReadyResponse,
  isMissingTableError,
} from "@/lib/communities-social";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão para publicar." }, { status: 401 });
    const community = await getCommunityBySlug(client, slug);
    if (!community || !community.is_active) {
      return NextResponse.json({ error: "Comunidade não encontrada." }, { status: 404 });
    }
    if (!(await isMember(client, community.id, user.id))) {
      return NextResponse.json({ error: "Entra na comunidade para publicar." }, { status: 403 });
    }
    let body: { content?: unknown; image_url?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Escreve alguma coisa para publicar." }, { status: 400 });
    if (content.length > COMMUNITY_LIMITS.postMaxChars) {
      return NextResponse.json({ error: `Publicação demasiado longa (máx. ${COMMUNITY_LIMITS.postMaxChars} caracteres).` }, { status: 400 });
    }
    const imageUrl = typeof body.image_url === "string" ? body.image_url.trim().slice(0, 600) || null : null;

    const last = await lastPostAt(client, user.id);
    if (last && Date.now() - last.getTime() < COMMUNITY_LIMITS.minSecondsBetweenPosts * 1000) {
      return NextResponse.json({ error: "Espera alguns segundos entre publicações." }, { status: 429 });
    }

    const { data, error } = await client
      .from("community_posts")
      .insert({ community_id: community.id, author_id: user.id, author_name: user.displayName, content, image_url: imageUrl })
      .select("id, author_name, content, image_url, is_pinned, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ post: { ...data, commentCount: 0, reactions: {} } }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível publicar." }, { status: 500 });
  }
}
