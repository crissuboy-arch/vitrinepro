/**
 * app/api/auth/entitlement/route.ts
 *
 * GET → { isOwner: boolean }
 *
 * Verificação server-side: a sessão é lida no servidor e o email é
 * comparado com a allowlist PLATFORM_OWNER_EMAILS (lib/owner-entitlement).
 * O frontend NUNCA decide sozinho — apenas consome o booleano.
 */

import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { isOwnerEmail } from "@/lib/owner-entitlement";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json({ isOwner: isOwnerEmail(user?.email) });
  } catch {
    return NextResponse.json({ isOwner: false });
  }
}
