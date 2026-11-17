/**
 * app/api/quotes/track/route.ts — Fase 2: acompanhamento por LINK PRIVADO.
 *
 * O consumidor não tem conta: prova a posse do pedido com o token do
 * link (comparamos o hash SHA-256). Ações:
 * - (sem action) → estado do pedido + manifestações de interesse
 *   (só dados públicos das empresas: nome, cidade, categoria, Montra).
 * - action "decide" → aceitar/recusar um interesse. Ao ACEITAR, o
 *   contacto do consumidor passa a ser visível para ESSA empresa
 *   (evento quote_contact_revealed nas métricas da empresa).
 * - action "close" → o consumidor fecha o seu pedido.
 *
 * Os dados de contacto do consumidor NUNCA são devolvidos aqui.
 */

import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidTrackingToken, consumerCanDecideInterest } from "@/lib/quotes";
import { getServiceClient, hashTrackingToken, isQuotesTableMissing } from "@/lib/quotes-server";

export const runtime = "nodejs";

const TRACK_LIMIT = 60;
const TRACK_WINDOW_MS = 60 * 60_000;

const REQUEST_FIELDS = "id, category, city, title, description, status, expires_at, created_at";

async function loadState(svc: NonNullable<ReturnType<typeof getServiceClient>>, requestId: string) {
  const { data: request } = await svc
    .from("quote_requests")
    .select(REQUEST_FIELDS)
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return null;

  const { data: interests } = await svc
    .from("quote_interests")
    .select("id, message, status, created_at, business_id")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  const businessIds = [...new Set((interests || []).map((i) => i.business_id))];
  const { data: businesses } = businessIds.length
    ? await svc.from("businesses").select("id, name, slug, city, category").in("id", businessIds)
    : { data: [] };
  const byId = new Map((businesses || []).map((b) => [b.id, b]));

  return {
    request,
    interests: (interests || []).map((i) => ({
      id: i.id,
      message: i.message,
      status: i.status,
      created_at: i.created_at,
      business: byId.get(i.business_id) || { name: "Negócio", slug: "", city: null, category: null },
    })),
  };
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`quotes-track:${ip}`, TRACK_LIMIT, TRACK_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarda um pouco." }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const token = body.token;
    if (!isValidTrackingToken(token)) {
      return NextResponse.json({ error: "Link inválido." }, { status: 400 });
    }

    const svc = getServiceClient();
    if (!svc) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

    const { data: found, error: findError } = await svc
      .from("quote_requests")
      .select("id")
      .eq("tracking_token_hash", hashTrackingToken(token))
      .maybeSingle();

    if (findError) {
      if (isQuotesTableMissing(findError)) {
        return NextResponse.json({ error: "Os pedidos de orçamento ainda não estão ativos.", ready: false }, { status: 503 });
      }
      console.error("[QUOTES TRACK] Lookup falhou:", findError.message);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
    if (!found) {
      return NextResponse.json({ error: "Pedido não encontrado. Verifica o link privado que recebeste ao publicar." }, { status: 404 });
    }

    const action = typeof body.action === "string" ? body.action : "get";

    if (action === "decide") {
      const interestId = typeof body.interestId === "string" ? body.interestId : "";
      const decision = body.decision === "accepted" ? "accepted" : body.decision === "declined" ? "declined" : null;
      if (!interestId || !decision) {
        return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
      }
      const { data: interest } = await svc
        .from("quote_interests")
        .select("id, status, business_id")
        .eq("id", interestId)
        .eq("request_id", found.id)
        .maybeSingle();
      if (!interest) return NextResponse.json({ error: "Interesse não encontrado." }, { status: 404 });
      if (!consumerCanDecideInterest(interest.status)) {
        return NextResponse.json({ error: "Este interesse já foi decidido." }, { status: 409 });
      }
      const { error: updateError } = await svc
        .from("quote_interests")
        .update({ status: decision })
        .eq("id", interestId);
      if (updateError) {
        console.error("[QUOTES TRACK] Decisão falhou:", updateError.message);
        return NextResponse.json({ error: "Não foi possível guardar a decisão." }, { status: 500 });
      }
      if (decision === "accepted") {
        // Métrica da empresa: o contacto foi revelado para ela.
        await svc.from("business_analytics").insert({
          business_id: interest.business_id,
          event_type: "quote_contact_revealed",
        });
      }
    } else if (action === "close") {
      const { error: closeError } = await svc
        .from("quote_requests")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", found.id)
        .in("status", ["pending", "approved"]);
      if (closeError) {
        console.error("[QUOTES TRACK] Fecho falhou:", closeError.message);
        return NextResponse.json({ error: "Não foi possível fechar o pedido." }, { status: 500 });
      }
    } else if (action !== "get") {
      return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
    }

    const state = await loadState(svc, found.id);
    if (!state) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, ...state });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
