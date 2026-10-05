-- ============================================================
-- VitrinePro — FASE A4 — Descoberta local + Perto de Mim
-- Migration 20261005000006_a4_local_discovery.sql
--
-- ADITIVA. NÃO destrutiva. Aplicação MANUAL no Supabase SQL Editor.
--
-- Adiciona à tabela public.businesses:
--   postal_code  TEXT               (código postal da Montra)
--   latitude     DOUBLE PRECISION   (WGS84, nullable)
--   longitude    DOUBLE PRECISION   (WGS84, nullable)
--
-- Regras:
--   - ZERO UPDATE / DELETE / ALTER de dados existentes.
--   - latitude/longitude aceitam NULL: negócios antigos NÃO são
--     obrigados a ter coordenadas.
--   - Nenhuma policy RLS é alterada: as policies existentes
--     (vp_businesses_select / vp_businesses_update) continuam a valer;
--     as novas colunas herdam-nas automaticamente.
--   - Índices parciais apenas onde latitude/longitude são NOT NULL,
--     para consultas "Perto de Mim" eficientes.
-- ============================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Sanidade: coordenadas, quando presentes, dentro dos intervalos WGS84.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'businesses_coords_range_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_coords_range_check CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (
          latitude BETWEEN -90 AND 90
          AND longitude BETWEEN -180 AND 180
        )
      );
  END IF;
END $$;

-- Índice parcial para "Perto de Mim": só negócios publicados COM coordenadas.
CREATE INDEX IF NOT EXISTS idx_businesses_published_coords
  ON public.businesses (latitude, longitude)
  WHERE published = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================
-- VERIFICAÇÃO (somente leitura, opcional após aplicar):
-- ============================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'businesses'
--   AND column_name IN ('postal_code', 'latitude', 'longitude');
--
-- SELECT count(*) AS total,
--        count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS com_coords
-- FROM public.businesses;
