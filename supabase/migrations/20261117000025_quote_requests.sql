-- ════════════════════════════════════════════════════════════════════
-- Fase 2 — Pedidos de Orçamento (VitrinePro)
-- Decisões da Cristiane (17/11/2026, plano das Fases 1–3):
--   · Publicação SEM conta obrigatória, com contactos protegidos.
--   · PRÉ-MODERAÇÃO: nenhum pedido aparece sem aprovação no admin.
--   · Acompanhamento por LINK PRIVADO seguro (token; guardamos o hash).
--   · Notificações inicialmente dentro da aplicação (contadores).
--
-- Modelo de dados (RGPD por desenho):
--   · quote_requests         — dados PÚBLICOS do pedido. NENHUM dado
--                              pessoal vive nesta tabela.
--   · quote_request_contacts — nome/email/telefone do consumidor, em
--                              tabela separada, SEM leitura pública.
--                              Só é revelado a uma empresa depois de o
--                              consumidor ACEITAR o interesse dela, e só
--                              através das rotas API (service role).
--   · quote_interests        — manifestações de interesse das empresas.
--
-- Segurança:
--   · RLS ativa nas 3 tabelas.
--   · quote_requests: SELECT público apenas de pedidos aprovados e não
--     expirados. Sem policies de escrita — toda a escrita passa pelas
--     rotas API do servidor (service role), com validação, honeypot,
--     rate-limit e verificação de sessão/token.
--   · quote_request_contacts e quote_interests: SEM policies — acesso
--     exclusivamente via service role nas rotas API.
--
-- Migration ADITIVA: não altera tabelas nem dados existentes.
-- Aplicação MANUAL no Supabase (SQL Editor) — nunca automática.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Pedidos (dados públicos, sem PII) ────────────────────────────
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  city text not null,
  title text not null,
  description text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'closed')),
  -- Hash SHA-256 (hex) do token privado de acompanhamento.
  -- O token em claro só é mostrado ao consumidor na submissão.
  tracking_token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_requests_public_idx
  on public.quote_requests (status, expires_at desc, created_at desc);
create index if not exists quote_requests_city_category_idx
  on public.quote_requests (city, category, status);

-- ── 2. Contactos (PII — tabela isolada) ─────────────────────────────
create table if not exists public.quote_request_contacts (
  request_id uuid primary key
    references public.quote_requests (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  consent_at timestamptz not null,
  consent_text_version text not null,
  check (email is not null or phone is not null)
);

-- ── 3. Manifestações de interesse ───────────────────────────────────
create table if not exists public.quote_interests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.quote_requests (id) on delete cascade,
  business_id uuid not null
    references public.businesses (id) on delete cascade,
  message text,
  status text not null default 'sent'
    check (status in ('sent', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (request_id, business_id)
);

create index if not exists quote_interests_request_idx
  on public.quote_interests (request_id, created_at desc);
create index if not exists quote_interests_business_idx
  on public.quote_interests (business_id, created_at desc);

-- ── 4. RLS ──────────────────────────────────────────────────────────
alter table public.quote_requests enable row level security;
alter table public.quote_request_contacts enable row level security;
alter table public.quote_interests enable row level security;

-- Leitura pública APENAS de pedidos aprovados e dentro da validade.
-- (A tabela não contém dados pessoais; os contactos vivem à parte.)
drop policy if exists quote_requests_public_read on public.quote_requests;
create policy quote_requests_public_read
  on public.quote_requests
  for select
  to anon, authenticated
  using (status = 'approved' and expires_at > now());

-- quote_request_contacts: SEM policies (só service role, via API).
-- quote_interests: SEM policies (só service role, via API).
