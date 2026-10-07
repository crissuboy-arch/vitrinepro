-- Migration: PROPOSTA — NÃO APLICAR sem revisão
-- A10.1C: impedir escalada de plano pelo owner (versão final)
--
-- MECANISMO: auth.role() — retorna a role Postgres efetiva da sessão:
--   'service_role'  → conexão com service_role key (server-side autorizado)
--   'authenticated' → usuário logado via Supabase Auth
--   'anon'          → chave pública sem sessão
--
-- Por que auth.role() e não auth.jwt() IS NULL:
-- - auth.jwt() IS NULL é uma condição NEGATIVA (ausência de algo).
--   Privilégio financeiro não deve ser concedido por "ausência".
-- - auth.role() é uma afirmação POSITIVA da role efetiva, definida pelo
--   próprio Supabase/PostgREST a partir da chave usada na conexão.
-- - service_role só existe quando a conexão usa a service_role key,
--   que nunca sai do servidor (nunca no browser, nunca no cliente).
--
-- SECURITY DEFINER com search_path explícito: impede que um atacante
-- crie objetos num schema anterior do search_path para sequestrar
-- chamadas internas da função (ex.: shadow de auth.role).

CREATE OR REPLACE FUNCTION public.prevent_plan_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    -- Só service_role pode alterar plan. Qualquer outra role (authenticated,
    -- anon, ou qualquer role futura não privilegiada) é bloqueada.
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'Alteração de plano não permitida diretamente. Use o checkout Stripe.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_plan_escalation ON public.businesses;
CREATE TRIGGER trg_prevent_plan_escalation
  BEFORE UPDATE OF plan ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_escalation();

-- A função em si não concede privilégio: ela só BLOQUEIA.
-- Chamar a função diretamente não altera nada (é um trigger BEFORE).
-- O trigger dispara em qualquer UPDATE de plan, independente do caminho
-- (REST, RPC, SQL direto, dashboard) — a proteção é no banco.
--
-- Verificação pós-aplicação:
-- 1. Como authenticated (owner): UPDATE businesses SET plan='business' → FALHA
-- 2. Como anon: UPDATE → FALHA (RLS já bloqueia, trigger é segunda camada)
-- 3. Via service_role: UPDATE businesses SET plan='pro' → OK
-- 4. Edição normal (nome/descrição) como owner → OK (trigger só olha plan)
