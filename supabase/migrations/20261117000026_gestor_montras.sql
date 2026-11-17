-- =====================================================================
-- GESTOR DE MONTRAS — convites, gestão delegada, chaves API e auditoria
-- Missão "3 Melhorias" (17/11/2026), bloco 2 — Atena.
--
-- Desenho:
--   * montra_managers: identidade do gestor, chaveada pelo EMAIL do
--     convite. A proprietária convida um email; a conta com esse email
--     aceita (vincula user_id) e fica 'active'. Sem conta, o convite
--     fica 'invited' à espera. NUNCA se inventa email nem conta.
--   * business_managers: quais montras cada gestor pode gerir
--     (atribuição explícita da proprietária/admin, ou automática nas
--     montras criadas pelo próprio gestor).
--   * manager_api_keys: identidade de API para a gestora quando opera
--     como agente (ex.: Atena). Só o HASH SHA-256 da chave é guardado;
--     a chave em claro é mostrada UMA vez na criação (painel admin).
--   * manager_audit_log: registo de ações do gestor (quem, o quê,
--     em que montra, quando).
--
-- Segurança:
--   * RLS ativa nas 4 tabelas e ZERO policies: nenhum acesso direto
--     com a chave pública. Tudo passa pelas rotas /api com
--     service_role no servidor e verificação de identidade.
--   * O gestor NÃO tem acesso a pagamentos, dados bancários,
--     credenciais, gestão de administradores nem configurações
--     críticas — essas superfícies não são tocadas por este desenho.
--   * A conta proprietária (allowlist ADMIN_EMAILS) mantém-se a única
--     administradora total.
-- =====================================================================

create table if not exists public.montra_managers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid null,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'revoked')),
  invited_by text null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz null
);

create table if not exists public.business_managers (
  business_id uuid not null references public.businesses (id) on delete cascade,
  manager_id uuid not null references public.montra_managers (id) on delete cascade,
  granted_by text null,
  created_at timestamptz not null default now(),
  primary key (business_id, manager_id)
);

create index if not exists business_managers_manager_idx
  on public.business_managers (manager_id);

create table if not exists public.manager_api_keys (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.montra_managers (id) on delete cascade,
  key_hash text not null unique,
  label text null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz null,
  revoked_at timestamptz null
);

create table if not exists public.manager_audit_log (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid null,
  manager_email text null,
  action text not null,
  business_id uuid null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists manager_audit_log_business_idx
  on public.manager_audit_log (business_id, created_at desc);

alter table public.montra_managers enable row level security;
alter table public.business_managers enable row level security;
alter table public.manager_api_keys enable row level security;
alter table public.manager_audit_log enable row level security;
