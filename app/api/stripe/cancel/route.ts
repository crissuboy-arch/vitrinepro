import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

  // No Stripe subscription ID — plan was set manually, downgrade immediately
  if (!business.stripe_subscription_id) {
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
  } catch (err: any) {
    console.error("[STRIPE CANCEL]", err);

    // Subscription no longer exists in Stripe — just downgrade
    if (err.statusCode === 404 || err.code === "resource_missing") {
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
