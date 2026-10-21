-- Migration: 20261021000021_businesses_show_in_explore.sql
-- Controlo administrativo de visibilidade no Explorar ("Mostrar/Ocultar do Explorar").
--
-- REGRA DE PRODUTO: OCULTAR ≠ DESPUBLICAR.
--   businesses.published        → a Montra está pública (link direto/QR abrem).
--   businesses.show_in_explore  → a Montra aparece na DESCOBERTA pública
--                                 (Explorar, pesquisa, rankings, recomendações,
--                                 sitemap, páginas cidade×categoria, marketplace).
-- Uma Montra oculta continua publicada: o link direto e o QR funcionam, o
-- comerciante continua a geri-la e o plano/assinatura ficam intactos.
--
-- SEGURANÇA (só o admin altera): espelha o padrão já usado para a coluna
-- `plan` (migration 20261007000016_prevent_plan_escalation):
--   - A escrita legítima é EXCLUSIVAMENTE via API admin
--     (PATCH /api/admin/businesses/[id], requireAdmin + service_role).
--   - A RLS de UPDATE de businesses é ao nível da LINHA (owner-scoped), por
--     isso sem esta guarda um comerciante conseguiria escrever a coluna
--     diretamente via PostgREST na sua própria linha.
--   - Trigger BEFORE UPDATE OF show_in_explore: qualquer tentativa de MUDAR
--     o valor cuja role efetiva não seja 'service_role' levanta exceção.
--     Updates que não mudam o valor passam (o dashboard continua a funcionar).
--   - Trigger BEFORE INSERT: inserções fora de 'service_role' são
--     normalizadas para show_in_explore = true (sem partir o onboarding);
--     só o caminho admin pode criar uma Montra já oculta.
--   auth.role() é uma afirmação POSITIVA da role efetiva da sessão
--   ('service_role' só existe com a service_role key, que nunca sai do
--   servidor) — nunca conceder por ausência (ex.: auth.jwt() IS NULL).
--
-- DEFAULT: todas as Montras existentes ficam VISÍVEIS por omissão.
-- Nenhuma Montra é ocultada por esta migration.
--
-- Aditiva apenas. NÃO aplicar automaticamente em produção — aplicar
-- manualmente no SQL Editor DEPOIS de confirmar a ordem das migrations
-- (Dashboard → Database → Migrations) e ANTES do deploy do código que
-- filtra por esta coluna.

-- ─── 1. Coluna ────────────────────────────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS show_in_explore BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.businesses.show_in_explore IS
  'Admin-only: mostrar esta Montra na descoberta pública (Explorar/pesquisa/rankings). '
  'Ocultar NÃO despublica: link direto e QR continuam a funcionar. Default true.';

-- ─── 2. Guarda (função) ───────────────────────────────────────────────
-- SECURITY DEFINER com search_path explícito: impede que um atacante crie
-- objetos num schema anterior do search_path para sequestrar chamadas
-- internas (ex.: shadow de auth.role). A função só BLOQUEIA/normaliza —
-- chamá-la diretamente não altera nada (é uma função de trigger).
CREATE OR REPLACE FUNCTION public.guard_business_show_in_explore()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Fora do caminho admin, uma Montra nasce sempre visível no Explorar.
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.show_in_explore := true;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: só service_role pode MUDAR o valor.
  IF OLD.show_in_explore IS DISTINCT FROM NEW.show_in_explore THEN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'Visibilidade no Explorar só pode ser alterada pela administração da plataforma.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── 3. Triggers ──────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_guard_business_show_in_explore_update ON public.businesses;
CREATE TRIGGER trg_guard_business_show_in_explore_update
  BEFORE UPDATE OF show_in_explore ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_business_show_in_explore();

DROP TRIGGER IF EXISTS trg_guard_business_show_in_explore_insert ON public.businesses;
CREATE TRIGGER trg_guard_business_show_in_explore_insert
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_business_show_in_explore();

-- ─── VERIFICAÇÃO (manual, após aplicar) ───────────────────────────────
-- 1. Coluna e default:
--    SELECT column_name, column_default, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'businesses' AND column_name = 'show_in_explore';
--    → column_default contém 'true', is_nullable = 'NO'.
-- 2. Nenhuma Montra ficou oculta pela migration:
--    SELECT count(*) FROM public.businesses WHERE show_in_explore = false;
--    → 0 (salvo decisão administrativa posterior e explícita).
-- 3. Como authenticated (dono da Montra):
--    UPDATE public.businesses SET show_in_explore = false WHERE id = '<id próprio>';
--    → FALHA com 'Visibilidade no Explorar só pode ser alterada…'.
-- 4. Como authenticated: UPDATE de nome/descrição da própria Montra → OK.
-- 5. Via service_role: UPDATE … SET show_in_explore = false → OK;
--    a página /vitrine/<slug> continua a abrir; /explorar deixa de a listar.
