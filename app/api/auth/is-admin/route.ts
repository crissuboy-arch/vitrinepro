/**
 * app/api/auth/is-admin/route.ts — A6.5 fix (iPhone smoke)
 *
 * Verificação de admin NO SERVIDOR para controlar a visibilidade de
 * controlos administrativos (ex.: "Painel do Dono" no /explorar).
 *
 * Regra do brief: não confiar somente em email hardcoded no frontend.
 * A allowlist vive no servidor (env ADMIN_EMAILS, com fallback para os
 * mesmos endereços já usados nas rotas /api/admin/*). O frontend apenas
 * consome { isAdmin: boolean } — nunca decide sozinho.
 */

import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAILS = ["cris.suboy@gmail.com", "geralvitrinepropt@gmail.com"];

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return list.map((e) => e.toLowerCase());
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ isAdmin: false });
    const isAdmin = getAdminEmails().includes(user.email.toLowerCase());
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
