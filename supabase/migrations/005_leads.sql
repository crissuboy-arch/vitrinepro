-- ============================================================
-- Migration 005: Lead capture table (popup homepage)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  business_type text,
  source text DEFAULT 'popup_homepage',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (anon form submission)
CREATE POLICY "leads_insert_public" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can read leads (admin panel)
CREATE POLICY "leads_select_auth" ON public.leads
  FOR SELECT TO authenticated
  USING (true);
