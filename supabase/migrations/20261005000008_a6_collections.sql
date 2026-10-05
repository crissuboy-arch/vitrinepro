-- ================================================================
-- VitrinePro — FASE A6: Collections (Favoritos → Coleções)
-- Migration aditiva e segura para produção.
-- APLICAR MANUALMENTE no Supabase SQL Editor (não reaplicar).
-- ================================================================
--
-- REGRAS PRESERVADAS:
-- - public.favorites NÃO é tocada (semântica, triggers de
--   favorite_count e /api/social continuam intactos).
-- - Nenhum dado existente é alterado ou movido.
-- - Sem DEFAULTs em colunas novas de tabelas existentes
--   (não há colunas novas em tabelas existentes).
-- - Sem feed social, seguidores, comentários ou IA.
-- - Coleções PRIVADAS por padrão (RLS estrita por utilizador).
--
-- DECISÕES DE SCHEMA:
-- - "Favoritos" continua a usar public.favorites nesta fase.
-- - collections.is_default permite marcar a coleção padrão
--   ("❤️ Favoritos") sem alterar a semântica de favorites.
-- - collection_items aceita business_id OU product_id
--   (CHECK XOR), nunca ambos, nunca nenhum.
-- - Unicidade por item via índices parciais (NULL-safe):
--   o mesmo negócio/produto não se repete na mesma coleção,
--   mas pode estar em várias coleções.

-- ─── 1. collections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_collections_user
  ON public.collections(user_id);

-- ─── 2. collection_items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collection_items (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID        NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  business_id   UUID        REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id    UUID        REFERENCES public.products(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (business_id IS NOT NULL AND product_id IS NULL) OR
    (business_id IS NULL AND product_id IS NOT NULL)
  )
);

-- Unicidade NULL-safe: um negócio/produto aparece no máximo
-- uma vez por coleção (Postgres trata NULL como distinto em
-- UNIQUE simples, por isso usamos índices parciais).
CREATE UNIQUE INDEX IF NOT EXISTS uq_collection_items_biz
  ON public.collection_items(collection_id, business_id)
  WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_collection_items_prod
  ON public.collection_items(collection_id, product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collection_items_collection
  ON public.collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_business
  ON public.collection_items(business_id) WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collection_items_product
  ON public.collection_items(product_id) WHERE product_id IS NOT NULL;

-- ─── 3. RLS ──────────────────────────────────────────────────────
-- Privadas por padrão: nenhuma policy de leitura pública.
-- Apenas o dono gere as suas coleções; itens herdados da
-- ownership via parent collection (sem auth.uid() direto nos itens).

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vp_collections_manage" ON public.collections;
CREATE POLICY "vp_collections_manage"
  ON public.collections FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vp_collection_items_manage" ON public.collection_items;
CREATE POLICY "vp_collection_items_manage"
  ON public.collection_items FOR ALL
  USING  (collection_id IN (SELECT id FROM public.collections WHERE user_id = auth.uid()))
  WITH CHECK (collection_id IN (SELECT id FROM public.collections WHERE user_id = auth.uid()));

-- ─── FIM A6 ──────────────────────────────────────────────────────
