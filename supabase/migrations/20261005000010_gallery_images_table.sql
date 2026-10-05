-- 20261005000010_gallery_images_table.sql
--
-- A tabela public.gallery_images é lida e escrita pelo app
-- (dashboard, onboarding, Montra pública), mas nenhuma migration
-- anterior a criava — o schema base (businesses, products, profiles…)
-- foi criado fora das migrations deste repo.
--
-- Sem a tabela, os INSERTs da galeria falhavam; o código antigo ainda
-- ignorava o erro (falha silenciosa), por isso as fotos "não salvavam".
--
-- Idempotente: seguro correr mesmo se a tabela já existir.
-- APLICAR MANUALMENTE no Supabase SQL Editor (padrão do projeto).

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  order_index INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_images_business_id_idx
  ON public.gallery_images (business_id);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Mesmas policies já definidas em 20261004000003 (recriadas aqui para o
-- caso de a tabela ter sido criada agora).
DROP POLICY IF EXISTS "vp_gallery_select" ON public.gallery_images;
CREATE POLICY "vp_gallery_select" ON public.gallery_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vp_gallery_write" ON public.gallery_images;
CREATE POLICY "vp_gallery_write" ON public.gallery_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
