-- ============================================================
-- VitrinePro — A2.3 LEADS / PII hardening (CANONICAL, ADDITIVE)
-- Date: 2026-10-04 — Fase A2 (Fundação Segura)
--
-- Problem (audit A1): policy "leads_select_auth" allowed ANY
-- authenticated user to read ALL leads (names, emails, whatsapp) —
-- a PII leak. Leads had no business association at all.
--
-- This migration is ADDITIVE and IDEMPOTENT:
--  - adds a nullable business_id (existing platform leads keep working)
--  - replaces the broad read policy with owner-scoped reads
--  - does NOT touch historical migrations
--  - does NOT delete any data
--
-- Intended final state:
--  INSERT : anon + authenticated (public lead forms) — unchanged
--  SELECT : authenticated users may read ONLY leads whose business_id
--           belongs to a business they own (businesses.user_id = auth.uid())
--  Platform leads (business_id IS NULL, e.g. popup_homepage) are readable
--  ONLY via service_role — the app exposes them through the server-side
--  admin API (app/api/admin/leads) which checks ADMIN_EMAILS.
--
-- DO NOT APPLY BLINDLY IN PRODUCTION:
--  1. Confirm this file's name sorts AFTER the last applied migration
--     (Supabase Dashboard → Database → Migrations).
--  2. Run the VERIFICATION queries at the bottom after applying.
-- ============================================================

-- 1. Associate leads with a business (nullable = platform-level lead)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);

-- 2. Remove the dangerous broad-read policy
DROP POLICY IF EXISTS "leads_select_auth" ON public.leads;

-- 3. Owner-scoped read: a merchant only sees leads of their own businesses
DROP POLICY IF EXISTS "leads_select_owner" ON public.leads;
CREATE POLICY "leads_select_owner" ON public.leads
  FOR SELECT TO authenticated
  USING (
    business_id IS NOT NULL
    AND business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

-- 4. Keep public insert for lead forms (unchanged, explicit for clarity)
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;
CREATE POLICY "leads_insert_public" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- VERIFICATION (run after applying; expect the noted results)
-- ============================================================
-- -- 1. Policies present:
-- SELECT policyname, roles, cmd FROM pg_policies
--  WHERE schemaname = 'public' AND tablename = 'leads';
-- -- expect: leads_insert_public (INSERT) + leads_select_owner (SELECT)
--
-- -- 2. No policy allows unrestricted SELECT:
-- SELECT policyname FROM pg_policies
--  WHERE schemaname='public' AND tablename='leads' AND cmd='SELECT'
--    AND qual = 'true';
-- -- expect: 0 rows
--
-- -- 3. Existing rows preserved:
-- SELECT count(*) FROM public.leads;
-- -- expect: same count as before applying
-- ============================================================
