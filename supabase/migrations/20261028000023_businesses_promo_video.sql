-- Migration: 20261028000023_businesses_promo_video.sql
-- Vídeo promocional da Montra (brief da dona, 2026-10-28).
--
-- O QUE FAZ:
--   * 4 colunas novas (anuláveis) em public.businesses para a secção de
--     vídeo promocional da Montra pública: URL do vídeo, URL da miniatura,
--     texto do botão e URL do botão. Sem vídeo guardado, a secção não
--     aparece na Montra (renderização condicional no código).
--   * 1 bucket novo de Storage, 'vitrine-videos' (público, 50 MB,
--     video/mp4, video/webm, video/quicktime), e a sua inclusão nas 4
--     policies canónicas de Storage (leitura pública + escrita só do dono
--     sob o prefixo {business_id}/, exatamente como os buckets de imagem
--     da migration 20261004000003_canonical_rls_normalization.sql).
--
-- SEMÂNTICA:
--   businesses.promo_video_url            → link do vídeo (ficheiro do
--     bucket vitrine-videos ou URL https externa .mp4/.webm/.mov).
--   businesses.promo_video_thumbnail_url  → miniatura antes do Play
--     (imagem do bucket vitrine-covers; NUNCA entra em gallery_images).
--   businesses.promo_video_button_text    → texto do botão (ex.:
--     "📚 Conhecer os nossos livros"; vazio = texto pré-preenchido).
--   businesses.promo_video_button_url     → destino do botão (ex.: a loja
--     da marca); vazio ou inválido = botão escondido.
--
-- Aditiva apenas. NÃO aplicar automaticamente em produção — aplicar
-- manualmente no SQL Editor DEPOIS de confirmar a ordem das migrations
-- (Dashboard → Database → Migrations) e ANTES de usar o carregamento de
-- vídeo no painel. O código degrada-se com segurança pré-migration:
-- sem colunas, a Montra pública esconde a secção (normalização defensiva)
-- e o painel avisa para aplicar esta migration ao tentar guardar.
-- NADA nesta migration publica Montras, altera produtos, preços, fotos,
-- checkouts, planos, Stripe ou URLs existentes.
--
-- ─── 1. Colunas ────────────────────────────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS promo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_button_text TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_button_url TEXT;

COMMENT ON COLUMN public.businesses.promo_video_url IS
  'Vídeo promocional da Montra (URL https .mp4/.webm/.mov). NULL = sem secção de vídeo na Montra pública.';
COMMENT ON COLUMN public.businesses.promo_video_thumbnail_url IS
  'Miniatura do vídeo promocional (imagem). NULL = fundo bonito com botão Play.';
COMMENT ON COLUMN public.businesses.promo_video_button_text IS
  'Texto do botão abaixo do vídeo (ex.: "📚 Conhecer os nossos livros"). NULL/vazio = texto pré-preenchido.';
COMMENT ON COLUMN public.businesses.promo_video_button_url IS
  'Destino do botão abaixo do vídeo (ex.: a loja da marca). NULL/inválido = botão escondido.';

-- ─── 2. Bucket de vídeos ───────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vitrine-videos', 'vitrine-videos', true, 52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Policies canónicas de Storage (extensão da 000003) ────────────
-- As policies existentes listam os buckets por nome; recriam-se com
-- 'vitrine-videos' incluído, sem alterar nenhuma outra regra.
DROP POLICY IF EXISTS "vp_storage_public_read" ON storage.objects;
CREATE POLICY "vp_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN (
    'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
    'vitrine-products', 'business-images', 'business-media',
    'vitrine-videos'
  ));

DROP POLICY IF EXISTS "vp_storage_owner_insert" ON storage.objects;
CREATE POLICY "vp_storage_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media',
      'vitrine-videos'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

DROP POLICY IF EXISTS "vp_storage_owner_update" ON storage.objects;
CREATE POLICY "vp_storage_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media',
      'vitrine-videos'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

DROP POLICY IF EXISTS "vp_storage_owner_delete" ON storage.objects;
CREATE POLICY "vp_storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media',
      'vitrine-videos'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

-- ─── VERIFICAÇÃO (manual, após aplicar) ────────────────────────────────
-- 1. Colunas:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'businesses'
--      AND column_name LIKE 'promo\_video%';
--    → 4 linhas, data_type 'text', is_nullable 'YES'.
-- 2. Bucket:
--    SELECT id, public, file_size_limit, allowed_mime_types
--    FROM storage.buckets WHERE id = 'vitrine-videos';
--    → public true, file_size_limit 52428800, 3 mime types de vídeo.
-- 3. Nenhuma Montra ficou com vídeo pela migration:
--    SELECT count(*) FROM public.businesses WHERE promo_video_url IS NOT NULL;
--    → 0 (a secção só aparece quando a proprietária guardar um vídeo).
