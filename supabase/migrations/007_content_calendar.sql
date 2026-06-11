-- Content Calendar — per-user planning of social media posts.
-- Planning/organization only: NO social API integration, NO auto-posting.

CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  rede_social TEXT NOT NULL
    CHECK (rede_social IN ('instagram','tiktok','facebook','youtube','pinterest','linkedin')),
  data DATE NOT NULL,
  hora TIME,
  status TEXT NOT NULL DEFAULT 'ideia'
    CHECK (status IN ('ideia','planejado','produzido','agendado','publicado')),
  legenda TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (FKs are not auto-indexed in Postgres)
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_data
  ON content_calendar (user_id, data);
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_status
  ON content_calendar (user_id, status);

-- Row Level Security: each user only sees/manages their own items
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own content_calendar" ON content_calendar;
CREATE POLICY "Users manage own content_calendar" ON content_calendar
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
