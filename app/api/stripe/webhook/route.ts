import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

  const stripe = new Stripe(stripeKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    if (endpointSecret) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
      }
      const rawBody = await request.text();
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } else {
      console.warn("[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
      event = await request.json();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[STRIPE WEBHOOK] Signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    console.log(`[STRIPE WEBHOOK] Event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const businessId = session.client_reference_id;
      const planId = session.metadata?.planId || "premium";

      if (!businessId) {
        console.warn("[STRIPE WEBHOOK] checkout.session.completed missing client_reference_id");
        return NextResponse.json({ received: true });
      }

      console.log(`[STRIPE WEBHOOK] Updating plan '${planId}' for business ${businessId}`);
      const { error } = await supabase
        .from("businesses")
        .update({ plan: planId })
        .eq("id", businessId);

      if (error) {
        console.error("[STRIPE WEBHOOK] Supabase update error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[STRIPE WEBHOOK] Plan updated successfully`);
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
          console.log(`[STRIPE WEBHOOK] Renewal: updating plan '${planId}' for business ${businessId}`);
          const { error } = await supabase
            .from("businesses")
            .update({ plan: planId })
            .eq("id", businessId);

          if (error) {
            console.error("[STRIPE WEBHOOK] Renewal update error:", error.message);
          }
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Cancellation: downgrade to free
      const subscription = event.data.object;
      const businessId = subscription.metadata?.businessId;

      if (businessId) {
        console.log(`[STRIPE WEBHOOK] Subscription cancelled for business ${businessId} — downgrading to free`);
        await supabase
          .from("businesses")
          .update({ plan: "free" })
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
