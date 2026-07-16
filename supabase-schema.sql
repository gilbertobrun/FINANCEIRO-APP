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
