-- PROPOSTA_20261008000020_google_review_url.sql — A10.4 item 3 ("Avaliar no Google")
--
-- Adiciona `businesses.google_review_url`: link direto de avaliação do
-- Google Business Profile, cadastrado pelo comerciante no dashboard.
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS — seguro rodar mais de uma vez.
-- RLS: nenhuma policy alterada; a nova coluna herda automaticamente as
-- policies existentes (vp_businesses_select / vp_businesses_update),
-- que isolam por user_id = auth.uid(). Mesmo padrão das migrations
-- 000006 (A4) e 000007 (A5).
--
-- NÃO EXECUTAR AUTOMATICAMENTE — aplicar manualmente no Supabase
-- após aprovação da Cris.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_review_url TEXT;

COMMENT ON COLUMN public.businesses.google_review_url IS
  'Link direto para avaliação no Google Business Profile (ex.: https://g.page/.../review). Cadastrado pelo comerciante; exibido como botão "Avaliar no Google" na Montra pública.';
