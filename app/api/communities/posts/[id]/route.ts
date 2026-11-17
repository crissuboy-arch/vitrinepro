/**
 * /api/communities/posts/[id] — editar/apagar a própria publicação.
 * PATCH: só o autor (conteúdo + imagem; marca edited_at).
 * DELETE: autor, moderador da comunidade ou admin → status "removed"
 * (preserva o rasto para moderação; deixa de ser visível).
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, COMMUNITY_LIMITS, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

async function loadPost(id: string) {
  const client = svc();
  if (!client) return { client: null, post: null };
  const { data } = await client
    .from("community_posts")
    .select("id, community_id, author_id, status")
    .eq("id", id)
    .maybeSingle();
  return { client, post: data };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, post } = await loadPost(id);
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    if (!post || post.status !== "visible") return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
    if (post.author_id !== user.id) return NextResponse.json({ error: "Só o autor pode editar esta publicação." }, { status: 403 });

    let body: { content?: unknown; image_url?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Escreve alguma coisa." }, { status: 400 });
    if (content.length > COMMUNITY_LIMITS.postMaxChars) {
      return NextResponse.json({ error: `Publicação demasiado longa (máx. ${COMMUNITY_LIMITS.postMaxChars}).` }, { status: 400 });
    }
    const imageUrl = typeof body.image_url === "string" ? body.image_url.trim().slice(0, 600) || null : null;
    const { data, error } = await client
      .from("community_posts")
      .update({ content, image_url: imageUrl, edited_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, author_name, content, image_url, is_pinned, edited_at, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível editar." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client, post } = await loadPost(id);
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    if (!post || post.status !== "visible") return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });

    let allowed = post.author_id === user.id;
    if (!allowed) {
      const admin = await requireAdmin();
      if (admin.ok) {
        allowed = true;
      } else {
        const { data: membership } = await client
          .from("community_members")
          .select("role")
          .eq("community_id", post.community_id as string)
          .eq("user_id", user.id)
          .maybeSingle();
        allowed = membership?.role === "moderator";
      }
    }
    if (!allowed) return NextResponse.json({ error: "Sem permissão para remover esta publicação." }, { status: 403 });

    const { error } = await client.from("community_posts").update({ status: "removed" }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível remover." }, { status: 500 });
  }
}
