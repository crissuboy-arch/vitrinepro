-- =====================================================================
-- COMUNIDADES SOCIAIS — rede interna da VitrinePro
-- Missão "Finalização da VitrinePro" (17/11/2026), bloco 3.
--
-- NÃO confundir com lib/communities.ts (comunidades por país de
-- origem do proprietário, usadas no Explorar) — esse sistema fica
-- intacto. Aqui cria-se a camada SOCIAL: membros, publicações,
-- comentários, reações, denúncias e moderação.
--
-- Desenho:
--   * social_communities: comunidades públicas (slug único). Seed com
--     as 6 iniciais; o admin pode criar mais pelo painel, sem código.
--   * community_members: adesão explícita (botão Entrar). Qualquer
--     pessoa autenticada pode entrar em qualquer comunidade — sem
--     comprovação de nacionalidade.
--   * community_posts / community_comments: author_name é um RETRATO
--     do nome público no momento da publicação. Emails, telefones e
--     outros dados privados NUNCA são guardados nem expostos aqui.
--   * community_reactions: uma reação por (publicação, utilizador,
--     emoji) — repetir o mesmo emoji remove a reação (toggle na API).
--   * community_reports: denúncias para moderação administrativa.
--
-- Segurança:
--   * RLS ativa em todas as tabelas. Leitura pública direta apenas
--     de social_communities ativas; todo o resto passa pelas rotas
--     /api com service_role e verificação de sessão (padrão das
--     Fases 1/2 e do Gestor de Montras). Publicar, comentar e reagir
--     exige autenticação + adesão à comunidade (verificado na API).
-- =====================================================================

create table if not exists public.social_communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text null,
  color text null,
  description text null,
  is_active boolean not null default true,
  created_by text null,
  created_at timestamptz not null default now()
);

insert into public.social_communities (slug, name, icon, color, description) values
  ('brasileira', 'Comunidade Brasileira', '🇧🇷', '#22C55E', 'Brasileiros em Portugal: negócios, dicas e apoio mútuo.'),
  ('portuguesa', 'Comunidade Portuguesa', '🇵🇹', '#C8A96B', 'Portugueses a empreender e a fazer crescer os seus negócios.'),
  ('angolana', 'Comunidade Angolana', '🇦🇴', '#EF4444', 'Angolanos em Portugal: empreendedorismo e comunidade.'),
  ('cabo-verdiana', 'Comunidade Cabo-Verdiana', '🇨🇻', '#3B82F6', 'Cabo-verdianos em Portugal: negócios e cultura.'),
  ('francesa', 'Comunidade Francesa', '🇫🇷', '#6366F1', 'Franceses em Portugal: negócios e vida local.'),
  ('internacional', 'Comunidade Internacional', '🌍', '#94A3B8', 'Todas as nacionalidades, um só espaço de partilha.')
on conflict (slug) do nothing;

create table if not exists public.community_members (
  community_id uuid not null references public.social_communities (id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('member', 'moderator')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists community_members_user_idx
  on public.community_members (user_id);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.social_communities (id) on delete cascade,
  author_id uuid not null,
  author_name text not null,
  content text not null,
  image_url text null,
  is_pinned boolean not null default false,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_feed_idx
  on public.community_posts (community_id, is_pinned desc, created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null,
  author_name text not null,
  content text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at asc);

create table if not exists public.community_reactions (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolved_by text null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists community_reports_status_idx
  on public.community_reports (status, created_at desc);

alter table public.social_communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;

-- Leitura pública direta apenas da lista de comunidades ativas.
-- (Todo o resto passa pelas rotas /api com service_role.)
drop policy if exists social_communities_public_read on public.social_communities;
create policy social_communities_public_read
  on public.social_communities
  for select
  using (is_active = true);
