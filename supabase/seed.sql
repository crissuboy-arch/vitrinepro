-- Seed SAFE reference data for VitrinePro (A2.12)
-- Run this in the Supabase SQL Editor on your NEW project after running schema.sql
--
-- SAFE FOR PRODUCTION: only plans, categories and cities (public reference
-- data, no accounts, no PII, no credentials).
-- Demo/mock users, businesses, products, testimonials and gallery images
-- live in seed.demo.sql — DEVELOPMENT ONLY, NEVER run it in production.

-- ==========================================
-- 1. SEED PLANS
-- ==========================================
-- A2.8: prices follow the central source of truth (lib/plans.ts):
-- Free €0 / Pro €12 / Business €29,90 (temporary commercial reference).
INSERT INTO public.plans (name, slug, price_monthly, price_yearly, features) VALUES
  ('Free', 'free', 0.00, 0.00, '[]'),
  ('Pro', 'pro', 12.00, 120.00, '["Produtos ilimitados", "Chatbot IA 24h", "Destaque no diretório", "Analytics de visitas", "SEO para o Google", "Domínio próprio"]'),
  ('Business', 'business', 29.90, 299.00, '["Tudo do Pro", "Loja online com pagamentos", "Chatbot IA avançado", "1º lugar nas pesquisas", "Relatórios mensais", "Multi-idioma"]')
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 2. SEED CATEGORIES
-- ==========================================
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

-- ==========================================
-- 3. SEED CITIES
-- ==========================================
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

