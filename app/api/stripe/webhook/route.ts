import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

  try {
    log(`[STRIPE WEBHOOK] Event: ${event.type} (${event.id})`);

    // A2.6 — Idempotency: Stripe may redeliver events. Skip already-seen ids.
    // (If the stripe_events table doesn't exist yet, log and continue —
    //  the migration 20261004000004 creates it.)
    try {
      const { error: idemError } = await supabase
        .from("stripe_events")
        .insert({ event_id: event.id, type: event.type });
      if (idemError && idemError.code === "23505") {
        log(`[STRIPE WEBHOOK] Duplicate event ${event.id} — skipping`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      if (idemError) throw idemError;
    } catch (e) {
      if (e instanceof Error && e.message.includes("duplicate")) throw e;
      console.warn("[STRIPE WEBHOOK] Idempotency check unavailable:", e instanceof Error ? e.message : e);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const businessId = session.client_reference_id;
      const planId = session.metadata?.planId || "premium";

      if (!businessId) {
        console.warn("[STRIPE WEBHOOK] checkout.session.completed missing client_reference_id");
        return NextResponse.json({ received: true });
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
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Period ended after cancel_at_period_end — downgrade to free and clear subscription data
      const subscription = event.data.object;
      const businessId = subscription.metadata?.businessId;

      if (businessId) {
        log(`[STRIPE WEBHOOK] Subscription deleted for business ${businessId} — downgrading to free`);
        await supabase
          .from("businesses")
          .update({ plan: "free", stripe_subscription_id: null, subscription_cancel_at: null, stripe_subscription_status: "canceled" })
          .eq("id", businessId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook processing error";
    console.error("[STRIPE WEBHOOK] Processing error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
