-- Migration: Add Stripe subscription tracking columns
-- Run this in the Supabase SQL Editor before deploying this feature

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at  TIMESTAMPTZ;
