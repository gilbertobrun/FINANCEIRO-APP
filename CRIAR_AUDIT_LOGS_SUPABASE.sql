create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  username text,
  user_label text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
drop policy if exists "audit_logs_select_admin" on public.audit_logs;

create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (true);

create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (is_app_admin());

grant insert, select on public.audit_logs to authenticated;
