-- ============================================================
-- 20261007000015_fix_visibility_rls_canonical_published.sql
-- HOTFIX: policies SELECT passam a usar SOMENTE a fonte canónica
--         businesses.published (sem o OR da coluna legada).
--
-- Escopo mínimo: substitui APENAS
--   - vp_products_select
--   - vp_gallery_select
--
-- NÃO altera: colunas, dados, ownership, policies de escrita,
--             business_posts, outras policies. NÃO remove a coluna
--             outras policies. NÃO remove a coluna legada nesta tarefa.
--
-- Regra products:
--   - Dono (user_id = auth.uid()): SELECT de tudo, inclusive ocultos.
--   - Público: SOMENTE products.is_visible = true
--              AND businesses.published = true.
--   - show_in_explore NÃO entra na RLS: é distribuição no Explorar,
--     não privacidade global.
--
-- Regra gallery: idêntica, com gallery_images.is_visible.
-- ============================================================

-- ─── 1. Products — SELECT canónico ───────────────────────────
DROP POLICY IF EXISTS "vp_products_select" ON public.products;
CREATE POLICY "vp_products_select" ON public.products
  FOR SELECT USING (
    -- Dono: vê tudo, inclusive ocultos (gestão no dashboard).
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    OR (
      -- Público: só produto visível de Montra publicada (canónico).
      is_visible = true
      AND business_id IN (
        SELECT id FROM public.businesses WHERE published = true
      )
    )
  );

-- ─── 2. Gallery — SELECT canónico ────────────────────────────
DROP POLICY IF EXISTS "vp_gallery_select" ON public.gallery_images;
CREATE POLICY "vp_gallery_select" ON public.gallery_images
  FOR SELECT USING (
    -- Dono: vê tudo, inclusive ocultas.
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    OR (
      -- Público: só imagem visível de Montra publicada (canónico).
      is_visible = true
      AND business_id IN (
        SELECT id FROM public.businesses WHERE published = true
      )
    )
  );
