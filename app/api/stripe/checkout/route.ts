/**
 * app/api/stripe/checkout/route.ts — A2.5 (hardened) + A2.7/A2.9
 *
 * BEFORE: created a Stripe session for ANY businessId with no
 * authentication and no ownership check — anyone could start (or probe)
 * checkouts for other merchants' businesses. Live price IDs were
 * hard-coded as fallbacks, and the URL fallback used vitrinepro.pt.
 *
 * AFTER:
 *  - Requires an authenticated session (cookie) or Bearer token.
 *  - Verifies the caller OWNS the business (user_id match).
 *  - planId validated server-side against the CHECKOUT_PLANS allowlist.
 *  - Stripe Price IDs come ONLY from env (no hard-coded live IDs).
 *  - Base URL from lib/site (canonical https://vitrinepro.pt fallback).
 *  - No internal error details leaked to the client.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase-server";
import { CHECKOUT_PLANS, normalizePlan, getStripePriceId, type PlanId } from "@/lib/plans";
import { getSiteUrlFromRequest } from "@/lib/site";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getCallerId(request: Request): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user.id;
  } catch {
    // fall through to Bearer
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user?.id || null;
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  // 1. Authentication required.
  const callerId = await getCallerId(request);
  if (!callerId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { planId, businessId } = (body || {}) as Record<string, unknown>;

  if (typeof planId !== "string" || typeof businessId !== "string" || !businessId) {
    return NextResponse.json(
      { error: "planId e businessId são obrigatórios." },
      { status: 400 }
    );
  }

  // 2. Plan allowlist validated server-side (never trust the client).
  const plan = normalizePlan(planId);
  if (!(CHECKOUT_PLANS as string[]).includes(plan)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  // 3. Price ID from env only — no hard-coded live price IDs (A2.7).
  const priceId = getStripePriceId(plan as PlanId);
  if (!priceId) {
    console.error(`[STRIPE CHECKOUT] Price ID em falta para o plano '${plan}' (env).`);
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  // 4. Ownership: the caller must own the business being upgraded.
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  const { data: business } = await admin
    .from("businesses")
    .select("id, user_id, plan")
    .eq("id", businessId)
    .eq("user_id", callerId)
    .maybeSingle();

  if (!business) {
    // Same response whether the business doesn't exist or belongs to
    // someone else: no oracle for enumeration.
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  const baseUrl = getSiteUrlFromRequest(request);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: business.id,
      metadata: { planId: plan, businessId: business.id },
      subscription_data: {
        metadata: { planId: plan, businessId: business.id },
      },
      // The dashboard reads success=stripe / cancel=stripe.
      success_url: `${baseUrl}/dashboard?success=stripe&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard?cancel=stripe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE CHECKOUT] Falha ao criar sessão:", error instanceof Error ? error.message : "desconhecido");
    return NextResponse.json({ error: "Erro ao criar sessão de checkout." }, { status: 500 });
  }
}
