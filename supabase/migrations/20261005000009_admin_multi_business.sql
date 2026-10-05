-- ================================================================
-- VitrinePro — Conta administradora multi-Montra
-- Remove a UNIQUE(user_id) legada de public.businesses
-- (da "primeira versao": 1 conta = 1 Montra).
--
-- APLICAR MANUALMENTE no Supabase SQL Editor (não reaplicar).
-- ================================================================
--
-- PORQUÊ: a conta administradora precisa gerir centenas de Montras
-- (próprias e de clientes) com um único login. O dashboard multi-Montra
-- (A3/A2.5) já suporta várias Montras por conta na UI; esta migration
-- remove o bloqueio ao nível da base de dados.
--
-- SEGURANÇA: não altera RLS, não altera policies, não mexe em dados.
-- O isolamento por dono (user_id = auth.uid()) continua intacto.
-- Apenas permite várias linhas de businesses com o mesmo user_id.
--
-- IDEMPOTENTE: se a constraint não existir, não faz nada.

DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.businesses'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(user_id)%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.businesses DROP CONSTRAINT %I', cname);
    RAISE NOTICE 'Removida constraint unique % de businesses(user_id) — multi-Montra desbloqueada.', cname;
  ELSE
    RAISE NOTICE 'Nenhuma constraint unique em businesses(user_id) — nada a fazer.';
  END IF;
END $$;
