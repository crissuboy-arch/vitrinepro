/**
 * app/api/admin/users/route.ts — A2.14
 *
 * Server-side admin user listing. The admin dashboard previously read
 * `profiles` directly with the anon key; under the canonical RLS
 * (profiles are strictly owner-scoped) that no longer works — and the
 * client-side ADMIN_EMAILS check was never real authorization.
 *
 * Access: service role, only after verifying the caller's session email
 * against the server-side ADMIN_EMAILS allowlist.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAILS = ["cris.suboy@gmail.com", "geralvitrinepropt@gmail.com"];

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return DEFAULT_ADMIN_EMAILS;
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getCallerEmail(request: Request): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) return user.email;
  } catch {
    // fall through
  }
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
    .from("profiles")
    .select("id, email, display_name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ADMIN USERS] Erro ao ler perfis:", error.message);
    return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}
