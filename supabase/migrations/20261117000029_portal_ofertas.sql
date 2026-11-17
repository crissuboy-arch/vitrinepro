-- 20261117000029_portal_ofertas.sql
-- Integração Portal de Ofertas (multiloja/afiliados) ↔ VitrinePro.
--
-- O que faz:
--  1) businesses.business_kind — tipo de montra (serviços, produtos
--     digitais, produtos próprios, multiloja/afiliados). Default
--     'servicos': as montras existentes NÃO mudam de comportamento.
--  2) portal_settings — configuração única da integração (ligar/desligar,
--     categorias visíveis, destaques escolhidos, URL do Portal).
--     Começa DESLIGADA: nada aparece publicamente até a proprietária
--     ativar no painel e publicar a montra.
--  3) portal_sync_runs — registo de cada sincronização do feed do Portal
--     (estado, totais, erro) para diagnóstico no painel.
--
-- Os produtos do Portal NÃO são copiados para a tabela products: a
-- VitrinePro consulta o feed publicado pelo Portal (fonte principal),
-- com IDs estáveis por loja (ex.: amazon:B0...). Sem duplicação manual.
-- Sem policies públicas: leitura/escrita só via API com service role.
-- A montra "Portal de Ofertas" é criada pela proprietária/admin (rascunho)
-- a partir do painel — esta migration não cria empresas nem produtos.

alter table public.businesses
  add column if not exists business_kind text not null default 'servicos';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_business_kind_check'
  ) then
    alter table public.businesses
      add constraint businesses_business_kind_check
      check (business_kind in ('servicos', 'produtos_digitais', 'produtos_proprios', 'multiloja_afiliados'));
  end if;
end $$;

create index if not exists businesses_business_kind_idx
  on public.businesses (business_kind);

create table if not exists public.portal_settings (
  id int primary key check (id = 1),
  enabled boolean not null default false,
  categories text[] not null default '{}',
  featured_ids text[] not null default '{}',
  portal_url text not null default 'https://portal-de-ofertapt.vercel.app',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.portal_settings (id) values (1)
on conflict (id) do nothing;

create table if not exists public.portal_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'a_correr'
    check (status in ('a_correr', 'ok', 'erro')),
  source_url text,
  total int,
  destaques int,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists portal_sync_runs_created_idx
  on public.portal_sync_runs (created_at desc);

alter table public.portal_settings enable row level security;
alter table public.portal_sync_runs enable row level security;
