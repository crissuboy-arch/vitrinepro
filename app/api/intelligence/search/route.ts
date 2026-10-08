/**
 * app/api/intelligence/search/route.ts — A7 (Fase 1)
 *
 * Entrada server-side estável para a Intelligence Layer.
 *
 * POST { query, latitude?, longitude?, radiusKm?, city?, category?,
 *        maxPrice?, minPrice?, neededToday?, resultTypes?, limit? }
 *
 * - Valida payload (query ≤ 200 chars).
 * - Rate limit simples em memória (60 req/min por IP).
 * - Carrega SÓ dados públicos via anon key (RLS pública existente):
 *     businesses.published=true, products.is_visible=true,
 *     products.show_in_explore=true (descoberta pública),
 *     business_posts ativos e dentro da janela.
 * - NUNCA retorna: email de owner, user_id, dados admin, favoritos,
 *   coleções, Stripe, Auth.
 * - Sem service_role (não necessário — RLS pública basta).
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  searchIntelligence,
  type VitrineIntent,
  type IntelligenceData,
} from "@/lib/intelligence";

export const runtime = "nodejs";

// Rate limit simples: 60 req/min por IP.
// I8 (A10.2): limpeza periódica para o mapa não crescer sem limite.
const hits = new Map<string, { count: number; reset: number }>();
let lastSweep = Date.now();
function sweepHits(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [ip, rec] of hits) {
    if (now > rec.reset) hits.delete(ip);
  }
}
function rateLimited(ip: string): boolean {
  const now = Date.now();
  sweepHits(now);
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + 60000 });
    return false;
  }
  rec.count++;
  return rec.count > 60;
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const query = String(body.query || "").slice(0, 200).trim();
  if (!query) return NextResponse.json({ error: "query obrigatória" }, { status: 400 });

  const intent: VitrineIntent = {
    query,
    latitude: num(body.latitude),
    longitude: num(body.longitude),
    radiusKm: num(body.radiusKm),
    city: typeof body.city === "string" ? body.city.slice(0, 100) : null,
    category: typeof body.category === "string" ? body.category.slice(0, 100) : null,
    maxPrice: num(body.maxPrice),
    minPrice: num(body.minPrice),
    neededToday: body.neededToday === true,
    resultTypes: Array.isArray(body.resultTypes)
      ? (body.resultTypes as string[]).filter((t) => ["business", "product", "post"].includes(t)) as VitrineIntent["resultTypes"]
      : undefined,
    limit: Math.min(Math.max(parseInt(String(body.limit || "20"), 10) || 20, 1), 50),
  };

  try {
    // Cliente público (anon key) — RLS pública existente filtra.
    // Sem service_role: a camada só vê o que qualquer visitante vê.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const now = new Date();

    // Só dados públicos (RLS existente garante).
    const [bizRes, prodRes, postRes] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug, description, category, city, latitude, longitude, logo_url, cover_url, opening_hours, service_today")
        .eq("published", true)
        .limit(500),
      supabase
        .from("products")
        .select("id, business_id, name, description, price, image_url, available_today, pickup_today, delivery_today, businesses!inner(id, name, slug, city, category, latitude, longitude, published)")
        .eq("is_visible", true)
        .eq("show_in_explore", true)
        .limit(1000),
      supabase
        .from("business_posts")
        .select("id, business_id, type, title, content, image_url, price, starts_at, expires_at, is_active, product_id, businesses!inner(id, name, slug, city, latitude, longitude, published), products!left(id, is_visible, show_in_explore)")
        .eq("is_active", true)
        .limit(500),
    ]);

    // A10.1 CRITICAL 5: diferenciar SEARCH_ERROR de ZERO_RESULTS.
    // Erro de banco NUNCA vira "zero resultados" silencioso.
    const dbError = bizRes.error || prodRes.error || postRes.error;
    if (dbError) {
      console.error("[INTELLIGENCE] Database error:", dbError.message);
      return NextResponse.json(
        { error: "search_error", message: "Erro ao buscar. Tente novamente." },
        { status: 500 }
      );
    }

    const data: IntelligenceData = {
      businesses: (bizRes.data || []).map((b: any) => ({
        id: b.id, name: b.name, slug: b.slug, description: b.description,
        category: b.category, city: b.city, latitude: b.latitude, longitude: b.longitude,
        logo_url: b.logo_url, cover_url: b.cover_url,
        opening_hours: b.opening_hours, service_today: b.service_today,
      })),
      products: (prodRes.data || [])
        .filter((p: any) => p.businesses?.published && (!p.product_id || (p.products?.is_visible && p.products?.show_in_explore)))
        .map((p: any) => ({
          id: p.id, business_id: p.business_id, name: p.name, description: p.description,
          price: p.price, image_url: p.image_url,
          available_today: p.available_today, pickup_today: p.pickup_today, delivery_today: p.delivery_today,
          business_name: p.businesses.name, business_slug: p.businesses.slug,
          business_city: p.businesses.city, business_category: p.businesses.category,
          business_lat: p.businesses.latitude, business_lng: p.businesses.longitude,
        })),
      posts: (postRes.data || [])
        .filter((p: any) => p.businesses?.published && (!p.product_id || (p.products?.is_visible && p.products?.show_in_explore)))
        .map((p: any) => ({
          id: p.id, business_id: p.business_id, type: p.type, title: p.title,
          content: p.content, image_url: p.image_url, price: p.price,
          starts_at: p.starts_at, expires_at: p.expires_at, is_active: p.is_active,
          business_name: p.businesses.name, business_slug: p.businesses.slug,
          business_city: p.businesses.city,
          business_lat: p.businesses.latitude, business_lng: p.businesses.longitude,
        })),
    };

    const results = searchIntelligence(intent, data, now);
    return NextResponse.json({ results, count: results.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
