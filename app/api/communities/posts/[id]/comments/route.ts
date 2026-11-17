/**
 * /api/communities/posts/[id]/comments — comentários de uma publicação.
 * GET público (só visíveis); POST exige login + adesão à comunidade
 * da publicação.
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, isMember, COMMUNITY_LIMITS, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const { data, error } = await client
      .from("community_comments")
      .select("id, author_name, content, created_at")
      .eq("post_id", id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ comments: data ?? [] });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar os comentários." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão para comentar." }, { status: 401 });
    const { data: post } = await client
      .from("community_posts")
      .select("id, community_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!post || post.status !== "visible") {
      return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
    }
    if (!(await isMember(client, post.community_id as string, user.id))) {
      return NextResponse.json({ error: "Entra na comunidade para comentar." }, { status: 403 });
    }
    let body: { content?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Escreve o comentário." }, { status: 400 });
    if (content.length > COMMUNITY_LIMITS.commentMaxChars) {
      return NextResponse.json({ error: `Comentário demasiado longo (máx. ${COMMUNITY_LIMITS.commentMaxChars}).` }, { status: 400 });
    }
    const { data, error } = await client
      .from("community_comments")
      .insert({ post_id: id, author_id: user.id, author_name: user.displayName, content })
      .select("id, author_name, content, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível comentar." }, { status: 500 });
  }
}
