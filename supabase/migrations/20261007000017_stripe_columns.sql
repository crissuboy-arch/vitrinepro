-- Migration: PROPOSTA — NÃO APLICAR sem revisão
-- A10.1 CRITICAL 2: alinhar schema com código Stripe
--
-- Problema: o código usa stripe_subscription_id, stripe_customer_id e
-- subscription_cancel_at, mas só stripe_subscription_status existe no schema.
--
-- Esta migration adiciona as colunas em falta. NÃO remove nada.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ,
  -- A10.1C: proteção contra eventos Stripe fora de ordem.
  -- Guarda o timestamp do evento mais recente aplicado; eventos mais antigos
  -- são ignorados para não regredir plan/status.
  ADD COLUMN IF NOT EXISTS stripe_last_event_at TIMESTAMPTZ;

-- Índices para lookup por Stripe IDs (webhook)
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer
  ON public.businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription
  ON public.businesses(stripe_subscription_id);

-- Verificação pós-aplicação:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='businesses' AND column_name LIKE 'stripe_%';
-- Deve listar: stripe_subscription_status, stripe_customer_id, stripe_subscription_id
