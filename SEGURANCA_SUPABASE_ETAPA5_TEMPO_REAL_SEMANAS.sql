-- ETAPA 5 - Tempo real, fechamento semanal e calendario financeiro
-- Execute no SQL Editor do Supabase depois de publicar esta versao.
-- Nao apaga dados existentes.

alter table public.financeiro_app_state replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.financeiro_app_state;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create table if not exists public.weekly_closings (
  id uuid primary key default gen_random_uuid(),
  week_key text unique not null,
  start_date date not null,
  end_date date not null,
  month integer not null,
  year integer not null,
  week_number integer not null,
  status text not null default 'Fechada',
  total_sales numeric(14,2) not null default 0,
  total_expenses numeric(14,2) not null default 0,
  total_receipts numeric(14,2) not null default 0,
  total_pending numeric(14,2) not null default 0,
  total_profit numeric(14,2) not null default 0,
  capital_turnover numeric(14,2) not null default 0,
  target_value numeric(14,2) not null default 0,
  closed_by uuid references auth.users(id),
  closed_at timestamptz,
  reopened_by uuid references auth.users(id),
  reopened_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_closings_period_idx
on public.weekly_closings (year, month, week_number);

create index if not exists weekly_closings_status_idx
on public.weekly_closings (status);

create index if not exists weekly_closings_dates_idx
on public.weekly_closings (start_date, end_date);

alter table public.weekly_closings enable row level security;

drop policy if exists "weekly_closings_read_authenticated" on public.weekly_closings;
drop policy if exists "weekly_closings_admin_insert" on public.weekly_closings;
drop policy if exists "weekly_closings_admin_update" on public.weekly_closings;

create policy "weekly_closings_read_authenticated"
on public.weekly_closings
for select
to authenticated
using (true);

create policy "weekly_closings_admin_insert"
on public.weekly_closings
for insert
to authenticated
with check (is_app_admin());

create policy "weekly_closings_admin_update"
on public.weekly_closings
for update
to authenticated
using (is_app_admin())
with check (is_app_admin());

grant select on public.weekly_closings to authenticated;
grant insert, update on public.weekly_closings to authenticated;
