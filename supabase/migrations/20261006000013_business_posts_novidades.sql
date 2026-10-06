-- 20261006000013_business_posts_novidades.sql
--
-- A6.5 "Novidades na Vitrine": estende a tabela existente public.business_posts
-- (criada em 003_community.sql, até agora órfã — nenhuma UI a usava).
--
-- ADITIVA e idempotente: só adiciona colunas, alarga o CHECK de type e cria
-- um índice. NÃO altera RLS (policies canónicas vp_posts_select/vp_posts_write
-- permanecem), NÃO altera ownership, NÃO remove nada.
--
-- APLICAR MANUALMENTE no Supabase SQL Editor (padrão do projeto).
-- O código da A6.5 deteta a ausência destas colunas e esconde a funcionalidade
-- em vez de falhar, por isso é seguro fazer deploy do código antes de aplicar.

ALTER TABLE public.business_posts
  ADD COLUMN IF NOT EXISTS price      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS starts_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cta_type   TEXT,
  ADD COLUMN IF NOT EXISTS cta_target TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Alargar os tipos permitidos. Mantém os 4 valores antigos como aliases para
-- não invalidar dados que já possam existir.
-- Remove primeiro qualquer CHECK pré-existente sobre a coluna (só existe o do type).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.business_posts'::regclass
      AND contype = 'c'
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

-- Índice para o feed público (filtro por validade).
CREATE INDEX IF NOT EXISTS idx_business_posts_feed
  ON public.business_posts (is_active, starts_at, expires_at);
