import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json({ error: "business_id obrigatório." }, { status: 400 });
    }

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayRes, weekRes, monthRes, whatsappRes, productRes] = await Promise.all([
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", "page_view")
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", "page_view")
        .gte("created_at", weekStart.toISOString()),
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", "page_view")
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", "whatsapp_click")
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", "product_view")
        .gte("created_at", monthStart.toISOString()),
    ]);

    return NextResponse.json({
      views_today: todayRes.count ?? 0,
      views_week: weekRes.count ?? 0,
      views_month: monthRes.count ?? 0,
      whatsapp_clicks: whatsappRes.count ?? 0,
      product_views: productRes.count ?? 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, event_type } = body;

    if (!business_id || !event_type) {
      return NextResponse.json({ error: "business_id e event_type obrigatórios." }, { status: 400 });
    }

    const validTypes = ["page_view", "whatsapp_click", "product_view"];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ error: "event_type inválido." }, { status: 400 });
    }

    const { error } = await supabase
      .from("business_analytics")
      .insert({ business_id, event_type });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
