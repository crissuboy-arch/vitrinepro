/**
 * app/api/vitrine/ask/route.ts — A8 "Pergunte à Vitrine"
 *
 * Fluxo: mensagem → interpretIntent() → VitrineIntent → A7 → composeAnswer()
 *
 * Segurança/custo:
 * - Rate limit 20 req/min por IP (mesmo padrão do /api/chat).
 * - Mensagem máx. 500 chars; histórico NÃO persistido (stateless).
 * - Timeout no provider (15s); falha → fallback rule-based → busca tradicional.
 * - Nenhuma chave no browser; service_role nunca usado aqui.
 * - Proteção básica contra prompt injection: system prompts proíbem
 *   exfiltrar dados; o modelo NUNCA recebe dados privados (só resultados
 *   públicos da A7). Pedidos como "mostre usuários" viram intent vazia →
 *   zero results honesto.
 * - O modelo não recebe o catálogo — só os top resultados da A7.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getProvider } from "@/lib/ai";
import {
  searchIntelligence,
  type VitrineIntent,
  type IntelligenceData,
} from "@/lib/intelligence";

export const runtime = "nodejs";

const ASK_LIMIT = 20;
const ASK_WINDOW_MS = 60_000;
const MAX_MESSAGE = 500;

function isValidMessage(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= MAX_MESSAGE;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`ask:${ip}`, ASK_LIMIT, ASK_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas perguntas. Tente novamente em instantes." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const message = body.message;
  if (!isValidMessage(message)) {
    return NextResponse.json(
      { error: "Mensagem inválida (máx. 500 caracteres)." },
      { status: 400 }
    );
  }

  // Contexto de localização (com consentimento da experiência).
  const lat = typeof body.latitude === "number" && isFinite(body.latitude) ? body.latitude : null;
  const lng = typeof body.longitude === "number" && isFinite(body.longitude) ? body.longitude : null;
  const city = typeof body.city === "string" ? body.city.slice(0, 100) : null;

  try {
    // 1. Interpreta intenção (IA ou rule-based).
    const provider = getProvider();
    let partial: Partial<VitrineIntent>;
    try {
      partial = await provider.interpretIntent(message.trim(), {
        city,
        latitude: lat,
        longitude: lng,
      });
    } catch {
      // Provider falhou → fallback seguro sem IA.
      const { RuleBasedProvider } = await import("@/lib/ai");
      partial = await new RuleBasedProvider().interpretIntent(message.trim(), {
        city,
        latitude: lat,
        longitude: lng,
      });
    }

    const intent: VitrineIntent = {
      query: (partial.query || message.trim()).slice(0, 200),
      latitude: partial.latitude ?? null,
      longitude: partial.longitude ?? null,
      radiusKm: partial.radiusKm ?? null,
      city: partial.city ?? null,
      category: partial.category ?? null,
      maxPrice: partial.maxPrice ?? null,
      minPrice: partial.minPrice ?? null,
      neededToday: partial.neededToday ?? false,
      resultTypes: ["business", "product", "post"],
      limit: 12,
    };

    // 2. Busca na A7 (fonte de verdade — dados reais).
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const now = new Date();
    const [bizRes, prodRes, postRes] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug, description, category, city, latitude, longitude, logo_url, cover_url, is_featured, opening_hours, service_today")
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
        .select("id, business_id, type, title, content, image_url, price, starts_at, expires_at, is_active, businesses!inner(id, name, slug, city, latitude, longitude, published)")
        .eq("is_active", true)
        .limit(200),
    ]);

    const data: IntelligenceData = {
      businesses: (bizRes.data || []).map((b: any) => ({
        id: b.id, name: b.name, slug: b.slug, description: b.description,
        category: b.category, city: b.city, latitude: b.latitude, longitude: b.longitude,
        logo_url: b.logo_url, cover_url: b.cover_url, is_featured: b.is_featured,
        opening_hours: b.opening_hours, service_today: b.service_today,
      })),
      products: (prodRes.data || [])
        .filter((p: any) => p.businesses?.published)
        .map((p: any) => ({
          id: p.id, business_id: p.business_id, name: p.name, description: p.description,
          price: p.price, image_url: p.image_url,
          available_today: p.available_today, pickup_today: p.pickup_today, delivery_today: p.delivery_today,
          business_name: p.businesses.name, business_slug: p.businesses.slug,
          business_city: p.businesses.city, business_category: p.businesses.category,
          business_lat: p.businesses.latitude, business_lng: p.businesses.longitude,
        })),
      posts: (postRes.data || [])
        .filter((p: any) => p.businesses?.published)
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

    // 3. Compõe resposta (só com resultados reais; nunca inventa).
    let answer: string;
    try {
      answer = await provider.composeAnswer(message.trim(), intent, results);
    } catch {
      answer =
        results.length === 0
          ? "Não encontrei isso na Vitrine agora. Tente outro termo."
          : `Encontrei ${results.length} ${results.length === 1 ? "opção" : "opções"} na Vitrine.`;
    }

    // 4. Resposta: texto + resultados normalizados (cards vêm dos IDs, não do texto).
    return NextResponse.json({
      answer,
      intent: {
        query: intent.query,
        city: intent.city,
        category: intent.category,
        maxPrice: intent.maxPrice,
        neededToday: intent.neededToday,
        nearby: intent.latitude != null,
      },
      results: results.map((r) => ({
        id: r.id,
        type: r.type,
        business_id: r.business_id,
        name: r.name,
        slug: r.slug,
        image_url: r.image_url,
        price: r.price,
        city: r.city,
        category: r.category,
        distanceKm: r.distanceKm != null ? Math.round(r.distanceKm * 10) / 10 : null,
        // Link público canónico:
        url:
          r.type === "business"
            ? `/vitrine/${r.slug}`
            : r.type === "product"
              ? `/vitrine/${r.slug}`
              : `/vitrine/${r.slug}`,
      })),
      provider: provider.name,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Não foi possível responder agora. Tente a busca tradicional." },
      { status: 500 }
    );
  }
}
