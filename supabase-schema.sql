create table if not exists financeiro_app_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table financeiro_app_state enable row level security;

drop policy if exists "authenticated_read_financeiro_state" on financeiro_app_state;
drop policy if exists "authenticated_write_financeiro_state" on financeiro_app_state;
drop policy if exists "authenticated_update_financeiro_state" on financeiro_app_state;
drop policy if exists "app_read_financeiro_state" on financeiro_app_state;
drop policy if exists "app_insert_financeiro_state" on financeiro_app_state;
drop policy if exists "app_update_financeiro_state" on financeiro_app_state;

create policy "app_read_financeiro_state"
on financeiro_app_state
for select
to anon, authenticated
using (id = 'main');

create policy "app_insert_financeiro_state"
on financeiro_app_state
for insert
to anon, authenticated
with check (id = 'main');

create policy "app_update_financeiro_state"
on financeiro_app_state
for update
to anon, authenticated
using (id = 'main')
with check (id = 'main');

insert into financeiro_app_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Estrutura segura preparada para a futura etapa com Supabase Auth/RLS por perfil.
-- O app atual continua usando financeiro_app_state para nao duplicar o giro nem quebrar dados existentes.
create table if not exists app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null check (role in ('socio_adm', 'socio_mm', 'financeiro', 'visualizador')),
  label text not null,
  permissions text[] not null default array['view']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_profiles enable row level security;

create or replace function is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from app_profiles
    where user_id = auth.uid()
      and ('admin' = any(permissions) or role in ('socio_adm', 'socio_mm'))
  );
$$;

create or replace function can_manage_payments()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from app_profiles
    where user_id = auth.uid()
      and ('payments' = any(permissions) or 'admin' = any(permissions) or role in ('socio_adm', 'socio_mm', 'financeiro'))
  );
$$;

drop policy if exists "profile_read_self_or_admin" on app_profiles;
drop policy if exists "profile_admin_update" on app_profiles;
drop policy if exists "profile_admin_insert" on app_profiles;

create policy "profile_read_self_or_admin"
on app_profiles
for select
to authenticated
using (user_id = auth.uid() or is_app_admin());

create policy "profile_admin_update"
on app_profiles
for update
to authenticated
using (is_app_admin())
with check (is_app_admin());

create policy "profile_admin_insert"
on app_profiles
for insert
to authenticated
with check (is_app_admin());

create table if not exists financial_settings (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  capital_turnover numeric(14,2) not null default 0,
  capital_goal numeric(14,2) not null default 25000,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists capital_change_history (
  id uuid primary key default gen_random_uuid(),
  change_type text not null check (change_type in ('capital_turnover', 'capital_goal')),
  previous_value numeric(14,2) not null,
  new_value numeric(14,2) not null,
  reason text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

alter table financial_settings enable row level security;
alter table capital_change_history enable row level security;

drop policy if exists "admin_read_financial_settings" on financial_settings;
drop policy if exists "admin_update_financial_settings" on financial_settings;
drop policy if exists "admin_insert_capital_history" on capital_change_history;
drop policy if exists "admin_read_capital_history" on capital_change_history;

create policy "admin_read_financial_settings"
on financial_settings
for select
to authenticated
using (is_app_admin());

create policy "admin_update_financial_settings"
on financial_settings
for update
to authenticated
using (is_app_admin())
with check (is_app_admin());

create policy "admin_read_capital_history"
on capital_change_history
for select
to authenticated
using (is_app_admin());

create policy "admin_insert_capital_history"
on capital_change_history
for insert
to authenticated
with check (is_app_admin());
