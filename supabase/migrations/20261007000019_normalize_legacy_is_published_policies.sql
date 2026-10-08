-- Migration: 20261007000019_normalize_legacy_is_published_policies.sql
-- A10.2 I3 — DECISÃO DA CRIS: normalizar policies legadas para published canónico.
--
-- NÃO APLICADA — aguardando revisão e aplicação manual no Supabase.
--
-- Escopo: SOMENTE as duas policies que ainda usam o OR legado de is_published.
-- - vp_business_images_select (de 20261004000003)
-- - vp_testimonials_select (de 20261004000003)
--
-- Já normalizadas anteriormente (não tocadas aqui):
-- - vp_products_select (000015)
-- - vp_gallery_select (000015)
-- - vp_posts_select (000018)
--
-- NÃO faz DROP de coluna, NÃO altera dados, NÃO toca outras policies.

DROP POLICY IF EXISTS "vp_business_images_select" ON public.business_images;

CREATE POLICY "vp_business_images_select" ON public.business_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vp_testimonials_select" ON public.testimonials;

CREATE POLICY "vp_testimonials_select" ON public.testimonials
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR user_id = auth.uid())
  );

-- Verificação pós-aplicação:
-- 1. SELECT de imagem de negócio publicado (anon) → visível
-- 2. SELECT de imagem de negócio NÃO publicado (anon) → 0 linhas
-- 3. Owner vê as próprias imagens (autenticado)
-- 4. Mesmo para testimonials
