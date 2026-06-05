-- VitrinePro — Community System
-- Run in Supabase SQL Editor

-- ─── 1. Favorites ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user   ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_biz    ON public.favorites(business_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manages favorites" ON public.favorites;
CREATE POLICY "User manages favorites"
  ON public.favorites FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public read favorite counts" ON public.favorites;
CREATE POLICY "Public read favorite counts"
  ON public.favorites FOR SELECT USING (true);

-- ─── 2. Business posts (feed) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_posts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('promotion','event','news','offer')),
  title       TEXT        NOT NULL,
  content     TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_posts_biz ON public.business_posts(business_id, created_at DESC);

ALTER TABLE public.business_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read posts" ON public.business_posts;
CREATE POLICY "Public read posts"
  ON public.business_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner write posts" ON public.business_posts;
CREATE POLICY "Owner write posts"
  ON public.business_posts FOR ALL
  USING  (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- ─── 3. Invite links ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_links (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT        UNIQUE NOT NULL,
  business_id UUID        REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  uses        INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read invite" ON public.invite_links;
CREATE POLICY "Public read invite"
  ON public.invite_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert invite" ON public.invite_links;
CREATE POLICY "Auth insert invite"
  ON public.invite_links FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owner update invite" ON public.invite_links;
CREATE POLICY "Owner update invite"
  ON public.invite_links FOR UPDATE
  USING (created_by = auth.uid());

-- ─── 4. Add owner fields to businesses (if not exist) ────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_name   TEXT,
  ADD COLUMN IF NOT EXISTS owner_photo  TEXT,
  ADD COLUMN IF NOT EXISTS owner_bio    TEXT;
