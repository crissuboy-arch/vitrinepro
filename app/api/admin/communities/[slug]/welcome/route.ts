/**
 * POST /api/admin/communities/[slug]/welcome — cria a publicação de
 * boas-vindas FIXADA da comunidade (admin). Idempotente: se já existir
 * uma publicação fixada de boas-vindas, devolve a existente.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { svc, getCommunityBySlug, communitiesNotReadyResponse, isMissingTableError, WELCOME_POST_CONTENT } from "@/lib/communities-social";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { slug } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const community = await getCommunityBySlug(client, slug);
    if (!community) return NextResponse.json({ error: "Comunidade não encontrada." }, { status: 404 });
    const { data: existing } = await client
      .from("community_posts")
      .select("id")
      .eq("community_id", community.id)
      .eq("is_pinned", true)
      .ilike("content", "És novo por aqui%")
      .eq("status", "visible")
      .maybeSingle();
    if (existing) return NextResponse.json({ ready: true, created: false, postId: existing.id });
    const { data, error } = await client
      .from("community_posts")
      .insert({
        community_id: community.id,
        author_id: auth.userId,
        author_name: "Equipa VitrinePro",
        content: WELCOME_POST_CONTENT,
        is_pinned: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ ready: true, created: true, postId: data.id }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível criar as boas-vindas." }, { status: 500 });
  }
}
