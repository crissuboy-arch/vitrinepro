/**
 * app/api/admin/quotes/[id]/route.ts — Fase 2: decisão de moderação.
 *
 * PATCH { status: "approved" | "rejected" | "closed" } — admin apenas,
 * com audit log (lib/admin-auth). Pré-moderação: um pedido só se torna
 * público com status "approved".
 */

import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { isQuotesTableMissing } from "@/lib/quotes-server";

export const runtime = "nodejs";

const DECISIONS = ["approved", "rejected", "closed"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const status = body.status;
  if (typeof status !== "string" || !(DECISIONS as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const { data, error } = await svc
    .from("quote_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, category, city, title, description, status, expires_at, created_at")
    .maybeSingle();

  if (error) {
    if (isQuotesTableMissing(error)) {
      return NextResponse.json({ error: "Os pedidos de orçamento ainda não estão ativos.", ready: false }, { status: 503 });
    }
    console.error("[ADMIN QUOTES] Decisão falhou:", error.message);
    return NextResponse.json({ error: "Não foi possível guardar a decisão." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  adminLog("quotes.moderate", { by: auth.email, quoteId: id, status });
  return NextResponse.json({ ok: true, quote: data });
}
