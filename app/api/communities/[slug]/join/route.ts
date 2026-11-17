/**
 * /api/communities/[slug]/join — adesão à comunidade.
 * POST entra (exige login); DELETE sai. Sem comprovação de
 * nacionalidade: qualquer conta pode entrar em qualquer comunidade.
 */
import { NextResponse } from "next/server";
import { svc, getCommunityBySlug, getSessionUser, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

async function resolve(slug: string) {
  const client = svc();
  if (!client) return { error: communitiesNotReadyResponse() };
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Inicia sessão para entrar na comunidade." }, { status: 401 }) };
  const community = await getCommunityBySlug(client, slug).catch(() => null);
  if (!community || !community.is_active) {
    return { error: NextResponse.json({ error: "Comunidade não encontrada." }, { status: 404 }) };
  }
  return { client, user, community };
}

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const r = await resolve(slug);
    if ("error" in r) return r.error;
    const already = await isMember(r.client, r.community.id, r.user.id).catch(() => false);
    const { error } = await r.client
      .from("community_members")
      .insert({ community_id: r.community.id, user_id: r.user.id });
    if (error && (error as { code?: string }).code !== "23505") throw error;
    return NextResponse.json({ ok: true, isMember: true, firstJoin: !already }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível entrar na comunidade." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const r = await resolve(slug);
    if ("error" in r) return r.error;
    const { error } = await r.client
      .from("community_members")
      .delete()
      .eq("community_id", r.community.id)
      .eq("user_id", r.user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, isMember: false });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível sair da comunidade." }, { status: 500 });
  }
}
