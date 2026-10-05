-- 20261005000011_cover_framing.sql
--
-- Editor de enquadramento da capa: persiste SÓ parâmetros de apresentação.
-- A imagem original (businesses.cover_url, bucket vitrine-covers) é preservada;
-- nenhum ficheiro novo é gerado ou cortado.
--
-- NULL = sem ajuste manual → comportamento atual (center, zoom 1).
-- cover_position_x / cover_position_y: 0–100 (object-position CSS)
-- cover_zoom: >= 1 (transform: scale CSS)
--
-- Idempotente. APLICAR MANUALMENTE no Supabase SQL Editor quando autorizado.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS cover_position_x DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS cover_position_y DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS cover_zoom DOUBLE PRECISION;
