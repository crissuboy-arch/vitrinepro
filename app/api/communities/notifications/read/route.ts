/**
 * POST /api/communities/notifications/read — marca notificações do
 * próprio como lidas (todas, ou uma lista de ids).
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão." }, { status: 401 });
    let ids: string[] = [];
    try {
      const body = (await req.json()) as { ids?: unknown };
      if (Array.isArray(body.ids)) ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 100);
    } catch {
      // sem body = marcar todas
    }
    let query = client.from("community_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    if (ids.length > 0) query = query.in("id", ids);
    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível atualizar." }, { status: 500 });
  }
}
