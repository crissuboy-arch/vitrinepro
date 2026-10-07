import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { normalizePlan } from "@/lib/plans";

// M12: only emit verbose logs outside production to avoid leaking IDs/PII in Vercel logs.
const isProd = process.env.NODE_ENV === "production";
const log = (...args: unknown[]) => {
  if (!isProd) console.log(...args);
};

// Service role client — bypasses RLS so the plan update always succeeds
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // C1: never process an unsigned webhook. If the signing secret is missing we
  // refuse the request instead of trusting arbitrary, unverified JSON.
  if (!endpointSecret) {
    console.error("[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not set — refusing unverified webhook");
    return NextResponse.json({ error: "Webhook signing secret not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[STRIPE WEBHOOK] Signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // A10.1C: proteção contra eventos fora de ordem.
  // Retorna true se o evento deve ser aplicado (é mais novo que o último).
  // Usa event.created (timestamp Stripe, segundos) como relógio.
  async function shouldApplyEvent(businessId: string, eventCreated: number): Promise<boolean> {
    const eventAt = new Date(eventCreated * 1000).toISOString();
    const { data } = await supabase
      .from("businesses")
      .select("stripe_last_event_at")
      .eq("id", businessId)
      .maybeSingle();
    const lastAt = data?.stripe_last_event_at;
    if (lastAt && new Date(lastAt) >= new Date(eventAt)) {
      log(`[STRIPE WEBHOOK] Evento antigo ignorado (last: ${lastAt}, event: ${eventAt})`);
      return false;
    }
    return true;
  }

  async function markEventApplied(businessId: string, eventCreated: number): Promise<void> {
    await supabase
      .from("businesses")
      .update({ stripe_last_event_at: new Date(eventCreated * 1000).toISOString() })
      .eq("id", businessId);
  }

  try {
    log(`[STRIPE WEBHOOK] Event: ${event.type} (${event.id})`);

    // A10.1 CRITICAL 3 — Idempotência SEGURA:
    // NÃO registra o evento antes de processar. Em vez disso:
    // 1. Verifica se já foi processado (SELECT).
    // 2. Processa o efeito.
    // 3. SÓ então registra como processado.
    // Se o passo 2 falhar, o retry do Stripe reprocessa com segurança.
    const { data: alreadyProcessed } = await supabase
      .from("stripe_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (alreadyProcessed) {
      log(`[STRIPE WEBHOOK] Duplicate event ${event.id} — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const businessId = session.client_reference_id;
      // A2.5: store the canonical plan id (legacy aliases normalized).
      const planId = normalizePlan(session.metadata?.planId || "premium");

      if (!businessId) {
        console.warn("[STRIPE WEBHOOK] checkout.session.completed missing client_reference_id");
        return NextResponse.json({ received: true });
      }

      // A10.1C: ignora checkout antigo (ex.: sessão abandonada concluída depois).
      if (!(await shouldApplyEvent(businessId, event.created))) {
        return NextResponse.json({ received: true, stale: true });
      }

      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
      const customerId = typeof session.customer === "string" ? session.customer : null;

      log(`[STRIPE WEBHOOK] Updating plan '${planId}' for business ${businessId} (sub: ${subscriptionId})`);
      const { error } = await supabase
        .from("businesses")
        .update({
          plan: planId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          stripe_subscription_status: "active",
          subscription_cancel_at: null, // clear any pending cancellation on new checkout
        })
        .eq("id", businessId);

      if (error) {
        console.error("[STRIPE WEBHOOK] Supabase update error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await markEventApplied(businessId, event.created);
      log(`[STRIPE WEBHOOK] Plan updated successfully`);
    } else if (event.type === "invoice.payment_succeeded") {
      // Renewals: subscription metadata contains businessId + planId
      // (set via subscription_data.metadata in checkout session creation)
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId && stripeKey) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const businessId = subscription.metadata?.businessId;
        const planId = subscription.metadata?.planId;

        if (businessId && planId) {
          log(`[STRIPE WEBHOOK] Renewal: updating plan '${planId}' for business ${businessId}`);
          const { error } = await supabase
            .from("businesses")
            .update({ plan: planId, stripe_subscription_status: "active" })
            .eq("id", businessId);

          if (error) {
            console.error("[STRIPE WEBHOOK] Renewal update error:", error.message);
          }
        }
      }
    } else if (event.type === "invoice.payment_failed") {
      // A2.6 — SAFE behavior: a failed payment does NOT immediately cancel
      // the plan (transient failures: expired card retry, SCA, etc.).
      // Record the Stripe status so the dashboard/support can follow up;
      // the plan is only downgraded when Stripe itself deletes the
      // subscription (customer.subscription.deleted).
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;

      if (subscriptionId) {
        let businessId: string | null = null;
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          businessId = subscription.metadata?.businessId || null;
        } catch (e) {
          console.error("[STRIPE WEBHOOK] payment_failed: sub retrieve falhou:", e instanceof Error ? e.message : e);
        }

        const { error } = await supabase
          .from("businesses")
          .update({ stripe_subscription_status: "past_due" })
          .eq(businessId ? "id" : "stripe_subscription_id", businessId || subscriptionId);

        if (error) {
          console.error("[STRIPE WEBHOOK] payment_failed update error:", error.message);
        } else {
          log(`[STRIPE WEBHOOK] payment_failed registado (past_due) para business ${businessId || subscriptionId} — plano mantido`);
        }
      } else {
        console.warn("[STRIPE WEBHOOK] invoice.payment_failed sem subscription");
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const businessId = subscription.metadata?.businessId;

      if (businessId) {
        // A10.1C: ignora evento antigo (não regredir entitlement).
        if (!(await shouldApplyEvent(businessId, event.created))) {
          return NextResponse.json({ received: true, stale: true });
        }
        // Mirror Stripe's subscription status (A2.6)
        await supabase
          .from("businesses")
          .update({ stripe_subscription_status: subscription.status || null })
          .eq("id", businessId);
        if (subscription.cancel_at_period_end && subscription.cancel_at) {
          const cancelAt = new Date(subscription.cancel_at * 1000).toISOString();
          log(`[STRIPE WEBHOOK] Subscription cancel scheduled for business ${businessId} at ${cancelAt}`);
          await supabase
            .from("businesses")
            .update({ subscription_cancel_at: cancelAt })
            .eq("id", businessId);
        } else if (!subscription.cancel_at_period_end) {
          // Reactivated — clear scheduled cancellation
          log(`[STRIPE WEBHOOK] Subscription reactivated for business ${businessId}`);
          await supabase
            .from("businesses")
            .update({ subscription_cancel_at: null })
            .eq("id", businessId);
        }
        await markEventApplied(businessId, event.created);
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Period ended after cancel_at_period_end — downgrade to free and clear subscription data
      const subscription = event.data.object;
      const businessId = subscription.metadata?.businessId;

      if (businessId) {
        // A10.1C: ignora evento antigo (ex.: deleted antigo após reativação nova).
        if (!(await shouldApplyEvent(businessId, event.created))) {
          return NextResponse.json({ received: true, stale: true });
        }
        log(`[STRIPE WEBHOOK] Subscription deleted for business ${businessId} — downgrading to free`);
        await supabase
          .from("businesses")
          .update({ plan: "free", stripe_subscription_id: null, subscription_cancel_at: null, stripe_subscription_status: "canceled" })
          .eq("id", businessId);
        await markEventApplied(businessId, event.created);
      }
    }

    // A10.1 CRITICAL 3: marca como processado SÓ após sucesso.
    // Se qualquer passo acima falhar, o evento NÃO é marcado e o retry
    // do Stripe reprocessa com segurança.
    const { error: markError } = await supabase
      .from("stripe_events")
      .insert({ event_id: event.id, type: event.type });
    if (markError && markError.code !== "23505") {
      console.error("[STRIPE WEBHOOK] Failed to mark event as processed:", markError.message);
      // Não falha a resposta — o efeito já foi aplicado; o próximo retry
      // verá o efeito idempotente (updates são idempotentes por natureza).
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook processing error";
    console.error("[STRIPE WEBHOOK] Processing error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
