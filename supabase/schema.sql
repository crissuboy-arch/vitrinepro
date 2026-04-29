-- VitrinePro Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid";

-- Create tables

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, country)
);

-- Plans/Pricing table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2),
  price_yearly NUMERIC(10,2),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  city_id UUID REFERENCES public.cities(id),
  address TEXT,
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  website TEXT,
  logo_url TEXT,
  cover_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  is_published BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Business images gallery
CREATE TABLE IF NOT EXISTS public.business_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('gallery', 'logo', 'cover')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Businesses: public read, user can CRUD own
CREATE POLICY "Anyone can view businesses" ON public.businesses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can create businesses" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id);

-- Business images: owner can manage
CREATE POLICY "Business owner can manage images" ON public.business_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- Reviews: public read, anyone can create
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Seed data for categories
INSERT INTO public.categories (name, slug, icon, order_index) VALUES
  ('Restaurantes', 'restaurantes', '🍽️', 1),
  ('Beleza', 'beleza', '💅', 2),
  ('Serviços', 'servicos', '🔧', 3),
  ('Construção', 'construcao', '🏠', 4),
  ('Automóvel', 'automovel', '🚗', 5),
  ('Saúde', 'saude', '🏥', 6),
  ('Lojas', 'lojas', '🛒', 7),
  ('Pet Shop', 'pet-shop', '🐕', 8),
  ('Cafetaria', 'cafetaria', '☕', 9),
  ('Academia', 'academia', '💪', 10),
  ('Decoração', 'decoracao', '🛋️', 11),
  ('Loja de Roupa', 'loja-de-roupa', '👔', 12),
  ('Serviço Doméstico', 'servico-domestico', '🏠', 13),
  ('Produtos Digitais', 'produtos-digitais', '💻', 14),
  ('Infoprodutos', 'infoprodutos', '📚', 15),
  ('Marketing', 'marketing', '📈', 16),
  ('Serviços Online', 'servicos-online', '🌐', 17),
  ('Outros', 'outros', '📦', 18)
ON CONFLICT (slug) DO NOTHING;

-- Seed data for cities
INSERT INTO public.cities (name, slug, country, order_index) VALUES
  -- Portugal
  ('Lisboa', 'lisboa', 'Portugal', 1),
  ('Porto', 'porto', 'Portugal', 2),
  ('Faro', 'faro', 'Portugal', 3),
  ('Braga', 'braga', 'Portugal', 4),
  ('Coimbra', 'coimbra', 'Portugal', 5),
  ('Aveiro', 'aveiro', 'Portugal', 6),
  ('Águeda', 'agueda', 'Portugal', 7),
  ('Setúbal', 'setubal', 'Portugal', 8),
  ('Leiria', 'leiria', 'Portugal', 9),
  ('Viseu', 'viseu', 'Portugal', 10),
  ('Évora', 'evora', 'Portugal', 11),
  -- Brasil
  ('São Paulo', 'sao-paulo', 'Brasil', 12),
  ('Rio de Janeiro', 'rio-de-janeiro', 'Brasil', 13),
  ('Belo Horizonte', 'belo-horizonte', 'Brasil', 14),
  ('Brasília', 'brasilia', 'Brasil', 15),
  ('Salvador', 'salvador', 'Brasil', 16),
  ('Curitiba', 'curitiba', 'Brasil', 17),
  ('Fortaleza', 'fortaleza', 'Brasil', 18),
  ('Recife', 'recife', 'Brasil', 19),
  ('Porto Alegre', 'porto-alegre', 'Brasil', 20)
ON CONFLICT (name, country) DO NOTHING;

-- Seed data for plans
INSERT INTO public.plans (name, slug, price_monthly, price_yearly, features) VALUES
  ('Free', 'free', 0, 0, '[]'),
  ('Pro', 'pro', 29.90, 299.00, '["Destaque no topo", "Badge Premium", "Mais visualizações", "Estatísticas básicas"]'),
  ('Premium', 'premium', 49.90, 499.00, '["Destaque no topo", "Badge Premium", "Mais visualizações", "Estatísticas avançadas", "Site personalizado", "Domínio próprio"]')
ON CONFLICT (slug) DO NOTHING;

-- Create storage bucket (run manually in Supabase Dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, file_extensions) 
-- VALUES ('business-media', 'business-media', true, 5242880, '.jpg,.jpeg,.png,.webp,.gif');

-- Storage policies
-- Allow authenticated users to upload their own business images
-- CREATE POLICY "Users can upload business images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'business-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to business images
-- CREATE POLICY "Public can view business images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'business-media');