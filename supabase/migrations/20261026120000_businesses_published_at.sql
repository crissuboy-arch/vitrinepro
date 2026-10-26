-- 20261026120000_businesses_published_at.sql — Notificação de novidade no /explorar
--
-- Adiciona `businesses.published_at`: data/hora da PRIMEIRA publicação da
-- Montra. É o campo que permite ao /explorar anunciar, com honestidade,
-- "acabou de chegar à VitrinePro" — sem ele, nenhuma data prova quando
-- uma Montra foi publicada pela primeira vez (created_at é a criação do
-- registo; updated_at não é tocado ao publicar).
--
-- SEMÂNTICA (não mudar sem rever a notificação):
--   * NULL = nunca publicada desde que o campo existe — inclui TODAS as
--     Montras publicadas antes desta migration (sem backfill: não se
--     inventa data de chegada para quem já lá estava).
--   * Valor = instante da primeira publicação registada. Nunca é
--     sobrescrito por republicações; nunca é carimbado ao despublicar.
--   * O carimbo é feito pelo código (onboarding, toggle do dashboard,
--     admin) — nunca por trigger — para a regra "só na primeira
--     publicação" ficar explícita e testável.
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS — seguro rodar mais de uma vez.
-- SEM BACKFILL: nenhum registo existente é tocado.
-- RLS: nenhuma policy alterada; a nova coluna herda automaticamente as
-- policies existentes (vp_businesses_select / vp_businesses_update),
-- que são row-level (não restringem colunas) — mesmo padrão da
-- migration 20261008000020 (google_review_url).
--
-- NÃO EXECUTAR AUTOMATICAMENTE — aplicar manualmente no SQL Editor do
-- Supabase (projeto VitrinePro) após aprovação da Cris, ANTES de qualquer
-- deploy que inclua a notificação. Sem esta coluna, a notificação não
-- mostra nada (degradação segura: sem recentes, nada é renderizado).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

COMMENT ON COLUMN public.businesses.published_at IS
  'Instante da primeira publicação da Montra. NULL = nunca publicada desde que o campo existe (inclui Montras publicadas antes desta migration, sem backfill). Carimbado só na primeira publicação (onboarding, toggle do dashboard, admin); nunca sobrescrito por republicações nem carimbado ao despublicar. Usado pela notificação de novidade do /explorar (publicados nos últimos 7 dias).';
