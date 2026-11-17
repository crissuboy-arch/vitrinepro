/**
 * POST /api/communities/reports — denunciar uma publicação ou
 * comentário para moderação. Exige login. A denúncia não expõe o
 * denunciante ao autor.
 */
import { NextResponse } from "next/server";
import { svc, getSessionUser, communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export async function POST(req: Request) {
  const client = svc();
  if (!client) return communitiesNotReadyResponse();
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Inicia sessão para denunciar." }, { status: 401 });
    let body: { target_type?: unknown; target_id?: unknown; reason?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }
    if (body.target_type !== "post" && body.target_type !== "comment") {
      return NextResponse.json({ error: "Alvo inválido." }, { status: 400 });
    }
    if (typeof body.target_id !== "string" || !body.target_id) {
      return NextResponse.json({ error: "Alvo em falta." }, { status: 400 });
    }
    const table = body.target_type === "post" ? "community_posts" : "community_comments";
    const { data: target } = await client.from(table).select("id").eq("id", body.target_id).maybeSingle();
    if (!target) return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    const { error } = await client.from("community_reports").insert({
      reporter_id: user.id,
      target_type: body.target_type,
      target_id: body.target_id,
      reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 300) || null : null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível registar a denúncia." }, { status: 500 });
  }
}
