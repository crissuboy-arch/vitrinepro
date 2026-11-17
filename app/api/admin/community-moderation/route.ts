/**
 * /api/admin/community-moderation — moderação das comunidades.
 * GET: denúncias pendentes (com o conteúdo denunciado) + publicações
 * ocultas. POST: ações — hide/restore/remove conteúdo, fixar/
 * desafixar publicação, resolver/ignorar denúncia.
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { communitiesNotReadyResponse, isMissingTableError } from "@/lib/communities-social";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const client = getServiceClient();
  if (!client) return communitiesNotReadyResponse();
  try {
    const { data: reports, error } = await client
      .from("community_reports")
      .select("id, reporter_id, target_type, target_id, reason, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const postIds = (reports ?? []).filter((r) => r.target_type === "post").map((r) => r.target_id as string);
    const commentIds = (reports ?? []).filter((r) => r.target_type === "comment").map((r) => r.target_id as string);
    const [posts, comments, hidden] = await Promise.all([
      postIds.length
        ? client.from("community_posts").select("id, author_name, content, status, community_id").in("id", postIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      commentIds.length
        ? client.from("community_comments").select("id, author_name, content, status, post_id").in("id", commentIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      client
        .from("community_posts")
        .select("id, author_name, content, is_pinned, created_at, community_id")
        .eq("status", "hidden")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const postMap = new Map((posts.data ?? []).map((p) => [p.id as string, p]));
    const commentMap = new Map((comments.data ?? []).map((c) => [c.id as string, c]));
    return NextResponse.json({
      reports: (reports ?? []).map((r) => ({
        ...r,
        target: r.target_type === "post" ? postMap.get(r.target_id as string) ?? null : commentMap.get(r.target_id as string) ?? null,
      })),
      hiddenPosts: hidden.data ?? [],
    });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível carregar a moderação." }, { status: 500 });
  }
}

const ACTIONS = new Set(["hide_post", "restore_post", "remove_post", "pin_post", "unpin_post", "hide_comment", "restore_comment", "resolve_report", "dismiss_report"]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const client = getServiceClient();
  if (!client) return communitiesNotReadyResponse();
  let body: { action?: unknown; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (typeof body.action !== "string" || !ACTIONS.has(body.action) || typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }
  try {
    switch (body.action) {
      case "hide_post":
        await client.from("community_posts").update({ status: "hidden" }).eq("id", body.id);
        break;
      case "restore_post":
        await client.from("community_posts").update({ status: "visible" }).eq("id", body.id);
        break;
      case "remove_post":
        await client.from("community_posts").update({ status: "removed" }).eq("id", body.id);
        break;
      case "pin_post":
        await client.from("community_posts").update({ is_pinned: true }).eq("id", body.id);
        break;
      case "unpin_post":
        await client.from("community_posts").update({ is_pinned: false }).eq("id", body.id);
        break;
      case "hide_comment":
        await client.from("community_comments").update({ status: "hidden" }).eq("id", body.id);
        break;
      case "restore_comment":
        await client.from("community_comments").update({ status: "visible" }).eq("id", body.id);
        break;
      case "resolve_report":
      case "dismiss_report":
        await client
          .from("community_reports")
          .update({
            status: body.action === "resolve_report" ? "resolved" : "dismissed",
            resolved_by: auth.email,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", body.id);
        break;
    }
    adminLog("community.moderation", { by: auth.email, action: body.action, targetId: body.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTableError(err)) return communitiesNotReadyResponse();
    return NextResponse.json({ error: "A ação falhou." }, { status: 500 });
  }
}
