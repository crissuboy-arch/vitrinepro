-- VitrinePro Analytics Table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.business_analytics (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL, -- 'page_view' | 'whatsapp_click' | 'product_view'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_analytics_business_created
  ON public.business_analytics(business_id, created_at);

ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (page views from public visitors)
DROP POLICY IF EXISTS "Public insert analytics" ON public.business_analytics;
CREATE POLICY "Public insert analytics"
  ON public.business_analytics
  FOR INSERT
  WITH CHECK (true);

-- Only the business owner can read their own analytics
DROP POLICY IF EXISTS "Owner read analytics" ON public.business_analytics;
CREATE POLICY "Owner read analytics"
  ON public.business_analytics
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );
