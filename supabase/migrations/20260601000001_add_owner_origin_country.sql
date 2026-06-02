-- Migration to add owner_origin_country to public.businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_origin_country TEXT;

-- Update existing seeded businesses with mock countries of origin
UPDATE public.businesses
SET owner_origin_country = 'Brasil'
WHERE slug = 'sabores-da-terra';

UPDATE public.businesses
SET owner_origin_country = 'Cabo Verde'
WHERE slug = 'studio-bella';
