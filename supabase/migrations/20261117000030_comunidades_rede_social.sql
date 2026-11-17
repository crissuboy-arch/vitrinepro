-- 20261117000030_comunidades_rede_social.sql
-- Comunidades como rede social interna (correção sobre a 027):
--
--  1) community_profiles — perfil público do membro (um por utilizador,
--     válido em todas as comunidades): nome público, fotografia,
--     biografia e cidade. NUNCA emails/contactos.
--  2) community_comments.parent_id — respostas a comentários.
--  3) edited_at em publicações e comentários.
--  4) community_notifications — notificações dentro da plataforma
--     (comentário, resposta, reação). Só o próprio as lê (via API).
--  5) Bucket público "community-media" (avatares + fotos das
--     publicações), com as policies canónicas de Storage estendidas:
--     cada utilizador só escreve na pasta com o seu próprio id.
--
-- RLS ativa e ZERO policies nas tabelas novas: todo o acesso é feito
-- pelas rotas de API com service role, que validam sessão, adesão e
-- autoria. Nada muda para quem não usa as comunidades.

create table if not exists public.community_profiles (
  user_id uuid primary key,
  display_name text not null,
  avatar_url text null,
  bio text null,
  city text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_comments
  add column if not exists parent_id uuid null
  references public.community_comments (id) on delete cascade;

create index if not exists community_comments_parent_idx
  on public.community_comments (parent_id);

alter table public.community_posts
  add column if not exists edited_at timestamptz null;

alter table public.community_comments
  add column if not exists edited_at timestamptz null;

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid not null,
  actor_name text not null,
  type text not null check (type in ('comment', 'reply', 'reaction')),
  community_id uuid not null references public.social_communities (id) on delete cascade,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  comment_id uuid null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_idx
  on public.community_notifications (user_id, is_read, created_at desc);

alter table public.community_profiles enable row level security;
alter table public.community_notifications enable row level security;

-- ─── Bucket de media das comunidades ────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media', 'community-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Policies canónicas de Storage: acrescenta 'community-media' à leitura
-- pública e uma regra de escrita própria (pasta = id do utilizador),
-- sem alterar as regras existentes dos outros buckets.
drop policy if exists "vp_storage_public_read" on storage.objects;
create policy "vp_storage_public_read" on storage.objects
  for select using (bucket_id in (
    'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
    'vitrine-products', 'business-images', 'business-media',
    'vitrine-videos', 'community-media'
  ));

drop policy if exists "vp_storage_owner_insert" on storage.objects;
create policy "vp_storage_owner_insert" on storage.objects
  for insert with check (
    (
      bucket_id in (
        'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
        'vitrine-products', 'business-images', 'business-media',
        'vitrine-videos'
      )
      and (select user_id from public.businesses
           where id::text = split_part(name, '/', 1)) = auth.uid()
    )
    or (
      bucket_id = 'community-media'
      and split_part(name, '/', 1) = auth.uid()::text
    )
  );

drop policy if exists "vp_storage_owner_update" on storage.objects;
create policy "vp_storage_owner_update" on storage.objects
  for update using (
    (
      bucket_id in (
        'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
        'vitrine-products', 'business-images', 'business-media',
        'vitrine-videos'
      )
      and (select user_id from public.businesses
           where id::text = split_part(name, '/', 1)) = auth.uid()
    )
    or (
      bucket_id = 'community-media'
      and split_part(name, '/', 1) = auth.uid()::text
    )
  );

drop policy if exists "vp_storage_owner_delete" on storage.objects;
create policy "vp_storage_owner_delete" on storage.objects
  for delete using (
    (
      bucket_id in (
        'vitrine-logos', 'vitrine-covers', 'vitrine-gallery',
        'vitrine-products', 'business-images', 'business-media',
        'vitrine-videos'
      )
      and (select user_id from public.businesses
           where id::text = split_part(name, '/', 1)) = auth.uid()
    )
    or (
      bucket_id = 'community-media'
      and split_part(name, '/', 1) = auth.uid()::text
    )
  );
