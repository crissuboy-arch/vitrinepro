/**
 * app/api/admin/quotes/route.ts — Fase 2: moderação de pedidos.
 *
 * GET — fila de moderação + contadores (admin, via lib/admin-auth).
 * Devolve APENAS campos públicos dos pedidos: os contactos dos
 * consumidores NÃO são precisos para moderar e nunca saem da tabela
 * quote_request_contacts por esta rota (minimização RGPD).
 */

import { NextResponse } from "next/server";
import { requireAdmin, getServiceClient, adminLog } from "@/lib/admin-auth";
import { isQuotesTableMissing } from "@/lib/quotes-server";

export const runtime = "nodejs";

const FIELDS = "id, category, city, title, description, status, expires_at, created_at";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const svc = getServiceClient();
  if (!svc) return NextResponse.json({ ready: false, counts: null, quotes: [] });

  const countFor = (status: string) =>
    svc
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

  const [pendingC, approvedC, rejectedC, closedC, interestsC, list] = await Promise.all([
    countFor("pending"),
    countFor("approved"),
    countFor("rejected"),
    countFor("closed"),
    svc.from("quote_interests").select("id", { count: "exact", head: true }),
    svc
      .from("quote_requests")
      .select(FIELDS)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (list.error) {
    if (isQuotesTableMissing(list.error)) {
      return NextResponse.json({ ready: false, counts: null, quotes: [] });
    }
    console.error("[ADMIN QUOTES] Lista falhou:", list.error.message);
    return NextResponse.json({ ready: false, counts: null, quotes: [] });
  }

  adminLog("quotes.list", { by: auth.email, total: list.data?.length ?? 0 });

  return NextResponse.json({
    ready: true,
    counts: {
      pending: pendingC.count ?? 0,
      approved: approvedC.count ?? 0,
      rejected: rejectedC.count ?? 0,
      closed: closedC.count ?? 0,
      interests: interestsC.count ?? 0,
    },
    quotes: list.data || [],
  });
}
