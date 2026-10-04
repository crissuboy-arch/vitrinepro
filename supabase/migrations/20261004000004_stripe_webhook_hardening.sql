-- ============================================================
-- VitrinePro — A2.6 Stripe webhook hardening (ADDITIVE, IDEMPOTENT)
-- Date: 2026-10-04 — Fase A2 (Fundação Segura)
--
-- 1. stripe_events: idempotency ledger for webhook events.
--    Stripe may redeliver events; the webhook skips event_ids already seen.
-- 2. businesses.stripe_subscription_status: mirrors Stripe's subscription
--    status so invoice.payment_failed can be recorded WITHOUT immediately
--    downgrading the plan on a transient failure.
--
-- No data is modified. Safe to run multiple times.
-- DO NOT APPLY BLINDLY IN PRODUCTION — verify migration order first
-- (Supabase Dashboard → Database → Migrations).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id   TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No direct client access: only service_role (webhook) touches this table.
-- (No policies = deny for anon/authenticated; service_role bypasses RLS.)

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_stripe_events_created
  ON public.stripe_events(created_at);
