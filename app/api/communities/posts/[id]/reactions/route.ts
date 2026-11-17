/**
 * POST /api/communities/posts/[id]/reactions — reagir a uma
 * publicação (toggle: repetir o mesmo emoji remove a reação).
 * Exige login + adesão. Emojis permitidos: ❤️ 👍 🎉
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, isMember, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

const ALLOWED_EMOJIS = new Set(["❤️", "👍", "🎉"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão para reagir." }, { status: 401 });
    let body: { emoji?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    if (typeof body.emoji !== "string" || !ALLOWED_EMOJIS.has(body.emoji)) {
      return NextResponse.json({ error: "Reação inválida." }, { status: 400 });
    }
    const { data: post } = await client
      .from("community_posts")
      .select("id, community_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!post || post.status !== "visible") {
      return NextResponse.json({ error: "Publicação não encontrada." }, { status: 404 });
    }
    if (!(await isMember(client, post.community_id as string, user.id))) {
      return NextResponse.json({ error: "Entra na comunidade para reagir." }, { status: 403 });
    }
    const { data: existing } = await client
      .from("community_reactions")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .eq("emoji", body.emoji)
      .maybeSingle();
    if (existing) {
      await client.from("community_reactions").delete().eq("post_id", id).eq("user_id", user.id).eq("emoji", body.emoji);
      return NextResponse.json({ reacted: false });
    }
    const { error } = await client.from("community_reactions").insert({ post_id: id, user_id: user.id, emoji: body.emoji });
    if (error) throw error;
    return NextResponse.json({ reacted: true }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível reagir." }, { status: 500 });
  }
}
