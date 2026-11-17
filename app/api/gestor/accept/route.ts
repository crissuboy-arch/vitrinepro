/**
 * POST /api/gestor/accept — a pessoa convidada aceita o convite.
 * Exige sessão com o MESMO email do convite: vincula o user_id e
 * ativa a gestora. É o passo de consentimento — sem ele, o convite
 * não dá acesso a nada.
 */
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/admin-auth";
import { normalizeManagerEmail, isMissingTableError, gestorNotReadyResponse, gestorAudit } from "@/lib/gestor-auth";

export async function POST() {
  const svc = getServiceClient();
  if (!svc) return gestorNotReadyResponse();
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const email = normalizeManagerEmail(user.email);
    const { data: manager, error } = await svc
      .from("montra_managers")
      .select("id, email, status")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    if (!manager) {
      return NextResponse.json({ status: "none" });
    }
    if (manager.status === "revoked") {
      return NextResponse.json({ status: "revoked" });
    }
    if (manager.status === "active") {
      return NextResponse.json({ status: "active", managerId: manager.id });
    }
    const { error: upErr } = await svc
      .from("montra_managers")
      .update({ user_id: user.id, status: "active", accepted_at: new Date().toISOString() })
      .eq("id", manager.id);
    if (upErr) throw upErr;
    await gestorAudit(svc, { managerId: manager.id, email, action: "manager.accept" });
    return NextResponse.json({ status: "active", managerId: manager.id });
  } catch (err) {
    if (isMissingTableError(err)) return gestorNotReadyResponse();
    return NextResponse.json({ error: "Não foi possível aceitar o convite." }, { status: 500 });
  }
}
