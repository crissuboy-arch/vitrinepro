import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { shouldSkipStripeDowngrade } from "@/lib/admin-pro";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
  }

  // Auth: verify Supabase JWT from Authorization header
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  let businessId: string;
  try {
    ({ businessId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!businessId) {
    return NextResponse.json({ error: "businessId é obrigatório." }, { status: 400 });
  }

  // Ownership check — user must own the business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, plan, stripe_subscription_id, user_id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  if (business.plan === "free") {
    return NextResponse.json({ error: "Não existe subscrição ativa para cancelar." }, { status: 400 });
  }

  // Pro administrativo (correção Cantinho da Lu, 2026-10-28): lido em
  // consulta separada para a rota continuar a funcionar pré-migration
  // (a coluna ainda não existe → sem concessão → comportamento antigo).
  const { data: grantRow, error: grantErr } = await supabase
    .from("businesses")
    .select("admin_pro_grant")
    .eq("id", businessId)
    .maybeSingle();
  const adminGrant = !grantErr && shouldSkipStripeDowngrade(grantRow);

  // No Stripe subscription ID — plan was set manually. ANTES: rebaixava
  // imediatamente para free, o que apagava um Pro concedido pela admin
  // (cortesia, sem subscrição). AGORA: com Pro administrativo, não há
  // nada para cancelar e o Pro mantém-se.
  if (!business.stripe_subscription_id) {
    if (adminGrant) {
      return NextResponse.json({
        success: true,
        immediate: false,
        cancel_at: null,
        admin_grant_preserved: true,
      });
    }
    await supabase
      .from("businesses")
      .update({ plan: "free", subscription_cancel_at: null })
      .eq("id", businessId);
    return NextResponse.json({ success: true, immediate: true, cancel_at: null });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // cancel_at_period_end keeps access until billing period ends
    const subscription = await stripe.subscriptions.update(business.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const cancelAt = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;

    // Update immediately for responsive UI (webhook also confirms later)
    await supabase
      .from("businesses")
      .update({ subscription_cancel_at: cancelAt })
      .eq("id", businessId);

    console.log(`[STRIPE CANCEL] Business ${businessId} — cancels at ${cancelAt}`);
    return NextResponse.json({ success: true, immediate: false, cancel_at: cancelAt });
  } catch (err: unknown) {
    console.error("[STRIPE CANCEL]", err instanceof Error ? err.message : err);

    // Subscription no longer exists in Stripe — just downgrade, EXCETO com
    // Pro administrativo (a concessão da admin nunca é retirada por rotina
    // Stripe; limpam-se só os campos Stripe obsoletos).
    const stripeErr = err as { statusCode?: number; code?: string };
    if (stripeErr.statusCode === 404 || stripeErr.code === "resource_missing") {
      if (adminGrant) {
        await supabase
          .from("businesses")
          .update({ stripe_subscription_id: null, subscription_cancel_at: null })
          .eq("id", businessId);
        return NextResponse.json({
          success: true,
          immediate: false,
          cancel_at: null,
          admin_grant_preserved: true,
        });
      }
      await supabase
        .from("businesses")
        .update({ plan: "free", stripe_subscription_id: null, subscription_cancel_at: null })
        .eq("id", businessId);
      return NextResponse.json({ success: true, immediate: true, cancel_at: null });
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao cancelar no Stripe." },
      { status: 500 }
    );
  }
}
