-- VitrinePro — Fix Schema Compatibility
-- Executa este SQL no Supabase Dashboard → SQL Editor → New Query

-- ─── 1. Garantir coluna is_published existe ─────────────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Sincronizar is_published com published nos registos existentes
UPDATE public.businesses SET is_published = published WHERE is_published IS DISTINCT FROM published;

-- ─── 2. Corrigir CHECK constraint do plano (adicionar 'business') ────────────
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_plan_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'pro', 'premium', 'business'));

-- ─── 3. RLS — Permitir leitura pública de negócios publicados ───────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Public read published businesses" ON public.businesses;
DROP POLICY IF EXISTS "public_read_published" ON public.businesses;

-- Criar política pública de leitura
CREATE POLICY "Public read published businesses"
  ON public.businesses
  FOR SELECT
  USING (published = true);

-- Owners podem ler os seus próprios negócios (incluindo rascunhos)
DROP POLICY IF EXISTS "Owner read own business" ON public.businesses;
CREATE POLICY "Owner read own business"
  ON public.businesses
  FOR SELECT
  USING (user_id = auth.uid());

-- Owners podem criar e actualizar os seus negócios
DROP POLICY IF EXISTS "Owner insert business" ON public.businesses;
CREATE POLICY "Owner insert business"
  ON public.businesses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner update business" ON public.businesses;
CREATE POLICY "Owner update business"
  ON public.businesses
  FOR UPDATE
  USING (user_id = auth.uid());

-- ─── 4. RLS para tabelas públicas ───────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT USING (true);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read cities" ON public.cities;
CREATE POLICY "Public read cities"
  ON public.cities FOR SELECT USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products"
  ON public.products FOR SELECT USING (true);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials"
  ON public.testimonials FOR SELECT USING (true);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery_images;
CREATE POLICY "Public read gallery"
  ON public.gallery_images FOR SELECT USING (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews"
  ON public.reviews FOR SELECT USING (is_approved = true);

-- ─── 5. Profiles — utilizador lê o seu próprio perfil ────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner read profile" ON public.profiles;
CREATE POLICY "Owner read profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Owner update profile" ON public.profiles;
CREATE POLICY "Owner update profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Service role insert profile" ON public.profiles;
CREATE POLICY "Service role insert profile"
  ON public.profiles FOR INSERT WITH CHECK (true);
