import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const PLAN_PRICE_MAP: Record<string, string> = {
  premium: process.env.STRIPE_PRICE_PREMIUM || "price_1TdcwCAMDgnZ14qnXRDpeJj9",
  pro: process.env.STRIPE_PRICE_PREMIUM || "price_1TdcwCAMDgnZ14qnXRDpeJj9",
  business: process.env.STRIPE_PRICE_BUSINESS || "price_1Tdd5QAMDgnZ14qnEVPYYncB",
};

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { planId, businessId } = await request.json();

    if (!planId || !businessId) {
      return NextResponse.json(
        { error: "planId e businessId são obrigatórios." },
        { status: 400 }
      );
    }

    const priceId = PLAN_PRICE_MAP[planId];
    if (!priceId) {
      return NextResponse.json(
        { error: `Plano inválido: '${planId}'. Escolha 'premium' ou 'business'.` },
        { status: 400 }
      );
    }

    // NEXT_PUBLIC_APP_URL is the canonical origin — more reliable than request headers behind proxies
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (() => {
        const host = request.headers.get("host") || "localhost:3000";
        const proto = request.headers.get("x-forwarded-proto") || "http";
        return `${proto}://${host}`;
      })();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: businessId,
      // Session metadata for checkout.session.completed
      metadata: { planId, businessId },
      // Subscription metadata for invoice.payment_succeeded (renewals)
      subscription_data: {
        metadata: { planId, businessId },
      },
      success_url: `${origin}/dashboard?success=stripe&plan=${planId}`,
      cancel_url: `${origin}/dashboard?cancel=stripe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[STRIPE CHECKOUT] Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout.", details: errorMsg },
      { status: 500 }
    );
  }
}
