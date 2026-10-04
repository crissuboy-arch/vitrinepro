-- VitrinePro — A2.5 Normalization (MANUAL application)
-- ============================================================
-- Apply in the Supabase Dashboard → SQL Editor → New Query, ONCE,
-- AFTER the three A2 migrations, in a single run. Do NOT apply via CI.
--
-- ADDITIVE-ONLY. What it does:
--   1. Promotes legacy `is_published = true` rows to `published = true`
--      (never unpublishes anything; guarded if the column is missing).
--   2. Widens the businesses plan CHECK to accept the legacy alias 'gold'
--      (canonical tiers stay free | pro | business; aliases premium/gold
--      keep working and are normalized in code via lib/plans.ts).
--   3. Makes the public businesses RLS policy depend ONLY on
--      `published = true` (plus owner). The `is_published` column is
--      NOT dropped — it is kept as a historical column in this phase.
--
-- What it does NOT do:
--   - No data deletion, no column drops, no value rewrites of plans.
--   - Does not touch /explorar, /vitrine, dashboard or any app code.

-- ─── 1. Legacy publication promotion ─────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'is_published'
  ) THEN
    UPDATE public.businesses
    SET published = true
    WHERE is_published = true
      AND published IS DISTINCT FROM true;
  END IF;
END $$;

-- ─── 2. Plan CHECK: canonical tiers + preserved legacy aliases ────────────
-- Code (lib/plans.ts) normalizes: pro|premium|gold -> pro, business -> business.
-- The CHECK must therefore accept every value the code may persist.
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_plan_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'pro', 'premium', 'gold', 'business'));

-- ─── 3. RLS: public reads via `published` only (owner always allowed) ─────
-- Replaces the A2 policy that also consulted the legacy `is_published`.
DROP POLICY IF EXISTS "vp_businesses_select" ON public.businesses;

CREATE POLICY "vp_businesses_select" ON public.businesses
  FOR SELECT
  USING (published = true OR user_id = auth.uid());

-- Child-table policies (products, gallery_images, business_images,
-- testimonials, business_posts) already gate on businesses.published via the
-- A2 canonical migration and need no change here.

-- ─── Verification (optional, read-only) ───────────────────────────────────
-- SELECT count(*) AS legacy_still_divergent
-- FROM public.businesses
-- WHERE is_published = true AND published IS DISTINCT FROM true;
-- (expect 0 after section 1)
