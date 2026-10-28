-- Migration: 20261028000022_businesses_admin_pro_grant.sql
-- Pro ADMINISTRATIVO (cortesia permanente, sem Stripe) — correção Cantinho da Lu.
--
-- PROBLEMA PROVADO NO CÓDIGO (2026-10-28):
--   * app/api/stripe/webhook/route.ts (customer.subscription.deleted) faz
--     UPDATE plan='free' para qualquer businessId nos metadados da
--     subscrição — sem distinguir Pro pago de Pro concedido pela admin.
--   * app/api/stripe/cancel/route.ts, sem stripe_subscription_id, comenta
--     "plan was set manually, downgrade immediately" e faz plan='free'.
-- Um Pro concedido manualmente (sem subscrição Stripe) era, por isso,
-- apagável por rotinas de sincronização/cancelamento. Esta migration cria
-- a distinção que faltava; a proteção é aplicada no código (webhook e
-- cancel leem a flag e NÃO rebaixam quando ela está ativa).
--
-- SEMÂNTICA:
--   businesses.admin_pro_grant = true  → Pro concedido pela administração
--     (cortesia permanente, sem cobrança, sem assinatura Stripe).
--     NENHUMA rotina Stripe pode rebaixar o plano enquanto a flag estiver
--     ativa. Só a admin pode conceder/revogar (PATCH /api/admin/businesses/[id],
--     service_role). Revogar a flag NÃO altera o plano sozinha — a admin
--     gere o plano explicitamente no mesmo ou noutro PATCH.
--   businesses.admin_pro_grant = false → plano regido pelo Stripe (ou manual
--     sem proteção): as rotinas atuais aplicam-se normalmente.
--
-- Aditiva apenas. NÃO aplicar automaticamente em produção — aplicar
-- manualmente no SQL Editor DEPOIS de confirmar a ordem das migrations
-- (Dashboard → Database → Migrations) e ANTES do deploy do código que lê
-- esta coluna. O código degrada-se com segurança pré-migration (a lista
-- admin assume false; o webhook/cancel leem a flag e tratam ausência
-- como false).
--
-- ─── 1. Coluna ────────────────────────────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS admin_pro_grant BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.businesses.admin_pro_grant IS
  'Admin-only: Pro concedido pela administração como cortesia permanente, '
  'sem cobrança e sem assinatura Stripe. Enquanto true, nenhuma rotina '
  'Stripe (webhook customer.subscription.deleted, cancel) pode rebaixar o '
  'plano. Só a admin concede/revoga (API admin, service_role). Default false.';

-- ─── 2. Carimbo (auditoria, opcional) ────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS admin_pro_granted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.businesses.admin_pro_granted_at IS
  'Instante em que o Pro administrativo foi concedido (NULL = nunca ou revogado). '
  'Preenchido/limpo pelo PATCH admin em conjunto com admin_pro_grant.';

-- ─── VERIFICAÇÃO (manual, após aplicar) ───────────────────────────────
-- 1. Colunas e defaults:
--    SELECT column_name, column_default, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'businesses'
--      AND column_name IN ('admin_pro_grant', 'admin_pro_granted_at');
--    → admin_pro_grant: default 'false', is_nullable 'NO'.
-- 2. Nenhuma Montra ficou com Pro administrativo pela migration:
--    SELECT count(*) FROM public.businesses WHERE admin_pro_grant = true;
--    → 0 (a concessão da Cantinho da Lu é feita pelo SQL de reparação
--      próprio, com guardas por slug+nome, NÃO por esta migration).
