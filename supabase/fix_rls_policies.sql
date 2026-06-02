-- Row Level Security (RLS) Policies
-- Run this in the Supabase SQL Editor on your NEW project after running schema.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_images ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view cities" ON public.cities;
DROP POLICY IF EXISTS "Public can view plans" ON public.plans;

DROP POLICY IF EXISTS "Businesses read access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses insert access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses update access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete access" ON public.businesses;

DROP POLICY IF EXISTS "Products read access" ON public.products;
DROP POLICY IF EXISTS "Products write access" ON public.products;

DROP POLICY IF EXISTS "Testimonials read access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials insert access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials write access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials delete access" ON public.testimonials;

DROP POLICY IF EXISTS "Gallery images read access" ON public.gallery_images;
DROP POLICY IF EXISTS "Gallery images write access" ON public.gallery_images;

DROP POLICY IF EXISTS "Reviews read access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews write access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews delete access" ON public.reviews;

DROP POLICY IF EXISTS "Business images read access" ON public.business_images;
DROP POLICY IF EXISTS "Business images write access" ON public.business_images;

-- ==========================================
-- 1. PROFILES POLICIES
-- ==========================================
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. CATEGORIES, CITIES, PLANS (Public read)
-- ==========================================
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Public can view plans" ON public.plans
  FOR SELECT USING (true);

-- ==========================================
-- 3. BUSINESSES POLICIES
-- ==========================================
CREATE POLICY "Businesses read access" ON public.businesses
  FOR SELECT USING (published = true OR is_published = true OR auth.uid() = user_id);

CREATE POLICY "Businesses insert access" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Businesses update access" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Businesses delete access" ON public.businesses
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4. PRODUCTS POLICIES
-- ==========================================
CREATE POLICY "Products read access" ON public.products
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "Products write access" ON public.products
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ==========================================
-- 5. TESTIMONIALS POLICIES
-- ==========================================
CREATE POLICY "Testimonials read access" ON public.testimonials
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "Testimonials insert access" ON public.testimonials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Testimonials write access" ON public.testimonials
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Testimonials delete access" ON public.testimonials
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ==========================================
-- 6. GALLERY IMAGES POLICIES
-- ==========================================
CREATE POLICY "Gallery images read access" ON public.gallery_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "Gallery images write access" ON public.gallery_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ==========================================
-- 7. REVIEWS POLICIES (Compatibility)
-- ==========================================
CREATE POLICY "Reviews read access" ON public.reviews
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "Reviews insert access" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Reviews write access" ON public.reviews
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Reviews delete access" ON public.reviews
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ==========================================
-- 8. BUSINESS IMAGES POLICIES (Compatibility)
-- ==========================================
CREATE POLICY "Business images read access" ON public.business_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE published = true OR is_published = true OR user_id = auth.uid())
  );

CREATE POLICY "Business images write access" ON public.business_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
