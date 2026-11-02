-- Run in Supabase → SQL Editor. Safe to re-run (idempotent), also on an existing table.
create table if not exists public.budgets (
  hash       text primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin-only fields (the student app never touches these).
alter table public.budgets add column if not exists nickname text;
alter table public.budgets add column if not exists notes    text;
alter table public.budgets add column if not exists is_test  boolean not null default false;

-- No Row Level Security for now (by request) — see README before launching.
alter table public.budgets disable row level security;
grant select, insert, update, delete on public.budgets to anon, authenticated;

-- Realtime: lets the admin dashboard refresh itself when students save.
do $$ begin
  alter publication supabase_realtime add table public.budgets;
exception when duplicate_object then null;
end $$;

-- Optional: flag demo rows so the admin can hide them.
-- update public.budgets set is_test = true where data->>'seed' = 'true';
