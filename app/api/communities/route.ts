/**
 * GET /api/communities — lista pública das comunidades sociais com
 * contagens (membros e publicações). Sem dados privados.
 */
import { NextResponse } from "next/server";
import { svc, communityCounts, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export async function GET() {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const { data, error } = await client
      .from("social_communities")
      .select("id, slug, name, icon, color, description, created_at")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    const communities = await Promise.all(
      (data ?? []).map(async (c) => ({ ...c, counts: await communityCounts(client, c.id as string) }))
    );
    return NextResponse.json({ communities });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar as comunidades." }, { status: 500 });
  }
}
