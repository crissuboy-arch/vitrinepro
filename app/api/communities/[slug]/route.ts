/**
 * /api/communities/[slug] — detalhe público de uma comunidade.
 * GET: comunidade + publicações visíveis (fixadas primeiro) com
 * contagens de comentários/reações e o estado do visitante
 * (membro ou não). Visitantes leem; interagir exige login + adesão.
 */
import { NextResponse } from "next/server";
import {
  svc,
  getCommunityBySlug,
  getSessionUser,
  isMember,
  communityCounts,
  communitiesNotReadyResponse,
  isMissingTableError,
  getProfile,
  getProfilesMap,
} from "@/lib/communities-social";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const community = await getCommunityBySlug(client, slug);
    if (!community || !community.is_active) {
      return NextResponse.json({ error: "Comunidade não encontrada." }, { status: 404 });
    }
    const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    let postsQuery = client
      .from("community_posts")
      .select("id, author_id, author_name, content, image_url, is_pinned, edited_at, created_at")
      .eq("community_id", community.id)
      .eq("status", "visible")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (q) postsQuery = postsQuery.ilike("content", `%${q}%`);
    const { data: posts, error } = await postsQuery;
    if (error) throw error;

    const postIds = (posts ?? []).map((p) => p.id as string);
    const [commentsCount, reactions, counts, viewer] = await Promise.all([
      postIds.length
        ? client.from("community_comments").select("post_id").in("post_id", postIds).eq("status", "visible")
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      postIds.length
        ? client.from("community_reactions").select("post_id, emoji, user_id").in("post_id", postIds)
        : Promise.resolve({ data: [] as { post_id: string; emoji: string; user_id: string }[] }),
      communityCounts(client, community.id),
      getSessionUser(),
    ]);

    const commentCounts = new Map<string, number>();
    for (const c of commentsCount.data ?? []) {
      commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
    }
    const reactionMap = new Map<string, Map<string, { count: number; mine: boolean }>>();
    for (const r of reactions.data ?? []) {
      if (!reactionMap.has(r.post_id)) reactionMap.set(r.post_id, new Map());
      const byEmoji = reactionMap.get(r.post_id)!;
      const entry = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (viewer && r.user_id === viewer.id) entry.mine = true;
      byEmoji.set(r.emoji, entry);
    }

    const member = viewer ? await isMember(client, community.id, viewer.id) : false;

    // Perfis públicos dos autores + prévia de membros (avatares).
    const authorIds = [...new Set((posts ?? []).map((p) => p.author_id as string))];
    const { data: memberRows } = await client
      .from("community_members")
      .select("user_id, joined_at")
      .eq("community_id", community.id)
      .order("joined_at", { ascending: false })
      .limit(12);
    const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
    const profiles = await getProfilesMap(client, [...authorIds, ...memberIds, ...(viewer ? [viewer.id] : [])]).catch(
      () => new Map(),
    );
    const viewerProfile = viewer ? profiles.get(viewer.id) ?? null : null;
    const membersPreview = memberIds.map((uid) => {
      const prof = profiles.get(uid);
      return { userId: uid, displayName: prof?.displayName ?? "Membro VitrinePro", avatarUrl: prof?.avatarUrl ?? null, city: prof?.city ?? null, bio: prof?.bio ?? null };
    });

    return NextResponse.json({
      community: { ...community, counts },
      viewer: viewer
        ? {
            loggedIn: true,
            isMember: member,
            userId: viewer.id,
            displayName: viewerProfile?.displayName ?? viewer.displayName,
            profile: viewerProfile,
          }
        : { loggedIn: false, isMember: false },
      membersPreview,
      posts: (posts ?? []).map((p) => {
        const prof = profiles.get(p.author_id as string);
        return {
          ...p,
          author_name: prof?.displayName ?? p.author_name,
          author_avatar: prof?.avatarUrl ?? null,
          author_city: prof?.city ?? null,
          author_bio: prof?.bio ?? null,
          commentCount: commentCounts.get(p.id as string) ?? 0,
          reactions: Object.fromEntries(reactionMap.get(p.id as string) ?? new Map()),
        };
      }),
    });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar a comunidade." }, { status: 500 });
  }
}
