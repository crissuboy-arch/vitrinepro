-- ============================================================================
-- Migration 009 — Enhance the existing `reviews` table for public star reviews
-- Run in the Supabase SQL Editor. Additive & idempotent (safe to re-run).
-- NOT applied automatically — apply manually when ready.
--
-- We REUSE the existing `reviews` table (which already syncs with `testimonials`
-- via triggers). We only ADD the columns the new UI needs and relax defaults.
-- Field mapping used by the app:  reviewer_name -> author_name,  approved -> is_approved.
-- ============================================================================

-- 1. New columns expected by the reviews UI ---------------------------------
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_email TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photo_url      TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified       BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_reply    TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_reply_at TIMESTAMPTZ;

-- Public reviews should be visible right away (spec: approved default true).
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT true;

-- 2. RLS policies (DROP first, per project rule) -----------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Business owner can update reviews of their own business (e.g. to reply).
DROP POLICY IF EXISTS "Owner manages own business reviews" ON public.reviews;
CREATE POLICY "Owner manages own business reviews"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id AND b.user_id = auth.uid()
    )
  );

-- 3. Auto-average: keep businesses.rating_average / rating_count in sync ------
CREATE OR REPLACE FUNCTION public.fn_recalc_business_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  bid UUID := COALESCE(NEW.business_id, OLD.business_id);
BEGIN
  UPDATE public.businesses b SET
    rating_average = COALESCE(
      (SELECT ROUND(AVG(r.rating)::numeric, 2)
         FROM public.reviews r
        WHERE r.business_id = bid AND r.is_approved = true), 0),
    rating_count = COALESCE(
      (SELECT COUNT(*)
         FROM public.reviews r
        WHERE r.business_id = bid AND r.is_approved = true), 0)
  WHERE b.id = bid;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_recalc_rating ON public.reviews;
CREATE TRIGGER trg_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_business_rating();

-- 4. Storage bucket for review photos (anonymous uploads) --------------------
-- Create a PUBLIC bucket named 'vitrine-reviews' in the Supabase dashboard
-- (Storage > New bucket > Public) and allow INSERT for anon, e.g.:
--   CREATE POLICY "Anyone can upload review photos" ON storage.objects
--     FOR INSERT TO anon, authenticated
--     WITH CHECK (bucket_id = 'vitrine-reviews');
-- The app degrades gracefully and submits the review without a photo if upload fails.
