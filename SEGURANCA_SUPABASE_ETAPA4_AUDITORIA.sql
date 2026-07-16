-- ETAPA 4 - Auditoria financeira do aplicativo
-- Execute no SQL Editor do Supabase depois de publicar o app atualizado.
-- Nao apaga dados. Apenas cria a tabela de logs e as politicas de seguranca.

create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  username text,
  user_label text,
  action text not null,
  details jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);

create index if not exists audit_logs_action_idx
on public.audit_logs (action);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_insert_authenticated" on public.audit_logs;
drop policy if exists "audit_read_admin" on public.audit_logs;

-- Qualquer usuario logado pode registrar a propria acao.
create policy "audit_insert_authenticated"
on public.audit_logs
for insert
to authenticated
with check (user_id = auth.uid() or user_id is null);

-- Apenas socios/admin podem consultar os logs.
create policy "audit_read_admin"
on public.audit_logs
for select
to authenticated
using (is_app_admin());

grant usage on schema public to authenticated;
grant select, insert on public.audit_logs to authenticated;
