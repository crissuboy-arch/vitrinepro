/**
 * GET /api/admin/platform-stats — métricas da plataforma para o admin.
 * Agrega das tabelas-fonte (sem recolher dados pessoais):
 * Radar (promoções ativas, pedidos aprovados, empresas recentes),
 * Comunidades (membros, publicações, comentários) e Assunto do Dia
 * (publicados e pendentes de aprovação, incl. rascunhos da Atena).
 */
import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient } from "@/lib/admin-auth";
import { countActivePromotions, type PromotionRow } from "@/lib/promotions";
import { isMissingTableError } from "@/lib/gestor-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  try {
    const [promos, quotes, newBiz, members, cPosts, cComments, topicsPub, topicsPending, topicsAtena] = await Promise.all([
      svc.from("business_posts").select("id, business_id, type, title, price, original_price, starts_at, expires_at, is_active, created_at").eq("type", "promocao"),
      svc.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      svc.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      svc.from("community_members").select("user_id", { count: "exact", head: true }),
      svc.from("community_posts").select("id", { count: "exact", head: true }).eq("status", "visible"),
      svc.from("community_comments").select("id", { count: "exact", head: true }).eq("status", "visible"),
      svc.from("daily_topics").select("id", { count: "exact", head: true }).eq("status", "published"),
      svc.from("daily_topics").select("id", { count: "exact", head: true }).eq("status", "pending"),
      svc.from("daily_topics").select("id", { count: "exact", head: true }).eq("created_via", "atena").eq("status", "pending"),
    ]);
    return NextResponse.json({
      radar: {
        activePromotions: promos.data ? countActivePromotions(promos.data as unknown as PromotionRow[]) : 0,
        approvedQuotes: quotes.count ?? 0,
        newBusinesses7d: newBiz.count ?? 0,
      },
      communities: {
        members: members.count ?? 0,
        posts: cPosts.count ?? 0,
        comments: cComments.count ?? 0,
      },
      topics: {
        published: topicsPub.count ?? 0,
        pendingApproval: topicsPending.count ?? 0,
        pendingFromAtena: topicsAtena.count ?? 0,
      },
      partial: [members, cPosts, topicsPub].some((r) => !!r.error),
    });
  } catch (err) {
    if (isMissingTableError(err)) {
      return NextResponse.json({ error: "Algumas tabelas ainda não existem (migrations 027/028 por aplicar)." }, { status: 503 });
    }
    return NextResponse.json({ error: "Não foi possível carregar as métricas." }, { status: 500 });
  }
}
