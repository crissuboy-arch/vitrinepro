-- ============================================================
-- VitrinePro — seed.demo.sql (A2.12)
--
-- ⚠️  DEVELOPMENT / DEMO ONLY — NEVER RUN IN PRODUCTION  ⚠️
--
-- This file creates MOCK users in auth.users with a NON-FUNCTIONAL
-- placeholder password hash ('$2a$10$abcdefghijklmnopqrstuv').
-- These accounts can NEVER be used to log in — the hash is not a valid
-- bcrypt digest. They exist only so local/dev databases have relational
-- demo content (businesses, products, testimonials, gallery).
--
-- Running this in production would pollute real data with fake
-- businesses and fake reviews. Don't.
--
-- Prerequisite: supabase/seed.sql (safe reference data).
-- ============================================================

-- ==========================================
-- 4. SEED MOCK USERS in auth.users
-- ==========================================
-- NON-FUNCTIONAL placeholder hashes: login with these accounts is impossible.
-- For local testing, create real users through the app's signup flow.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'restaurante@mock.com', '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"João Silva"}', now(), now(), 'authenticated', 'authenticated'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'beleza@mock.com', '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Souza"}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 5. SEED MOCK BUSINESSES
-- ==========================================
-- João's Restaurant
INSERT INTO public.businesses (
  id, user_id, name, description, whatsapp, phone, email, instagram, website, slug, logo_url, cover_url, published, plan, is_verified, rating_average, rating_count, view_count, category_id, city_id, owner_origin_country
)
SELECT 
  'b1111111-1111-4111-a111-111111111111',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Sabores da Terra',
  'O melhor da cozinha tradicional portuguesa no coração do Porto. Ingredientes frescos e ambiente acolhedor.',
  '+351912345678',
  '+351223456789',
  'contacto@saboresdaterra.pt',
  '@saboresdaterra',
  'https://saboresdaterra.pt',
  'sabores-da-terra',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
  true,
  'pro',
  true,
  4.8,
  2,
  152,
  c.id,
  ci.id,
  'Brasil'
FROM public.categories c, public.cities ci
WHERE c.slug = 'restaurantes' AND ci.slug = 'porto'
ON CONFLICT (id) DO NOTHING;

-- Maria's Salon
INSERT INTO public.businesses (
  id, user_id, name, description, whatsapp, phone, email, instagram, website, slug, logo_url, cover_url, published, plan, is_verified, rating_average, rating_count, view_count, category_id, city_id, owner_origin_country
)
SELECT 
  'b2222222-2222-4222-a222-222222222222',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'Studio Bella',
  'Salão de beleza completo em Lisboa. Especialistas em coloração, corte, manicure e tratamentos estéticos de alta qualidade.',
  '+351987654321',
  '+351217654321',
  'geral@studiobella.pt',
  '@studiobella_lisboa',
  'https://studiobella.pt',
  'studio-bella',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=400&fit=crop',
  true,
  'premium',
  true,
  5.0,
  1,
  89,
  c.id,
  ci.id,
  'Cabo Verde'
FROM public.categories c, public.cities ci
WHERE c.slug = 'beleza' AND ci.slug = 'lisboa'
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. SEED PRODUCTS
-- ==========================================
-- Sabores da Terra Products
INSERT INTO public.products (id, business_id, name, description, price, image_url, order_index) VALUES
  ('e1111111-1111-4111-a111-111111111111', 'b1111111-1111-4111-a111-111111111111', 'Bacalhau à Brás', 'Bacalhau desfiado com batata palha, ovos, cebola e azeitonas.', 14.50, 'https://images.unsplash.com/photo-1560684352-8497838a2229?w=300&h=200&fit=crop', 1),
  ('e1111111-1111-4111-a111-111111111112', 'b1111111-1111-4111-a111-111111111111', 'Francesinha Especial', 'Prato tradicional com molho especial artesanal, batata e ovo.', 12.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=200&fit=crop', 2)
ON CONFLICT (id) DO NOTHING;

-- Studio Bella Products
INSERT INTO public.products (id, business_id, name, description, price, image_url, order_index) VALUES
  ('e2222222-2222-4222-a222-222222222221', 'b2222222-2222-4222-a222-222222222222', 'Corte & Brushing', 'Corte moderno personalizado com lavagem e secagem profissional.', 35.00, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&h=200&fit=crop', 1),
  ('e2222222-2222-4222-a222-222222222222', 'b2222222-2222-4222-a222-222222222222', 'Manicure de Gel', 'Aplicação de unhas de gel com cutículas tratadas e nail art opcional.', 25.00, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop', 2)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 7. SEED TESTIMONIALS (Automatically syncs to reviews via trigger)
-- ==========================================
-- Sabores da Terra Reviews
INSERT INTO public.testimonials (id, business_id, author_name, text, rating, created_at) VALUES
  ('d1111111-1111-4111-a111-111111111111', 'b1111111-1111-4111-a111-111111111111', 'Carlos Santos', 'Excelente francesinha! O molho é divinal e o atendimento muito simpático.', 5, now() - interval '2 days'),
  ('d1111111-1111-4111-a111-111111111112', 'b1111111-1111-4111-a111-111111111111', 'Ana Oliveira', 'Comida muito saborosa e autêntica. O ambiente é acolhedor e familiar.', 4, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- Studio Bella Reviews
INSERT INTO public.testimonials (id, business_id, author_name, text, rating, created_at) VALUES
  ('d2222222-2222-4222-a222-222222222221', 'b2222222-2222-4222-a222-222222222222', 'Beatriz Gomes', 'O melhor corte que já fiz em Lisboa! As meninas são profissionais incríveis.', 5, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 8. SEED GALLERY IMAGES (Automatically syncs to business_images via trigger)
-- ==========================================
-- Sabores da Terra Gallery
INSERT INTO public.gallery_images (id, business_id, image_url, order_index) VALUES
  ('c1111111-1111-4111-a111-111111111111', 'b1111111-1111-4111-a111-111111111111', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop', 1),
  ('c1111111-1111-4111-a111-111111111112', 'b1111111-1111-4111-a111-111111111111', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', 2)
ON CONFLICT (id) DO NOTHING;

-- Studio Bella Gallery
INSERT INTO public.gallery_images (id, business_id, image_url, order_index) VALUES
  ('c2222222-2222-4222-a222-222222222221', 'b2222222-2222-4222-a222-222222222222', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop', 1)
ON CONFLICT (id) DO NOTHING;
