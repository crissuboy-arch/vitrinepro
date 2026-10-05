-- ============================================================
-- VitrinePro — FASE A5 — "Preciso Hoje" + Disponibilidade Local
-- Migration 20261005000007_a5_availability.sql
--
-- ADITIVA. NÃO destrutiva. Aplicação MANUAL no Supabase SQL Editor.
--
-- Adiciona à tabela public.products:
--   available_today  BOOLEAN   (produto disponível hoje)
--   pickup_today     BOOLEAN   (retirada hoje)
--   delivery_today   BOOLEAN   (entrega hoje)
--
-- Adiciona à tabela public.businesses:
--   service_today    BOOLEAN   (negócio de serviço atende hoje)
--
-- SEMÂNTICA DE TRÊS ESTADOS (intencional — NÃO usar DEFAULT):
--   TRUE  = o comerciante confirmou SIM
--   FALSE = o comerciante confirmou NÃO
--   NULL  = NÃO INFORMADO / UNKNOWN
--
-- Regras:
--   - ZERO UPDATE / DELETE / ALTER de dados existentes.
--   - SEM backfill: nenhum registro existente é marcado como
--     disponível ou indisponível automaticamente.
--   - NULL nunca significa "não" — significa "o comerciante ainda
--     não informou". A interface trata NULL como
--     "Disponibilidade não informada", nunca como "Disponível hoje".
--   - Nenhuma policy RLS é alterada: as policies existentes
--     (vp_products_select / vp_products_write,
--      vp_businesses_select / vp_businesses_update) continuam a valer;
--     as novas colunas herdam-nas automaticamente.
--   - "Aberto agora" NÃO é coluna: é derivado em tempo de leitura
--     a partir de businesses.opening_hours (código puro, sem migration).
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS available_today BOOLEAN,
  ADD COLUMN IF NOT EXISTS pickup_today BOOLEAN,
  ADD COLUMN IF NOT EXISTS delivery_today BOOLEAN;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS service_today BOOLEAN;

-- Comentários de documentação no catálogo (não alteram dados).
COMMENT ON COLUMN public.products.available_today IS
  'A5: TRUE=comerciante confirmou disponível hoje; FALSE=confirmou indisponível; NULL=não informado (UNKNOWN). Sem DEFAULT intencionalmente.';
COMMENT ON COLUMN public.products.pickup_today IS
  'A5: retirada hoje confirmada pelo comerciante (TRUE/FALSE/NULL=não informado). Independente de available_today.';
COMMENT ON COLUMN public.products.delivery_today IS
  'A5: entrega hoje confirmada pelo comerciante (TRUE/FALSE/NULL=não informado). Independente de available_today.';
COMMENT ON COLUMN public.businesses.service_today IS
  'A5: negócio de serviço atende hoje (TRUE/FALSE/NULL=não informado). Sem DEFAULT intencionalmente.';

-- ============================================================
-- VERIFICAÇÃO (somente leitura, opcional após aplicar):
-- ============================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND ((table_name = 'products'
--     AND column_name IN ('available_today', 'pickup_today', 'delivery_today'))
--    OR (table_name = 'businesses' AND column_name = 'service_today'));
--
-- Esperado: 4 linhas, data_type = boolean, is_nullable = YES,
-- column_default = NULL (sem default), e nenhuma linha existente
-- alterada (todas as 4 colunas NULL nos registros atuais):
--
-- SELECT count(*) AS total,
--        count(*) FILTER (WHERE available_today IS NOT NULL) AS com_disponibilidade
-- FROM public.products;
-- -- Esperado: com_disponibilidade = 0
--
-- SELECT count(*) AS total,
--        count(*) FILTER (WHERE service_today IS NOT NULL) AS com_service_today
-- FROM public.businesses;
-- -- Esperado: com_service_today = 0
