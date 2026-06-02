-- Storage Setup Script
-- Run this in the Supabase SQL Editor on your NEW project after running schema.sql

-- ==========================================
-- 1. CREATE STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vitrine-logos', 'vitrine-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('vitrine-covers', 'vitrine-covers', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('vitrine-gallery', 'vitrine-gallery', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('vitrine-products', 'vitrine-products', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('business-images', 'business-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('business-media', 'business-media', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. CREATE STORAGE POLICIES
-- ==========================================
-- Clean up existing policies if any
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Access" ON storage.objects;

-- Allow public read access to all buckets
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id IN (
    'vitrine-logos', 'vitrine-covers', 'vitrine-gallery', 'vitrine-products', 'business-images', 'business-media'
  ));

-- Allow authenticated users to upload/insert files
CREATE POLICY "Auth Insert Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery', 'vitrine-products', 'business-images', 'business-media'
    ) 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their files
CREATE POLICY "Auth Update Access" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery', 'vitrine-products', 'business-images', 'business-media'
    )
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their files
CREATE POLICY "Auth Delete Access" ON storage.objects
  FOR DELETE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery', 'vitrine-products', 'business-images', 'business-media'
    )
    AND auth.role() = 'authenticated'
  );
