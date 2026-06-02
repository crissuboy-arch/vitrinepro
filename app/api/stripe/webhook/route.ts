import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(request: Request) {
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    if (endpointSecret) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "Falta assinatura do webhook." }, { status: 400 });
      }
      const rawBody = await request.text();
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } else {
      console.warn("[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET não configurada. A processar JSON diretamente.");
      event = await request.json();
    }

    const eventType = event.type;
    console.log(`[STRIPE WEBHOOK] Evento recebido: ${eventType}`);

    if (eventType === "checkout.session.completed") {
      const session = event.data.object;
      const businessId = session.client_reference_id;
      const planId = session.metadata?.planId || "pro";

      if (businessId) {
        console.log(`[STRIPE WEBHOOK] Atualizar plano para ${planId} no negócio ${businessId}`);
        const { error } = await supabase
          .from("businesses")
          .update({ plan: planId })
          .eq("id", businessId);

        if (error) {
          console.error("[STRIPE WEBHOOK] Erro ao atualizar Supabase:", error.message);
          throw error;
        }
        console.log(`[STRIPE WEBHOOK] Sucesso ao atualizar plano do negócio ${businessId}`);
      }
    } else if (eventType === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      
      // If we need to fetch subscription details from Stripe
      if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const businessId = subscription.metadata?.businessId;
        const planId = subscription.metadata?.planId;

        if (businessId && planId) {
          console.log(`[STRIPE WEBHOOK] Atualizar pagamento bem-sucedido para ${planId} no negócio ${businessId}`);
          await supabase
            .from("businesses")
            .update({ plan: planId })
            .eq("id", businessId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro de webhook desconhecido";
    console.error("[STRIPE WEBHOOK] Error handling event:", error);
    return NextResponse.json(
      { error: "Erro de processamento do webhook Stripe.", details: errorMsg },
      { status: 400 }
    );
  }
}
