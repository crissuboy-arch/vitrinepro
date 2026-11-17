-- ============================================================
-- VitrinePro — FASE 1 "VITRINE FLASH" — Promoções
-- Migration 20261117000024_promotions_flash.sql
--
-- ADITIVA. NÃO destrutiva. Aplicação MANUAL no Supabase SQL Editor.
-- NÃO aplicar automaticamente.
--
-- O que faz:
--   1. Adiciona business_posts.original_price (preço antes da promoção).
--      A promoção continua a ser um business_posts com type='promocao':
--      price = preço promocional, original_price = preço original.
--   2. Constraint: original_price, quando existe, é >= price.
--   3. Índice parcial para listar promoções ativas rapidamente.
--   4. Trigger de LIMITE DE PROMOÇÕES ATIVAS POR PLANO, aplicado no
--      backend (base de dados) — impossível de contornar pela API/UI:
--        Free €0        → 1 promoção ativa
--        Pro €12/mês    → 5 promoções ativas (inclui legados premium/gold)
--        Business €29,90→ 20 promoções ativas
--      "Ativa" = type='promocao' AND is_active=true AND não expirada
--      (expires_at NULL ou > now()). Promoções agendadas (starts_at no
--      futuro) contam para o limite — ocupam o lugar.
--      A proprietária da plataforma (emails de PLATFORM_OWNER_EMAILS,
--      mesmos defaults de lib/owner-entitlement.ts) conta como Business,
--      tal como no entitlement efetivo da aplicação — sem alterar o plano
--      gravado de nenhuma Montra.
--
-- NÃO altera: planos, preços, policies RLS, dados existentes.
-- Rollback manual (se algum dia for preciso):
--   DROP TRIGGER IF EXISTS trg_enforce_promotion_limit ON public.business_posts;
--   DROP FUNCTION IF EXISTS public.enforce_promotion_limit();
--   ALTER TABLE public.business_posts DROP CONSTRAINT IF EXISTS business_posts_original_price_check;
--   ALTER TABLE public.business_posts DROP COLUMN IF EXISTS original_price;
-- ============================================================

-- 1. Coluna do preço original -------------------------------------------
ALTER TABLE public.business_posts
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);

-- 2. Sanidade: preço original nunca inferior ao promocional -------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_posts_original_price_check'
  ) THEN
    ALTER TABLE public.business_posts
      ADD CONSTRAINT business_posts_original_price_check CHECK (
        original_price IS NULL
        OR price IS NULL
        OR original_price >= price
      );
  END IF;
END $$;

-- 3. Índice parcial: promoções ativas por negócio ------------------------
CREATE INDEX IF NOT EXISTS idx_business_posts_active_promotions
  ON public.business_posts (business_id, expires_at)
  WHERE type = 'promocao' AND is_active = true;

-- 4. Limite de promoções ativas por plano (backend) ----------------------
CREATE OR REPLACE FUNCTION public.enforce_promotion_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan  text;
  v_email text;
  v_limit int;
  v_count int;
BEGIN
  -- Só promoções contam; os outros 7 tipos de novidade não têm limite.
  IF NEW.type <> 'promocao' THEN
    RETURN NEW;
  END IF;

  -- Post desativado ou já expirado não ocupa lugar.
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RETURN NEW;
  END IF;

  SELECT b.plan, u.email
    INTO v_plan, v_email
    FROM public.businesses b
    LEFT JOIN auth.users u ON u.id = b.user_id
   WHERE b.id = NEW.business_id;

  -- Limite por plano (espelha lib/plans.ts: normalizePlan).
  -- Proprietária da plataforma → Business (entitlement efetivo,
  -- lib/owner-entitlement.ts; defaults de PLATFORM_OWNER_EMAILS).
  IF lower(coalesce(v_email, '')) IN ('cris.suboy@gmail.com', 'geralvitrinepropt@gmail.com') THEN
    v_limit := 20;
  ELSIF lower(coalesce(v_plan, '')) = 'business' THEN
    v_limit := 20;
  ELSIF lower(coalesce(v_plan, '')) IN ('pro', 'premium', 'gold') THEN
    v_limit := 5;
  ELSE
    v_limit := 1;
  END IF;

  SELECT count(*)
    INTO v_count
    FROM public.business_posts
   WHERE business_id = NEW.business_id
     AND type = 'promocao'
     AND is_active = true
     AND (expires_at IS NULL OR expires_at > now())
     AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'LIMITE_PROMOCOES_ATINGIDO: o teu plano permite no máximo % promoção(ões) ativa(s). Desativa ou deixa expirar uma promoção atual antes de publicar outra.', v_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_promotion_limit ON public.business_posts;

CREATE TRIGGER trg_enforce_promotion_limit
  BEFORE INSERT OR UPDATE ON public.business_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_promotion_limit();
