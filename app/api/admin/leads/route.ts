/**
 * app/api/admin/leads/route.ts — A2.14
 *
 * BEFORE: app/admin/page.tsx read the `leads` table directly with the anon
 * key; the only "authorization" was a client-side ADMIN_EMAILS array.
 * Anyone authenticated could bypass the UI and read all leads via RLS
 * (see A2.3) — a PII leak.
 *
 * AFTER: leads are read with the service role on the server, only after
 * verifying the caller's session AND that their email is in the server-side
 * ADMIN_EMAILS allowlist (env ADMIN_EMAILS, comma-separated).
 * The UI may hide controls, but it is no longer the authorization mechanism.
 */

import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
// I4-C (A10.2): allowlist e service client vêm do helper central —
// cópia local eliminada (era divergência com @/lib/admin-auth).
import { getAdminEmails, getServiceClient } from "@/lib/admin-auth";

export const runtime = "nodejs";

async function getCallerEmail(request: Request): Promise<string | null> {
  // 1. Cookie session (dashboard usage)
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) return user.email;
  } catch {
    // fall through
  }
  // 2. Bearer token
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const admin = getServiceClient();
    if (admin) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user?.email) return data.user.email;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const email = await getCallerEmail(request);
  // I4-D (A10.2): 401 não autenticado, 403 autenticado sem permissão.
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!getAdminEmails().includes(email.toLowerCase())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const admin = getServiceClient();
  if (!admin) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") || "200");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

  const { data, error } = await admin
    .from("leads")
    .select("id, name, email, whatsapp, business_type, source, business_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ADMIN LEADS] Erro ao ler leads:", error.message);
    return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 });
  }

  return NextResponse.json({ leads: data || [] });
}
