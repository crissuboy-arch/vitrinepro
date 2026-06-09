-- Add catalog_settings column to businesses table
-- Run this in the Supabase SQL Editor before deploying the catalog PDF feature

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS catalog_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN public.businesses.catalog_settings IS
  'Stores user-customized catalog PDF preferences (colors, fonts, content toggles)';
