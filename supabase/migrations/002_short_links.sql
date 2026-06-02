create table if not exists short_links (
  id uuid default gen_random_uuid() primary key,
  short_code text unique not null,
  business_id uuid references businesses(id) on delete cascade,
  clicks integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_short_links_code on short_links(short_code);

alter table short_links enable row level security;

drop policy if exists "Owner manage" on short_links;
create policy "Owner manage" on short_links
  using (business_id in (select id from businesses where user_id = auth.uid()));

drop policy if exists "Public read" on short_links;
create policy "Public read" on short_links for select using (true);

-- RPC function to atomically increment short link clicks securely
create or replace function increment_short_link_clicks(code text)
returns void as $$
begin
  update public.short_links
  set clicks = clicks + 1
  where short_code = code;
end;
$$ language plpgsql security definer;
