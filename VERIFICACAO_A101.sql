-- VERIFICAÇÃO PÓS-MIGRATIONS A10.1 — colar no Supabase SQL Editor e correr.
-- Somente leitura, exceto o teste do trigger (que deve FALHAR sem alterar nada).

-- 1. Schema: 5 colunas Stripe em businesses
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='businesses'
  AND column_name IN ('stripe_customer_id','stripe_subscription_id',
    'subscription_cancel_at','stripe_last_event_at','stripe_subscription_status')
ORDER BY column_name;
-- Esperado: 5 linhas (TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT)

-- 2. Trigger ativo
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema='public' AND event_object_table='businesses'
  AND trigger_name='trg_prevent_plan_escalation';
-- Esperado: 1 linha (BEFORE, UPDATE)

-- 3. Policy vp_posts_select — definição efetiva
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname='public' AND tablename='business_posts'
  AND policyname='vp_posts_select';
-- Esperado: USING com b.user_id = auth.uid() OR (published + is_active + janela)

-- 4. TESTE DO TRIGGER (deve FALHAR com exceção, sem alterar nada):
-- UPDATE public.businesses SET plan='business'
-- WHERE id = '<SEU_BUSINESS_ID>' AND false;
-- (o AND false garante zero linhas afetadas mesmo se o trigger falhar;
--  remova o AND false apenas se quiser o teste real — ele bloqueia via exceção)
