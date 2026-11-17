/**
 * app/api/quotes/route.ts — Fase 2 "Pedidos de Orçamento".
 *
 * GET  — lista pública: apenas pedidos APROVADOS e não expirados, só
 *        campos públicos (a tabela quote_requests não tem dados pessoais).
 * POST — submissão pública SEM conta: honeypot + rate-limit + validação
 *        (lib/quotes) + token privado de acompanhamento (guardamos só o
 *        hash). O pedido nasce 'pending' — PRÉ-MODERAÇÃO no admin.
 *
 * Escrita só com service role no servidor. Sem a migration aplicada, a
 * API degrada com ready:false / 503 em vez de rebentar.
 */

import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateQuoteSubmission, trackingPath, CONSENT_TEXT_VERSION } from "@/lib/quotes";
import { getServiceClient, generateTrackingToken, hashTrackingToken, isQuotesTableMissing } from "@/lib/quotes-server";

export const runtime = "nodejs";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60_000; // 5 submissões/hora/IP

const PUBLIC_FIELDS = "id, category, city, title, description, status, expires_at, created_at";

export async function GET(request: Request) {
  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ ready: false, quotes: [] });

  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") || "").trim().slice(0, 60);
  const category = (searchParams.get("category") || "").trim().slice(0, 60);

  let query = svc
    .from("quote_requests")
    .select(PUBLIC_FIELDS)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(60);
  if (city) query = query.eq("city", city);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    if (isQuotesTableMissing(error)) return NextResponse.json({ ready: false, quotes: [] });
    console.error("[QUOTES] Lista pública falhou:", error.message);
    return NextResponse.json({ ready: false, quotes: [] });
  }
  return NextResponse.json({ ready: true, quotes: data || [] });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`quotes-submit:${ip}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitos pedidos seguidos. Tenta novamente dentro de uma hora." }, { status: 429 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    // Honeypot: campo invisível que só bots preenchem. Fingimos sucesso
    // e não gravamos nada.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const validation = validateQuoteSubmission(body);
    if (!validation.ok || !validation.value) {
      return NextResponse.json({ error: validation.errors[0] || "Dados inválidos.", errors: validation.errors }, { status: 422 });
    }
    const v = validation.value;

    const svc = getServiceClient();
    if (!svc) {
      return NextResponse.json({ error: "Serviço indisponível de momento." }, { status: 503 });
    }

    const token = generateTrackingToken();
    const { data: created, error: insertError } = await svc
      .from("quote_requests")
      .insert({
        category: v.category,
        city: v.city,
        title: v.title,
        description: v.description,
        status: "pending",
        tracking_token_hash: hashTrackingToken(token),
      })
      .select("id")
      .single();

    if (insertError || !created) {
      if (isQuotesTableMissing(insertError)) {
        return NextResponse.json({ error: "Os pedidos de orçamento ainda não estão ativos.", ready: false }, { status: 503 });
      }
      console.error("[QUOTES] Insert do pedido falhou:", insertError?.message);
      return NextResponse.json({ error: "Não foi possível registar o pedido." }, { status: 500 });
    }

    const { error: contactError } = await svc.from("quote_request_contacts").insert({
      request_id: created.id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      consent_at: new Date().toISOString(),
      consent_text_version: CONSENT_TEXT_VERSION,
    });

    if (contactError) {
      // Sem contacto o pedido não serve — desfaz a criação.
      await svc.from("quote_requests").delete().eq("id", created.id);
      console.error("[QUOTES] Insert do contacto falhou:", contactError.message);
      return NextResponse.json({ error: "Não foi possível registar o pedido." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, token, trackingUrl: trackingPath(token) });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
