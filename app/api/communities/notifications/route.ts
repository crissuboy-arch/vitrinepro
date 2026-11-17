/**
 * /api/communities/notifications — notificações do próprio utilizador.
 * GET: últimas 30 + contagem de não lidas. POST /read marca como lidas.
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export const runtime = "nodejs";

export async function GET() {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    const [list, unread] = await Promise.all([
      client
        .from("community_notifications")
        .select("id, actor_name, type, community_id, post_id, comment_id, is_read, created_at, social_communities(slug, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      client.from("community_notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ]);
    if (list.error) throw list.error;
    return NextResponse.json({ notifications: list.data ?? [], unread: unread.count ?? 0 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar as notificações." }, { status: 500 });
  }
}
