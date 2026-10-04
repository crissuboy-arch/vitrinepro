# VitrinePro — Migrations (canonical execution source, A2.15)

> **Do NOT renumber historical migrations** — some may already be applied in
> production. New migrations are appended with a `YYYYMMDDHHMMSS_` prefix
> that sorts after the last applied one.

## How to check what is already applied (before running anything)

Supabase Dashboard → Database → **Migrations** shows the applied list in order.
Alternatively, in the SQL Editor:

```sql
SELECT name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY name;
```

Only apply a file whose name sorts **after** the last applied migration.
Never re-run a historical migration that is already applied.

## Order and purpose

| File | Status | Purpose |
|---|---|---|
| `20260601000000_create_tables.sql` | HISTORICAL / NO-OP | Empty file, kept only to preserve the sequence. Do not delete. |
| `001_analytics.sql` | HISTORICAL | `business_analytics` table + insert-public / owner-read policies. |
| `002_fix_schema.sql` | HISTORICAL | `is_published` column, plan CHECK, first RLS pass. **Conflicts** with `../fix_rls_policies.sql` — superseded by the canonical migration below. |
| `002_short_links.sql` | HISTORICAL | `short_links` + click-counter RPC. |
| `003_community.sql` | HISTORICAL | `favorites`, `business_posts`, `invite_links`. |
| `004_seo_categories_cities.sql` | HISTORICAL | SEO categories/cities. |
| `005_leads.sql` | HISTORICAL | `leads` table. **Its broad read policy was insecure** — fixed by `20261004000002`. |
| `006_catalogs.sql` | HISTORICAL | `catalogs` table + RLS. |
| `007_content_calendar.sql` | HISTORICAL | `content_calendar` table + RLS. |
| `20260601000001_add_owner_origin_country.sql` | HISTORICAL | Adds `businesses.owner_origin_country`; backfills two demo slugs. |
| `20261004000002_leads_pii_hardening.sql` | **NEW (A2.3)** | Adds `leads.business_id`; replaces the any-authenticated-read policy with owner-scoped reads. |
| `20261004000003_canonical_rls_normalization.sql` | **NEW (A2.4)** | Drops every conflicting policy name from `002_fix_schema.sql` and `../fix_rls_policies.sql`; recreates ONE canonical `vp_*` policy set, including storage write isolation (A2.13). Policies only — no data changes. |
| `20261004000004_stripe_webhook_hardening.sql` | **NEW (A2.6)** | `stripe_events` idempotency ledger + `businesses.stripe_subscription_status`. |

Standalone scripts in `supabase/` (NOT migrations, run manually once):
- `schema.sql`, `fix_rls_policies.sql`, `storage_setup.sql`, `programmatic_seo_setup.sql`,
  `social_interactions.sql`, `add_*.sql`, `migration_guide.md` — historical references.
  The canonical RLS state is defined by `20261004000003`, not by re-running these.

Seed data:
- `supabase/seed.sql` — SAFE reference data (plans/categories/cities). May run in production.
- `supabase/seed.demo.sql` — DEVELOPMENT ONLY (mock users with non-functional password hashes + demo content). **Never in production.**

## Rules for future migrations

1. Additive only: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` + re-create.
2. Never edit a historical file that may already be applied.
3. Name new files `YYYYMMDDHHMMSS_description.sql` with the current date.
4. Include a VERIFICATION block (commented SQL) at the end of every migration.
5. **Never apply to production automatically** — apply manually in the SQL Editor after verifying order.
