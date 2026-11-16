-- App settings (currently just the selected theme).
-- Run this once in Supabase → SQL Editor, after the init migration.
-- One row per setting: key = 'theme', value = '"glacier"' (a JSON string).

create table if not exists public.settings (
  key        text   primary key check (char_length(key) between 1 and 64),
  value      jsonb  not null check (octet_length(value::text) <= 2000),
  updated_at bigint not null
);

-- Same access model as tasks/todos: no sign-in, so the anon role manages the
-- table. See the security note in SUPABASE_SETUP.md.
alter table public.settings enable row level security;

drop policy if exists "anon manage settings" on public.settings;
create policy "anon manage settings" on public.settings
  for all to anon using (true) with check (true);
