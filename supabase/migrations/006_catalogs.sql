CREATE TABLE IF NOT EXISTS catalogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  modelo TEXT DEFAULT 'elegante',
  cores JSONB DEFAULT '{
    "principal": "#c9a96e",
    "secundaria": "#0a0d14",
    "titulos": "#f5f0e8",
    "precos": "#c9a96e",
    "fundo": "#ffffff"
  }',
  capa JSONB DEFAULT '{}',
  paginas JSONB DEFAULT '[]',
  slug TEXT UNIQUE,
  publico BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own catalogs" ON catalogs;
CREATE POLICY "Users manage own catalogs" ON catalogs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public catalogs viewable by all" ON catalogs;
CREATE POLICY "Public catalogs viewable by all" ON catalogs
  FOR SELECT USING (publico = true);
