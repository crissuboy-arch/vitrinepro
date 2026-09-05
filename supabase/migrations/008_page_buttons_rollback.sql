-- ============================================================
-- Rollback da Migration 008 — page_buttons
--
-- Reverte SOMENTE os objetos criados pela 008_page_buttons.sql:
--   função increment_button_click, policies, trigger + função de trigger,
--   índice e a tabela page_buttons.
--
-- NÃO toca em nenhuma outra tabela, policy, função ou dado da VitrinePro.
-- NÃO EXECUTAR sem necessidade real — isto apaga todos os botões guardados.
--
-- Uso: só correr manualmente no SQL Editor do Supabase, nunca automatizado.
-- ============================================================

DROP FUNCTION IF EXISTS public.increment_button_click(uuid);

DROP POLICY IF EXISTS "Public read active buttons" ON public.page_buttons;
DROP POLICY IF EXISTS "Owner manage buttons" ON public.page_buttons;

DROP TRIGGER IF EXISTS trg_page_buttons_updated_at ON public.page_buttons;
DROP FUNCTION IF EXISTS public.page_buttons_set_updated_at();

DROP INDEX IF EXISTS public.idx_page_buttons_business_order;

DROP TABLE IF EXISTS public.page_buttons;
