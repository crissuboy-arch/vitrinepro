/**
 * app/api/quotes/interest/route.ts — Fase 2: lado da EMPRESA.
 *
 * POST — manifestar interesse num pedido aprovado (requer sessão e
 *        propriedade da Montra). Um interesse por empresa/pedido.
 * GET  — as manifestações da empresa; quando o consumidor ACEITOU, o
 *        contacto desse pedido é incluído (revelação autorizada).
 *
 * Tudo via service role depois de verificar sessão + ownership —
 * quote_interests e quote_request_contacts não têm policies públicas.
 */

import { NextResponse } from "next/server";
import { getServiceClient, getAuthenticatedUserId, isQuotesTableMissing } from "@/lib/quotes-server";

export const runtime = "nodejs";

const REQUEST_FIELDS = "id, category, city, title, description, status, expires_at";

async function ownedBusiness(svc: NonNullable<ReturnType<typeof getServiceClient>>, businessId: unknown, userId: string) {
  if (typeof businessId !== "string" || !businessId) return null;
  const { data } = await svc
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const svc = getServiceClient();
    if (!svc) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

    const business = await ownedBusiness(svc, body.business_id, userId);
    if (!business) return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });

    const requestId = typeof body.request_id === "string" ? body.request_id : "";
    if (!requestId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

    const { data: quote } = await svc
      .from("quote_requests")
      .select("id, status, expires_at")
      .eq("id", requestId)
      .maybeSingle();
    if (!quote) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    if (quote.status !== "approved" || new Date(quote.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Este pedido já não está disponível." }, { status: 409 });
    }

    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : null;

    const { error: insertError } = await svc.from("quote_interests").insert({
      request_id: requestId,
      business_id: business.id,
      message: message || null,
      status: "sent",
    });

    if (insertError) {
      if (isQuotesTableMissing(insertError)) {
        return NextResponse.json({ error: "Os pedidos de orçamento ainda não estão ativos.", ready: false }, { status: 503 });
      }
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Já manifestaste interesse neste pedido." }, { status: 409 });
      }
      console.error("[QUOTES INTEREST] Insert falhou:", insertError.message);
      return NextResponse.json({ error: "Não foi possível registar o interesse." }, { status: 500 });
    }

    await svc.from("business_analytics").insert({
      business_id: business.id,
      event_type: "quote_interest",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    const svc = getServiceClient();
    if (!svc) return NextResponse.json({ ready: false, interests: [] });

    const business = await ownedBusiness(svc, businessId, userId);
    if (!business) return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });

    const { data: interests, error } = await svc
      .from("quote_interests")
      .select("id, request_id, message, status, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (isQuotesTableMissing(error)) return NextResponse.json({ ready: false, interests: [] });
      console.error("[QUOTES INTEREST] Lista falhou:", error.message);
      return NextResponse.json({ ready: false, interests: [] });
    }

    const requestIds = [...new Set((interests || []).map((i) => i.request_id))];
    const { data: requests } = requestIds.length
      ? await svc.from("quote_requests").select(REQUEST_FIELDS).in("id", requestIds)
      : { data: [] };
    const requestById = new Map((requests || []).map((r) => [r.id, r]));

    // Contactos só dos interesses ACEITES (revelação autorizada).
    const acceptedIds = (interests || []).filter((i) => i.status === "accepted").map((i) => i.request_id);
    const { data: contacts } = acceptedIds.length
      ? await svc.from("quote_request_contacts").select("request_id, name, email, phone").in("request_id", acceptedIds)
      : { data: [] };
    const contactByRequest = new Map((contacts || []).map((c) => [c.request_id, c]));

    return NextResponse.json({
      ready: true,
      interests: (interests || []).map((i) => ({
        id: i.id,
        request_id: i.request_id,
        message: i.message,
        status: i.status,
        created_at: i.created_at,
        request: requestById.get(i.request_id) || null,
        contact:
          i.status === "accepted"
            ? contactByRequest.get(i.request_id) || null
            : null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
