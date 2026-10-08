-- ============================================================
-- LIMPEZA DEMO — EXECUÇÃO DEFINITIVA (VitrinePro A10.2)
-- NÃO EXECUTADO — aguardando autorização e revisão manual.
--
-- Remove SOMENTE os 2 negócios demo + dependentes.
-- Transação única, autocontida: BEGIN ... COMMIT no mesmo script.
-- Qualquer verificação que falhe → RAISE EXCEPTION → transação
-- abortada → COMMIT não persiste nada.
-- NÃO toca auth.users. NÃO toca outros negócios.
-- ============================================================

BEGIN;

-- ── BEFORE: validação estrita (aborta se divergir) ──────────
DO $$
DECLARE
  v_biz   INT;
  v_prod  INT;
  v_test  INT;
BEGIN
  SELECT COUNT(*) INTO v_biz FROM public.businesses
  WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_biz <> 2 THEN
    RAISE EXCEPTION 'BEFORE: esperava 2 negócios demo, encontrou %', v_biz;
  END IF;

  PERFORM 1 FROM public.businesses
  WHERE id = 'b1111111-1111-4111-a111-111111111111' AND name = 'Sabores da Terra';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BEFORE: negócio 1 não é Sabores da Terra — abortando';
  END IF;

  PERFORM 1 FROM public.businesses
  WHERE id = 'b2222222-2222-4222-a222-222222222222' AND name = 'Studio Bella';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BEFORE: negócio 2 não é Studio Bella — abortando';
  END IF;

  SELECT COUNT(*) INTO v_prod FROM public.products
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_prod <> 4 THEN
    RAISE EXCEPTION 'BEFORE: esperava 4 produtos demo, encontrou %', v_prod;
  END IF;

  SELECT COUNT(*) INTO v_test FROM public.testimonials
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_test <> 3 THEN
    RAISE EXCEPTION 'BEFORE: esperava 3 testimonials demo, encontrou %', v_test;
  END IF;
END $$;

-- ── DELETEs: filhos primeiro ────────────────────────────────
DELETE FROM public.collection_items
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.business_posts
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.gallery_images
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.business_images
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.testimonials
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.products
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.favorites
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.business_likes
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.business_shares
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.page_buttons
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.reviews
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.short_links
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.business_analytics
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.leads
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.catalogs
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.content_calendar
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

DELETE FROM public.businesses
WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

-- ── AFTER: tudo deve ser 0 (aborta se restar algo) ──────────
DO $$
DECLARE
  v_rest INT;
BEGIN
  SELECT COUNT(*) INTO v_rest FROM public.businesses
  WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % negócios', v_rest; END IF;

  SELECT COUNT(*) INTO v_rest FROM public.products
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % produtos', v_rest; END IF;

  SELECT COUNT(*) INTO v_rest FROM public.testimonials
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % testimonials', v_rest; END IF;

  SELECT COUNT(*) INTO v_rest FROM public.business_posts
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % posts', v_rest; END IF;

  SELECT COUNT(*) INTO v_rest FROM public.business_images
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % imagens', v_rest; END IF;

  SELECT COUNT(*) INTO v_rest FROM public.gallery_images
  WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
  IF v_rest <> 0 THEN RAISE EXCEPTION 'AFTER: restam % gallery', v_rest; END IF;
END $$;

-- Só chega aqui se BEFORE e AFTER passaram.
COMMIT;
