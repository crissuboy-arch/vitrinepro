-- ============================================================
-- LIMPEZA DEMO — SIMULAÇÃO (VitrinPro A10.2)
-- Script único, executável numa única chamada.
-- BEGIN e ROLLBACK no mesmo script: NADA é persistido.
-- NÃO contém COMMIT. NÃO toca auth.users.
-- ============================================================

BEGIN;

-- ── BEFORE: valida exatamente os 2 UUIDs demo ───────────────
-- Esperado: 2 linhas, nomes exatos, published=true.
SELECT id, name, published FROM public.businesses
WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222')
ORDER BY name;

-- Contagens por tabela dependente (só dos 2 negócios)
SELECT 'products'         AS tabela, COUNT(*) AS n FROM public.products
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'testimonials'     AS tabela, COUNT(*) AS n FROM public.testimonials
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'business_images'  AS tabela, COUNT(*) AS n FROM public.business_images
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'gallery_images'   AS tabela, COUNT(*) AS n FROM public.gallery_images
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'business_posts'   AS tabela, COUNT(*) AS n FROM public.business_posts
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'favorites'        AS tabela, COUNT(*) AS n FROM public.favorites
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'business_likes'   AS tabela, COUNT(*) AS n FROM public.business_likes
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'business_shares'  AS tabela, COUNT(*) AS n FROM public.business_shares
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'page_buttons'     AS tabela, COUNT(*) AS n FROM public.page_buttons
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'reviews'          AS tabela, COUNT(*) AS n FROM public.reviews
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'short_links'      AS tabela, COUNT(*) AS n FROM public.short_links
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'collection_items' AS tabela, COUNT(*) AS n FROM public.collection_items
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'business_analytics' AS tabela, COUNT(*) AS n FROM public.business_analytics
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'leads'            AS tabela, COUNT(*) AS n FROM public.leads
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'catalogs'         AS tabela, COUNT(*) AS n FROM public.catalogs
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'content_calendar' AS tabela, COUNT(*) AS n FROM public.content_calendar
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

-- ── DELETEs (filhos primeiro; explícitos mesmo com CASCADE confirmado) ──
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
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.catalogs
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
DELETE FROM public.content_calendar
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

-- Por fim: os 2 negócios
DELETE FROM public.businesses
WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

-- ── AFTER (dentro da transação): tudo deve ser 0 ────────────
SELECT 'businesses_restantes'   AS check, COUNT(*) AS n FROM public.businesses
WHERE id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'products_restantes'     AS check, COUNT(*) AS n FROM public.products
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'testimonials_restantes' AS check, COUNT(*) AS n FROM public.testimonials
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'posts_restantes'        AS check, COUNT(*) AS n FROM public.business_posts
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'likes_restantes'        AS check, COUNT(*) AS n FROM public.business_likes
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');
SELECT 'reviews_restantes'      AS check, COUNT(*) AS n FROM public.reviews
WHERE business_id IN ('b1111111-1111-4111-a111-111111111111','b2222222-2222-4222-a222-222222222222');

-- Simulação: descarta tudo. NADA é persistido.
ROLLBACK;
