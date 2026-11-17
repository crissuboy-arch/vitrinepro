/**
 * /api/communities/posts/[id]/comments — comentários de uma publicação.
 * GET público (só visíveis); POST exige login + adesão à comunidade
 * da publicação.
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, isMember, COMMUNITY_LIMITS, communitiesNotReadyResponse, isMissingTableError, effectiveDisplayName, getProfilesMap, notify } from "@/lib/communities-social";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const { data, error } = await client
      .from("community_comments")
      .select("id, author_id, author_name, content, parent_id, edited_at, created_at")
      .eq("post_id", id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    const profiles = await getProfilesMap(client, (data ?? []).map((c) => c.author_id as string)).catch(() => new Map());
    return NextResponse.json({
      comments: (data ?? []).map((c) => {
        const prof = profiles.get(c.author_id as string);
        return { ...c, author_avatar: prof?.avatarUrl ?? null, author_city: prof?.city ?? null, author_name: prof?.displayName ?? c.author_name };
      }),
    });
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
      .select("id, community_id, author_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!post || post.status !== "visible") {
      return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
    }
    if (!(await isMember(client, post.community_id as string, user.id))) {
      return NextResponse.json({ error: "Entra na comunidade para comentar." }, { status: 403 });
    }
    let body: { content?: unknown; parent_id?: unknown };
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
    // Resposta a comentário: o pai tem de ser desta publicação.
    let parent: { id: string; author_id: string } | null = null;
    if (typeof body.parent_id === "string" && body.parent_id) {
      const { data: parentRow } = await client
        .from("community_comments")
        .select("id, author_id, post_id, status")
        .eq("id", body.parent_id)
        .maybeSingle();
      if (!parentRow || parentRow.post_id !== id || parentRow.status !== "visible") {
        return NextResponse.json({ error: "Comentário original não encontrado." }, { status: 400 });
      }
      parent = { id: parentRow.id as string, author_id: parentRow.author_id as string };
    }
    const authorName = await effectiveDisplayName(client, user);
    const { data, error } = await client
      .from("community_comments")
      .insert({ post_id: id, author_id: user.id, author_name: authorName, content, parent_id: parent?.id ?? null })
      .select("id, author_id, author_name, content, parent_id, edited_at, created_at")
      .single();
    if (error) throw error;
    // Notificações: resposta → autor do comentário original; comentário → autor da publicação.
    if (parent) {
      await notify(client, { recipientId: parent.author_id, actor: { ...user, displayName: authorName }, type: "reply", communityId: post.community_id as string, postId: id, commentId: data.id as string });
      if ((post.author_id as string) !== parent.author_id) {
        await notify(client, { recipientId: post.author_id as string, actor: { ...user, displayName: authorName }, type: "comment", communityId: post.community_id as string, postId: id, commentId: data.id as string });
      }
    } else {
      await notify(client, { recipientId: post.author_id as string, actor: { ...user, displayName: authorName }, type: "comment", communityId: post.community_id as string, postId: id, commentId: data.id as string });
    }
    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível comentar." }, { status: 500 });
  }
}
