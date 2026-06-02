# Deploy VitrinePro — Checklist

## 1. Supabase

- [ ] Executar `supabase/migrations/001_analytics.sql` no SQL Editor
- [ ] Verificar buckets Storage (todos públicos):
  - `vitrine-logos`
  - `vitrine-covers`
  - `vitrine-gallery`
  - `vitrine-products`
- [ ] Confirmar RLS activo em todas as tabelas
- [ ] Confirmar trigger `on_auth_user_created` activo (cria perfil automaticamente)

## 2. Stripe

- [x] Produto **VitrinePro Premium** — €12/mês → `STRIPE_PRICE_PREMIUM=price_1TdcwCAMDgnZ14qnXRDpeJj9`
- [x] Produto **VitrinePro Business** — €29.90/mês → `STRIPE_PRICE_BUSINESS=price_1Tdd5QAMDgnZ14qnEVPYYncB`
- [ ] Criar webhook em `https://vitrinepro.pt/api/stripe/webhook`
  - Eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- [ ] Copiar Webhook Secret para `STRIPE_WEBHOOK_SECRET`

## 3. Vercel

- [ ] Adicionar **todas** as variáveis de `.env.example` em Settings → Environment Variables
- [ ] Deploy branch `main`
- [ ] Verificar 17 rotas no build log (ver tabela abaixo)
- [ ] Testar fluxo completo: `/login` → `/onboarding` → `/dashboard` → `/vitrine/[slug]`

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

## 4. Anthropic API

- [ ] Criar API Key em [console.anthropic.com](https://console.anthropic.com)
- [ ] Adicionar `ANTHROPIC_API_KEY` no Vercel
- [ ] Testar chatbot numa vitrine com plano Pro ou Business

## 5. Domínio

- [ ] Apontar `vitrinepro.pt` para Vercel (Settings → Domains)
- [ ] Verificar SSL activo (automático no Vercel)
- [ ] Testar `https://vitrinepro.pt/og-default.png` está acessível (OG image)

## 6. Google OAuth (opcional)

- [ ] Criar projecto em [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Activar Google+ API
- [ ] Configurar OAuth redirect: `https://xxxx.supabase.co/auth/v1/callback`
- [ ] Adicionar credenciais no Supabase → Authentication → Providers → Google

## Notas Importantes

- O Stripe em **modo teste** usa `sk_test_...` — mudar para `sk_live_...` em produção
- Se `STRIPE_SECRET_KEY` não estiver configurada, o checkout retorna URL de simulação (só em dev)
- O chatbot usa fallback por palavras-chave se `ANTHROPIC_API_KEY` não estiver configurada
- A migration analytics deve ser executada **antes** do primeiro deploy em produção
