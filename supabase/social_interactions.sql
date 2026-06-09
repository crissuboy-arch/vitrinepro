-- ================================================================
-- VitrinePro — Social Interactions Migration
-- Run in Supabase SQL Editor
-- ================================================================

-- ── 1. business_likes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_likes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);
CREATE INDEX IF NOT EXISTS idx_biz_likes_user ON public.business_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_biz_likes_biz  ON public.business_likes(business_id);

-- ── 2. business_shares (anonymous OK) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.business_shares (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform    TEXT        NOT NULL DEFAULT 'link', -- 'link' | 'whatsapp' | 'twitter' | 'instagram'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_biz_shares_biz ON public.business_shares(business_id);

-- ── 3. Counter columns on businesses ───────────────────────────
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS like_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER NOT NULL DEFAULT 0;

-- ── 4. Triggers: maintain like_count ───────────────────────────
CREATE OR REPLACE FUNCTION fn_like_count_inc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.businesses SET like_count = like_count + 1 WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_like_count_dec()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.businesses SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.business_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_like_count_inc ON public.business_likes;
CREATE TRIGGER trg_like_count_inc
  AFTER INSERT ON public.business_likes
  FOR EACH ROW EXECUTE FUNCTION fn_like_count_inc();

DROP TRIGGER IF EXISTS trg_like_count_dec ON public.business_likes;
CREATE TRIGGER trg_like_count_dec
  AFTER DELETE ON public.business_likes
  FOR EACH ROW EXECUTE FUNCTION fn_like_count_dec();

-- ── 5. Triggers: maintain share_count ──────────────────────────
CREATE OR REPLACE FUNCTION fn_share_count_inc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.businesses SET share_count = share_count + 1 WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_share_count_inc ON public.business_shares;
CREATE TRIGGER trg_share_count_inc
  AFTER INSERT ON public.business_shares
  FOR EACH ROW EXECUTE FUNCTION fn_share_count_inc();

-- ── 6. Triggers: maintain favorite_count (existing favorites table) ──
CREATE OR REPLACE FUNCTION fn_fav_count_inc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.businesses SET favorite_count = favorite_count + 1 WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_fav_count_dec()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.businesses SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = OLD.business_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_count_inc ON public.favorites;
CREATE TRIGGER trg_fav_count_inc
  AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION fn_fav_count_inc();

DROP TRIGGER IF EXISTS trg_fav_count_dec ON public.favorites;
CREATE TRIGGER trg_fav_count_dec
  AFTER DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION fn_fav_count_dec();

-- ── 7. Triggers: maintain view_count via business_analytics ────
CREATE OR REPLACE FUNCTION fn_view_count_inc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_type = 'page_view' THEN
    UPDATE public.businesses SET view_count = view_count + 1 WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_view_count_inc ON public.business_analytics;
CREATE TRIGGER trg_view_count_inc
  AFTER INSERT ON public.business_analytics
  FOR EACH ROW EXECUTE FUNCTION fn_view_count_inc();

-- ── 8. RLS policies ────────────────────────────────────────────
ALTER TABLE public.business_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_read_all"    ON public.business_likes;
DROP POLICY IF EXISTS "likes_insert_own"  ON public.business_likes;
DROP POLICY IF EXISTS "likes_delete_own"  ON public.business_likes;

CREATE POLICY "likes_read_all"
  ON public.business_likes FOR SELECT USING (true);

CREATE POLICY "likes_insert_own"
  ON public.business_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
  ON public.business_likes FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.business_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shares_read_all"   ON public.business_shares;
DROP POLICY IF EXISTS "shares_insert_all" ON public.business_shares;

CREATE POLICY "shares_read_all"
  ON public.business_shares FOR SELECT USING (true);

CREATE POLICY "shares_insert_all"
  ON public.business_shares FOR INSERT WITH CHECK (true);

-- ── 9. Ranking score function ───────────────────────────────────
-- score = views×1 + likes×5 + favorites×10 + shares×3 + rating×20
-- Premium plan adds a 200pt bonus so paid plans still appear first
CREATE OR REPLACE FUNCTION vitrine_score(biz public.businesses)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT (
    COALESCE(biz.view_count,     0) * 1  +
    COALESCE(biz.like_count,     0) * 5  +
    COALESCE(biz.favorite_count, 0) * 10 +
    COALESCE(biz.share_count,    0) * 3  +
    COALESCE(biz.rating_average, 0)::INTEGER * 20 +
    CASE WHEN biz.plan IN ('premium','pro','business') THEN 200 ELSE 0 END
  );
$$;

-- ── 10. Backfill favorite_count from existing favorites ─────────
UPDATE public.businesses b
SET    favorite_count = (
  SELECT COUNT(*) FROM public.favorites f WHERE f.business_id = b.id
);
