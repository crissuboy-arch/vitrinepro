-- 20261006000013_business_posts_novidades.sql
--
-- A6.5 — "Novidades na Vitrine".
--
-- A tabela public.business_posts foi definida em 003_community.sql mas
-- APARENTEMENTE NUNCA FOI APLICADA em produção (erro 42P01 em 2026-10-06).
-- Por isso esta migration é AUTOSSUFICIENTE: cria a tabela se não existir
-- e adiciona as colunas novas se já existir uma versão antiga.
--
-- NÃO aplicar automaticamente. A Cristiane aplica manualmente no SQL Editor.

-- 1. Cria a tabela completa se não existir.
CREATE TABLE IF NOT EXISTS public.business_posts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  content     TEXT,
  image_url   TEXT,
  price       NUMERIC(10,2),
  starts_at   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  cta_type    TEXT,
  cta_target  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Colunas novas se a tabela já existia numa versão antiga.
ALTER TABLE public.business_posts
  ADD COLUMN IF NOT EXISTS price      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS starts_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cta_type   TEXT,
  ADD COLUMN IF NOT EXISTS cta_target TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Constraint de tipo: remove qualquer CHECK antigo e aplica o novo
--    (4 tipos legados + 8 tipos A6.5).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.business_posts'::regclass AND contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.business_posts DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.business_posts
  ADD CONSTRAINT business_posts_type_check CHECK (type IN (
    'promotion', 'event', 'news', 'offer',
    'menu_do_dia', 'promocao', 'novidade', 'produto_novo',
    'servico_novo', 'evento', 'disponivel_hoje', 'destaque'
  ));

-- 4. RLS + policies canónicas (não existiam se a tabela não existia).
ALTER TABLE public.business_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read posts" ON public.business_posts;
DROP POLICY IF EXISTS "Owner write posts" ON public.business_posts;
DROP POLICY IF EXISTS "vp_posts_select" ON public.business_posts;
DROP POLICY IF EXISTS "vp_posts_write" ON public.business_posts;

CREATE POLICY "vp_posts_select" ON public.business_posts
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "vp_posts_write" ON public.business_posts
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- 5. Índices.
CREATE INDEX IF NOT EXISTS idx_business_posts_biz
  ON public.business_posts (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_posts_feed
  ON public.business_posts (is_active, starts_at, expires_at);
