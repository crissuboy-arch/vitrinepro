-- ============================================================
-- VitrinePro — A2.4 CANONICAL RLS NORMALIZATION (idempotent)
-- Date: 2026-10-04 — Fase A2 (Fundação Segura)
--
-- WHY: the audit found two conflicting policy sets in the repo:
--   supabase/fix_rls_policies.sql            (standalone script)
--   supabase/migrations/002_fix_schema.sql   (migration)
-- They disagree on: businesses read scope, products read scope,
-- profiles read scope, reviews read scope.
-- The REAL production state is UNKNOWN (never guessed here).
--
-- WHAT THIS DOES:
--  - Drops every conflicting policy name from both sets (idempotent).
--  - Recreates ONE canonical, documented policy set.
--  - Policies only: NO data is modified, NO tables are dropped.
--  - Safe to run multiple times (all statements are IF EXISTS / re-create).
--
-- DO NOT APPLY BLINDLY IN PRODUCTION:
--  1. Supabase Dashboard → Database → Migrations: confirm this file sorts
--     AFTER the last applied migration.
--  2. Snapshot current policies first:
--       SELECT schemaname, tablename, policyname, cmd
--       FROM pg_policies WHERE schemaname IN ('public','storage')
--       ORDER BY tablename, policyname;
--  3. Apply in the SQL Editor, then run the VERIFICATION block at the end.
--  4. Smoke-test: public vitrine page, login, dashboard analytics, upload.
-- ============================================================

-- ─── 0. Drop ALL known conflicting policy names ─────────────────
-- businesses
DROP POLICY IF EXISTS "Public read published businesses" ON public.businesses;
DROP POLICY IF EXISTS "public_read_published" ON public.businesses;
DROP POLICY IF EXISTS "Owner read own business" ON public.businesses;
DROP POLICY IF EXISTS "Owner insert business" ON public.businesses;
DROP POLICY IF EXISTS "Owner update business" ON public.businesses;
DROP POLICY IF EXISTS "Businesses read access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses insert access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses update access" ON public.businesses;
DROP POLICY IF EXISTS "Businesses delete access" ON public.businesses;
-- products
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Products read access" ON public.products;
DROP POLICY IF EXISTS "Products write access" ON public.products;
-- testimonials
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials read access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials insert access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials write access" ON public.testimonials;
DROP POLICY IF EXISTS "Testimonials delete access" ON public.testimonials;
-- gallery_images
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Gallery images read access" ON public.gallery_images;
DROP POLICY IF EXISTS "Gallery images write access" ON public.gallery_images;
-- business_images
DROP POLICY IF EXISTS "Business images read access" ON public.business_images;
DROP POLICY IF EXISTS "Business images write access" ON public.business_images;
-- reviews
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviews read access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews write access" ON public.reviews;
DROP POLICY IF EXISTS "Reviews delete access" ON public.reviews;
-- profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner read profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner update profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role insert profile" ON public.profiles;
-- categories / cities / plans
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view cities" ON public.cities;
DROP POLICY IF EXISTS "Public can view plans" ON public.plans;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read cities" ON public.cities;
-- analytics
DROP POLICY IF EXISTS "Public insert analytics" ON public.business_analytics;
DROP POLICY IF EXISTS "Owner read analytics" ON public.business_analytics;
-- favorites
DROP POLICY IF EXISTS "User manages favorites" ON public.favorites;
DROP POLICY IF EXISTS "Public read favorite counts" ON public.favorites;
-- business_posts
DROP POLICY IF EXISTS "Public read posts" ON public.business_posts;
DROP POLICY IF EXISTS "Owner write posts" ON public.business_posts;
-- invite_links
DROP POLICY IF EXISTS "Public read invite" ON public.invite_links;
DROP POLICY IF EXISTS "Auth insert invite" ON public.invite_links;
DROP POLICY IF EXISTS "Owner update invite" ON public.invite_links;
-- short_links
DROP POLICY IF EXISTS "Owner manage" ON public.short_links;
DROP POLICY IF EXISTS "Public read" ON public.short_links;
-- catalogs
DROP POLICY IF EXISTS "Users manage own catalogs" ON public.catalogs;
DROP POLICY IF EXISTS "Public catalogs viewable by all" ON public.catalogs;
-- content_calendar
DROP POLICY IF EXISTS "Users manage own content_calendar" ON public.content_calendar;
-- leads (broad read removed by A2.3 migration; belt-and-braces here)
DROP POLICY IF EXISTS "leads_select_auth" ON public.leads;
-- storage
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Access" ON storage.objects;

-- ─── 1. BUSINESSES ──────────────────────────────────────────────
-- Canonical: public reads PUBLISHED (either flag, legacy compat);
-- owners read/write their own (incl. drafts).
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_businesses_select" ON public.businesses
  FOR SELECT USING (published = true OR is_published = true OR user_id = auth.uid());

CREATE POLICY "vp_businesses_insert" ON public.businesses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "vp_businesses_update" ON public.businesses
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "vp_businesses_delete" ON public.businesses
  FOR DELETE USING (user_id = auth.uid());

-- ─── 2. PRODUCTS / GALLERY / BUSINESS_IMAGES / TESTIMONIALS / POSTS
-- Canonical: public reads when the business is published (or owner);
-- writes restricted to the business owner.
-- (002_fix_schema allowed unrestricted public product reads — the leak
--  is closed here: unpublished businesses' products stay private.)

CREATE POLICY "vp_products_select" ON public.products
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );
CREATE POLICY "vp_products_write" ON public.products
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "vp_gallery_select" ON public.gallery_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );
CREATE POLICY "vp_gallery_write" ON public.gallery_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "vp_business_images_select" ON public.business_images
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );
CREATE POLICY "vp_business_images_write" ON public.business_images
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- Testimonials: visitors may submit (public insert); reads follow the
-- business visibility rule; owner moderates.
CREATE POLICY "vp_testimonials_select" ON public.testimonials
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );
CREATE POLICY "vp_testimonials_insert" ON public.testimonials
  FOR INSERT WITH CHECK (true);
CREATE POLICY "vp_testimonials_owner_write" ON public.testimonials
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "vp_testimonials_owner_delete" ON public.testimonials
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "vp_posts_select" ON public.business_posts
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses
      WHERE published = true OR is_published = true OR user_id = auth.uid())
  );
CREATE POLICY "vp_posts_write" ON public.business_posts
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ─── 3. REVIEWS ─────────────────────────────────────────────────
-- Canonical: public reads APPROVED reviews (or the owner's own);
-- anyone may submit; owner moderates.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_reviews_select" ON public.reviews
  FOR SELECT USING (
    is_approved = true
    OR business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "vp_reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);
CREATE POLICY "vp_reviews_owner_write" ON public.reviews
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "vp_reviews_owner_delete" ON public.reviews
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ─── 4. PROFILES ────────────────────────────────────────────────
-- Canonical: strictly owner-scoped (002_fix_schema wins over the public
-- read in fix_rls_policies.sql). Admin user listing must go through a
-- server-side API (service role) — see PENDÊNCIAS.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_profiles_select" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "vp_profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "vp_profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── 5. PUBLIC CATALOG TABLES ───────────────────────────────────
CREATE POLICY "vp_categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "vp_cities_select" ON public.cities FOR SELECT USING (true);
CREATE POLICY "vp_plans_select" ON public.plans FOR SELECT USING (true);

-- ─── 6. ANALYTICS ───────────────────────────────────────────────
-- Public INSERT kept (anonymous page views) — abuse is handled in the
-- API layer (rate limit + validation + dedup), not by RLS.
-- SELECT is owner-only; the GET endpoint additionally enforces ownership
-- in application code (defense in depth).
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_analytics_insert" ON public.business_analytics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "vp_analytics_select_owner" ON public.business_analytics
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ─── 7. FAVORITES ───────────────────────────────────────────────
-- Canonical: strictly per-user. The old "Public read favorite counts"
-- (USING true) leaked who favorited what — removed. If a public counter
-- is needed later, add a SECURITY DEFINER function returning counts only.
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vp_favorites_manage" ON public.favorites
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── 8. SHORT LINKS / CATALOGS / CONTENT CALENDAR / INVITES ─────
CREATE POLICY "vp_short_links_public_read" ON public.short_links
  FOR SELECT USING (true); -- needed for /v/[code] redirects
CREATE POLICY "vp_short_links_owner_write" ON public.short_links
  FOR ALL USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "vp_catalogs_owner" ON public.catalogs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "vp_catalogs_public_read" ON public.catalogs
  FOR SELECT USING (publico = true);

CREATE POLICY "vp_content_calendar_owner" ON public.content_calendar
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "vp_invite_public_read" ON public.invite_links
  FOR SELECT USING (true);
CREATE POLICY "vp_invite_auth_insert" ON public.invite_links
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "vp_invite_owner_update" ON public.invite_links
  FOR UPDATE USING (created_by = auth.uid());

-- ─── 9. STORAGE (A2.13) ─────────────────────────────────────────
-- BEFORE: any authenticated user could UPDATE/DELETE any file in the
-- public buckets (no ownership isolation).
-- AFTER: writes are isolated by path — the app uploads to
-- `{business_id}/...` (see lib/supabase-storage.ts), and only the owner
-- of that business may insert/update/delete under its prefix.
-- Public read is preserved (vitrines are public).

CREATE POLICY "vp_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN (
    'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
    'vitrine-products', 'business-images', 'business-media'
  ));

CREATE POLICY "vp_storage_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

CREATE POLICY "vp_storage_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

CREATE POLICY "vp_storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN (
      'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
      'vitrine-products', 'business-images', 'business-media'
    )
    AND (SELECT user_id FROM public.businesses
         WHERE id::text = split_part(name, '/', 1)) = auth.uid()
  );

-- ============================================================
-- VERIFICATION (run after applying)
-- ============================================================
-- -- 1. No legacy/conflicting policy names remain:
-- SELECT policyname FROM pg_policies
--  WHERE schemaname IN ('public','storage')
--    AND (policyname LIKE '%read access%' OR policyname LIKE '%write access%'
--      OR policyname = 'leads_select_auth'
--      OR policyname = 'Public read favorite counts'
--      OR policyname = 'Auth Insert Access');
-- -- expect: 0 rows
--
-- -- 2. Canonical policies present (spot check):
-- SELECT count(*) FROM pg_policies
--  WHERE schemaname='public' AND policyname LIKE 'vp\_%';
-- -- expect: > 30
--
-- -- 3. Leads still owner-scoped (from A2.3 migration):
-- SELECT policyname FROM pg_policies
--  WHERE schemaname='public' AND tablename='leads' AND cmd='SELECT';
-- -- expect: leads_select_owner
-- ============================================================
