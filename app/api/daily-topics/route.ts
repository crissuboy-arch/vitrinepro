/**
 * GET /api/daily-topics — Assuntos do Dia PUBLICADOS (público).
 * Fixados primeiro, depois os mais recentes. Filtros opcionais
 * ?city= e ?category=. Agendados para o futuro não aparecem.
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin-auth";
import { TOPIC_FIELDS } from "@/lib/daily-topics";
import { isMissingTableError } from "@/lib/gestor-auth";

export async function GET(req: Request) {
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ topics: [] });
  try {
    const params = new URL(req.url).searchParams;
    const today = new Date().toISOString().slice(0, 10);
    let query = svc
      .from("daily_topics")
      .select(TOPIC_FIELDS)
      .eq("status", "published")
      .or(`scheduled_for.is.null,scheduled_for.lte.${today}`)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(12);
    const city = params.get("city");
    const category = params.get("category");
    if (city) query = query.eq("city", city);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ topics: data ?? [] });
  } catch (err) {
    if (isMissingTableError(err)) return NextResponse.json({ topics: [] });
    return NextResponse.json({ topics: [] });
  }
}
