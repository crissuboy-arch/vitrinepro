-- ============================================================
-- 20261007000014_product_gallery_visibility.sql
-- Controles de visibilidade: produto e galeria (aditiva)
--
-- OCULTAR ≠ EXCLUIR. Ocultar mantém os dados; excluir é destrutivo.
--
-- Novas colunas (DEFAULT true = preserva comportamento existente):
--   products.is_visible       → aparece na Montra pública
--   products.show_in_explore  → distribuído no Explorar (feed/busca)
--   gallery_images.is_visible → aparece publicamente na galeria
--
-- Regra do produto:
--   A) is_visible=true,  show_in_explore=true  → Montra + Explorar
--   B) is_visible=true,  show_in_explore=false → Montra, sem Explorar
--   C) is_visible=false, show_in_explore=false → nada público
-- Estado incoerente (is_visible=false + show_in_explore=true) é
-- impedido na aplicação (ocultar da Montra força show_in_explore=false).
--
-- show_in_explore NÃO é segredo: só controla distribuição no Explorar.
-- Por isso NÃO entra na policy de SELECT (o produto continua legível
-- dentro da Montra). O filtro do Explorar é na consulta da aplicação.
--
-- RLS: alteração mínima. Mantém o OR legado de is_published nas
-- policies antigas (sem limpeza ampla nesta tarefa); adiciona apenas
-- a porta is_visible para leitura pública. O dono (user_id = auth.uid())
-- continua vendo/gerindo os próprios produtos e imagens ocultos.
-- NÃO enfraquece: para o público, a nova condição é estritamente mais
-- restritiva; para o dono, idêntica.
-- ============================================================

-- ─── 1. Colunas ──────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_in_explore BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.is_visible IS
  'Visível na Montra pública. false = oculto (mantém cadastrado).';
COMMENT ON COLUMN public.products.show_in_explore IS
  'Distribuído no Explorar (feed/busca). false = só na Montra. Não é segredo.';
COMMENT ON COLUMN public.gallery_images.is_visible IS
  'Visível publicamente na galeria. false = só no dashboard do dono.';

-- Índices parciais para as consultas públicas (só o que é visível).
CREATE INDEX IF NOT EXISTS idx_products_visible
  ON public.products(business_id) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_products_explore
  ON public.products(business_id) WHERE is_visible = true AND show_in_explore = true;

CREATE INDEX IF NOT EXISTS idx_gallery_images_visible
  ON public.gallery_images(business_id) WHERE is_visible = true;

-- ─── 2. RLS produtos — leitura pública exige is_visible ──────
DROP POLICY IF EXISTS "vp_products_select" ON public.products;
CREATE POLICY "vp_products_select" ON public.products
  FOR SELECT USING (
    -- Dono: vê tudo, inclusive ocultos (gestão no dashboard).
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    OR (
      -- Público: só produto visível de Montra publicada.
      -- (Mantido o OR legado de is_published; sem limpeza ampla aqui.)
      is_visible = true
      AND business_id IN (
        SELECT id FROM public.businesses
        WHERE published = true OR is_published = true
      )
    )
  );

-- ─── 3. RLS galeria — leitura pública exige is_visible ───────
DROP POLICY IF EXISTS "vp_gallery_select" ON public.gallery_images;
CREATE POLICY "vp_gallery_select" ON public.gallery_images
  FOR SELECT USING (
    -- Dono: vê tudo, inclusive ocultas.
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    OR (
      -- Público: só imagem visível de Montra publicada.
      is_visible = true
      AND business_id IN (
        SELECT id FROM public.businesses
        WHERE published = true OR is_published = true
      )
    )
  );

-- (Policies de escrita inalteradas: só o dono escreve.)
