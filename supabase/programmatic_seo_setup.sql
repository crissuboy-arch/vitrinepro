-- ==========================================
-- 1. DATABASE SCHEMA UPDATES
-- ==========================================

-- Alter public.businesses to add platform-hybrid type and verification columns
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'empresa' CHECK (type IN ('empresa', 'profissional', 'loja'));
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_verified_store BOOLEAN DEFAULT false;

-- Alter public.products to add marketplace details (physical/digital types & SEO slugs)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'fisico' CHECK (type IN ('fisico', 'digital'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_type TEXT CHECK (digital_type IN ('curso', 'ebook', 'plr', 'template', 'prompt'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indices for dynamic SEO lookups if they do not exist
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_type ON public.businesses(type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);

-- Update check constraints on businesses plans if needed
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_plan_check CHECK (plan IN ('free', 'pro', 'premium', 'business'));

-- ==========================================
-- 2. SECURITY (RLS) POLICIES FOR CATEGORIES AND CITIES
-- ==========================================

-- Grant ALL access to categories and cities for administrators (cris.suboy@gmail.com)
DROP POLICY IF EXISTS "Admin write access to categories" ON public.categories;
CREATE POLICY "Admin write access to categories" ON public.categories
  FOR ALL USING (auth.jwt() ->> 'email' = 'cris.suboy@gmail.com');

DROP POLICY IF EXISTS "Admin write access to cities" ON public.cities;
CREATE POLICY "Admin write access to cities" ON public.cities
  FOR ALL USING (auth.jwt() ->> 'email' = 'cris.suboy@gmail.com');

-- ==========================================
-- 3. SEED DYNAMIC PORTUGAL CITIES & FREGUESIAS
-- ==========================================
INSERT INTO public.cities (id, name, slug, country, region, is_active) VALUES
  -- 18 distritos principais + regiões autónomas
  ('17759a10-e4ef-4e57-91e9-472ec7a49181', 'Lisboa', 'lisboa', 'Portugal', 'Lisboa', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49182', 'Porto', 'porto', 'Portugal', 'Porto', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49183', 'Aveiro', 'aveiro', 'Portugal', 'Aveiro', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49184', 'Coimbra', 'coimbra', 'Portugal', 'Coimbra', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49185', 'Braga', 'braga', 'Portugal', 'Braga', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49186', 'Faro', 'faro', 'Portugal', 'Algarve', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49187', 'Setúbal', 'setubal', 'Portugal', 'Setúbal', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49188', 'Leiria', 'leiria', 'Portugal', 'Leiria', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49189', 'Viseu', 'viseu', 'Portugal', 'Viseu', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49190', 'Évora', 'evora', 'Portugal', 'Alentejo', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49191', 'Viana do Castelo', 'viana-do-castelo', 'Portugal', 'Minho', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49192', 'Vila Real', 'vila-real', 'Portugal', 'Trás-os-Montes', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49193', 'Bragança', 'braganca', 'Portugal', 'Trás-os-Montes', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49194', 'Guarda', 'guarda', 'Portugal', 'Beira Interior', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49195', 'Castelo Branco', 'castelo-branco', 'Portugal', 'Beira Interior', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49196', 'Portalegre', 'portalegre', 'Portugal', 'Alentejo', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49197', 'Santarém', 'santarem', 'Portugal', 'Ribatejo', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49198', 'Beja', 'beja', 'Portugal', 'Alentejo', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49199', 'Funchal', 'funchal', 'Portugal', 'Madeira', true),
  ('17759a10-e4ef-4e57-91e9-472ec7a49200', 'Ponta Delgada', 'ponta-delgada', 'Portugal', 'Açores', true),
  
  -- Municípios / Concelhos Populosos
  (gen_random_uuid(), 'Vila Nova de Gaia', 'vila-nova-de-gaia', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Sintra', 'sintra', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Cascais', 'cascais', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Loures', 'loures', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Amadora', 'amadora', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Almada', 'almada', 'Portugal', 'Setúbal', true),
  (gen_random_uuid(), 'Odivelas', 'odivelas', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Matosinhos', 'matosinhos', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Gondomar', 'gondomar', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Guimarães', 'guimaraes', 'Portugal', 'Braga', true),
  (gen_random_uuid(), 'Vila Franca de Xira', 'vila-franca-de-xira', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Maia', 'maia', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Famalicão', 'famalicao', 'Portugal', 'Braga', true),
  (gen_random_uuid(), 'Barcelos', 'barcelos', 'Portugal', 'Braga', true),
  (gen_random_uuid(), 'Portimão', 'portimao', 'Portugal', 'Algarve', true),
  (gen_random_uuid(), 'Albufeira', 'albufeira', 'Portugal', 'Algarve', true),
  (gen_random_uuid(), 'Loulé', 'loule', 'Portugal', 'Algarve', true),

  -- Freguesias de Lisboa
  (gen_random_uuid(), 'Arroios', 'arroios', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Benfica', 'benfica', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Alvalade', 'alvalade', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Lumiar', 'lumiar', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Belém', 'belem', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Avenidas Novas', 'avenidas-novas', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Campo de Ourique', 'campo-de-ourique', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Olivais', 'olivais', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Marvila', 'marvila', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Misericórdia', 'misericordia', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Estrela', 'estrela', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Penha de França', 'penha-de-franca', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Santo António', 'santo-antonio', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Santa Maria Maior', 'santa-maria-maior', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Campolide', 'campolide', 'Portugal', 'Lisboa', true),
  (gen_random_uuid(), 'Parque das Nações', 'parque-das-nacoes', 'Portugal', 'Lisboa', true),

  -- Freguesias do Porto
  (gen_random_uuid(), 'Paranhos', 'paranhos', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Ramalde', 'ramalde', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Campanhã', 'campanha', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Bonfim', 'bonfim', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Lordelo do Ouro e Massarelos', 'lordelo-do-ouro-e-massarelos', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau, Vitória', 'cedofeita-santo-ildefonso-se-miragaia-sao-nicolau-vitoria', 'Portugal', 'Porto', true),
  (gen_random_uuid(), 'Aldoar, Foz do Douro e Nevogilde', 'aldoar-foz-do-douro-e-nevogilde', 'Portugal', 'Porto', true)
ON CONFLICT (name, country) DO NOTHING;

-- ==========================================
-- 4. SEED HIERARCHICAL CATEGORIES
-- ==========================================

-- Insert Top-Level Parent Categories
INSERT INTO public.categories (id, name, slug, icon, description, parent_id, is_active) VALUES
  ('c0000000-0000-4000-a000-000000000000', 'Serviços', 'servicos', '🛠️', 'Prestação de serviços profissionais locais', NULL, true),
  ('c1000000-0000-4000-a000-000000000000', 'Marketplace', 'marketplace', '🛍️', 'Produtos físicos e lojas locais', NULL, true),
  ('c2000000-0000-4000-a000-000000000000', 'Digital', 'digital', '💻', 'Produtos digitais, cursos e infoprodutos', NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Services Child Categories
INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Advogado', 'advogado', '⚖️', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Dentista', 'dentista', '🦷', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Ginecologista', 'ginecologista', '🩺', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Psicólogo', 'psicologo', '🧠', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Canalizador', 'canalizador', '🔧', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Tubista', 'tubista', '🛠️', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Soldador', 'soldador', '👨‍🏭', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Eletricista', 'eletricista', '⚡', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Marido de Aluguel', 'marido-de-aluguel', '🏠', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Agência de Marketing', 'agencia-de-marketing', '📈', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Designer', 'designer', '🎨', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Digitador', 'digitador', '⌨️', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Currículos', 'curriculos', '📄', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  
  -- Novas categorias requisitadas
  ('Limpeza', 'limpeza', '🧹', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Marketing Digital', 'marketing-digital', '📈', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Gestor de Tráfego', 'gestor-de-trafego', '📊', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Web Designer', 'web-designer', '💻', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Designer Gráfico', 'designer-grafico', '🎨', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Restaurantes', 'restaurantes', '🍽️', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Pastelarias', 'pastelarias', '🥐', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Cafés', 'cafes', '☕', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Hotéis', 'hoteis', '🏨', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Alojamento Local', 'alojamento-local', '🏡', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Oficinas', 'oficinas', '🔧', (SELECT id FROM public.categories WHERE slug = 'servicos'), true),
  ('Imobiliárias', 'imobiliarias', '🏢', (SELECT id FROM public.categories WHERE slug = 'servicos'), true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Marketplace Child Categories
INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Moda', 'moda', '👕', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true),
  ('Eletrônicos', 'eletronicos', '💻', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true),
  ('Casa', 'casa', '🏠', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true),
  ('Ferramentas', 'ferramentas', '🔨', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true),
  ('Automóveis', 'automoveis', '🚗', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true),
  ('Artesanato', 'artesanato', '🏺', (SELECT id FROM public.categories WHERE slug = 'marketplace'), true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Digital Child Categories
INSERT INTO public.categories (name, slug, icon, parent_id, is_active) VALUES
  ('Cursos', 'cursos', '🎓', (SELECT id FROM public.categories WHERE slug = 'digital'), true),
  ('Ebooks', 'ebooks', '📚', (SELECT id FROM public.categories WHERE slug = 'digital'), true),
  ('PLR', 'plr', '📦', (SELECT id FROM public.categories WHERE slug = 'digital'), true),
  ('Templates', 'templates', '⚙️', (SELECT id FROM public.categories WHERE slug = 'digital'), true),
  ('Prompts IA', 'prompts-ia', '🤖', (SELECT id FROM public.categories WHERE slug = 'digital'), true)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 5. SEED PLATFORM-HYBRID BUSINESSES & PRODUCTS
-- ==========================================

-- Insert Auth Users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ofensiva@mock.com', '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ofensiva Criativa Admin"}', now(), now(), 'authenticated', 'authenticated'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'zafix@mock.com', '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zafix Admin"}', now(), now(), 'authenticated', 'authenticated'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'zavix@mock.com', '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zavix Onlane Admin"}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert User Profiles
INSERT INTO public.profiles (id, email, display_name, plan, created_at, updated_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ofensiva@mock.com', 'Ofensiva Criativa', 'premium', now(), now()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'zafix@mock.com', 'Zafix', 'premium', now(), now()),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'zavix@mock.com', 'Zavix Onlane', 'premium', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert Business 1: Ofensiva Criativa (Digital Expat/Immigrant Marketing & Coding Agency in Porto)
INSERT INTO public.businesses (
  id, user_id, name, description, whatsapp, phone, email, instagram, website, slug, logo_url, cover_url, published, plan, is_verified, rating_average, rating_count, view_count, category_id, city_id, owner_origin_country, type, is_verified_store
)
SELECT 
  'b5111111-1111-4111-a111-111111111111',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'Ofensiva Criativa',
  'Desenvolvemos templates Next.js, ebooks e cursos de SEO e Programação para alavancar a presença digital de novos negócios em Portugal. Foco em soluções de tráfego orgânico de alta conversão.',
  '+351911111111',
  '+351221111111',
  'contacto@ofensivacriativa.pt',
  '@ofensivacriativa',
  'https://ofensivacriativa.pt',
  'ofensiva-criativa',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=500&fit=crop',
  true,
  'business',
  true,
  4.9,
  2,
  354,
  c.id,
  ci.id,
  'Brasil',
  'loja', -- Hybrid Shop
  true   -- Verified Store
FROM public.categories c, public.cities ci
WHERE c.slug = 'templates' AND ci.slug = 'porto'
ON CONFLICT (id) DO NOTHING;

-- Insert Business 2: Zafix (Physical Tech Shop in Lisbon)
INSERT INTO public.businesses (
  id, user_id, name, description, whatsapp, phone, email, instagram, website, slug, logo_url, cover_url, published, plan, is_verified, rating_average, rating_count, view_count, category_id, city_id, owner_origin_country, type, is_verified_store
)
SELECT 
  'b5222222-2222-4222-a222-222222222222',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'Zafix',
  'A sua loja de eletrónicos e gadgets de referência em Lisboa. Smartphones, computadores recondicionados, cabos e acessórios premium com o melhor custo-benefício e entrega rápida em Portugal.',
  '+351922222222',
  '+351212222222',
  'contacto@zafix.pt',
  '@zafix.eletronicos',
  'https://zafix.pt',
  'zafix',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=500&fit=crop',
  true,
  'business',
  true,
  4.7,
  1,
  182,
  c.id,
  ci.id,
  'Angola',
  'loja', -- Hybrid Shop
  true   -- Verified Store
FROM public.categories c, public.cities ci
WHERE c.slug = 'eletronicos' AND ci.slug = 'lisboa'
ON CONFLICT (id) DO NOTHING;

-- Insert Business 3: Zavix Onlane (Physical & Digital Tech Store in Faro)
INSERT INTO public.businesses (
  id, user_id, name, description, whatsapp, phone, email, instagram, website, slug, logo_url, cover_url, published, plan, is_verified, rating_average, rating_count, view_count, category_id, city_id, owner_origin_country, type, is_verified_store
)
SELECT 
  'b5333333-3333-4333-a333-333333333333',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'Zavix Onlane',
  'A sua boutique e loja online de tecnologia e acessórios de alta performance. Oferecemos smartwatches, auriculares com cancelamento de ruído e gadgets inteligentes com entrega rápida em Portugal.',
  '+351933333333',
  '+351289333333',
  'contacto@zavix.onlane',
  '@zavix.onlane',
  'https://zavix.onlane',
  'zavix-onlane',
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=500&fit=crop',
  true,
  'business',
  true,
  5.0,
  1,
  95,
  c.id,
  ci.id,
  'Portugal',
  'loja', -- Hybrid Shop
  true   -- Verified Store
FROM public.categories c, public.cities ci
WHERE c.slug = 'eletronicos' AND ci.slug = 'faro'
ON CONFLICT (id) DO NOTHING;

-- Seed Products for Ofensiva Criativa (Digital Products)
INSERT INTO public.products (id, business_id, name, description, price, image_url, order_index, type, digital_type, download_url, slug) VALUES
  (
    'f5111111-1111-4111-a111-111111111111',
    'b5111111-1111-4111-a111-111111111111',
    'Template Next.js SaaS Premium',
    'Landing page profissional otimizada para SaaS com integração Stripe, Supabase Auth, e Tailwind CSS. Carregamento ultrarrápido.',
    49.00,
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop',
    1,
    'digital',
    'template',
    'https://github.com/ofensiva/saas-template-premium',
    'template-nextjs-saas-premium'
  ),
  (
    'f5111111-1111-4111-a111-222222222222',
    'b5111111-1111-4111-a111-111111111111',
    'Curso SEO Programático Massivo',
    'Aprenda a estruturar e indexar milhares de landing pages de SEO dinâmico no Google. Inclui scripts Node.js e configurações Supabase.',
    97.00,
    'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=600&h=400&fit=crop',
    2,
    'digital',
    'curso',
    'https://ofensivacriativa.hotmart.com/seo-programatico',
    'curso-seo-programatico-massivo'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Products for Zafix (Physical Products)
INSERT INTO public.products (id, business_id, name, description, price, image_url, order_index, type, slug) VALUES
  (
    'f5222222-2222-4222-a222-111111111111',
    'b5222222-2222-4222-a222-222222222222',
    'Carregador Rápido 20W USB-C',
    'Carregamento turbo compatível com iPhone, Samsung e Xiaomi. Proteção de aquecimento inteligente integrada e cabo reforçado.',
    12.90,
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=400&fit=crop',
    1,
    'fisico',
    'carregador-rapido-20w-usbc'
  ),
  (
    'f5222222-2222-4222-a222-222222222222',
    'b5222222-2222-4222-a222-222222222222',
    'Auscultadores Bluetooth ANC',
    'Cancelamento ativo de ruído (ANC), bateria de 30 horas, som estéreo HD e conexão inteligente multiponto Bluetooth 5.2.',
    34.90,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
    2,
    'fisico',
    'auscultadores-bluetooth-anc'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Products for Zavix Onlane (Physical Products)
INSERT INTO public.products (id, business_id, name, description, price, image_url, order_index, type, slug) VALUES
  (
    'f5333333-3333-4333-a333-111111111111',
    'b5333333-3333-4333-a333-333333333333',
    'Smartwatch Sport GPS V4',
    'Monitor de ritmo cardíaco, rastreador de sono, GPS integrado e bateria de até 14 dias para atividades ao ar livre.',
    59.90,
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=400&fit=crop',
    1,
    'fisico',
    'smartwatch-sport-gps-v4'
  ),
  (
    'f5333333-3333-4333-a333-222222222222',
    'b5333333-3333-4333-a333-333333333333',
    'Auriculares Bluetooth ANC Prime',
    'Cancelamento ativo de ruído estéreo, design intra-auricular ergonómico e 24h de autonomia com estojo de carga rápida.',
    24.90,
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=400&fit=crop',
    2,
    'fisico',
    'auriculares-bluetooth-anc-prime'
  )
ON CONFLICT (id) DO NOTHING;
