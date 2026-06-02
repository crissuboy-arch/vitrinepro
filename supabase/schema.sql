-- VitrinePro Complete Database Schema
-- Run this in the Supabase SQL Editor on your NEW project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE (Extends auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a profile for new users signing up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. CITIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ==========================================
-- 4. PLANS/PRICING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2),
  price_yearly NUMERIC(10,2),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. BUSINESSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  city TEXT,
  country TEXT,
  address TEXT,
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  youtube TEXT,
  linkedin TEXT,
  website TEXT,
  opening_hours JSONB DEFAULT '{}',
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  cover_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Compatibility fields for existing frontend pages
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  is_verified BOOLEAN DEFAULT false,
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_origin_country TEXT,
  
  UNIQUE(user_id)
);

-- ==========================================
-- 6. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  image_url TEXT,
  order_index INTEGER DEFAULT 0
);

-- ==========================================
-- 7. TESTIMONIALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. GALLERY_IMAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- ==========================================
-- 9. REVIEWS TABLE (Compatibility)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 10. BUSINESS_IMAGES TABLE (Compatibility)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.business_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('gallery', 'logo', 'cover')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. TRIGGERS FOR BACKWARD COMPATIBILITY
-- ==========================================

-- Trigger to sync business fields (category/city lookup & published status)
CREATE OR REPLACE FUNCTION public.sync_business_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync published status
  IF TG_OP = 'INSERT' THEN
    IF NEW.published IS NULL AND NEW.is_published IS NOT NULL THEN
      NEW.published := NEW.is_published;
    ELSIF NEW.is_published IS NULL AND NEW.published IS NOT NULL THEN
      NEW.is_published := NEW.published;
    END IF;
  ELSE -- TG_OP = 'UPDATE'
    IF NEW.published IS DISTINCT FROM OLD.published THEN
      NEW.is_published := NEW.published;
    ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
      NEW.published := NEW.is_published;
    END IF;
  END IF;

  -- Sync category name
  IF TG_OP = 'INSERT' THEN
    IF NEW.category_id IS NOT NULL THEN
      SELECT name INTO NEW.category FROM public.categories WHERE id = NEW.category_id;
    END IF;
  ELSE -- UPDATE
    IF NEW.category_id IS DISTINCT FROM OLD.category_id AND NEW.category_id IS NOT NULL THEN
      SELECT name INTO NEW.category FROM public.categories WHERE id = NEW.category_id;
    END IF;
  END IF;

  -- Sync city and country
  IF TG_OP = 'INSERT' THEN
    IF NEW.city_id IS NOT NULL THEN
      SELECT name, country INTO NEW.city, NEW.country FROM public.cities WHERE id = NEW.city_id;
    END IF;
  ELSE -- UPDATE
    IF NEW.city_id IS DISTINCT FROM OLD.city_id AND NEW.city_id IS NOT NULL THEN
      SELECT name, country INTO NEW.city, NEW.country FROM public.cities WHERE id = NEW.city_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_business_fields ON public.businesses;
CREATE TRIGGER trigger_sync_business_fields
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_fields();

-- Testimonial <-> Review Sync triggers
CREATE OR REPLACE FUNCTION public.sync_testimonial_to_review()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.reviews (id, business_id, author_name, rating, comment, is_approved, created_at)
  VALUES (
    NEW.id,
    NEW.business_id,
    NEW.author_name,
    NEW.rating,
    NEW.text,
    true,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    author_name = EXCLUDED.author_name,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    is_approved = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_testimonial_to_review ON public.testimonials;
CREATE TRIGGER trg_sync_testimonial_to_review
  AFTER INSERT OR UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.sync_testimonial_to_review();

CREATE OR REPLACE FUNCTION public.sync_testimonial_delete_to_review()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.reviews WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_testimonial_delete_to_review ON public.testimonials;
CREATE TRIGGER trg_sync_testimonial_delete_to_review
  AFTER DELETE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.sync_testimonial_delete_to_review();

-- Review <-> Testimonial Sync triggers
CREATE OR REPLACE FUNCTION public.sync_review_to_testimonial()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.is_approved = true THEN
    INSERT INTO public.testimonials (id, business_id, author_name, text, rating, created_at)
    VALUES (
      NEW.id,
      NEW.business_id,
      NEW.author_name,
      COALESCE(NEW.comment, ''),
      NEW.rating,
      NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
      author_name = EXCLUDED.author_name,
      text = EXCLUDED.text,
      rating = EXCLUDED.rating;
  ELSE
    DELETE FROM public.testimonials WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_review_to_testimonial ON public.reviews;
CREATE TRIGGER trg_sync_review_to_testimonial
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_review_to_testimonial();

CREATE OR REPLACE FUNCTION public.sync_review_delete_to_testimonial()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.testimonials WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_review_delete_to_testimonial ON public.reviews;
CREATE TRIGGER trg_sync_review_delete_to_testimonial
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_review_delete_to_testimonial();

-- Gallery Image <-> Business Image Sync triggers
CREATE OR REPLACE FUNCTION public.sync_gallery_to_business_images()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_images (id, business_id, url, type, order_index)
  VALUES (
    NEW.id,
    NEW.business_id,
    NEW.image_url,
    'gallery',
    NEW.order_index
  )
  ON CONFLICT (id) DO UPDATE SET
    url = EXCLUDED.url,
    order_index = EXCLUDED.order_index;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_gallery_to_business_images ON public.gallery_images;
CREATE TRIGGER trg_sync_gallery_to_business_images
  AFTER INSERT OR UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_gallery_to_business_images();

CREATE OR REPLACE FUNCTION public.sync_gallery_delete_to_business_images()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.business_images WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_gallery_delete_to_business_images ON public.gallery_images;
CREATE TRIGGER trg_sync_gallery_delete_to_business_images
  AFTER DELETE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_gallery_delete_to_business_images();

CREATE OR REPLACE FUNCTION public.sync_business_images_to_gallery()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'gallery' THEN
    INSERT INTO public.gallery_images (id, business_id, image_url, order_index)
    VALUES (
      NEW.id,
      NEW.business_id,
      NEW.url,
      NEW.order_index
    )
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      order_index = EXCLUDED.order_index;
  ELSE
    DELETE FROM public.gallery_images WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_business_images_to_gallery ON public.business_images;
CREATE TRIGGER trg_sync_business_images_to_gallery
  AFTER INSERT OR UPDATE ON public.business_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_images_to_gallery();

CREATE OR REPLACE FUNCTION public.sync_business_images_delete_to_gallery()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.gallery_images WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_business_images_delete_to_gallery ON public.business_images;
CREATE TRIGGER trg_sync_business_images_delete_to_gallery
  AFTER DELETE ON public.business_images
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_images_delete_to_gallery();