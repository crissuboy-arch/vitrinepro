# Deploy VitrinePro — Checklist (A2.16, revisto em 2026-10-04)

Legenda de estado:
- **CONFIRMADO** — verificado em código nesta fase.
- **PRECISA VERIFICAR** — exige confirmação manual no serviço externo; não assumir.

> Preços de referência temporários (fonte central: `lib/plans.ts`):
> Free €0 · Pro €12/mês · Business €29,90/mês.
> Domínio canónico: **https://vitrinepro.pt** (fonte central: `lib/site.ts`).

## 1. SUPABASE

- [ ] **PRECISA VERIFICAR** — Lista de migrations aplicadas (Dashboard → Database → Migrations).
      Aplicar pela ordem (ver `supabase/migrations/README.md`):
  1. `001_analytics.sql` … `20260601000001_add_owner_origin_country.sql` (históricas — só se ainda não aplicadas)
  2. **NEW** `20261004000002_leads_pii_hardening.sql` (A2.3 — leads owner-scoped)
  3. **NEW** `20261004000003_canonical_rls_normalization.sql` (A2.4 — RLS canónico + storage isolado)
  4. **NEW** `20261004000004_stripe_webhook_hardening.sql` (A2.6 — idempotência + status)
  5. `supabase/seed.sql` (SAFE — plans/categories/cities). **NUNCA** correr `seed.demo.sql` em produção.
- [ ] **PRECISA VERIFICAR** — Correr o bloco VERIFICATION no fim de cada migration nova.
- [ ] **PRECISA VERIFICAR** — Buckets Storage públicos: `vitrine-logos`, `vitrine-covers`, `vitrine-gallery`, `vitrine-products`, `business-images`, `business-media`.
- [ ] **PRECISA VERIFICAR** — RLS activo em todas as tabelas.
- [ ] **PRECISA VERIFICAR** — Trigger `on_auth_user_created` activo (cria perfil automaticamente).
- **CONFIRMADO** — Código faz upload para `{business_id}/…`; as policies `vp_storage_owner_*` isolam escrita por dono do negócio.

## 2. STRIPE

- [ ] **PRECISA VERIFICAR** — Produtos e Price IDs no Dashboard Stripe (modo LIVE):
  - Pro €12/mês → copiar o Price ID para `STRIPE_PRICE_PREMIUM`
  - Business €29,90/mês → copiar o Price ID para `STRIPE_PRICE_BUSINESS`
  - **CONFIRMADO** — Nenhum Price ID hard-coded no código (só de env; `lib/plans.ts`).
- [ ] **PRECISA VERIFICAR** — Webhook `https://vitrinepro.pt/api/stripe/webhook` com os eventos:
  `checkout.session.completed`, `invoice.payment_succeeded`, **`invoice.payment_failed`** (novo na A2.6),
  `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] **PRECISA VERIFICAR** — `STRIPE_WEBHOOK_SECRET` e `STRIPE_SECRET_KEY` (LIVE) configurados na Vercel.
- **CONFIRMADO** — Webhook valida assinatura e recusa sem secret; eventos são idempotentes (`stripe_events`).
- **CONFIRMADO** — `invoice.payment_failed` regista `past_due` **sem** despromover o plano de imediato.
- **CONFIRMADO** — `/api/stripe/checkout` exige sessão autenticada + ownership do negócio + plano da allowlist.

## 3. ENV (Vercel → Settings → Environment Variables)

**CONFIRMADO** — `.env.example` real e completo (só nomes/placeholders, zero secrets).
Copiar cada nome e preencher com os valores reais; nunca commitar `.env.local`.

| Variável | Estado |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **PRECISA VERIFICAR** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **PRECISA VERIFICAR** |
| `SUPABASE_SERVICE_ROLE_KEY` (server-only) | **PRECISA VERIFICAR** |
| `NEXT_PUBLIC_APP_URL` = `https://vitrinepro.pt` | **PRECISA VERIFICAR** |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | **PRECISA VERIFICAR** |
| `STRIPE_PRICE_PREMIUM` / `STRIPE_PRICE_BUSINESS` | **PRECISA VERIFICAR** |
| `ANTHROPIC_API_KEY` (server-only) | **PRECISA VERIFICAR** — sem ela, o chat usa fallback por regras |
| `ADMIN_EMAILS` | **PRECISA VERIFICAR** (default: cris.suboy@gmail.com) |
| `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID` | **PRECISA VERIFICAR** (opcional) |

## 4. VERCEL

- [ ] **PRECISA VERIFICAR** — Deploy da branch `main`; domínio `vitrinepro.pt` apontado.
- [ ] **PRECISA VERIFICAR** — Preview deployments continuam a funcionar (fallback `VERCEL_URL` em `lib/site.ts`).
- [ ] Testar fluxo completo: `/login` → `/onboarding` → `/dashboard` → `/vitrine/[slug]`.

### Rotas esperadas no build

| Rota | Tipo |
|------|------|
| `/` | Static |
| `/login` | Static |
| `/register` | Static |
| `/onboarding` | Static |
| `/dashboard` | Static |
| `/businesses` | Static |
| `/explorar` | Static |
| `/pricing` | Static |
| `/admin` | Static |
| `/auth/callback` | Static |
| `/vitrine/[slug]` | Dynamic |
| `/business/[id]` | Dynamic |
| `/[city]/[category]` | Dynamic |
| `/api/analytics` | Dynamic |
| `/api/chat` | Dynamic |
| `/api/stripe/checkout` | Dynamic |
| `/api/stripe/webhook` | Dynamic |
| `/api/admin/leads` (novo A2.14) | Dynamic |
| `/api/admin/users` (novo A2.14) | Dynamic |

## 5. ANTHROPIC

- **CONFIRMADO** — `/api/chat` com rate limit (20/min/IP), validação de payload, contexto resolvido server-side e entitlement do plano validado server-side. Visitantes anónimos continuam a poder usar (sem login), dentro do limite.
- [ ] **PRECISA VERIFICAR** — `ANTHROPIC_API_KEY` válida em produção; testar 1 mensagem no widget da Montra.

## 6. DOMAIN

- **CONFIRMADO** — Fallbacks antigos (`vitrinepro.com`, `vitrine.vitriodigital.com`) removidos do código; fallback canónico é `https://vitrinepro.pt`.
- [ ] **PRECISA VERIFICAR** — DNS e SSL de `vitrinepro.pt` na Vercel.
- [ ] **PRECISA VERIFICAR** — `https://vitrinepro.pt/og-default.png` acessível (OG image).

## 7. SECURITY CHECK (pós-deploy)

- [ ] `POST /api/chat` sem `businessId`/`businessSlug`/`context` → 400.
- [ ] `POST /api/chat` com `businessId` de negócio plano free → 403 (sem queimar API).
- [ ] `POST /api/chat` com `business` (objeto legado do cliente) → 400 (contexto nunca aceite do cliente).
- [ ] `POST /api/analytics` com `event_type` inválido → 400; com `business_id` inexistente → 404.
- [ ] `GET /api/analytics?business_id=X` sem sessão → 401; com sessão de outro utilizador → 404.
- [ ] `POST /api/stripe/checkout` sem sessão → 401; com `businessId` de outro utilizador → 404.
- [ ] Utilizador autenticado não lê `leads` de outro negócio (RLS).
- [ ] Utilizador autenticado não apaga ficheiros de outro negócio (Storage RLS).
- [ ] `GET /api/admin/leads` com email não-admin → 403.

## 8. SMOKE TEST (pós-deploy)

- [ ] `/` carrega sem depoimentos inventados; `/sitemap.xml` sem `/categorias`, `/cidades`, `/lojas`.
- [ ] Widget de chat na vitrine Pro responde (ou fallback por regras se sem `ANTHROPIC_API_KEY`).
- [ ] Upgrade Pro via Stripe test mode → webhook promove o plano; `invoice.payment_failed` (test clock) regista `past_due` sem despromover.

## Notas Importantes

- O Stripe em **modo teste** usa `sk_test_…` — mudar para `sk_live_…` em produção.
- O chatbot usa fallback por palavras-chave se `ANTHROPIC_API_KEY` não estiver configurada.
- As migrations novas **não** são aplicadas automaticamente — aplicar manualmente no SQL Editor após verificar a ordem.
- Google OAuth (opcional): criar projecto em console.cloud.google.com, activar Google+ API, redirect `https://xxxx.supabase.co/auth/v1/callback`, configurar em Supabase → Authentication → Providers → Google. (**PRECISA VERIFICAR**)
