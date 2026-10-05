/**
 * app/api/analytics/route.ts — A2.2 (hardened)
 *
 * BEFORE: POST accepted anonymous, unvalidated events for ANY business_id
 * (falsifiable metrics); GET exposed every business's metrics publicly.
 *
 * AFTER:
 *  - POST stays public (page views / clicks come from anonymous visitors)
 *    but with: strict event allowlist, business_id format validation,
 *    business existence check, per-IP rate limit and short dedup window.
 *  - GET is now PRIVATE: requires an authenticated session (cookie) or a
 *    Supabase Bearer token, and only returns metrics for businesses the
 *    caller owns (businesses.user_id = auth.uid()).
 *
 * Public events (POST, no login):  page_view, whatsapp_click, product_view,
 *   business_result_click, product_result_click (A4 discovery),
 *   need_today_result_click (A5 "Preciso Hoje")
 * Private (GET, owner only):       aggregated metrics per business
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isAllowedEvent,
  isUuidLike,
  makeDeduper,
  type AllowedEvent,
} from "@/lib/analytics-guard";

export const runtime = "nodejs";

// Abuse brakes for the public POST endpoint (per IP, single instance).
const POST_LIMIT = 60;
const POST_WINDOW_MS = 60_000;
// Identical (ip, business, event) hits inside this window are dropped as dupes.
const DEDUP_WINDOW_MS = 5_000;

const deduper = makeDeduper(DEDUP_WINDOW_MS);

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Service role preferred (bypasses RLS for the existence check + insert);
  // falls back to anon key which the public INSERT policy allows.
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Authenticated user id from cookie session or Bearer token. */
async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user.id;
  } catch {
    // fall through to Bearer check
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const admin = getServiceClient();
    if (admin) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user) return data.user.id;
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    if (!businessId || !isUuidLike(businessId)) {
      return NextResponse.json({ error: "business_id inválido." }, { status: 400 });
    }

    // Private metrics: caller must own the business.
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
    }

    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
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

    const countFor = (event: AllowedEvent, since: string) =>
      supabase
        .from("business_analytics")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("event_type", event)
        .gte("created_at", since);

    const [todayRes, weekRes, monthRes, whatsappRes, productRes] = await Promise.all([
      countFor("page_view", todayStart.toISOString()),
      countFor("page_view", weekStart.toISOString()),
      countFor("page_view", monthStart.toISOString()),
      countFor("whatsapp_click", monthStart.toISOString()),
      countFor("product_view", monthStart.toISOString()),
    ]);

    return NextResponse.json({
      views_today: todayRes.count ?? 0,
      views_week: weekRes.count ?? 0,
      views_month: monthRes.count ?? 0,
      whatsapp_clicks: whatsappRes.count ?? 0,
      product_views: productRes.count ?? 0,
    });
  } catch {
    // Never leak internals on a private endpoint.
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Rate limit anonymous event ingestion.
    const ip = getClientIp(request);
    const rl = rateLimit(`analytics:${ip}`, POST_LIMIT, POST_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
    }

    // 2. Strict payload validation — reject anything arbitrary.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    const { business_id, event_type } = body as Record<string, unknown>;

    if (!isUuidLike(business_id)) {
      return NextResponse.json({ error: "business_id inválido." }, { status: 400 });
    }
    if (!isAllowedEvent(event_type)) {
      return NextResponse.json({ error: "event_type inválido." }, { status: 400 });
    }

    // 3. Business must exist (prevents junk rows for forged ids).
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
    }
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .maybeSingle();
    if (!business) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
    }

    // 4. Dedup identical hits in a short window (naive flood brake).
    if (deduper.isDuplicate(`${ip}:${business_id}:${event_type}`)) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    const { error } = await supabase
      .from("business_analytics")
      .insert({ business_id, event_type });

    if (error) {
      console.error("[ANALYTICS] Insert falhou:", error.message);
      return NextResponse.json({ error: "Não foi possível registar." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
