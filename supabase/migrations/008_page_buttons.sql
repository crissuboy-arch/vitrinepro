-- ============================================================
-- Migration 008 — page_buttons
-- Construtor de Botões & Links (Fase 1 da integração Montra)
--
-- Garantias:
--   • Puramente ADITIVA. Zero DROP / TRUNCATE / DELETE / RENAME.
--   • Não toca em businesses, profiles, products, catalogs, reviews,
--     testimonials, leads, auth.users nem em policies de outras tabelas.
--   • Não altera dados existentes.
--   • Idempotente: pode correr mais do que uma vez sem erro nem efeitos
--     colaterais (IF NOT EXISTS / CREATE OR REPLACE / guardas DO).
--   • FK para businesses(id) ON DELETE CASCADE.
--   • RLS ativada + policies que isolam os dados pelo proprietário
--     autenticado (mesmo padrão de short_links).
-- ============================================================

-- ── Tabela ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_buttons (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id    uuid         NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type           text         NOT NULL DEFAULT 'custom',   -- 'whatsapp' | 'instagram' | … | 'catalog' | 'custom' | 'divider'
  label          text         NOT NULL DEFAULT '',
  sublabel       text,
  url            text         NOT NULL DEFAULT '',         -- URL / ação (https:, tel:, mailto:, wa.me, /catalogo/…)
  icon           text,                                     -- nome do ícone
  whatsapp_msg   text,                                     -- mensagem pré-preenchida para botões WhatsApp
  preset_id      text,                                     -- id do preset de estilo aplicado
  style          jsonb        NOT NULL DEFAULT '{}'::jsonb, -- cores, gradiente, glow, sombra, animação, tipografia, dimensões
  rules          jsonb        NOT NULL DEFAULT '{}'::jsonb, -- regras de exibição + agendamento (daysOfWeek, businessHoursOnly, startDate, endDate…)
  display_order  integer      NOT NULL DEFAULT 0,
  active         boolean      NOT NULL DEFAULT true,
  click_count    integer      NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

-- ── Índice (a FK não é auto-indexada no Postgres; cobre a listagem ordenada) ──
CREATE INDEX IF NOT EXISTS idx_page_buttons_business_order
  ON public.page_buttons (business_id, display_order);

-- ── updated_at automático ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.page_buttons_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- CREATE OR REPLACE TRIGGER (Postgres 14+) — sem DROP.
CREATE OR REPLACE TRIGGER trg_page_buttons_updated_at
  BEFORE UPDATE ON public.page_buttons
  FOR EACH ROW EXECUTE FUNCTION public.page_buttons_set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.page_buttons ENABLE ROW LEVEL SECURITY;

-- Proprietário: leitura + escrita total dos botões dos seus negócios.
-- Guarda idempotente (sem DROP): ignora se a policy já existir.
DO $$
BEGIN
  CREATE POLICY "Owner manage buttons" ON public.page_buttons
    FOR ALL
    USING      (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
    WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Leitura pública dos botões ativos de negócios publicados.
-- (Para a Fase 6 — a vitrine pública. Nenhum código a usa nesta fase; é inócua.)
DO $$
BEGIN
  CREATE POLICY "Public read active buttons" ON public.page_buttons
    FOR SELECT
    USING (active = true AND business_id IN (SELECT id FROM public.businesses WHERE published = true));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── RPC: incremento atómico de cliques ──────────────────────
-- Mesmo padrão de public.increment_short_link_clicks(text), com search_path fixo.
CREATE OR REPLACE FUNCTION public.increment_button_click(p_button_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.page_buttons
  SET click_count = click_count + 1
  WHERE id = p_button_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_button_click(uuid) TO anon, authenticated;

-- ============================================================
-- Analytics: os cliques são registados de duas formas, SEM tabela nova:
--   1. page_buttons.click_count            → total por botão (via RPC acima)
--   2. business_analytics (event_type = 'button_click')  → agregado no dashboard
--      A coluna event_type é text livre (sem CHECK em produção) e o trigger
--      fn_view_count_inc só reage a 'page_view', pelo que 'button_click' não
--      afeta nenhuma métrica existente.
-- Uma tabela button_click_events só será criada se, no futuro, for preciso
-- breakdown por botão × fonte × dispositivo × série temporal.
-- ============================================================
