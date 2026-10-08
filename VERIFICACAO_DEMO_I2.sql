-- I2 (A10.2) — VERIFICAÇÃO READ-ONLY de conteúdo demo em produção.
-- Colar no Supabase SQL Editor e correr. Somente SELECT, nada é alterado.
-- IDs vindos de supabase/seed.demo.sql (NUNCA rodar esse arquivo em produção).

-- Negócios demo
SELECT id, name, slug, published, plan, created_at
FROM public.businesses
WHERE id IN (
  'b1111111-1111-4111-a111-111111111111',  -- Sabores da Terra
  'b2222222-2222-4222-a222-222222222222'   -- Studio Bella
);

-- Produtos demo (se os negócios existirem)
SELECT id, business_id, name, price
FROM public.products
WHERE business_id IN (
  'b1111111-1111-4111-a111-111111111111',
  'b2222222-2222-4222-a222-222222222222'
);

-- Testimonials demo
SELECT id, business_id, author_name, LEFT(text, 60) AS text_preview
FROM public.testimonials
WHERE business_id IN (
  'b1111111-1111-4111-a111-111111111111',
  'b2222222-2222-4222-a222-222222222222'
);

-- Utilizadores mock do seed (emails @mock.com)
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@mock.com';
