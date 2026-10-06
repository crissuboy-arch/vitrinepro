-- 20261006000012_product_image_framing.sql
--
-- Editor de enquadramento da IMAGEM DO PRODUTO: persiste SÓ parâmetros de apresentação.
-- A imagem original (products.image_url, bucket vitrine-products) é preservada;
-- nenhum ficheiro novo é gerado ou cortado.
--
-- NULL = sem ajuste manual → comportamento atual (center, zoom 1).
-- image_position_x / image_position_y: 0–100 (object-position CSS)
-- image_zoom: >= 1 (transform: scale CSS)
--
-- Mesmo conceito do enquadramento da capa (20261005000011_cover_framing.sql).
--
-- Idempotente. APLICAR MANUALMENTE no Supabase SQL Editor quando autorizado.
-- NÃO foi aplicada automaticamente.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_position_x DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS image_position_y DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS image_zoom DOUBLE PRECISION;
