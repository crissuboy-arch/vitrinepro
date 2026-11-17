/**
 * /api/communities/posts/[id]/comments/[commentId] — editar/apagar o
 * próprio comentário (autor apenas; moderação usa o mesmo caminho de
 * remoção das publicações via admin/reports).
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, COMMUNITY_LIMITS, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export const runtime = "nodejs";

async function loadComment(postId: string, commentId: string) {
  const client = svc();
  if (!client) return { client: null, comment: null };
  const { data } = await client
    .from("community_comments")
    .select("id, post_id, author_id, status")
    .eq("id", commentId)
    .eq("post_id", postId)
    .maybeSingle();
  return { client, comment: data };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const { client, comment } = await loadComment(id, commentId);
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    if (!comment || comment.status !== "visible") return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
    if (comment.author_id !== user.id) return NextResponse.json({ error: "Só o autor pode editar este comentário." }, { status: 403 });
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
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", commentId)
      .select("id, author_id, author_name, content, parent_id, edited_at, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ comment: data });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível editar." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const { client, comment } = await loadComment(id, commentId);
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    if (!comment || comment.status !== "visible") return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });
    if (comment.author_id !== user.id) return NextResponse.json({ error: "Só o autor pode apagar este comentário." }, { status: 403 });
    const { error } = await client.from("community_comments").update({ status: "removed" }).eq("id", commentId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível apagar." }, { status: 500 });
  }
}
