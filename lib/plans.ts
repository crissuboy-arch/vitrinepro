/**
 * lib/plans.ts — A2.8
 *
 * SOURCE OF TRUTH for plan names, prices and entitlements.
 *
 * Temporary commercial reference (until Cristiane decides otherwise):
 *   FREE    = €0
 *   PRO     = €12/mês
 *   BUSINESS = €29,90/mês
 *
 * Legacy aliases seen in the codebase: "premium" and "gold" are treated
 * as PRO-level. Do NOT scatter prices across components — import from here.
 *
 * Stripe Price IDs always come from env (STRIPE_PRICE_PREMIUM /
 * STRIPE_PRICE_BUSINESS). Never hard-code live price IDs.
 */

export type PlanId = "free" | "pro" | "business";
export type PlanInput = PlanId | "premium" | "gold" | string;

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** monthly price in EUR */
  priceEur: number;
  priceLabel: string;
  chatbot: boolean;
  maxProducts: number | null; // null = unlimited
  analytics: boolean;
  seo: boolean;
  customDomain: boolean;
  onlineStore: boolean;
}

/** Canonical plan catalog. */
export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Grátis",
    priceEur: 0,
    priceLabel: "€0",
    chatbot: false,
    maxProducts: 3,
    analytics: false,
    seo: false,
    customDomain: false,
    onlineStore: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceEur: 12,
    priceLabel: "€12",
    chatbot: true,
    maxProducts: null,
    analytics: true,
    seo: true,
    customDomain: true,
    onlineStore: false,
  },
  business: {
    id: "business",
    name: "Business",
    priceEur: 29.9,
    priceLabel: "€29,90",
    chatbot: true,
    maxProducts: null,
    analytics: true,
    seo: true,
    customDomain: true,
    onlineStore: true,
  },
};

/** Plans accepted by Stripe checkout (server-side allowlist). */
export const CHECKOUT_PLANS: PlanId[] = ["pro", "business"];

/**
 * Normalizes legacy/variant plan strings to a canonical PlanId.
 * Unknown values fall back to "free" (never escalate privileges).
 */
export function normalizePlan(plan: PlanInput | null | undefined): PlanId {
  const p = String(plan || "").toLowerCase().trim();
  if (p === "business") return "business";
  if (p === "pro" || p === "premium" || p === "gold") return "pro";
  return "free";
}

/** Server-side entitlement check: may this plan use the AI chatbot? */
export function planHasChatbot(plan: PlanInput | null | undefined): boolean {
  return PLANS[normalizePlan(plan)].chatbot;
}

/** Stripe Price ID for a checkout plan — env only, no hard-coded live IDs. */
export function getStripePriceId(plan: PlanId): string | null {
  if (plan === "pro") return process.env.STRIPE_PRICE_PREMIUM || null;
  if (plan === "business") return process.env.STRIPE_PRICE_BUSINESS || null;
  return null;
}
