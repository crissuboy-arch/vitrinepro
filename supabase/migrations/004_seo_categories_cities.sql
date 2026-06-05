-- ============================================================
-- Migration 004: SEO Categories + Portuguese Cities
-- Run in Supabase SQL Editor
-- ============================================================

-- CATEGORIES (14 categorias pedidas) — safe insert, skip if slug exists
INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Manicure', 'manicure', '💅', 'Profissionais de manicure, pedicure e cuidado de unhas em Portugal', true, 10
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'manicure');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Cabeleireiro', 'cabeleireiro', '✂️', 'Cabeleireiros, barbearias e salões de beleza em Portugal', true, 11
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'cabeleireiro');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Restaurante', 'restaurante', '🍽️', 'Restaurantes, snack-bares e casas de pasto em Portugal', true, 12
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'restaurante');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Advogado', 'advogado', '⚖️', 'Advogados e escritórios de advocacia em Portugal', true, 13
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'advogado');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Dentista', 'dentista', '🦷', 'Dentistas, clínicas dentárias e estomatologistas em Portugal', true, 14
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'dentista');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Ginecologista', 'ginecologista', '🩺', 'Ginecologistas e obstetras em Portugal', true, 15
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'ginecologista');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Soldador', 'soldador', '🔧', 'Soldadores e serviços de soldadura em Portugal', true, 16
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'soldador');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Tubista', 'tubista', '🔩', 'Canalizadores, tubistas e serviços de canalização em Portugal', true, 17
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'tubista');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Digitador', 'digitador', '⌨️', 'Serviços de digitação, transcrição e secretariado virtual em Portugal', true, 18
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'digitador');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Criação de Currículo', 'criacao-de-curriculo', '📄', 'Criação profissional de currículos, portfólios e cartas de motivação', true, 19
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'criacao-de-curriculo');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Marketplace', 'marketplace', '🛒', 'Marketplace de produtos locais e digitais em Portugal', true, 20
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'marketplace');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Agência de Marketing', 'agencia-de-marketing', '📈', 'Agências de marketing digital, publicidade e comunicação em Portugal', true, 21
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'agencia-de-marketing');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Loja Online', 'loja-online', '🛍️', 'Lojas online e e-commerce de produtos portugueses', true, 22
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'loja-online');

INSERT INTO public.categories (id, name, slug, icon, description, is_active, order_index)
SELECT gen_random_uuid(), 'Marido de Aluguel', 'marido-de-aluguel', '🔨', 'Serviços de reparação, bricolage e trabalhos domésticos ao domicílio', true, 23
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'marido-de-aluguel');

-- CITIES: 33 cidades portuguesas — safe insert
INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Lisboa', 'lisboa', 'Portugal', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'lisboa');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Porto', 'porto', 'Portugal', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'porto');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Braga', 'braga', 'Portugal', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'braga');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Coimbra', 'coimbra', 'Portugal', true, 4
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'coimbra');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Aveiro', 'aveiro', 'Portugal', true, 5
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'aveiro');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Setúbal', 'setubal', 'Portugal', true, 6
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'setubal');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Faro', 'faro', 'Portugal', true, 7
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'faro');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Évora', 'evora', 'Portugal', true, 8
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'evora');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Viseu', 'viseu', 'Portugal', true, 9
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'viseu');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Leiria', 'leiria', 'Portugal', true, 10
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'leiria');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Funchal', 'funchal', 'Portugal', true, 11
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'funchal');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Guimarães', 'guimaraes', 'Portugal', true, 12
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'guimaraes');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Almada', 'almada', 'Portugal', true, 13
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'almada');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Amadora', 'amadora', 'Portugal', true, 14
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'amadora');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Sintra', 'sintra', 'Portugal', true, 15
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'sintra');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Cascais', 'cascais', 'Portugal', true, 16
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'cascais');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Oeiras', 'oeiras', 'Portugal', true, 17
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'oeiras');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Loures', 'loures', 'Portugal', true, 18
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'loures');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Seixal', 'seixal', 'Portugal', true, 19
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'seixal');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Vila Nova de Gaia', 'vila-nova-de-gaia', 'Portugal', true, 20
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'vila-nova-de-gaia');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Matosinhos', 'matosinhos', 'Portugal', true, 21
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'matosinhos');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Gondomar', 'gondomar', 'Portugal', true, 22
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'gondomar');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Maia', 'maia', 'Portugal', true, 23
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'maia');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Valongo', 'valongo', 'Portugal', true, 24
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'valongo');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Viana do Castelo', 'viana-do-castelo', 'Portugal', true, 25
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'viana-do-castelo');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Bragança', 'braganca', 'Portugal', true, 26
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'braganca');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Santarém', 'santarem', 'Portugal', true, 27
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'santarem');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Portalegre', 'portalegre', 'Portugal', true, 28
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'portalegre');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Castelo Branco', 'castelo-branco', 'Portugal', true, 29
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'castelo-branco');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Beja', 'beja', 'Portugal', true, 30
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'beja');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Guarda', 'guarda', 'Portugal', true, 31
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'guarda');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Vila Real', 'vila-real', 'Portugal', true, 32
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'vila-real');

INSERT INTO public.cities (id, name, slug, country, is_active, order_index)
SELECT gen_random_uuid(), 'Ponta Delgada', 'ponta-delgada', 'Portugal', true, 33
WHERE NOT EXISTS (SELECT 1 FROM public.cities WHERE slug = 'ponta-delgada');
