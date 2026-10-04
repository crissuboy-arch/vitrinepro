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
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAILS = ["cris.suboy@gmail.com"];

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return list.map((e) => e.toLowerCase());
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

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
  if (!email || !getAdminEmails().includes(email.toLowerCase())) {
    // Same response for unauthenticated and non-admin: no oracle.
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
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
