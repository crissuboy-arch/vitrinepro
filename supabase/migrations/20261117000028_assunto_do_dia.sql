-- =====================================================================
-- ASSUNTO DO DIA — conteúdos editoriais aprovados
-- Missão "Finalização da VitrinePro" (17/11/2026), bloco 4.
--
-- Fluxo editorial com aprovação humana OBRIGATÓRIA:
--   draft → pending → published (ou archived)
--   * A Atena (Gestor de Montras, chave API) só cria em 'pending'
--     (created_via='atena') — nunca publica.
--   * O admin cria/edita/agenda/fixa/aprova/arquiva no painel.
--   * Publicação automática de notícias externas: DESATIVADA por
--     desenho — só entra conteúdo com fonte indicada e aprovação.
--
-- RLS ativa; leitura pública direta apenas de publicados.
-- A gestão passa pelas rotas /api (admin ou gestor autenticado).
-- =====================================================================

create table if not exists public.daily_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text null,
  source_name text null,
  source_url text null,
  city text null,
  category text null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'archived')),
  is_pinned boolean not null default false,
  scheduled_for date null,
  created_by text null,
  created_via text not null default 'admin' check (created_via in ('admin', 'atena')),
  created_at timestamptz not null default now(),
  published_at timestamptz null
);

create index if not exists daily_topics_public_idx
  on public.daily_topics (status, is_pinned desc, published_at desc);

alter table public.daily_topics enable row level security;

drop policy if exists daily_topics_public_read on public.daily_topics;
create policy daily_topics_public_read
  on public.daily_topics
  for select
  using (status = 'published');
